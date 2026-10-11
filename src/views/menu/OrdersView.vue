<script>
import {collection, doc, getDoc, onSnapshot, query, updateDoc, where} from "firebase/firestore";
import InfoPopup from "@/components/InfoPopup.vue";
import ErrorPopup from "@/components/ErrorPopup.vue";
import ConfirmationPopup from "@/components/ConfirmationPopup.vue";

export default {
  components: {ConfirmationPopup, ErrorPopup, InfoPopup},
  props:['user','userInfo','goToLink'],
  name: "OrdersView",
  computed: {
    isPopupOpen()
    {
      for (const popup in this.menus.popups)
      {
        if(popup === 'order')
        {
          continue;
        }
        if (this.menus.popups[popup].slide)
        {
          return true;
        }
      }
      return false;
    },
  },
  watch:{
    "menus.popups.order.show"(newValue,oldValue)
    {
      if(newValue === false)
      {
        this.orderToView = null;
      }
    }
  },
  data()
  {
    return{
      orderToView:null,
      menus: {
        popups: {
          order: {
            show: false,
            slide: false,
            alreadyOpen: false
          },
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
              this.title = this.text = ''
            }, 500)
          },
          fastClose(popup)
          {
            this[popup].show = false;
            this[popup].slide = false;
            this.title = this.text = ''
          }
        }
      },
      unSubscribers: {
        itemsList: null,
      },
      manageListItems: {
        //TODO: Change accordingly
        numItemsOnOnePage: 5,
        scrollOfTop: 180,
        //
        allItems: [],
        activePage: 0,
        numPages: 0,
        itemsToShow: [],
        start:1,
        end:1,
        navBar: {
          start: 0,
          end: -1,
          show: [],
          activeNavBar: 0,
        },
        calcTotalPages()
        {
          this.numPages = Math.floor(this.allItems.length / this.numItemsOnOnePage);
          const afterRoundCal = this.allItems.length - this.numPages * this.numItemsOnOnePage;
          if (afterRoundCal)
          {
            this.numPages++;
          }
          return this.numPages;
        },
        createPage(activePage)
        {
          window.scroll(0,this.scrollOfTop);
          this.activePage = activePage;
          const start = this.activePage * this.numItemsOnOnePage;
          const end = start + this.numItemsOnOnePage

          const itemsToShow = this.allItems.slice(start, end);

          this.start = start;
          let mutableEnd = 0;


          //Only needed for tha last page if there aren't a total of {{numItemsOnOnePage}} items
          if (this.activePage === this.numPages - 1)
          {
            itemsToShow.forEach((itemInfo, index) =>
            {
              if (!itemInfo)
              {
                itemsToShow.splice(index, 1);
              }

            })
          }

          //Calculates the start and the end index of the items it is showing
          itemsToShow.forEach((itemInfo, index) =>
          {
            if(itemInfo)
            {
              mutableEnd++;
            }
          })

          this.end = start + mutableEnd;

          this.itemsToShow = itemsToShow;
          this.navBar.activeNavBar = activePage;
          return this.itemsToShow;
        },
        createNavBar(startArg)
        {
          let start = startArg + 1;
          let end = 0;
          if (this.numPages <= 4)
          {
            end = this.numPages - 1;
          }
          else
          {
            end = start + 4;
            if (end > this.numPages)
            {
              while (end >= this.numPages)
              {
                end--;
              }
            }

          }
          this.navBar.start = start;
          this.navBar.end = end;
          this.navBar.show = [];

          for (let i = this.navBar.start; i <= this.navBar.end; i++)
          {
            this.navBar.show.push(i);
          }
          console.log("Nav bar: ", this.navBar.show);
        },
        previous()
        {
          if (this.navBar.activeNavBar === this.navBar.start)
          {
            //This might seem odd, but this is bc in createNavBar you instantly add +1 to the end. So i need 5 pages, i sub -6, add 1 and get 5.
            //It is stupid, but if it's working, do not touch it
            // this.navBar.end = this.navBar.start - 6;
            this.createNavBar(this.navBar.start - 6);
            this.createPage(this.activePage - 1)
          }
          else
          {
            this.createPage(this.activePage - 1);
          }
        },
        next()
        {
          if (this.navBar.activeNavBar === this.navBar.end)
          {
            this.createNavBar(this.navBar.end);
            this.createPage(this.activePage + 1);
          }
          else
          {
            this.createPage(this.activePage + 1);
          }
        },
      }
    }
  },
  methods:{
    closePopup(popup)
    {
      this.menus.popups.close(popup);
    },
    confirmAction(action)
    {
      switch (action)
      {
        case 'cancelOrder':
          this.menus.popups.close('confirmation')
          this.cancelOrder();
          break;
      }
    },
    cancelAction(action)
    {
      switch (action)
      {
        case 'cancelOrder':
          this.menus.popups.close('confirmation');
          break;

      }
    },
    async cancelOrder()
    {
      const oid = this.orderToView.oid;
      const orderedBooks = [...this.orderToView.orderedBooks];
      const orderRef = doc(this.$db,'orders', oid);

      try{
        await updateDoc(orderRef, {
          cancelReason: 'User has canceled the order.',
          estDeliveryDate: 'Canceled',
          status: 'canceled',
          finalized: true
        })

      }
      catch (e)
      {
        console.error('Error canceling order',e);
        return;
      }

      try
      {
        for (const book of orderedBooks)
        {
          const bid= book.bid;
          const amount = book.amount;
          const bookRef = doc(this.$db,'books', bid);

          const fetchedBookRef = await getDoc(bookRef);
          const fetchedBook = fetchedBookRef.data();

          await updateDoc(bookRef, {
            stock: fetchedBook.stock + amount
          })
        }
      }
      catch (e)
      {
        console.error('Error updating stock amount',e);
        return;
      }

      this.menus.popups.error.generatePopup('Order Canceled', 'Your order was successfully canceled');
      this.menus.popups.open('error');


    },
    confirmCancelOrder()
    {
      try
      {
        if(this.orderToView.status !== 'preparing')
        {
          throw Error('Order is out of phase: preparing');
        }
      }
      catch (e)
      {
        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred', 'You can only cancel orders that are being prepared!');
        this.menus.popups.open('error');
        return;
      }

      this.menus.popups.confirmation.generatePopup('Confirm Cancellation', 'Are you sure you want to cancel your order ?', 'cancelOrder');
      this.menus.popups.open('confirmation');
    },
    itemsListSubscriber(userQuery = null)
    {

      //TODO: Change the database accordingly
      const itemsListRef = collection(this.$db, 'orders');
      const queryRef = query(itemsListRef, where('uid', '==', this.user.uid));

      this.unSubscribers.itemsList = onSnapshot(queryRef, (snapshot) =>
      {

        const allItems = [];
        let snapshotToIterate = snapshot;
        if (userQuery)
        {
          snapshotToIterate = userQuery;
        }

        snapshotToIterate.docs.forEach((itemInfo) =>
        {
          const objectToPush = itemInfo.data();
          objectToPush.oid = itemInfo.id;
          allItems.push(objectToPush);
        })


        this.manageListItems.allItems = allItems;
        this.manageListItems.calcTotalPages();

        if (this.manageListItems.activePage >= this.manageListItems.numPages)
        {
          this.manageListItems.activePage = this.manageListItems.numPages - 1;
        }

        console.log('The active page is:', this.manageListItems.activePage)
        this.manageListItems.createPage(this.manageListItems.activePage);

        this.manageListItems.createNavBar(this.manageListItems.navBar.start - 1);

        console.log('The items to be shown are :', this.manageListItems.itemsToShow);
        console.log('All items: ', this.manageListItems.allItems);
        console.log('Total pages:', this.manageListItems.numPages);

        //TODO: This is specific to this page, delete accordingly
        //---------------------------------------------------------
        if(this.orderToView)
        {
          for (let i = 0; i < this.manageListItems.allItems.length; i++)
          {
            const order = this.manageListItems.allItems[i];
            if(order.oid === this.orderToView.oid)
            {
              this.orderToView = order;
              break;
            }
          }
        }
        //------------------------------------------------------------
        this.everythingLoaded = true;
      })
    },
    viewCancelReason()
    {
      try
      {
        if (this.orderToView.status !== 'canceled')
        {
          throw Error('Order not canceled');
        }
      } catch (e)
      {
        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred', 'This order is not canceled');
        this.menus.popups.open('error');
        return;
      }

      this.menus.popups.info.generatePopup('Cancel Reason', `"${this.orderToView.cancelReason}"`);
      this.menus.popups.open('info');

    },
    closeOrder()
    {
      this.menus.popups.close('order');

    },
    openOrder(order)
    {
      this.orderToView = order;
      this.menus.popups.open('order');
    },
    getDateString(date)
    {
      const dateArray = date.toString().split(' ');
      const newDateArray = dateArray.slice(0,4);
      let formedDate = '';
      newDateArray.forEach((word,index)=>{
        formedDate+=word;
        if(index === 0)
        {
          formedDate+=','
        }
        formedDate+=' ';
      })

      return formedDate;
    },
    totalToBePayed(books)
    {
      let total = 0;
      books.forEach((item) =>
      {

        total += item.total * 100;
      })
      total = total/100;
      return total.toFixed(2);
    }
  },
  async created()
  {
    await this.itemsListSubscriber();
  },
  beforeUnmount()
  {
    if(this.unSubscribers.itemsList)
    {
      this.unSubscribers.itemsList();
      this.unSubscribers.itemsList = null;
    }
  }
}
</script>

<template>
  <main class="user-profile-orders"
  >
    <h3 class="user-profile-orders-header shadow5">Your Orders</h3>
    <div class="user-profile-orders-items"
         :class="{'user-profile-orders-noOrders-wrapper': manageListItems.allItems.length === 0}"
    >
      <div class="user-profile-orders-item shadow5"
           v-if="manageListItems.allItems.length !== 0"
           v-for="(order,index) in manageListItems.itemsToShow"
           :key="index"
           @click.prevent="openOrder(order)"
      >
        <div class="user-profile-orders-img"
             v-if="order.orderedBooks.length === 1"
        >
          <img class="shadow2 user-profile-orders-img-item"
               :src="order.orderedBooks[0].coverPictureURL" alt="Book Cover">
        </div>

        <div class="user-profile-orders-img fixPosition"
             v-else
        >
          <img class="shadow2 user-profile-orders-img-moreThanOne"
               :src="order.orderedBooks[0].coverPictureURL" alt="Book Cover">
          <img class="shadow2 user-profile-orders-img-moreThanOne"
               :src="order.orderedBooks[1].coverPictureURL" alt="Book Cover">
        </div>

        <div class="user-profile-orders-orderInfo">
          <h4>Order ID: <span>{{order.oid}}</span></h4>
          <h5>Est. delivery date: <span>{{order.estDeliveryDate !== 'Canceled'? getDateString(order.estDeliveryDate.toDate()) : order.estDeliveryDate}}</span></h5>
        </div>
        <div class="user-profile-orders-status">
          <div class="shadow5 shade-1">Status:</div>
          <div class="shadow5"
               :class="{'bgc-1':order.status === 'delivered',
               'alert':order.status === 'canceled',
               'secondary-clr':order.status === 'preparing' || order.status === 'shipped'

               }"

          >{{ order.status }}
          </div>
        </div>
      </div>
      <div class="user-profile-orders-noOrders shadow5"
           v-else
      >
        <p>You have not placed any orders yet</p>

      </div>
    </div>

    <nav class="user-profile-savedBooks-nav user-profile-orders-nav shadow5">
      <button class="shadow2"
              :class="{'freeze':manageListItems.navBar.activeNavBar === 0 || manageListItems.navBar.end === -1}"
              @click.prevent="manageListItems.previous()"
      >&lt;</button>
      <div class="shadow2"

      >{{manageListItems.activePage + 1}}</div>
      <button class="shadow2"
              :class="{freeze:manageListItems.navBar.activeNavBar === manageListItems.numPages - 1}"
              @click.prevent="manageListItems.next()"

      >></button>
    </nav>
  </main>



  <div class="user-profile-popup-bg"
       v-if="menus.popups.order.slide"

  ></div>
  <div class="user-profile-popup-wrapper"
       v-if="menus.popups.order.show"

  >
    <ErrorPopup
        :popup="menus.popups.error"
        :popup-name="'error'"
        @close-popup="closePopup"

        :class="{'menu-freeze-bypass':menus.popups.error.show}"
    >


    </ErrorPopup>

    <InfoPopup
        :popup="menus.popups.info"
        :popup-name="'info'"
        @close-popup="closePopup"
        class="template-string-formatting"

        :class="{'menu-freeze-bypass':menus.popups.info.show}"
    >
    </InfoPopup>

    <ConfirmationPopup :actions="['Cancel Order', 'Close Menu']"
                       :popup="menus.popups.confirmation"
                       :popup-name="'confirmation'"
                       :confirm-action="confirmAction"
                       :cancel-action="cancelAction"
    >


    </ConfirmationPopup>
    <div class="user-profile-popup-order"
         v-if="menus.popups.order.show"
         :class="{'user-profile-popup-order-reveal': menus.popups.order.slide,
         'menu-freeze': isPopupOpen}"
    >

      <div class="user-profile-popup-order-title shadow5">
        <div class="close-cross"
             @click="closeOrder()"

        >&#10060;
        </div>
        <h3>Order ID: </h3>
        <p>{{orderToView.oid}}</p>
      </div>
      <div class="user-profile-popup-order-subtitle">
        <p>Order placed on: <span>{{getDateString(orderToView.datePlaced.toDate())}}</span></p>
        <p>Estimated delivery date: <span>{{orderToView.estDeliveryDate !== 'Canceled'? getDateString(orderToView.estDeliveryDate.toDate()) : orderToView.estDeliveryDate}}</span></p>
      </div>
      <div class="user-profile-popup-order-secInfo">
        <div class="shadow2" >Status: <span>{{orderToView.status}}</span></div>
        <div class="shadow2">Payment Method: <span>{{orderToView.information.paymentMethod === 'card' ? 'Payed Online' : 'To Pay on Delivery'}}</span></div>
      </div>
      <div class="user-profile-popup-order-mainInfo">
        <h4 class="user-profile-popup-order-mainInfo-header">Ordered Books</h4>
        <div class="user-profile-popup-order-items">
          <div class="user-profile-popup-order-item shadow5"
               v-for="(book,index) in orderToView.orderedBooks"
               :key="index"

          >
            <div class="user-profile-popup-order-img">
              <img class="shadow2" :src="book.coverPictureURL" alt="Book Cover">
            </div>
            <div class="user-profile-popup-order-coverInfo">
              <h4>{{book.title}}</h4>
              <h5>{{book.author}}</h5>
            </div>
            <div class="user-profile-popup-order-prices">
              <div>
                {{book.amount}} x ${{(book.price/100).toFixed(2)}}
              </div>
              <div>
                ${{book.total}}
              </div>
            </div>
          </div>

        </div>
        <div class="user-profile-popup-order-total">
          <div class="shadow2" v-if="orderToView.status ==='preparing' || orderToView.status ==='shipped'">
            Total to be Payed (including shipping: ${{orderToView.information.shippingFee/100}}): <span>${{orderToView.totalToBePayed/100}}</span>
          </div>
          <div class="shadow2" v-if="orderToView.status ==='delivered' && orderToView.finalized">
            Payed (including shipping: ${{orderToView.information.shippingFee/100}}): <span>${{orderToView.totalToBePayed/100}}</span>
          </div>
          <div class="shadow2" v-if="orderToView.status ==='canceled'">
            Order total (including shipping: ${{orderToView.information.shippingFee/100}}) was: <span>${{orderToView.totalToBePayed/100}}</span>
          </div>
        </div>
      </div>
      <div class="user-profile-popup-order-buttons">
        <button class="shadow2 btn-default custom-tooltip"
                v-if="orderToView.status ==='preparing' || orderToView.status ==='shipped'"
                data-title="You can only cancel your order while it is being prepared"
                @click.prevent="confirmCancelOrder()"

        >&#9432 Cancel Order</button>
        <button class="shadow2 btn-default alert custom-tooltip"
                v-if="orderToView.status==='canceled'"
                data-title="Click to see the reason why this order was canceled"
                @click.prevent="viewCancelReason()"
        >&#9432 Order Canceled
        </button>
        <button class="shadow2 btn-default menu-freeze bgc-1"
                v-if="orderToView.status ==='delivered' && orderToView.finalized"

        >Order Delivered</button>
      </div>


    </div>
  </div>
</template>

<style scoped>

</style>