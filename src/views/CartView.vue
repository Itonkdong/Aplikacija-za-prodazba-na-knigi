<script>
import {collection, doc, getDoc, onSnapshot, updateDoc} from "firebase/firestore";
import ConfirmationPopup from "@/components/ConfirmationPopup.vue";
import ErrorPopup from "@/components/ErrorPopup.vue";

export default {
  name: "CartView",
  components: {ErrorPopup, ConfirmationPopup},
  props:['user','userInfo','goToLink'],
  computed:{
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
    discountAmount()
    {
      let oldPrices = 0;
      let newPrices = 0;
      this.userCart.forEach((item)=>{

        oldPrices += item.oldPrice * item.amount;
        newPrices += item.price * item.amount;
      })

      const amount = (oldPrices - newPrices)/100;
      return amount.toFixed(2);
    },
    total()
    {
      let total = 0;
      this.userCart.forEach((item)=>{

        total += item.total
      })
      return total.toFixed(2);
    }
  },
  data()
  {
    return{
      everythingLoaded: false,
      userCart:[],
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
        }
      },
      unSubscriber: {
        cart:null,
        bookstore: null,
      }
    }
  },
  watch:{
    userInfo(newValue, oldValue)
    {

      if(newValue.cart !== this.userCart)
      {
        this.getCartItems();
      }
    }
  },
  methods:{
    closePopup(popup)
    {
      this.menus.popups.close(popup);
    },
    async updateCartBeforeCheckout()
    {
      if(!this.user)
      {
        console.error('There is no user');
        return;
      }
      if(!this.userInfo)
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

        console.log('The fetched book is:',fetchedBook);

        if(book.amount > fetchedBook.stock)
        {
          book.amount = fetchedBook.stock;
        }
        if(book.amount ===0 && fetchedBook.stock !== 0)
        {
          book.amount = 1;
        }

        if(fetchedBook.stock === 0)
        {
          userCart.splice(i,1);
          i--;
          continue;
        }

        const bookCartObj = {
          bid:fetchedBook.bid,
          title: fetchedBook.title,
          author: fetchedBook.author,
          coverPictureURL: fetchedBook.coverPictureURL,
          price: fetchedBook.price,
          numOrders: fetchedBook.numOrders,
          oldPrice: fetchedBook.oldPrice,
          amount: book.amount,
          currentlyInStock: fetchedBook.stock,
          total: (fetchedBook.price * book.amount)/100
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
    async proceedToCheckOut()
    {


      try
      {
        await this.updateCartBeforeCheckout();
        if(this.userCart.length === 0)
        {
          throw new Error('Empty cart');
        }
      }
      catch (e)
      {
        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred', 'Invalid books have been removed from your cart!');
        this.menus.popups.open('error');
        return;

      }

      this.$root.$data.checkoutButton = true;

      console.log('Before checkout cart is:', this.userCart);

      this.goToLink('/checkout')

    },
    async getCartItems()
    {
      if(!this.user)
      {
        console.error('There is no user');
        return;
      }
      if(!this.userInfo)
      {
        console.error('There is no user');
        return;
      }

      // console.log('The user info is:',this.userInfo);

      const userCart = this.userInfo.cart;


      let localCart = [];

      // console.log('The user cart is:',userCart);

      for (const book of userCart)
      {

        const bookRef = doc(this.$db, 'books', book.bid);
        const fetchedBookRef = await getDoc(bookRef);
        const fetchedBook = fetchedBookRef.data();

        console.log('The fetched book is:',fetchedBook);

        if(book.amount > fetchedBook.stock)
        {
          book.amount = fetchedBook.stock;
        }
        if(book.amount ===0 && fetchedBook.stock !== 0)
        {
          book.amount = 1;
        }

        const bookCartObj = {
          bid:fetchedBook.bid,
          title: fetchedBook.title,
          author: fetchedBook.author,
          coverPictureURL: fetchedBook.coverPictureURL,
          price: fetchedBook.price,
          oldPrice: fetchedBook.oldPrice,
          numOrders: fetchedBook.numOrders,
          amount: book.amount,
          currentlyInStock: fetchedBook.stock,
          total: (fetchedBook.price * book.amount)/100
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
    async removeBookFromCart(bookToChange)
    {
      const bid = bookToChange.bid;
      const localCart = this.userInfo.cart;
      const userInfoRef = doc(this.$db, 'usersList', this.user.uid);

      for (let i = 0; i < localCart.length; i++)
      {
        if(localCart[i].bid === bid)
        {
          localCart.splice(i,1);
          break;
        }
      }
      try
      {

        await updateDoc(userInfoRef, {
          cart: localCart
        })
        console.log('Successfully removed item');

      }
      catch (e)
      {
        console.error(e);
      }
    },
    async changeAmount(action,bookToChange)
    {
      const bid = bookToChange.bid;
      const localCart = this.userInfo.cart;
      const userInfoRef = doc(this.$db, 'usersList', this.user.uid);
      if(action === 'increase')
      {
        for (const book of localCart)
        {
          if(book.bid === bid)
          {
            book.amount ++;
            if(book.amount > book.currentlyInStock)
            {
              book.amount = book.currentlyInStock;
            }
            break;
          }
        }
      }
      else if(action==='decrease')
      {
        for (const book of localCart)
        {
          if(book.bid === bid)
          {
            if(book.amount === 1)
            {
              return;
            }
            book.amount--;
            break;
          }
        }
      }
      try
      {

        await updateDoc(userInfoRef, {
          cart: localCart
        })
        console.log('Successfully changed amount');

      }
      catch (e)
      {
        console.error(e);
      }

    },
    useCoupon()
    {
      this.menus.popups.error.generatePopup('Error Occurred', 'Coupons are not implemented yet');
      this.menus.popups.open('error');
    }
  },
  created()
  {

  },
  async mounted()
  {
    const bookStoreRef = collection(this.$db, 'books');
    this.unSubscriber.bookstore = onSnapshot(bookStoreRef, ()=>{
      this.getCartItems();
    })
  },
  beforeUnmount()
  {
    if(this.unSubscriber.bookstore)
    {
      this.unSubscriber.bookstore();
      this.unSubscriber.bookstore = null;
    }
  }
}
</script>

<template>
  <div class="cart-wrapper"
       :class="{'menu-freeze':isPopupOpen}"

  >

    <ErrorPopup
        :popup="menus.popups.error"
        :popup-name="'error'"
        @close-popup="closePopup"

        :class="{'menu-freeze-bypass':menus.popups.error.show}"
    >


    </ErrorPopup>

    <div class="cart-grid">
      <div class="cart">
        <div class="cart-header shadow2">
          <h4>Book</h4>
          <div>Price</div>
          <div>Amount</div>
          <div>Total</div>
        </div>
        <div class="cart-items"
             v-if="everythingLoaded"
        >
          <div class="cart-item empty-cart shadow5"
               v-if="userCart.length===0"
          >
            <p>Looks like you haven't added anything to your cart yet.</p>
          </div>
          <div class="cart-item shadow5"
               v-for="(book, index) in userCart"
               :key="index"
          >
            <div class="cart-item-outOfStock"
                 v-if="book.currentlyInStock === 0"
            >
              <p>Out Of Stock</p>
            </div>
            <div class="cart-remove-item"
                 @click="removeBookFromCart(book)"
                 title="Remove Item"
            >&#10006;
            </div>
            <div class="cart-item-book-info">
              <div class="cart-item-img">
                <img class="shadow2" :src="book.coverPictureURL" alt="Book Cover">
              </div>
              <div class="cart-item-coveInfo">
                <h4 class="cart-item-coveInfo-title">{{book.title}}</h4>
                <h5 class="cart-item-coverInfo-author">{{book.author}}</h5>
              </div>
            </div>
            <div class="cart-item-price">
              <div v-if="book.price !== book.oldPrice"
                   class="cart-item-old-price"

              >${{(book.oldPrice/100).toFixed(2)}}</div>
              <div>
                ${{(book.price/100).toFixed(2)}}
              </div>


            </div>
            <div class="cart-item-amountMenu">
              <div class="cart-item-amountMenu-container">
                <button class="btn-default"
                        @click.prevent="changeAmount('decrease', book)"
                        :class="{freeze:book.amount === 1}"
                >-</button>
                <div>{{book.amount}}</div>
                <button class="btn-default"
                        @click.prevent="changeAmount('increase', book)"
                        :class="{freeze:book.amount === book.currentlyInStock}"

                >+</button>
              </div>
            </div>
            <div class="cart-item-totalPrice">${{(book.total).toFixed(2)}}</div>
          </div>
        </div>

      </div>
      <div class="cart-checkout">
        <div class="cart-checkout-container shadow2">
          <div  class="cart-checkout-header">
            Your Cart
          </div>

          <div class="cart-checkout-item cart-checkout-discount">
            <h4>Discount Amount:</h4>
            <div>${{discountAmount}}</div>
          </div>
          <div class="cart-checkout-item cart-checkout-total">
            <h4>Total:</h4>
            <div>${{total}}</div>
          </div>
          <div class="cart-checkout-coupons">
            <input type="text" placeholder="Coupon">
            <button class="btn-default shadow2"
                    @click.prevent="useCoupon()"

            >Use Coupon</button>
          </div>
          <button class="btn-default cart-checkout-button"
                  v-if="userCart.length !== 0"
                  @click.prevent="proceedToCheckOut()"
          >Proceed to Check Out</button>
          <button class="btn-default cart-checkout-button shadow2"
                  v-else
                  @click.prevent="goToLink('/shop')"

          >Your Cart is Empty</button>
        </div>
      </div>
    </div>
  </div>

</template>

<style scoped>

</style>