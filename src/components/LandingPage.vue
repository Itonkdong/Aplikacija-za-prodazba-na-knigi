<script>
import {addDoc, collection, doc, getDoc, getDocs, limit, onSnapshot, query, updateDoc, where} from "firebase/firestore";
import ErrorPopup from "@/components/ErrorPopup.vue";

export default {
  name: "LandingPage",
  components: {ErrorPopup},
  props:['goToLink','userInfo', 'user'],
  emits:['openBookView'],
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
  },
  data()
  {
    return{
      manageListItems: {
        //TODO: Change accordingly
        numItemsOnOnePage: 4,
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
      },
      unSubscribers: {
        itemsList: null,
        query: null,
        sort: null,
        filter: null,
      },
      subscribeEmail:'',
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
  methods:{
    closePopup(popup)
    {
      this.menus.popups.close(popup);
    },
    isItNewBook(book)
    {
      const today = new Date();
      // today.setHours(0, 0, 0, 0); // Set the time to the beginning of the day

      const fiveDaysAgo = new Date(today);
      fiveDaysAgo.setDate(today.getDate() - 5);

      const bookDateAdded = book.dateAdded.toDate(); // Convert the Firebase server timestamp to a Date object

      /* if(book.title === 'The Decameron')
       {
         console.log(bookDateAdded, today);
         console.log(bookDateAdded <= today);
       }*/

      let isNew = false;
      // console.log('Date added:', bookDateAdded, 'Today:', today, '5 days ago:', fiveDaysAgo);
      if (bookDateAdded >= fiveDaysAgo && bookDateAdded <= today) {
        isNew = true;
      }

      // console.log('The book:', book, ' is new: ', isNew);

      return isNew;

    },
    itemsListSubscriber(userQuery = null)
    {

      //TODO: Change the database accordingly
      const itemsListRef = collection(this.$db, 'books');
      const queryRef = query(itemsListRef, limit(12)
      )

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
          allItems.push(itemInfo.data());
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


        this.everythingLoaded = true;
      })
    },
    openBookView(book)
    {
      console.log('Idi vo bookstore');

      this.$emit('openBookView', book);

    },
    async addBookToCart(bookToFetch)
    {

      //TODO: Validate
      try
      {
        if (!this.user)
        {
          throw new Error('User not signed in');
        }
      }

      catch (e)
      {
        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred', `Sign in to add books to cart`);
        this.menus.popups.open('error');
        return;
      }

      const bid = bookToFetch.bid;
      const bookRef = doc(this.$db, 'books',bid);
      const book = (await getDoc(bookRef)).data();

      try
      {
        if(book.stock === 0)
        {
          throw new Error('Book Out of Stock');
        }
      }

      catch (e)
      {
        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred', `${book.title} is out of stock at the moment. Try again later.`);
        this.menus.popups.open('error');
        return;
      }


      const uid = this.user.uid;
      const title = book.title;
      const userCart = this.userInfo.cart;

      const addedBookForUserCollection = {
        bid:bid,
        amount:1,
        title:title
      }

      let bookAlreadyInCart = false;
      for (let i = 0; i < userCart.length; i++)
      {
        if(userCart[i].bid === bid)
        {
          userCart[i].amount ++;
          bookAlreadyInCart = true;
          break;
        }
      }

      if(!bookAlreadyInCart)
      {
        userCart.push(addedBookForUserCollection);
      }

      console.log(this.userInfo);

      //Back-end handling
      const userInfoRef = doc(this.$db, 'usersList', this.user.uid);

      try
      {
        await updateDoc(userInfoRef, {
          cart: userCart
        })
        console.log('Successfully added book to cart');
        this.menus.popups.error.generatePopup('Successfully Added Book to Cart', `You have successfully added ${title} to your cart.`);
        this.menus.popups.open('error');

      }
      catch (e)
      {
        this.menus.popups.error.generatePopup('Error Occurred', `There was an error adding ${title} to your cart.
        Please try again later.`);
        this.menus.popups.open('error');
        console.error(e);
      }
    },
    async subscribeToNewsLetter()
    {
      const collectionRef = collection(this.$db, 'newsLetter');


      const queryRef = query(collectionRef, where('userEmail', '==', this.subscribeEmail));

      try
      {
        const snapshot = await getDocs(queryRef);

        if(snapshot.docs.length !== 0 )
        {
          throw new Error('Email already subscribed')
        }
      }
      catch (e)
      {
        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred', `${this.subscribeEmail} is already subscribed to our weekly newsletter.`);
        this.menus.popups.open('error');
        return;
      }


      try
      {
        const userEmail= {
          userEmail: this.subscribeEmail
        }
        await addDoc(collectionRef, userEmail);
        const saveEmail = this.subscribeEmail;
        this.menus.popups.error.generatePopup('Successfully Subscribed', `${saveEmail} was successfully subscribed to our weekly newsletter.`);
        this.menus.popups.open('error');
        this.subscribeEmail = '';
      }
      catch (e)
      {
        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred', `Error occurred while trying to subscribe to our newsletter.Try again later.`);
        this.menus.popups.open('error');
      }





    },
  },
  created()
  {
    this.itemsListSubscriber()
  },
  beforeUnmount()
  {
    this.unSubscribers.itemsList();
  }
}
</script>

<template>
  <section class="popular-books-section">
    <ErrorPopup
        :popup="menus.popups.error"
        :popup-name="'error'"
        @close-popup="closePopup"
        class="position-fixed"

        :class="{'menu-freeze-bypass':menus.popups.error.show}"
    >


    </ErrorPopup>
    <div class="popular-books shadow2">
      <h3 class="popular-books-title">Popular Books</h3>
      <div class="popular-books-grid">

        <div class="book-card shadow2 adjust-card-for-shop"
             v-for="(book, index) in manageListItems.itemsToShow"
             :key="index"
             @click.prevent="openBookView(book)"

        >
          <div class="book-card-img content">
            <div class="book-card-tags">
              <div class="book-card-tag tag-new"
                   v-if="isItNewBook(book)"

              >New</div>
              <div class="book-card-tag tag-sale"
                   v-if="book.onDiscount"
              >Sale</div>
            </div>

            <img class="shadow2" :src="book.coverPictureURL" alt="Book Cover">
          </div>
          <div class="book-card-info content">
            <div class="book-card-author">
              <div class="book-by-animate"> By: {{book.author}}</div>
            </div>
            <div class="book-card-genre">{{book.tags[0]}}</div>

          </div>
          <div class="book-card-title content">{{book.title}}</div>
          <div class="book-card-prices content">
            <div class="sale-percentage"
                 v-if="book.onDiscount && book.discountAmount"

            >-{{book.discountAmount}}%</div>
            <div class="book-card-old-price"
                 v-if="book.oldPrice !== book.price"

            >${{book.oldPrice/100}}</div>
            <div class="book-card-regular-price">${{book.price/100}}</div>
          </div>

          <div class="book-card-buttons">
            <button class="btn-default sml-btn book-card-button shadow2 accent-clr"
                    v-if="user && book.stock !== 0"
                    @click.stop="addBookToCart(book)"

            >Add to Cart</button>
            <button class="btn-default sml-btn book-card-button shadow2 accent-clr menu-freeze"
                    v-if="user && book.stock === 0"

            >Book Out Of Stock</button>

            <button class="btn-default sml-btn book-card-button shadow2 accent-clr menu-freeze"
                    v-if="!user"

            >Sign In To Add Books to Cart</button>
            <!--                    <button class="btn-default sml-btn popular-book-button shadow2 accent-clr-2">View Details</button>-->
          </div>

        </div>

      </div>
      <div class="popular-books-nav ">
        <nav>
          <div class="shadow2 popular-books-nav-button"
               :class="{freeze:manageListItems.navBar.activeNavBar === 0}"
               @click.prevent="manageListItems.previous()"
          >&lt;</div>
          <div class="shadow2"

          >{{manageListItems.activePage + 1}}</div>
          <div class="shadow2 popular-books-nav-button"
               :class="{freeze:manageListItems.navBar.activeNavBar === manageListItems.numPages - 1}"
               @click.prevent="manageListItems.next()"

          >></div>
        </nav>
      </div>
    </div>
  </section>

  <section class="news-letter-section">
    <div class="news-letter-text">
      <h4 class="news-letter-title">Don't know what to read?</h4>
      <p class="news-letter-para ">Worry no more! Browse our collection of books or subscribe to our newsletter
        and get weekly book suggestions.</p>
      <div>
        <button class="btn-default accent accent-clr big-btn shadow2"
                @click.prevent="goToLink('/shop')"

        >Shop Now</button>
      </div>


    </div>
    <div class="news-letter-picture">
      <img class="shadow5" src="@/Assets/Images/backgrounds/news-letter.png" alt="Library">
    </div>
    <div class="news-letter-footer">
      <div class="news-letter-subscription ">
        <input type="email" placeholder="Enter your email" class="subscription-email-input clean-input shadow" v-model="subscribeEmail">
        <button class="btn-subscribe shadow"
                :class="{'menu-freeze':!subscribeEmail}"
                @click.prevent="subscribeToNewsLetter"

        >Subscribe</button>
      </div>
    </div>
    <div class="news-letter-footer"></div>

  </section>
</template>

<style scoped>

</style>