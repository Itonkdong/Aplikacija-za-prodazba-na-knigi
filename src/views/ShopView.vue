<script>
import {collection, doc, getDoc, onSnapshot, orderBy, query, updateDoc, where} from "firebase/firestore";
import InfoPopup from "@/components/InfoPopup.vue";
import ErrorPopup from "@/components/ErrorPopup.vue";

export default {
  name: "ShopView",
  props:['filter','user','userInfo','goToLink'],
  components: {ErrorPopup, InfoPopup},
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
  watch:{
    filter(newValue, oldValue)
    {

      if(newValue)
      {
        if(newValue ==='new')
        {

          this.manageFilters.sort="dateAdded";
          this.$refs['sort'].value = "dateAdded";
          this.createQuery('sort');
        }
        else if(newValue ==='bestsellers')
        {

          this.manageFilters.sort="bestSellers";
          this.$refs['sort'].value = "bestSellers";
          this.createQuery('sort');
        }
        else if(newValue ==='on-discount')
        {

          this.manageFilters.sort="onDiscount";
          this.$refs['sort'].value = "onDiscount";
          this.createQuery('sort');
        }
        else {
          this.createQuery('title');
        }
      }
      else
      {
        location.reload();
      }


    }
  },
  data()
  {
    return{
      screenWidth: window.innerWidth,
      manageFilters: {
        sort:'Choose an option :',
        author: '',
        genre: 'Choose an option :',
        year: 'Choose an option :',
        priceRange: 'Choose an option :',
      },
      tags: ['Classic', 'Poetry', 'Fiction', 'Romance', 'Fantasy', 'Biography', 'Philosophy', 'Young Adult', 'Adventure', 'Dystopian',
        'Thriller', 'Tragedy', 'Comedy', 'Drama'],
      everythingLoaded: true,
      unSubscribers: {
        itemsList: null,
        query: null,
        sort: null,
        filter: null,
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
        }
      },
      manageListItems: {
        //TODO: Change accordingly
        numItemsOnOnePage: 12,
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
  methods: {
    closePopup(popup)
    {
      this.menus.popups.close(popup);
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
    itemsListSubscriber(query = null)
    {

      //TODO: Change the database accordingly
      const itemsListRef = collection(this.$db, 'books');

      this.unSubscribers.itemsList = onSnapshot(itemsListRef, (snapshot) =>
      {

        const allItems = [];
        let snapshotToIterate = snapshot;
        if (query)
        {
          snapshotToIterate = query;
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
    isItNewBook(book)
    {
      const today = new Date();
      // today.setHours(0, 0, 0, 0); // Set the time to the beginning of the day

      const fiveDaysAgo = new Date(today);
      fiveDaysAgo.setDate(today.getDate() - 5);

      const bookDateAdded = book.dateAdded.toDate(); // Convert the Firebase server timestamp to a Date object

      let isNew = false;
      // console.log('Date added:', bookDateAdded, 'Today:', today, '5 days ago:', fiveDaysAgo);
      if (bookDateAdded >= fiveDaysAgo && bookDateAdded <= today) {
        isNew = true;
      }

      // console.log('The book:', book, ' is new: ', isNew);

      return isNew;

    },
    openBookView(book)
    {
      console.log('Idi vo bookstore');

      this.$emit('openBookView', book);

    },
    createQuery(type)
    {
      console.log(this.manageFilters.sort, this.$refs['sort'].value);
      // return;


      if (this.manageFilters[type] === 'Choose an option :' || this.manageFilters[type] === '')
      {
        if (this.unSubscribers.filter)
        {
          this.unSubscribers.filter();
          this.unSubscribers.filter = null;
        }

        if (this.unSubscribers.itemsList)
        {
          this.unSubscribers.itemsList();
        }
        this.itemsListSubscriber();
        return;
      }

      for (const filterType in this.manageFilters)
      {
        if(filterType!==type)
        {
          if(filterType === 'author')
          {
            this.manageFilters[filterType] = '';
            continue
          }
          this.manageFilters[filterType] = 'Choose an option :';
        }
      }

      const booksRef = collection(this.$db, "books");
      let queryRef = null;
      let value = null;

      if(type!=='title')
      {
        value = this.$refs[type].value;
      }

      console.log("Value: ",value);

      if(type === 'sort')
      {
        if(value === 'dateAdded')
        {
          queryRef = query(booksRef,
              orderBy('dateAdded', 'desc'));

        }
        else if(value === 'bestSellers')
        {
          queryRef = query(booksRef,
              orderBy('numOrders', 'desc'));

        }
        else if(value === 'title')
        {
          queryRef = query(booksRef,
              orderBy('title', 'asc'));

        }
        else if(value==='price-asc')
        {
          queryRef = query(booksRef,
              orderBy('price', 'asc'));
        }
        else if(value==='price-desc')
        {
          queryRef = query(booksRef,
              orderBy('price', 'desc'));
        }
        else if(value==='onDiscount')
        {
          console.log('Idi do tuka');
          queryRef = query(booksRef,
              where('onDiscount','==',true));
        }
      }
      else if(type === 'genre')
      {
        queryRef = query(booksRef,
            where('tags','array-contains',value));

      }
      else if(type === 'year')
      {
        if(value === 'before 1900')
        {
          queryRef = query(booksRef,
              where('moreInfo.yearOfRelease','<','1900'));
        }
        else if(value === '1900')
        {
          queryRef = query(booksRef,
              where('moreInfo.yearOfRelease','>=','1900'),
              where('moreInfo.yearOfRelease','<','2000'),
          );
        }
        else if(value === '2000')
        {
          queryRef = query(booksRef,
              where('moreInfo.yearOfRelease','>=','2000'),
              where('moreInfo.yearOfRelease','<','2010'),
          );
        }
        else if(value === '2010')
        {
          queryRef = query(booksRef,
              where('moreInfo.yearOfRelease','>=','2010'),
          );
        }
      }
      else if(type==='author')
      {
        queryRef = query(booksRef,
            where("author", ">=", this.manageFilters.author),
            where("author", "<=", this.manageFilters.author + "\uf8ff"));
      }
      else if(type==='title')
      {
        queryRef = query(booksRef,
            where("title", ">=", this.filter),
            where("title", "<=", this.filter + "\uf8ff"));
      }
      else if(type==='priceRange')
      {
        value = parseInt(value)
        if(value === 4000)
        {
          queryRef = query(booksRef,
              where("price", ">", value),
              orderBy('price','desc')

          );
        }
        else if(value === 3000)
        {
          queryRef = query(booksRef,
              where("price", "<=", value),
              orderBy('price','desc'));
        }
        else if(value === 2000)
        {
          queryRef = query(booksRef,
              where("price", "<=", value),
              orderBy('price','desc'));
        }
        else if(value === 500)
        {
          queryRef = query(booksRef,
              where("price", "<=", value),
              orderBy('price','desc'));
        }
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
          if(type!=='author')
          {
            this.manageFilters[type] = "Choose an option :"
          }
          else
          {
            this.manageFilters[type] = "";
          }
          this.menus.popups.info.generatePopup('Filter Complete', 'There are 0 books with that filter');
          this.menus.popups.open('info')
          this.createQuery(type);
        }
      })

    },
    updateScreenWidth()
    {
      this.screenWidth = window.innerWidth;
    },
  },
  async created()
  {
    if(!this.filter)
    {
      await this.itemsListSubscriber();
    }
    setTimeout(()=>{
      window.scroll(0,0);
    },10);



  },
  mounted()
  {
    window.addEventListener('resize', this.updateScreenWidth);
    this.updateScreenWidth(); // Initial update

    if(this.filter)
    {
      if(this.filter ==='new')
      {

        this.manageFilters.sort="dateAdded";
        this.$refs['sort'].value = "dateAdded";
        this.createQuery('sort');
      }
      else if(this.filter ==='bestsellers')
      {

        this.manageFilters.sort="bestSellers";
        this.$refs['sort'].value = "bestSellers";
        this.createQuery('sort');
      }
      else if(this.filter ==='on-discount')
      {
        this.manageFilters.sort="onDiscount";
        this.$refs['sort'].value = "onDiscount";
        this.createQuery('sort');
      }
      else
      {
        this.createQuery('title');
      }
    }


  }
}
</script>

<template>
  <div class="shop-books-wrapper">
    <InfoPopup
        :popup="menus.popups.info"
        :popup-name="'info'"
        @close-popup="closePopup"

        :class="{'menu-freeze-bypass':menus.popups.info.show}"
    >
    </InfoPopup>
    <ErrorPopup
        :popup="menus.popups.error"
        :popup-name="'error'"
        @close-popup="closePopup"
        class="position-fixed"

        :class="{'menu-freeze-bypass':menus.popups.error.show}"
    >


    </ErrorPopup>

    <div class="shop-books-grid"
         :class="{'menu-freeze':isPopupOpen}"

    >

      <div class="shop-books-header">
        <div class="shop-books-header-full-path shop-books-header-element">
          <div class="shop-books-header-path">
            Home
          </div>
          <div>
            >
          </div>
          <div class="shop-books-header-path">
            Books
          </div>

        </div>
        <div class="shop-books-header-title shop-books-header-element">
          Books
        </div>
        <div class="shop-books-header-info shop-books-header-element">
          <div class="shop-books-header-info-showing-results">
            Showing {{manageListItems.start + 1}}-{{manageListItems.end}} out of {{manageListItems.allItems.length}} results
          </div>
          <div class="shop-books-header-info-pages">
<!--            View 2 3 <span class="shop-books-current-page">4</span>-->
          </div>
        </div>
      </div>
      <div class="shop-books-nav">
        <div class="shop-books-nav-sort-wrapper">
          <div class="shop-books-nav-sort">
            <h3 class="shop-books-nav-title">Sort</h3>
            <select class="shop-books-nav-filter-type-input"
                    v-model="manageFilters.sort"
                    @change="createQuery('sort')"
                    ref="sort"
            >
              <option>Choose an option :</option>
              <option value="dateAdded">What's new</option>
              <option value="bestSellers">Bestsellers First</option>
              <option value="title">Alphabetically</option>
              <option value="price-asc">Price: Cheapest First</option>
              <option value="price-desc">Price: Most Expensive First</option>
              <option value="onDiscount">On Discount</option>
            </select>
          </div>
        </div>
        <div class="shop-books-nav-filter-wrapper">
          <div class="shop-books-nav-filter">
            <h3 class="shop-books-nav-title">Filter</h3>
            <div class="shop-books-nav-filter-type">
              <h4 class="shop-books-nav-filter-type-title">Genre</h4>
              <select class="shop-books-nav-filter-type-input"
                      v-model="manageFilters.genre"
                      @change="createQuery('genre')"
                      ref="genre"
              >
                <option>Choose an option :</option>
                <option v-for="(tag, index) in tags"
                        :value="tag"
                        :key="index"
                >{{tag}}</option>
              </select>
            </div>
            <div class="shop-books-nav-filter-type">
              <h4 class="shop-books-nav-filter-type-title">Year</h4>
              <select class="shop-books-nav-filter-type-input"
                      v-model="manageFilters.year"
                      ref="year"
                      @change="createQuery('year')"
              >
                <option>Choose an option :</option>
                <option value="before 1900">Before 1900s</option>
                <option value="1900">1900s</option>
                <option value="2000">2000s</option>
                <option value="2010">2010s</option>
              </select>
            </div>
            <div class="shop-books-nav-filter-type">
              <h4 class="shop-books-nav-filter-type-title">Author</h4>
              <input type="text" placeholder="Author's name" class="shop-books-nav-filter-type-input"
                     ref="author"
                     v-model="manageFilters.author"
                     @change.prevent="createQuery('author')"

              >
            </div>
            <div class="shop-books-nav-filter-type">
              <h4 class="shop-books-nav-filter-type-title">Price Range</h4>
              <select class="shop-books-nav-filter-type-input"
                      v-model="manageFilters.priceRange"
                      ref="priceRange"
                      @change="createQuery('priceRange')"
              >
                <option>Choose an option :</option>
                <option value=4000>Above $30</option>
                <option value=3000>Under $30</option>
                <option value=2000>Under $20</option>
                <option value=500>Under $5</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <main class="shop-books-main">
        <div class="shop-books-main-grid"
             :class="{'shop-books-main-grid-small': screenWidth <= 1536}"

        >
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

              >${{(book.oldPrice/100).toFixed(2)}}</div>
              <div class="book-card-regular-price">${{(book.price/100).toFixed(2)}}</div>
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

              >Sign In To Add Books To Cart</button>
              <!--                    <button class="btn-default sml-btn popular-book-button shadow2 accent-clr-2">View Details</button>-->
            </div>

          </div>


        </div>

        <div class="shop-books-main-nav">
          <nav class="shop-books-main-nav-container">
            <div class="shop-books-main-nav-item main-nav-arrow right-arrow"
                 :class="{freeze:manageListItems.navBar.activeNavBar === 0}"
                 @click.prevent="manageListItems.previous()"

            >
              <span class="main-nav-arrow-animate"> &#8592;</span>
            </div>
            <div class="shop-books-main-nav-item"
                 v-for="(navLink, index) in manageListItems.navBar.show"
                 :key="index"
                 :class="{'shop-books-main-nav-active-page': manageListItems.activePage === navLink}"
                 @click.prevent="manageListItems.createPage(navLink)"
            >{{navLink + 1}}</div>

            <div class="shop-books-main-nav-item main-nav-arrow left-arrow"
                 :class="{freeze:manageListItems.navBar.activeNavBar === manageListItems.numPages - 1}"
                 @click.prevent="manageListItems.next()"

            >
              <span class="main-nav-arrow-animate"> &#8594;</span>
            </div>
          </nav>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>

</style>