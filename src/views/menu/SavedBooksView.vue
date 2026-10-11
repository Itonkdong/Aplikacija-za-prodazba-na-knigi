<script>
import {collection, doc, getDoc, onSnapshot, query, updateDoc, where} from "firebase/firestore";
import InfoPopup from "@/components/InfoPopup.vue";
import ErrorPopup from "@/components/ErrorPopup.vue";
import ConfirmationPopup from "@/components/ConfirmationPopup.vue";

export default {
  name: "SavedBooksView",
  components: {ConfirmationPopup, ErrorPopup, InfoPopup},
  props: ['user','userInfo','goToLink'],
  computed:{
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
  data()
  {
    return {
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
      everythingLoaded:false,
      unSubscribers: {
        itemsList: null,
      },
      manageListItems: {
        //TODO: Change accordingly
        numItemsOnOnePage: 4,
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
  watch:{
    user(newValue,oldValue)
    {
      console.log('Idi vo watcher');
      if(newValue)
      {
        if(this.unSubscribers.itemsList)
        {
          this.unSubscribers.itemsList();
          this.unSubscribers.itemsList = null;
        }
        this.itemsListSubscriber();
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

          break;
      }
    },
    cancelAction(action)
    {
      switch (action)
      {

      }
    },
    itemsListSubscriber(userQuery = null)
    {

      if(!this.user)
      {
        return;
      }

      //TODO: Change the database accordingly
      const itemsListRef = collection(this.$db, 'usersList');
      const queryRef = query(itemsListRef, where('uid', '==', this.user.uid))
      this.unSubscribers.itemsList = onSnapshot(queryRef, (snapshot) =>
      {

        let allItems = [];
        let snapshotToIterate = snapshot;
        if (userQuery)
        {
          snapshotToIterate = userQuery;
        }

        snapshotToIterate.docs.forEach((itemInfo) =>
        {
          allItems = itemInfo.data().savedBooks;
        })


        this.manageListItems.allItems = allItems;
        console.log(this.manageListItems.allItems);

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
    async removeBookFromSaved(fetchedBook)
    {
      try
      {
        if(!this.userInfo)
        {
          throw new Error('Not signed in');
        }

      }
      catch (e)
      {
        this.menus.popups.error.generatePopup('Error Occurred',`You must sign in before you can remove books`)
        this.menus.popups.open('error');
        console.error(e);
        return
      }



      const userSavedBooks = [...this.userInfo.savedBooks];
      const bid = fetchedBook.bid;
      const title = fetchedBook.title;

      for (let i = 0; i < userSavedBooks.length; i++)
      {
        const book = userSavedBooks[i];
        if(book.bid === bid)
        {
          userSavedBooks.splice(i,1);
          break;
        }
      }

      const userRef = doc(this.$db,'usersList', this.user.uid);
      try
      {
        await updateDoc(userRef, {
          savedBooks: userSavedBooks,
        });
      }
      catch (e)
      {
        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred',`There was a problem removing this book from your 'Saved books' list. Try again later.`)
        this.menus.popups.open('error');
      }



    },
    async removeAllSavedBooks()
    {
      try
      {
        if(!this.userInfo)
        {
          throw new Error('Not signed in');
        }

      }
      catch (e)
      {
        this.menus.popups.error.generatePopup('Error Occurred',`You must sign in before you can remove books`)
        this.menus.popups.open('error');
        console.error(e);
        return
      }

      const userRef = doc(this.$db,'usersList', this.user.uid);
      try
      {
        await updateDoc(userRef, {
          savedBooks: [],
        });
        this.menus.popups.info.generatePopup(`Cleared 'Saved Books' list`,`Your 'Saved Books' list was successfully cleared.`)
        this.menus.popups.open('info');
      }
      catch (e)
      {
        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred',`There was a problem clearing your 'Saved Books' list. Try again later.`)
        this.menus.popups.open('error');
      }

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
        this.menus.popups.info.generatePopup('Successfully Added Book to Cart', `You have successfully added ${title} to your cart.`);
        this.menus.popups.open('info');

      }
      catch (e)
      {
        this.menus.popups.info.generatePopup('Error Occurred', `There was an error adding ${title} to your cart.
        Please try again later.`);
        this.menus.popups.open('info');
        console.error(e);
      }

    },
    openBookView(book)
    {
      this.$bus.$emit('openBookView', book);
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
  <main class="user-profile-savedBooks"
        :class="{'menu-freeze':isPopupOpen}"
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
    <h3 class="user-profile-savedBooks-header shadow5">Your Saved Books</h3>
    <div class="user-profile-savedBooks-items"
         :class="{'user-profile-savedBooks-items-noItems':manageListItems.allItems.length === 0}"
         v-if="everythingLoaded"

    >
      <div class="user-profile-savedBooks-item user-profile-savedBooks-noSavedBooks"
           v-if="manageListItems.allItems.length === 0"
      >
        <p>Looks like you don't have any saved books.</p>
      </div>
      <div class="user-profile-savedBooks-item"
           v-else
           v-for="(book,index) in manageListItems.itemsToShow"
           :key="index"
           @click.prevent="openBookView(book)"

      >
        <div class="user-profile-savedBooks-img">
          <img class="shadow2" :src="book.coverPictureURL " alt="Book Cover">
        </div>
        <div class="user-profile-savedBooks-coverInfo">
          <h4>{{book.title}}</h4>
          <h5>{{book.author}}</h5>
        </div>
        <div class="user-profile-savedBooks-buttons">
          <button class="btn-default shadow2"
                  @click.stop="addBookToCart(book)"

          >Add to Cart</button>
          <button class="btn-default shadow2"
                  @click.stop="removeBookFromSaved(book)"

          >Remove from Saved</button>

        </div>
      </div>

    </div>
    <nav class="user-profile-savedBooks-nav">
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
    <div class="user-profile-savedBooks-footer">
      <button class="btn-default shadow2"
              v-if="manageListItems.allItems.length !== 0"
              @click.prevent="removeAllSavedBooks()"
      >Remove All from Saved</button>
      <button class="btn-default shadow2"
              v-else
              @click.prevent="goToLink('/shop')"
      >Browse Books</button>
    </div>
  </main>
</template>

<style scoped>

</style>