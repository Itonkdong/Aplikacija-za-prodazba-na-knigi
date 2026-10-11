<script>
//TODO: This should be changed with the Vue and then deleted
import {addDoc, collection, doc, getDoc, onSnapshot, serverTimestamp, updateDoc} from "firebase/firestore";
import InfoPopup from "@/components/InfoPopup.vue";
import ErrorPopup from "@/components/ErrorPopup.vue";

function animateMenu()
{
  let radioBtnCard = document.getElementById('payWithCard');
  let radioBtnDelivery = document.getElementById('payOnDelivery');
  radioBtnCard.addEventListener('click', async () =>
  {
    // console.log('CLicked card')
    let para = document.getElementById('pay-onDelivery-para');
    para.classList.remove('reveal-animate');
    setTimeout(() =>
    {
      para.classList.remove('reveal');
    }, 300);
    setTimeout(() =>
    {
      para = document.getElementById('pay-card-para');
      para.classList.add('reveal');
      setTimeout(() =>
      {
        para.classList.add('reveal-animate');
      }, 100);
    }, 300);


  })

  radioBtnDelivery.addEventListener('click', () =>
  {
    // console.log('CLicked delivery')
    let para = document.getElementById('pay-card-para');
    para.classList.remove('reveal-animate');
    setTimeout(() =>
    {
      para.classList.remove('reveal');
    }, 300);

    setTimeout(() =>
    {
      para = document.getElementById('pay-onDelivery-para');
      para.classList.add('reveal');
      setTimeout(() =>
      {
        para.classList.add('reveal-animate');
      }, 100);
    }, 300);
  })
}

export default {
  name: "CheckoutView",
  components: {ErrorPopup, InfoPopup},
  props: ['user', 'userInfo', 'goToLink'],
  computed: {
    total()
    {
      let total = 0;
      this.userCart.forEach((item) =>
      {

        total += item.total
      })
      return total.toFixed(2);
    },
    isPopupOpen()
    {
      for (const popup in this.menus.popups)
      {
        if (this.menus.popups[popup].slide)
        {
          return true;
        }
      }
      return false;
    },
    toPay()
    {
      const toPay = parseFloat(this.total) + (this.checkoutInfo.shippingFee / 100);
      return toPay;
    }

  },
  data()
  {
    return {
      daysToBeDelivered: 5,
      citiesToDisplay: [],
      readAndAgree: false,
      everythingLoaded: false,
      userCart: [],
      unSubscriber: {
        storeInfo: null,
        cart: null,
        bookstore: null,
      },
      checkoutInfo: {
        //TODO: Clear this,pls
        name: '',
        surname: '',
        streetAddress: '',
        apartment: '',
        country: "Choose an option :",
        city: "Select a country",
        region: '',
        zipCode: '',
        phoneNumber: '',
        shippingFee: 700, //Value in cents
        paymentMethod: 'payOnDelivery',
        notes: '',
      },
      menus: {
        popups: {
          error: {
            title: '',
            text: '',
            show: false,
            slide: false,
            alreadyOpen: false,
            action: '',
            generatePopup(title, text, action = '')
            {
              this.title = title;
              this.text = text
              this.action = action;
            }
          },
          confirmation: {
            title: '',
            text: '',
            show: false,
            slide: false,
            alreadyOpen: false,
            action: '',
            generatePopup(title, text, action = '')
            {
              this.title = title;
              this.text = text
              this.action = action;
            }
          },
          info: {
            title: '',
            text: '',
            show: false,
            slide: false,
            alreadyOpen: false,
            action: '',
            generatePopup(title, text, action = '')
            {
              this.title = title;
              this.text = text
              this.action = action;
            }
          },
          open(popup)
          {
            if (this[popup].show || this[popup].slide)
            {
              this[popup].alreadyOpen = true;
              setTimeout(() =>
              {
                this[popup].alreadyOpen = false;
              }, 100)
              return 'already-opened';
            }


            this[popup].show = true;
            setTimeout(() =>
            {
              this[popup].slide = true;
            }, 10)
            return '';
          },
          close(popup)
          {
            this[popup].slide = false;
            setTimeout(() =>
            {
              this[popup].show = false;
              this[popup].text = this[popup].title = this[popup].action = '';
            }, 500)
          },
          fastClose(popup)
          {
            this[popup].show = false;
            this[popup].slide = false;
          }
        },
        tabs: {
          information: {
            show: true,
            slide: false,
            alreadyOpen: false
          },
          shipping: {
            show: false,
            slide: false,
            alreadyOpen: false
          },
          payment: {
            show: false,
            slide: false,
            alreadyOpen: false
          },
          open(tabName)
          {
            for (const tab in this)
            {

              if (tab !== 'open')
              {
                console.log(tab);
                this[tab].show = false;
              }

            }
            this[tabName].show = true;
          }
        }
      },
    }
  },
  watch: {
    userInfo(newValue, oldValue)
    {
      if (newValue.cart !== this.userCart)
      {
        this.getCartItems();
      }
    },
    "checkoutInfo.country"(newValue, oldValue)
    {
      if (newValue === 'Choose an option :')
      {
        this.citiesToDisplay = [];
        this.checkoutInfo.city = 'Select a country';
        this.checkoutInfo.region = '';
      }
      else if (newValue === 'Macedonia')
      {
        this.citiesToDisplay = ['Choose an option :',
          'Skopje',
          'Bitola',
          'Ohrid',
          'Prilep',
          'Tetovo',
          'Gostivar',
          'Strumica',
          'Veles',
          'Kumanovo',
          'Stip',
          'Kavadarci',
          'Struga',
          'Kocani',
          'Radovis',
          'Kriva Palanka',
          // Add more cities as needed
        ];
        this.checkoutInfo.city = 'Choose an option :';
        this.checkoutInfo.region = 'Macedonia';
      }
      else if (newValue === 'Mexico')
      {
        this.citiesToDisplay = ['Choose an option :',
          'León',
          'Guanajuato',
          'Irapuato',
          'Silao',
          'Celaya',
          'Salamanca',
          'San Miguel de Allende',
          'Dolores Hidalgo',
          'Acámbaro',
          'Pénjamo',
          'Moroleón',
          'Uriangato',
        ];
        this.checkoutInfo.city = 'Choose an option :';
        this.checkoutInfo.region = 'Guanajuato';
      }
    },
    "menus.tabs.payment.show"(newValue, oldValue)
    {
      console.log('Vleguva vo watcher')
      if (newValue)
      {
        this.$nextTick(() =>
        {
          animateMenu();
        })

      }
    }
  },
  methods: {
    async validateForm()
    {
      try
      {
        for (const input in this.checkoutInfo)
        {
          if (input === 'notes' || input === 'apartment')
          {
            continue;
          }

          if (this.checkoutInfo[input] === "" ||
              this.checkoutInfo[input] === "Choose an option :" ||
              this.checkoutInfo[input] === "Select a country"
          )
          {
            throw Error('Missing input');
          }

        }
      } catch (e)
      {
        this.menus.popups.error.generatePopup('Error Occurred', `Please fill all the input fields.`);
        this.menus.popups.open('error');
        console.log(e);
        return false
      }

      return true;
    },
    async openTab(tabName)
    {
      //Validate from
      if (!await this.validateForm())
      {
        return;
      }
      window.scroll(0, 0);

      this.menus.tabs.open(tabName)
    },
    closePopup(popup)
    {
      this.menus.popups.close(popup);
      this.$emit('closedPopup');
    },
    openPopup(popup)
    {
      this.menus.popups.open(popup);
      this.$emit('openedPopup');
    },
    confirmAction(action)
    {
      switch (action)
      {
        case 'discardChanges':
          this.menus.popups.close('confirmation');
          this.menus.popups.close('addBook');
          this.resetInputs();
          break;
      }
    },
    cancelAction(action)
    {
      switch (action)
      {
        case 'discardChanges':
          this.menus.popups.close('confirmation');
          break;

      }
    },
    async updateCartBeforeCheckout()
    {
      if (!this.user)
      {
        console.error('There is no user');
        return;
      }
      if (!this.userInfo)
      {
        console.error('There is no user');
        return;
      }

      const userCart = this.userInfo.cart;
      let localCart = [];


      for (let i = 0; i < userCart.length; i++)
      {
        const book = userCart[i];
        const bookRef = doc(this.$db, 'books', book.bid);
        const fetchedBookRef = await getDoc(bookRef);
        const fetchedBook = fetchedBookRef.data();

        console.log('The fetched book is:', fetchedBook);

        if (book.amount > fetchedBook.stock)
        {
          book.amount = fetchedBook.stock;
        }
        if (book.amount === 0 && fetchedBook.stock !== 0)
        {
          book.amount = 1;
        }

        if (fetchedBook.stock === 0)
        {
          userCart.splice(i, 1);
          i--;
          continue;
        }

        const bookCartObj = {
          bid: fetchedBook.bid,
          title: fetchedBook.title,
          author: fetchedBook.author,
          coverPictureURL: fetchedBook.coverPictureURL,
          price: fetchedBook.price,
          numOrders: fetchedBook.numOrders,
          oldPrice: fetchedBook.oldPrice,
          amount: book.amount,
          currentlyInStock: fetchedBook.stock,
          total: (fetchedBook.price * book.amount) / 100
        }

        localCart.push(bookCartObj);


      }

      console.log('The local cart is:', localCart);
      this.userCart = localCart;

      //This is needed if the stock amount of the book changes in mean time(before the user checks out),
      // and there are not enough books
      const userRef = doc(this.$db, 'usersList', this.user.uid);
      await updateDoc(userRef, {
        cart: userCart
      })

    },
    async getCartItems()
    {
      if (!this.user)
      {
        console.error('There is no user');
        return;
      }
      if (!this.userInfo)
      {
        console.error('There is no user');
        return;
      }

      // console.log('The user info is:',this.userInfo);

      const userCart = this.userInfo.cart;


      let localCart = [];

      // console.log('The user cart is:',userCart);

      for (let i = 0; i < userCart.length; i++)
      {
        const book = userCart[i];
        const bookRef = doc(this.$db, 'books', book.bid);
        const fetchedBookRef = await getDoc(bookRef);
        const fetchedBook = fetchedBookRef.data();

        console.log('The fetched book is:', fetchedBook);

        if (book.amount > fetchedBook.stock)
        {
          book.amount = fetchedBook.stock;
        }
        if (book.amount === 0)
        {
          userCart.splice(i, 1);
          i--;
          continue;
        }

        const bookCartObj = {
          bid: fetchedBook.bid,
          title: fetchedBook.title,
          author: fetchedBook.author,
          coverPictureURL: fetchedBook.coverPictureURL,
          price: fetchedBook.price,
          oldPrice: fetchedBook.oldPrice,
          numOrders: fetchedBook.numOrders,
          amount: book.amount,
          currentlyInStock: fetchedBook.stock,
          total: (fetchedBook.price * book.amount) / 100
        }

        localCart.push(bookCartObj);

      }

      console.log('The local cart is:', localCart);
      this.userCart = localCart;

      //This is needed if the stock amount of the book changes in mean time(before the user checks out),
      // and there are not enough books
      const userRef = doc(this.$db, 'usersList', this.user.uid);
      await updateDoc(userRef, {
        cart: userCart
      })
      //--------------------------------------------------------------------------------------------------

      this.everythingLoaded = true;
    },
    calculateDeliveryDates(daysToBeDelivered, dateOrderPlaced = null)
    {
      let datePlaced = dateOrderPlaced;
      if (!datePlaced)
      {
        datePlaced = serverTimestamp();
      }

      const millisecondsInADay = 24 * 60 * 60 * 1000; // Number of milliseconds in a day
      // Convert the serverTimestamp to a JavaScript Date object
      const serverTimestampDate = new Date();


      // Calculate the new date by adding days
      const estDeliveryDate = new Date(serverTimestampDate.getTime() + daysToBeDelivered * millisecondsInADay);

      return {
        datePlaced: datePlaced,
        daysToBeDelivered: daysToBeDelivered,
        estDeliveryDate: estDeliveryDate
      }

    },
    async placeOrder()
    {
      //Small Validation
      try
      {
        if (!this.readAndAgree)
        {
          throw Error('Please agree to our terms and conditions');
        }
      } catch (e)
      {
        this.menus.popups.error.generatePopup('Error Occurred', 'Please agree to our Terms and Conditions.');
        this.menus.popups.open('error');

        console.error(e);
        return;
      }


      try
      {
        if (!this.user.emailVerified)
        {
          throw Error('Please verify your email address');
        }
      } catch (e)
      {
        this.menus.popups.error.generatePopup('Error Occurred', 'Please verify your email address before you place an order.');
        this.menus.popups.open('error');
        console.error(e);
        return;
      }


      //Validating the cart
      await this.updateCartBeforeCheckout();


      const deliveryDates = this.calculateDeliveryDates(this.daysToBeDelivered);
      const formatted = deliveryDates.estDeliveryDate.toISOString().slice(0, 10);


      console.log(deliveryDates.estDeliveryDate); // This will be the serverTimestamp + 5 days

      const orderObj = {
        uid: this.user.uid,
        email: this.user.email,
        displayName: this.user.displayName,
        information: this.checkoutInfo,
        orderedBooks: this.userCart,
        status: 'preparing',
        totalToBePayed: parseFloat(this.total) * 100 + this.checkoutInfo.shippingFee,
        finalized: false,
        metaData: {
          formattedDeliveryDate: formatted
        },
        cancelReason: '',
        datePlaced: deliveryDates.datePlaced,
        daysToBeDelivered: deliveryDates.daysToBeDelivered,
        estDeliveryDate: deliveryDates.estDeliveryDate,
      }

      const ordersRef = collection(this.$db, 'orders');


      //Placing the order
      try
      {
        const orderRef = await addDoc(ordersRef, orderObj);
        await updateDoc(orderRef, {
          oid: orderRef.id,
        })

        console.log('Order successfully placed');
      } catch (e)
      {
        console.error(e)
        return;

      }
      const booksToDecreaseStock = [...this.userCart];

      this.unSubscriber.bookstore();
      this.unSubscriber.bookstore = null;


      //Decreasing the stock amount and increasing the number of orders on a book
      try
      {
        for (let i = 0; i < booksToDecreaseStock.length; i++)
        {
          const book = booksToDecreaseStock[i];
          const bookRef = doc(this.$db, 'books', book.bid);
          const newStock = book.currentlyInStock - book.amount;
          const newNumOrders = book.numOrders + book.amount;
          console.log('New stock is:', newStock);
          await updateDoc(bookRef, {
            stock: newStock,
            numOrders: newNumOrders
          })

        }

      } catch (e)
      {
        console.log(e);
      }


      //Clearing the cart of a user
      try
      {
        const userRef = doc(this.$db, 'usersList', this.user.uid);
        await updateDoc(userRef, {
          cart: [],
          orders: this.userInfo.orders + 1,
        })
        this.userCart = [...booksToDecreaseStock];
        this.menus.popups.info.generatePopup('Successfully Placed Order', `Your order was successfully placed.
        Check it's status in your Menu/Orders tab.
        This page will automatically redirect.`);
        this.menus.popups.open('info');
        setTimeout(() =>
        {
          this.goToLink('/menu/orders');
        }, 5000)

      } catch (e)
      {
        console.error(e)
      }


    },
    storeInfoSubscriber()
    {
      const storeInfoRef = collection(this.$db, 'storeInfo');
      this.unSubscriber.storeInfo = onSnapshot(storeInfoRef, (snapshot) =>
      {
        let storeInfo = null;
        snapshot.docs.forEach((doc) =>
        {
          storeInfo = doc.data();
        })

        if(storeInfo.shippingFee < 0)
        {
          this.checkoutInfo.shippingFee = 700;
        }
        else
        {
          this.checkoutInfo.shippingFee = storeInfo.shippingFee;
        }

        if (storeInfo.daysToBeDelivered < 5)
        {
          this.daysToBeDelivered = 5;
        }
        else
        {
          this.daysToBeDelivered = storeInfo.daysToBeDelivered;
        }

      })

    },
    seeInfo()
    {
      console.log(this.checkoutInfo);
      console.log("Read and agreed:", this.readAndAgree);
    },
    useCoupon()
    {
      this.menus.popups.error.generatePopup('Error Occurred', 'Coupons are not implemented yet');
      this.menus.popups.open('error');
    }
  },
  created()
  {
    if (!this.$root.$data.checkoutButton)
    {
      this.goToLink('/cart');
    }

    window.addEventListener("beforeunload", function (e)
    {
      const confirmationMessage = "Are you sure you want to leave this page?";

      e.returnValue = confirmationMessage;

      return confirmationMessage;
    });

  },
  async mounted()
  {
    if (this.menus.tabs.payment.show)
    {
      animateMenu();
    }

    const bookStoreRef = collection(this.$db, 'books');
    this.unSubscriber.bookstore = onSnapshot(bookStoreRef, () =>
    {
      this.getCartItems();
    })

    this.storeInfoSubscriber();
  },
  beforeUnmount()
  {
    if (this.unSubscriber.bookstore)
    {
      this.unSubscriber.bookstore();
      this.unSubscriber.bookstore = null;
    }

    if (this.unSubscriber.storeInfo)
    {
      this.unSubscriber.storeInfo();
      this.unSubscriber.storeInfo = null;
    }


    this.$root.$data.checkoutButton = false;
  },
  beforeRouteLeave(to, from, next)
  {

    window.removeEventListener("beforeunload", function (e)
    {
      const confirmationMessage = "Are you sure you want to leave this page?";

      e.returnValue = confirmationMessage;

      return confirmationMessage;
    });
    next();

  }
}
</script>

<template>
  <div class="checkout-page-wrapper">

    <div class="checkout-grid"
         :class="{'menu-freeze':isPopupOpen}"
    >
      <div class="checkout-main-info">
        <ErrorPopup
            :popup="menus.popups.error"
            :popup-name="'error'"
            @close-popup="closePopup"
            class="position-fixed"

            :class="{'menu-freeze-bypass':menus.popups.error.show}"
        >


        </ErrorPopup>

        <InfoPopup
            :popup="menus.popups.info"
            :popup-name="'info'"
            @close-popup="closePopup"
            class="template-string-formatting position-fixed"

            :class="{'menu-freeze-bypass':menus.popups.info.show}"
            :remove-o-k-button="true"
        >
        </InfoPopup>


        <div class="checkout-main-info-header shadow2">
          <h2>Information</h2>
          <nav>
            <div class="checkout-main-info-header-link"
                 @click.prevent="goToLink('/cart')"
            >Cart
            </div>
            <div>></div>
            <div class="checkout-main-info-header-link"
                 :class="{'checkout-main-info-header-activeLink':menus.tabs.information.show}"
                 @click.prevent="menus.tabs.open('information')"
            >Information
            </div>
            <div>></div>
            <div class="checkout-main-info-header-link"
                 :class="{'checkout-main-info-header-activeLink':menus.tabs.shipping.show}"
                 @click.prevent="openTab('shipping')"
            >Shipping
            </div>
            <div>></div>
            <div class="checkout-main-info-header-link"
                 :class="{'checkout-main-info-header-activeLink':menus.tabs.payment.show}"
                 @click.prevent="openTab('payment')"
            >Payment
            </div>
          </nav>

        </div>

        <!--Payment-part is an :class-->
        <div class="checkout-confirmation-container"
             v-if="menus.tabs.payment.show || menus.tabs.shipping.show"
             :class="{'payment-part': menus.tabs.payment.show}"

        >
          <div class="checkout-confirmation-main-info">
            <div class="checkout-confirmation-main-info-item"
                 v-if="menus.tabs.shipping.show || menus.tabs.payment.show"
            >
              <h5>Contact</h5>
              <div>{{ user.email }}</div>
              <div hidden>Change</div>
            </div>
            <div class="checkout-confirmation-main-info-item"
                 v-if="menus.tabs.shipping.show || menus.tabs.payment.show"
            >
              <h5>Ship to</h5>
              <div>
                <span>{{ checkoutInfo.streetAddress }}, </span>
                <span>{{ checkoutInfo.city }}, </span>
                <span>{{ checkoutInfo.region }}, </span>
                <span>{{ checkoutInfo.zipCode }}, </span>
                <span>{{ checkoutInfo.country }}</span>
              </div>
              <div
                  @click.prevent="this.menus.tabs.open('information')"
                  class="clickable"

              >Change
              </div>
            </div>
            <!--There should be v-if on the line below-->

            <div class="checkout-confirmation-main-info-item"
                 v-if="menus.tabs.payment.show"
            >
              <h5>Method</h5>
              <div>Regular shipping: ${{ (checkoutInfo.shippingFee / 100).toFixed(2) }}</div>
              <div class="clickable" hidden>Change</div>
            </div>
          </div>
          <!--There should be v-if on the 3 lines below-->

          <div class="checkout-confirmation-paymentInfo"
               v-if="menus.tabs.payment.show"
          >
            <h2>Payment Methods</h2>
            <h3>All transactions are secure and encrypted</h3>
            <div class="checkout-confirmation-paymentInfo-container">
              <div class="checkout-confirmation-paymentInfo-item-container">
                <div class="checkout-confirmation-paymentInfo-item">
                  <input type="radio" name="payment-method" id="payWithCard" disabled value="card" class="freeze"
                         v-model="checkoutInfo.paymentMethod">
                  <div class="freeze">Pay online with a card <span>&#128179;</span> (This option is currently
                    unavailable)
                  </div>
                </div>
                <p id="pay-card-para" class="payment-explain-para">
                  Pay immediately online with your Visa or Master card
                </p>
              </div>
              <div class="checkout-confirmation-paymentInfo-item-container">
                <div class="checkout-confirmation-paymentInfo-item">
                  <input type="radio" name="payment-method" checked id="payOnDelivery" value="payOnDelivery"
                         v-model="checkoutInfo.paymentMethod">
                  <div>Pay on delivery <span>&#128181;</span></div>
                </div>
                <p class="payment-explain-para reveal reveal-animate" id="pay-onDelivery-para">
                  Pay on delivery when the book is shipped to you
                </p>
              </div>
            </div>
          </div>
          <div class="checkout-confirmation-termsConditions"
               v-if="menus.tabs.payment.show"

          >
            <p>Your personal data will be used so that we can deliver the ordered products to you and for other
              purposes described in our <span class="clickable"
                                              @click.prevent="goToLink('/terms-of-use')">Terms of Use</span>
              and <span class="clickable" @click.prevent="goToLink('/privacy-policy')">Privacy Policy</span>.</p>
            <div>
              <input type="checkbox" v-model="readAndAgree">
              <div>I have read and agree to the Terms and Conditions *</div>
            </div>
          </div>
          <div class="checkout-confirmation-placeOrder"
               v-if="menus.tabs.payment.show"
          >
            <button class="btn-default shadow2"
                    @click.prevent="placeOrder()"

            >&#128274; Place Order
            </button>
          </div>


          <!--          There should be v-if on the 3 lines below-->
          <div class="checkout-confirmation-shippingInfo"
               v-if="menus.tabs.shipping.show"
          >
            <h2>Shipping Methods</h2>
            <div>Standard Shipping fee: <span>${{ (checkoutInfo.shippingFee / 100).toFixed(2) }}</span>
            </div>
          </div>
          <div class="checkout-confirmation-notes"
               v-if="menus.tabs.shipping.show"

          >
            <h5>Note for the delivery (optional)</h5>
            <textarea placeholder="Spacial notes for your delivery" v-model="checkoutInfo.notes"></textarea>
          </div>
          <div class="checkout-main-info-nav"
               v-if="menus.tabs.shipping.show"
          >
            <button class="btn-default shadow2" type="button"
                    @click.prevent="menus.tabs.open('information')"
            ><span>&#10140;</span> Return To Information
            </button>
            <button class="btn-default shadow2" type="button"
                    @click.prevent="menus.tabs.open('payment')"


            >Continue to Payment <span>&#10140;</span></button>
          </div>


        </div>
        <form class="checkout-main-info-content"
              v-if="menus.tabs.information.show"

        >
          <h4>Shipping address</h4>
          <div class="checkout-main-info-initials">
            <div>
              <h6>Name *</h6>
              <input type="text" v-model="checkoutInfo.name">
            </div>
            <div>
              <h6>Surname *</h6>
              <input type="text" v-model="checkoutInfo.surname">
            </div>
          </div>
          <div class="checkout-main-info-streetAddress">
            <h6>Street address</h6>
            <input type="text" v-model="checkoutInfo.streetAddress">
            <input type="text" placeholder="Apartment, floor, ect... (optional)" v-model="checkoutInfo.apartment">
          </div>
          <div class="checkout-main-info-country">
            <h6>Country</h6>
            <select v-model="checkoutInfo.country">
              <option>Choose an option :</option>
              <option>Macedonia</option>
              <option>Mexico</option>
            </select>
          </div>
          <div class="checkout-main-info-cityRegionZip">
            <div>
              <h6>City *</h6>
              <select v-model="checkoutInfo.city">
                <option v-if="citiesToDisplay.length===0">Select a country</option>
                <option v-for="(option,index) in citiesToDisplay"
                        :key="index"
                >{{ option }}
                </option>
              </select>
            </div>
            <div>
              <h6>Region *</h6>
              <input type="text" disabled v-model="checkoutInfo.region">
            </div>
            <div>
              <h6>Zip Code *</h6>
              <input type="text" v-model="checkoutInfo.zipCode">
            </div>
          </div>
          <div class="checkout-main-info-tel">
            <h6>Phone Number</h6>
            <input type="tel" v-model="checkoutInfo.phoneNumber">
          </div>
          <div class="checkout-main-info-nav">
            <button class="btn-default shadow2" type="button"
                    @click.prevent="goToLink('/cart')"

            ><span>&#10140;</span>Return To Cart</button>
            <button class="btn-default shadow2" type="button"
                    @click.prevent="openTab('shipping')"

            >Continue to Shipping <span>&#10140;</span></button>
          </div>
        </form>

        <!--This is the first part of the page. There should be a v-if on the whole form-->


      </div>
      <div class="checkout-sec-info">
        <div class="checkout-sec-info-container shadow2">
          <h3 class="checkout-sec-info-header">
            Order Summary
          </h3>
          <div class="checkout-sec-info-items"
          >
            <div class="checkout-sec-info-item shadow2"
                 v-if="everythingLoaded"
                 v-for="(book,index) in userCart"
                 :key="index"
            >
              <div class="checkout-sec-info-item-img">
                <div class="checkout-sec-info-item-amount">x{{ book.amount }}</div>
                <img class="shadow2" :src="book.coverPictureURL"
                     alt="Book Cover">
              </div>
              <div class="checkout-sec-info-item-coverInfo">
                <h4>
                  {{ book.title }}
                </h4>
                <h5>
                  {{ book.author }}
                </h5>
              </div>
              <div class="checkout-sec-info-item-prices">
                <div class="checkout-sec-info-item-prices-oldPrice"
                     v-if="book.oldPrice!== book.price"
                >
                  ${{ (book.oldPrice / 100).toFixed(2) }}
                </div>
                <div class="checkout-sec-info-item-prices-regularPrice">
                  ${{ (book.price / 100).toFixed(2) }}
                </div>

              </div>
            </div>


          </div>
          <div class="checkout-sec-info-coupons">
            <input class="shadow2" type="text" placeholder="Coupon">
            <button class="btn-default shadow2"
                    @click.prevent="useCoupon()"
            >Use Coupon &#127915;
            </button>
          </div>
          <div class="checkout-sec-info-priceSummary">
            <div class="checkout-sec-info-priceSummary-total ">
              <h5>Total:</h5>
              <div>${{ total }}</div>
            </div>
            <div class="checkout-sec-info-priceSummary-shipping ">
              <h5>Shipping</h5>
              <div>${{ menus.tabs.information.show ? '0.00' : (checkoutInfo.shippingFee / 100).toFixed(2) }}</div>
            </div>
          </div>
          <div class="checkout-sec-info-totalPrice">
            <h5>
              To pay:
            </h5>
            <div>
              ${{ menus.tabs.information.show ? total : toPay.toFixed(2) }}
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>



</style>
