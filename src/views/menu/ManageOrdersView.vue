<script>
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import InfoPopup from "@/components/InfoPopup.vue";
import ErrorPopup from "@/components/ErrorPopup.vue";
import ConfirmationPopup from "@/components/ConfirmationPopup.vue";

export default {
  name: "ManageOrdersView",
  components: {ConfirmationPopup, ErrorPopup, InfoPopup},
  props: ['user', 'userInfo', 'goToLink'],
  computed: {
    isPopupOpen()
    {
      for (const popup in this.menus.popups)
      {
        if (popup === 'manageOrder')
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
  watch: {
    "menus.popups.order.show"(newValue, oldValue)
    {
      if (newValue === false)
      {
        this.orderToView = null;
        this.savedOrder = null;
      }
    }
  },
  data()
  {
    return {
      dateTest: null,
      orderToView: null,
      manageFilters: {
        email: '',
        sort:'Choose an option :',
        filter: 'Choose an option :',
      },
      savedOrder: null,
      menus: {
        popups: {
          manageOrder: {
            show: false,
            slide: false,
            alreadyOpen: false
          },
          filterNoResult:{
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
            buttons: [],
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
          cancelReason:{
            show: false,
            slide: false,
            alreadyOpen: false
          },
          input: {
            title: '',
            text: '',
            inputField:'',
            show: false,
            slide: false,
            alreadyOpen: false,
            action: '',
            buttons: [],
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
              this.title = this.text = '';
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
        filter: null
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
        start: 1,
        end: 1,
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
          window.scroll(0, this.scrollOfTop);
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
            if (itemInfo)
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
  methods: {
    closePopup(popup)
    {
      this.menus.popups.close(popup);
    },
    confirmAction(action)
    {
      switch (action)
      {
        case 'cancelOrder':
          this.menus.popups.close('confirmation');
          this.menus.popups.input.generatePopup('Cancel Reason','');
          this.menus.popups.input.action='proceedCancellation';
          this.menus.popups.input.buttons=['Cancel Order','Close'];
          this.menus.popups.open('input');
          break;
        case 'proceedCancellation':
          this.menus.popups.close('input');
          this.cancelOrder();
          break;
        case 'changeStatus':
          this.menus.popups.close('confirmation')
          this.changeStatusOfOrder();
          break;
        case 'finalizeOrder':
          this.menus.popups.close('confirmation')
          this.finalizeOrder();
          break;
        case 'changeDeliveryDate':
          this.menus.popups.close('confirmation')
          this.changeDeliveryDate();
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

        case 'proceedCancellation':
          this.menus.popups.close('input');
          this.menus.popups.input.inputField = '';
          break;
        case 'changeStatus':
          this.menus.popups.close('confirmation')
          this.orderToView.status = this.savedOrder.status;
          break;
        case 'finalizeOrder':
          this.menus.popups.close('confirmation')
          break;
        case 'changeDeliveryDate':
          this.menus.popups.close('confirmation')
          this.orderToView.metaData.formattedDeliveryDate = this.savedOrder.metaData.formattedDeliveryDate;
          break;

      }
    },
    async cancelOrder()
    {
      const oid = this.orderToView.oid;
      const orderedBooks = [...this.orderToView.orderedBooks];
      const orderRef = doc(this.$db, 'orders', oid);

      try
      {
        await updateDoc(orderRef, {
          estDeliveryDate: 'Canceled',
          status: 'canceled',
          finalized: true,
          cancelReason: this.menus.popups.input.inputField,
        })

        this.menus.popups.input.inputField = '';

      } catch (e)
      {
        console.error('Error canceling order', e);
        return;
      }

      try
      {
        for (const book of orderedBooks)
        {
          const bid = book.bid;
          const amount = book.amount;
          const bookRef = doc(this.$db, 'books', bid);

          const fetchedBookRef = await getDoc(bookRef);
          const fetchedBook = fetchedBookRef.data();

          await updateDoc(bookRef, {
            stock: fetchedBook.stock + amount
          })
        }
      } catch (e)
      {
        console.error('Error updating stock amount', e);
        return;
      }

      this.menus.popups.error.generatePopup('Order Canceled', 'The order was successfully canceled');
      this.menus.popups.open('error');


    },
    confirmCancelOrder()
    {
      try
      {
        if (this.orderToView.finalized)
        {
          throw Error('Order already finalized');
        }
      } catch (e)
      {
        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred', 'This order is already finalized');
        this.menus.popups.open('error');
        return;
      }

      this.menus.popups.confirmation.generatePopup('Confirm Cancellation', 'Are you sure you want to cancel this order ?', 'cancelOrder');
      this.menus.popups.confirmation.buttons = ['Cancel Order', 'Close'];
      this.menus.popups.open('confirmation');
    },
    async changeStatusOfOrder()
    {
      const orderRef = doc(this.$db, 'orders', this.orderToView.oid);
      try
      {
        await updateDoc(orderRef, {
          status: this.orderToView.status,
        })
        this.menus.popups.info.generatePopup('Successfully Changed Status', `The status of the order was successfully changed to ${this.orderToView.status}`);
        this.menus.popups.open('info');

      } catch (e)
      {
        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred', 'There was an error in changing the status of the order. Try again later.');
        this.menus.popups.open('error');
      }


    },
    async finalizeOrder()
    {
      const orderRef = doc(this.$db, 'orders', this.orderToView.oid);
      try
      {
        const dateDelivered = new Date();
        await updateDoc(orderRef, {
          status: 'delivered',
          finalized: true,
          estDeliveryDate: dateDelivered,
        })
        this.menus.popups.info.generatePopup('Successfully Finalized Order', `The order ${this.orderToView.oid} was successfully finalized.`);
        this.menus.popups.open('info');

      } catch (e)
      {
        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred', 'There was an error in finalizing the order. Try again later.');
        this.menus.popups.open('error');
      }

    },
    confirmFinalization()
    {
      try
      {
        if (this.orderToView.status === 'canceled')
        {
          throw Error('Order canceled');
        }
      } catch (e)
      {
        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred', 'You can not finalize canceled order');
        this.menus.popups.open('error');
        return;
      }

      this.menus.popups.confirmation.generatePopup('Confirm Finalization Of Order', `Are you sure you want to finalize the order: ${this.orderToView.oid}
      This will change its status to DELIVERED and you won't be able to make any other changes.
      `, 'finalizeOrder');
      this.menus.popups.confirmation.buttons = ['Finalize', 'Cancel'];
      this.menus.popups.open('confirmation');
    },
    confirmChangeStatus()
    {
      try
      {
        if (this.orderToView.status === 'canceled')
        {
          throw Error('Order canceled');
        }
      } catch (e)
      {
        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred', 'You can not change the status of a canceled order');
        this.menus.popups.open('error');
        return;
      }

      try
      {
        if (this.orderToView.finalized)
        {
          throw Error('Order finalized');
        }
      } catch (e)
      {
        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred', 'You can not change the status of a finalized order');
        this.menus.popups.open('error');
        return;
      }


      this.menus.popups.confirmation.generatePopup('Confirm Change Status', `Are you sure you want to change the status of the order to ${this.orderToView.status}`, 'changeStatus');
      this.menus.popups.confirmation.buttons = ['Change status', 'Cancel'];
      this.menus.popups.open('confirmation');

    },
    confirmChangeDeliveryDate()
    {
      try
      {
        if (this.orderToView.finalized)
        {
          throw Error('Order finalized');
        }
      } catch (e)
      {
        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred', 'You can not change the delivery date of a finalized order');
        this.menus.popups.open('error');
        return;
      }


      this.menus.popups.confirmation.generatePopup('Confirm Change Delivery Date',
          `Are you sure you want to change the delivery date of the order to ${this.orderToView.metaData.formattedDeliveryDate}`,
          'changeDeliveryDate');
      this.menus.popups.confirmation.buttons = ['Change date', 'Cancel'];
      this.menus.popups.open('confirmation');

    },
    formattedDate()
    {
      // Convert the selectedDate string into a Date object
      const date = new Date(this.orderToView.metaData.formattedDeliveryDate);

      // Check if the date is valid
      if (isNaN(date.getTime()))
      {
        return "Invalid Date";
      }

      // Format the date as needed
      // const options = {year: "numeric", month: "long", day: "numeric"};
      // return date.toLocaleDateString(undefined, options);
      return date;
    },
    validateNewDeliveryDate(newDate, today)
    {
      try
      {
        if (newDate === 'Invalid Date')
        {
          throw Error('Invalid date');
        }
      } catch (e)
      {
        this.menus.popups.error.generatePopup('Error Occurred', 'You have selected an invalid date');
        this.menus.popups.open('error');
        this.orderToView.metaData.formattedDeliveryDate = this.savedOrder.metaData.formattedDeliveryDate;
        return false;
      }

      try
      {
        if (newDate < today)
        {
          throw Error('Invalid date');
        }
      } catch (e)
      {
        this.menus.popups.error.generatePopup('Error Occurred', `You can't set the delivery date before today: ${this.getDateString(today)}`);
        this.menus.popups.open('error');
        this.orderToView.metaData.formattedDeliveryDate = this.savedOrder.metaData.formattedDeliveryDate;
        return false;
      }

      return true;

    },
    async changeDeliveryDate()
    {
      const newDate = this.formattedDate();
      const today = new Date();

      if(!this.validateNewDeliveryDate(newDate,today))
      {
        return;
      }

      console.log('The new date is:', newDate);

      const formatted = newDate.toISOString().slice(0, 10);

      const orderRef = doc(this.$db, 'orders', this.orderToView.oid);
      try
      {
        await updateDoc(orderRef, {
          estDeliveryDate: newDate,
          metaData: {
            formattedDeliveryDate: formatted
          }
        });
        this.menus.popups.info.generatePopup('Successfully Changed Delivery Date', `The delivery date of the order was successfully changed to ${this.getDateString(this.orderToView.estDeliveryDate.toDate())}`);
        this.menus.popups.open('info');

      } catch (e)
      {
        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred', 'There was an error in changing the delivery date of the order. Try again later.');
        this.menus.popups.open('error');
      }

    },
    itemsListSubscriber(userQuery = null)
    {

      //TODO: Change the database accordingly
      const itemsListRef = collection(this.$db, 'orders');
      this.unSubscribers.itemsList = onSnapshot(itemsListRef, (snapshot) =>
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
        if (this.orderToView)
        {
          for (let i = 0; i < this.manageListItems.allItems.length; i++)
          {
            const order = this.manageListItems.allItems[i];
            if (order.oid === this.orderToView.oid)
            {
              this.orderToView = {...order};
              this.savedOrder = {...order};
              this.savedOrder.metaData = {...order.metaData};
              break;
            }
          }
        }
        //------------------------------------------------------------
        this.everythingLoaded = true;
      })
    },
    closeOrder()
    {
      this.menus.popups.close('manageOrder');

    },
    createQuery(type)
    {

      // return;

      if (this.manageFilters[type] === 'Choose an option :' || this.manageFilters[type] === '')
      {
        if (this.unSubscribers.filter)
        {
          this.unSubscribers.filter();
          this.unSubscribers.filter = null;
        }
        this.unSubscribers.itemsList();
        this.itemsListSubscriber();
        return;
      }

      for (const filterType in this.manageFilters)
      {
        if(filterType!==type)
        {
          if(filterType === 'email')
          {
            this.manageFilters[filterType] = '';
            continue
          }
          this.manageFilters[filterType] = 'Choose an option :';
        }
      }

      const ordersRef = collection(this.$db, "orders");
      let queryRef = null;
      let value = this.$refs[type].value;

      console.log("Value: ",value);

      if(type === 'sort')
      {
        if(value === 'datePlaced-asc')
        {
          queryRef = query(ordersRef,
              orderBy('datePlaced', 'asc'));

        }
        else if(value === 'datePlaced-desc')
        {
          queryRef = query(ordersRef,
              orderBy('datePlaced', 'desc'));

        }
      }
      else if(type === 'filter')
      {
          queryRef = query(ordersRef,
              where('status','==',value));

      }
      else if(type==='email')
      {
        queryRef = query(ordersRef,
            where("email", ">=", this.manageFilters.email),
            where("email", "<=", this.manageFilters.email + "\uf8ff"));
      }

      this.unSubscribers.filter = onSnapshot(queryRef, (querySnapshot) =>
      {

        if (querySnapshot.docs.length)
        {
          if(this.unSubscribers.itemsList)
          {
            this.unSubscribers.itemsList();
          }
          this.itemsListSubscriber(querySnapshot);
        }
        else
        {
          if(type!=='email')
          {
            this.manageFilters[type] = "Choose an option :"
          }
          else
          {
            this.manageFilters[type] = "";
          }
          this.menus.popups.filterNoResult.generatePopup('Filter Complete', 'There are 0 orders with that filter');
          this.menus.popups.open('filterNoResult')
          this.createQuery(type);
        }
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
    openOrder(order)
    {
      this.orderToView = {...order};
      this.savedOrder = {...order};
      this.savedOrder.metaData = {...order.metaData};
      this.menus.popups.open('manageOrder');
    },
    getDateString(date)
    {
      const dateArray = date.toString().split(' ');
      const newDateArray = dateArray.slice(0, 4);
      let formedDate = '';
      newDateArray.forEach((word, index) =>
      {
        formedDate += word;
        if (index === 0)
        {
          formedDate += ','
        }
        formedDate += ' ';
      })

      return formedDate;
    },
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
  <main class="user-profile-menageOrders"
        :class="{'menu-freeze': isPopupOpen}"
  >
    <InfoPopup
        :popup="menus.popups.filterNoResult"
        :popup-name="'filterNoResult'"
        @close-popup="closePopup"
        class="template-string-formatting"

        :class="{'menu-freeze-bypass':menus.popups.filterNoResult.show}"
    >
    </InfoPopup>

    <div class="user-profile-menageOrders-header shadow5">
      <h3>Manage Orders</h3>
      <div class="user-profile-menageOrders-header-options">
        <div class="user-profile-menageOrders-header-option">
          <h6>Search by user:</h6>
          <input type="text" placeholder="Email"
                 v-model="manageFilters.email"
                 @change="createQuery('email')"
                 ref="email"
          >
        </div>
        <div class="user-profile-menageOrders-header-option">
          <h6>Sort by:</h6>
          <select class="user-profile-select" v-model="manageFilters.sort"
                  ref="sort"
                  @change="createQuery('sort')"
          >
            <option>Choose an option :</option>
            <option value="datePlaced-asc">Date placed: New First</option>
            <option value="datePlaced-desc">Date placed: Old First</option>
          </select>
        </div>
        <div class="user-profile-menageOrders-header-option">
          <h6>Filter by:</h6>
          <select class="user-profile-select"
                  v-model="manageFilters.filter"
                  ref="filter"
                  @change="createQuery('filter')"

          >
            <option>Choose an option :</option>
            <option value="preparing">Preparing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
        <div>
          <button hidden="hidden" class="shadow2 btn-default">Find</button>
        </div>

      </div>


    </div>
    <div class="user-profile-menageOrders-items">
      <div class="user-profile-menageOrders-item"
           v-for="(order,index) in manageListItems.itemsToShow"
           :key="index"
           @click.prevent="openOrder(order)"
      >
        <div class="user-profile-menageOrders-img"
             v-if="order.orderedBooks.length === 1"
        >
          <img class="shadow2 user-profile-menageOrders-img-item"
               :src="order.orderedBooks[0].coverPictureURL" alt="Book Cover">
        </div>

        <div class="user-profile-menageOrders-img fixPosition"
             v-else

        >
          <img class="shadow2 user-profile-menageOrders-img-moreThanOne"
               :src="order.orderedBooks[0].coverPictureURL" alt="Book Cover">
          <img class="shadow2 user-profile-menageOrders-img-moreThanOne"
               :src="order.orderedBooks[1].coverPictureURL" alt="Book Cover">
        </div>
        <div class="user-profile-menageOrders-orderInfo">
          <div>
            <h5>Order ID: <span>{{ order.oid }}</span></h5>
          </div>
          <h4>Ordered by: <span>{{ order.email }}</span></h4>
          <h4>Order On: <span>{{ getDateString(order.datePlaced.toDate()) }}</span></h4>

        </div>
        <div class="user-profile-menageOrders-status">
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
    </div>

    <div class="shadow5 user-profile-menageOrders-footer">
      <nav>
        <div class="user-profile-menageOrders-footer-link shadow2"
             :class="{freeze:manageListItems.navBar.activeNavBar === 0}"
             @click.prevent="manageListItems.previous()"

        >&lt;
        </div>
        <div class="user-profile-menageOrders-footer-link shadow2"
             v-for="(navLink, index) in manageListItems.navBar.show"
             :key="index"
             :class="{'user-profile-menageOrders-footer-activeLink': manageListItems.activePage === navLink}"
             @click.prevent="manageListItems.createPage(navLink)"


        >{{ navLink + 1}}
        </div>

        <div class="user-profile-menageOrders-footer-link shadow2"
             :class="{freeze:manageListItems.navBar.activeNavBar === manageListItems.numPages - 1}"
             @click.prevent="manageListItems.next()"

        >>
        </div>
      </nav>
    </div>
  </main>
  <div class="user-profile-popup-bg"
       v-if="menus.popups.manageOrder.slide"

  ></div>
  <div class="user-profile-popup-wrapper"
       v-if="menus.popups.manageOrder.show"
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

    <ConfirmationPopup :actions="menus.popups.confirmation.buttons"
                       :popup="menus.popups.confirmation"
                       :popup-name="'confirmation'"
                       :confirm-action="confirmAction"
                       :cancel-action="cancelAction"
    >
    </ConfirmationPopup>




    <div class="menu-info-popup shadow2"
         v-if="menus.popups.input.show"
         :class="{'menu-info-popup-appear': menus.popups.input.slide,
         }"
    >
      <h4>{{ menus.popups.input.title }}</h4>
      <textarea placeholder="Say your reason" v-model="menus.popups.input.inputField"></textarea>
      <div class="menu-info-popup-buttons">
        <button class="btn-default shadow2 alert"
                @click.prevent="confirmAction(menus.popups.input.action)"

        >{{menus.popups.input.buttons[0]}}
        </button>
        <button class="btn-default shadow2"
                @click.prevent="cancelAction(menus.popups.input.action)"
        >{{menus.popups.input.buttons[1]}}
        </button>
      </div>

    </div>

    <div class="user-profile-popup-order user-profile-popup-menageOrders"
         v-if="menus.popups.manageOrder.show"
         :class="{'user-profile-popup-order-reveal': menus.popups.manageOrder.slide,
         'menu-freeze': isPopupOpen}"
    >
      <div class="user-profile-popup-order-title shadow5">
        <div class="close-cross"
             @click="closeOrder()"

        >&#10060;
        </div>
        <h3>Menage Order with ID: </h3>
        <p>{{ orderToView.oid }}</p>
      </div>
      <div class="user-profile-popup-order-subtitle">
        <div class="user-profile-popup-menageOrders-subtitle">
          <p>Order placed on: <br><span>{{ getDateString(orderToView.datePlaced.toDate()) }}</span></p>
          <div>Order by: <br><span>{{ orderToView.email }}</span></div>
          <div>Shipping Info: <br><span>{{ orderToView.information.streetAddress }},
            {{ orderToView.information.city }},
            {{ orderToView.information.region }},
            {{ orderToView.information.zipCode }},
            {{ orderToView.information.country }}, Phone: {{ orderToView.information.phoneNumber }}</span></div>
        </div>

        <p><span v-if="orderToView.status === 'delivered'">Delivered on: </span><span
            v-else>Estimated delivery date: </span>
          <input type="date" v-model="orderToView.metaData.formattedDeliveryDate" @change="confirmChangeDeliveryDate()"
                 v-if="!orderToView.finalized">
          <span
              v-else>{{
              orderToView.status === 'canceled' ? orderToView.estDeliveryDate : getDateString(orderToView.estDeliveryDate.toDate())
            }}</span>
        </p>
      </div>
      <div class="user-profile-popup-order-secInfo">
        <div class="shadow2">Status:
          <select class="user-profile-select" v-model="orderToView.status" @change.prevent="confirmChangeStatus()"
                  v-if="orderToView.status === 'preparing' || orderToView.status === 'shipped'">
            <option>preparing</option>
            <option>shipped</option>
          </select>
          <span v-else>{{ orderToView.status }}</span>
        </div>
        <div class="shadow2">Payment Method:
          <span>{{ orderToView.information.paymentMethod === 'card' ? 'Payed Online' : 'To Pay on Delivery' }}</span>
        </div>
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
              <h4>{{ book.title }}</h4>
              <h5>{{ book.author }}</h5>
            </div>
            <div class="user-profile-popup-order-prices">
              <div>
                {{ book.amount }} x ${{ (book.price / 100).toFixed(2) }}
              </div>
              <div>
                ${{ book.total }}
              </div>
            </div>
          </div>

        </div>
        <div class="user-profile-popup-order-total">
          <div class="shadow2" v-if="savedOrder.status ==='preparing' || savedOrder.status ==='shipped'">
            Total to be Payed (including shipping: ${{ orderToView.information.shippingFee / 100 }}):
            <span>${{ orderToView.totalToBePayed / 100 }}</span>
          </div>
          <div class="shadow2" v-if="savedOrder.status ==='delivered'">
            Payed (including shipping: ${{ orderToView.information.shippingFee / 100 }}):
            <span>${{ orderToView.totalToBePayed / 100 }}</span>
          </div>
          <div class="shadow2" v-if="savedOrder.status ==='canceled'">
            Order total (including shipping: ${{ orderToView.information.shippingFee / 100 }}) was:
            <span>${{ orderToView.totalToBePayed / 100 }}</span>
          </div>
        </div>
      </div>
      <div class="user-profile-popup-order-buttons user-profile-popup-menageOrders-buttons">
        <button class="shadow2 btn-default alert"
                v-if="orderToView.status==='preparing' || orderToView.status==='shipped'"
                @click.prevent="confirmCancelOrder()"
        >Cancel Order
        </button>
        <button class="shadow2 btn-default alert custom-tooltip"
                v-if="orderToView.status==='canceled'"
                data-title="Click to see the reason why this order was canceled"
                @click.prevent="viewCancelReason()"
        >&#9432 Order Canceled
        </button>
        <button class="shadow2 btn-default bgc-1"
                @click.prevent="confirmFinalization()"
                v-if="!orderToView.finalized"
        >Finalize
        </button>
        <button class="shadow2 btn-default bgc-1 menu-freeze"
                v-if="orderToView.finalized && orderToView.status === 'delivered'"
        >Order Finalized
        </button>
      </div>


    </div>
  </div>
</template>

<style scoped>

</style>