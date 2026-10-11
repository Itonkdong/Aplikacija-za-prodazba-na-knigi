<script>
import {
  addDoc,
  collection, deleteDoc,
  doc,
  getDoc, getDocs,
  onSnapshot, orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import {getDownloadURL, getStorage, ref, uploadBytes} from "firebase/storage";
import {updateProfile} from "firebase/auth";
import ErrorPopup from "@/components/ErrorPopup.vue";
import InfoPopup from "@/components/InfoPopup.vue";
import ConfirmationPopup from "@/components/ConfirmationPopup.vue";

export default {
  name: "ManageBookstoreView",
  components: {ConfirmationPopup, InfoPopup, ErrorPopup},
  props: ['user', 'goToLink', 'userInfo'],
  computed: {
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
  watch: {
    "menus.popups.editBook.show"(newValue, oldValue)
    {
      if (!newValue && !this.menus.popups.manageDetails.show && !this.menus.popups.manageReviews.show)
      {
        this.bookToView = null;
        this.savedBook = null;
      }
    },
    "bookToView.discountAmount"(newValue, oldValue)
    {
      if (!this.bookToView)
      {
        return;
      }

      if (newValue < 0)
      {
        this.bookToView.discountAmount = 0;
        return
      }


      if (!newValue)
      {
        this.bookToView.price = this.savedBook.price;
        return;
      }

      const i = this.bookToView.price * newValue / 100;
      this.bookToView.price = this.bookToView.price - i;

    }
  },
  data()
  {
    return {
      manageBookstore: {
        sortSelectedOption: 'Choose an option :',
        searchTitle: '',
        searchISBN: '',
        filterBY: 'Choose an option :',
        sortBy: [
          {
            name: 'Choose an option',
            order: '',
            selected: true,
            backendData: 'null'
          },
          {
            name: 'Date-Added',
            order: 'asc',
            selected: false,
            backendData: 'dateAdded'
          },
          {
            name: 'Date-Added',
            order: 'desc',
            selected: false,
            backendData: 'dateAdded'
          },
          {
            name: 'Price',
            order: 'asc',
            selected: false,
            backendData: 'price'
          },
          {
            name: 'Price',
            order: 'desc',
            selected: false,
            backendData: 'price'
          },
          {
            name: 'Alphabetically',
            order: 'asc',
            selected: false,
            backendData: 'title'
          },
          {
            name: 'Alphabetically',
            order: 'desc',
            selected: false,
            backendData: 'title'
          }
        ]
      },
      tags: ['Classic', 'Poetry', 'Fiction', 'Romance', 'Fantasy', 'Biography', 'Philosophy', 'Young Adult', 'Adventure', 'Dystopian',
        'Thriller', 'Tragedy', 'Comedy', 'Drama'],
      bookCoverPictureHandler: {
        file: null,
        show: false,
        downloadLink: null,
        localURL: null,
        handleFileChange(event)
        {
          this.file = event.target.files[0];
          console.log(this.file);
        },
        open()
        {
          this.show = true;
        },
        close()
        {
          this.show = false;
        }
      },
      newBook: {
        isbn: '',
        title: '',
        author: '',
        tags: [],
        description: '',
        moreInfo: {
          language: '',
          originalTitle: '',
          publisher: '',
          yearOfRelease: '',
          numberOfPages: '',
          dimensions: '',
        },
        oldPrice: 0,
        price: 0,
        stock: 0
      },
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
          addBook: {
            show: false,
            slide: false,
            alreadyOpen: false
          },
          addTag: {
            show: false,
            slide: false,
            alreadyOpen: false
          },
          editBook: {
            show: false,
            slide: false,
            alreadyOpen: false
          },
          manageDetails: {
            show: false,
            slide: false,
            alreadyOpen: false
          },
          manageReviews: {
            show: false,
            slide: false,
            alreadyOpen: false
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
        allItems: [],
        activePage: 0,
        numPages: 0,
        itemsToShow: [],
        navBar: {
          start: 0,
          end: -1,
          show: [],
          activeNavBar: 0,
        },
        calcTotalPages()
        {
          this.numPages = Math.floor(this.allItems.length / 5);
          const afterRoundCal = this.allItems.length - this.numPages * 5;
          if (afterRoundCal)
          {
            this.numPages++;
          }
          return this.numPages;
        },
        createPage(activePage)
        {
          this.activePage = activePage;
          const start = this.activePage * 5;
          const end = start + 5

          const itemsToShow = this.allItems.slice(start, end);

          //Only needed for tha last page if there aren't a total of 5 items
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
        }
      },
      bookToView: null,
      savedBook: null,
      sameOldPrice: true,

      //Interfaces
      interfaces: {
        isbn: {
          show: false,
          value: '',
          oldValue: '',
          confirmed: false,
        },
        title: {
          show: false,
          value: '',
          oldValue: '',
          confirmed: false,
        },
        author: {
          show: false,
          value: '',
          oldValue: '',
          confirmed: false,
        },
        description: {
          show: false,
          value: '',
          oldValue: '',
          confirmed: false,
        },
        price: {
          show: false,
          value: 0,
          oldValue: '',
          confirmed: false,
        },
        stock: {
          show: false,
          value: 0,
          oldValue: '',
          confirmed: false,
        },
        discountAmount: {
          show: false,
          value: 0,
          oldValue: '',
          confirmed: false,
        },
        onDiscount: {
          show: false,
          value: 0,
          oldValue: '',
          confirmed: false,
        },
        language: {
          show: false,
          value: 0,
          oldValue: '',
          confirmed: false,
        },
        yearOfRelease: {
          show: false,
          value: 0,
          oldValue: '',
          confirmed: false,
        },
        originalTitle: {
          show: false,
          value: 0,
          oldValue: '',
          confirmed: false,
        },
        numberOfPages: {
          show: false,
          value: 0,
          oldValue: '',
          confirmed: false,
        },
        publisher: {
          show: false,
          value: 0,
          oldValue: '',
          confirmed: false,
        },
        dimensions: {
          show: false,
          value: 0,
          oldValue: '',
          confirmed: false,
        },
      }
    }
  },
  methods: {
    openInterface(interfaceID)
    {
      this.interfaces[interfaceID].show = true;
    },
    closeInterface(interfaceID)
    {
      this.bookToView[interfaceID] = this.savedBook[interfaceID];
      this.interfaces[interfaceID].show = false;
    },
    closePopup(popup)
    {
      this.menus.popups.close(popup);
    },
    clearSearchInput(input)
    {

      if (input === 'title')
      {
        if (this.manageBookstore.searchTitle)
        {
          this.manageBookstore.searchISBN = '';
        }
      }
      else if (input === 'ISBN')
      {
        if (this.manageBookstore.searchISBN)
        {
          this.manageBookstore.searchTitle = '';
        }
      }
    },
    createFilterOption()
    {
      let filter = null;
      console.log('Povikan filterBookstore: ', this.manageBookstore.filterBY);
      if (this.manageBookstore.filterBY === 'In Stock')
      {
        filter = {
          field: 'stock',
          operator: '>',
          value: 0
        }
      }
      else if (this.manageBookstore.filterBY === 'Out of Stock')
      {
        filter = {
          field: 'stock',
          operator: '==',
          value: 0
        }
      }
      else if (this.manageBookstore.filterBY === 'On Discount')
      {
        filter = {
          field: 'onDiscount',
          operator: '==',
          value: true
        }
      }
      else if (this.manageBookstore.filterBY === 'New')
      {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set the time to the beginning of the day

        const fiveDaysAgo = new Date(today);
        fiveDaysAgo.setDate(today.getDate() - 5);

        filter = {
          field: 'dateAdded',
          operator: ['>=', '<='],
          value: [fiveDaysAgo, today]
        }
      }

      return filter;

    },
    filterBookstore()
    {
      //If it is on 'Choose an option:, filter is not applied'
      if (this.manageBookstore.filterBY === 'Choose an option :')
      {
        if (this.unSubscribers.filter)
        {
          this.unSubscribers.filter();
          this.unSubscribers.filter = null;
        }
        this.unSubscribers.itemsList();
        if (this.manageBookstore.searchTitle)
        {
          console.log('Idi do tuka');
          this.creatingAQuery('title');
          return;
        }
        else if (this.manageBookstore.searchISBN)
        {
          this.creatingAQuery('isbn');
          return;
        }
        else
        {
          this.itemsListSubscriber();
          return;
        }
      }

      //Creating the filter
      const filter = this.createFilterOption();


      //Filter bug guard
      if (filter === null)
      {
        return;
      }

      console.log('Povikan filterBookstore: ', filter);


      //
      const booksRef = collection(this.$db, "books");
      let queryRef = null;

      try
      {
        if (this.manageBookstore.searchTitle)
        {
          if (this.manageBookstore.sortSelectedOption !== 'Choose an option :')
          {
            const selectedSortOption = this.createSortOption();
            if (selectedSortOption.backendData !== 'title')
            {
              if (filter.field === 'dateAdded')
              {
                queryRef = query(booksRef,
                    where("title", ">=", this.manageBookstore.searchTitle),
                    where("title", "<=", this.manageBookstore.searchTitle + "\uf8ff"),
                    where(filter.field, filter.operator[0], filter.value[0]),
                    where(filter.field, filter.operator[1], filter.value[1]),
                    orderBy('title', 'asc'),
                    orderBy(selectedSortOption.backendData, selectedSortOption.order)
                );
              }
              else
              {
                queryRef = query(booksRef,
                    where("title", ">=", this.manageBookstore.searchTitle),
                    where("title", "<=", this.manageBookstore.searchTitle + "\uf8ff"),
                    where(filter.field, filter.operator, filter.value),
                    orderBy('title', 'asc'),
                    orderBy(selectedSortOption.backendData, selectedSortOption.order)
                );
              }
            }
            else
            {

              if (filter.field === 'dateAdded')
              {
                queryRef = query(booksRef,
                    where("title", ">=", this.manageBookstore.searchTitle),
                    where("title", "<=", this.manageBookstore.searchTitle + "\uf8ff"),
                    where(filter.field, filter.operator[0], filter.value[0]),
                    where(filter.field, filter.operator[1], filter.value[1]),
                    orderBy(selectedSortOption.backendData, selectedSortOption.order)
                );


              }
              else
              {
                queryRef = query(booksRef,
                    where("title", ">=", this.manageBookstore.searchTitle),
                    where("title", "<=", this.manageBookstore.searchTitle + "\uf8ff"),
                    where(filter.field, filter.operator, filter.value),
                    orderBy(selectedSortOption.backendData, selectedSortOption.order)
                );
              }
            }
          }
          else
          {
            if (filter.field === 'dateAdded')
            {
              queryRef = query(booksRef,
                  where("title", ">=", this.manageBookstore.searchTitle),
                  where("title", "<=", this.manageBookstore.searchTitle + "\uf8ff"),
                  where(filter.field, filter.operator[0], filter.value[0]),
                  where(filter.field, filter.operator[1], filter.value[1]),
              );
            }
            else
            {
              console.log('Pravilno granjenje');
              queryRef = query(booksRef,
                  where("title", ">=", this.manageBookstore.searchTitle),
                  where("title", "<=", this.manageBookstore.searchTitle + "\uf8ff"),
                  where(filter.field, filter.operator, filter.value),
              );
            }
          }
        }
        else if (this.manageBookstore.searchISBN)
        {
          if (this.manageBookstore.sortSelectedOption !== 'Choose an option :')
          {
            const selectedSortOption = this.createSortOption();
            if (filter.field === 'dateAdded')
            {
              queryRef = query(booksRef,
                  where("isbn", ">=", this.manageBookstore.searchISBN),
                  where("isbn", "<=", this.manageBookstore.searchISBN + "\uf8ff"),
                  where(filter.field, filter.operator[0], filter.value[0]),
                  where(filter.field, filter.operator[1], filter.value[1]),
                  orderBy('isbn', 'asc'),
                  orderBy(selectedSortOption.backendData, selectedSortOption.order)
              );
            }
            else
            {
              queryRef = query(booksRef,
                  where("isbn", ">=", this.manageBookstore.searchISBN),
                  where("isbn", "<=", this.manageBookstore.searchISBN + "\uf8ff"),
                  where(filter.field, filter.operator, filter.value),
                  orderBy('isbn', 'asc'),
                  orderBy(selectedSortOption.backendData, selectedSortOption.order)
              );

            }
          }
          else
          {
            if (filter.field === 'dateAdded')
            {
              queryRef = query(booksRef,
                  where("isbn", ">=", this.manageBookstore.searchISBN),
                  where("isbn", "<=", this.manageBookstore.searchISBN + "\uf8ff"),
                  where(filter.field, filter.operator[0], filter.value[0]),
                  where(filter.field, filter.operator[1], filter.value[1]),
              );
            }
            else
            {
              queryRef = query(booksRef,
                  where("isbn", ">=", this.manageBookstore.searchISBN),
                  where("isbn", "<=", this.manageBookstore.searchISBN + "\uf8ff"),
                  where(filter.field, filter.operator, filter.value),
              );

            }
          }
        }
        else
        {
          if (this.manageBookstore.sortSelectedOption !== 'Choose an option :')
          {
            const selectedSortOption = this.createSortOption();
            if (filter.field === 'dateAdded')
            {
              queryRef = query(booksRef,
                  where(filter.field, filter.operator[0], filter.value[0]),
                  where(filter.field, filter.operator[1], filter.value[1]),
                  orderBy(filter.field, 'asc'),
                  orderBy(selectedSortOption.backendData, selectedSortOption.order)
              );
            }
            else
            {
              queryRef = query(booksRef,
                  where(filter.field, filter.operator, filter.value),
                  orderBy(filter.field, 'asc'),
                  orderBy(selectedSortOption.backendData, selectedSortOption.order)
              );

            }
          }
          else
          {
            if (filter.field === 'dateAdded')
            {
              queryRef = query(booksRef,
                  where(filter.field, filter.operator[0], filter.value[0]),
                  where(filter.field, filter.operator[1], filter.value[1]),
              );
            }
            else
            {
              queryRef = query(booksRef,
                  where(filter.field, filter.operator, filter.value),
              );

            }
          }
        }

      } catch (e)
      {
        console.error(e);
        this.manageBookstore.filterBY = this.manageBookstore.sortSelectedOption = "Choose an option :"
        this.manageBookstore.searchTitle = this.manageBookstore.searchISBN = "";
        this.menus.popups.info.generatePopup('Invalid Filter', `You can not filter on those fields`);
        this.menus.popups.open('info')
        if (this.unSubscribers.filter)
        {
          this.unSubscribers.filter();
          this.unSubscribers.filter = null;
        }

        this.unSubscribers.itemsList();
        this.itemsListSubscriber();
        return;
      }

      this.unSubscribers.filter = onSnapshot(queryRef, (querySnapshot) =>
      {

        if (querySnapshot.docs.length)
        {
          if (this.unSubscribers.itemsList)
          {
            this.unSubscribers.itemsList();
          }

          this.itemsListSubscriber(querySnapshot);
        }
        else
        {
          this.manageBookstore.filterBY = "Choose an option :"
          this.menus.popups.info.generatePopup('Filter Complete', 'There are 0 books with that filter');
          this.menus.popups.open('info')
          this.filterBookstore();
        }
      })
    },
    createSortOption()
    {
      let option = '';
      for (let i = 0; i < this.manageBookstore.sortSelectedOption.length; i++)
      {
        if (this.manageBookstore.sortSelectedOption[i] === ' ')
        {
          break
        }
        option += this.manageBookstore.sortSelectedOption[i];
      }

      let order = ''
      if (this.manageBookstore.sortSelectedOption[this.manageBookstore.sortSelectedOption.length - 3] === 'a')
      {
        order = this.manageBookstore.sortSelectedOption.substring(this.manageBookstore.sortSelectedOption.length - 3, this.manageBookstore.sortSelectedOption.length);
      }
      else
      {
        order = this.manageBookstore.sortSelectedOption.substring(this.manageBookstore.sortSelectedOption.length - 4, this.manageBookstore.sortSelectedOption.length);
      }


      console.log("SE povika creatingquery with sort, option:", option, order);


      let selectedOption = null
      this.manageBookstore.sortBy.forEach((sortOption) =>
      {
        sortOption.selected = false;
        if (sortOption.name === option && sortOption.order === order)
        {
          selectedOption = sortOption;
          selectedOption.selected = true;

        }
      })

      return selectedOption;

    },
    async creatingAQueryWithSort()
    {
      //Filters are ought to be applied from left to right, otherwise cleared
      if (this.manageBookstore.filterBY !== 'Choose an option :')
      {
        this.manageBookstore.filterBY = 'Choose an option :';
        await this.filterBookstore();
      }
      //----------------------------------------//

      if (this.manageBookstore.sortSelectedOption === 'Choose an option :')
      {
        if (this.unSubscribers.sort)
        {
          this.unSubscribers.sort();
          this.unSubscribers.sort = null;
        }
        this.unSubscribers.itemsList();

        if (this.manageBookstore.searchTitle)
        {
          console.log('Idi do tuka');
          await this.creatingAQuery('title');
          return;
        }
        else if (this.manageBookstore.searchISBN)
        {
          await this.creatingAQuery('isbn');
          return;
        }
        else
        {
          this.itemsListSubscriber();
          return;
        }
      }


      const selectedOption = this.createSortOption();
      console.log(selectedOption);

      const booksRef = collection(this.$db, "books");
      let queryRef = null;


      try
      {
        if (this.manageBookstore.searchISBN)
        {

          queryRef = query(booksRef,
              where("isbn", ">=", this.manageBookstore.searchISBN),
              where("isbn", "<=", this.manageBookstore.searchISBN + "\uf8ff"),
              orderBy('isbn', 'asc'),
              orderBy(selectedOption.backendData, selectedOption.order)
          );

        }
        else if (this.manageBookstore.searchTitle)
        {

          if (selectedOption.backendData === 'title')
          {
            queryRef = query(booksRef,
                where("title", ">=", this.manageBookstore.searchTitle),
                where("title", "<=", this.manageBookstore.searchTitle + "\uf8ff"),
                orderBy('title', selectedOption.order),)
          }
          else
          {
            queryRef = query(booksRef,
                where("title", ">=", this.manageBookstore.searchTitle),
                where("title", "<=", this.manageBookstore.searchTitle + "\uf8ff"),
                orderBy('title', selectedOption.order),
                orderBy(selectedOption.backendData, selectedOption.order));
          }
        }
        else
        {
          queryRef = query(booksRef,
              orderBy(selectedOption.backendData, selectedOption.order)
          );
        }
      } catch (e)
      {
        console.error(e);
        this.manageBookstore.sortSelectedOption = "Choose an option :"
        this.manageBookstore.searchTitle = this.manageBookstore.searchISBN = "";
        this.menus.popups.info.generatePopup('Invalid Filter', `You can not filter on those fields`);
        this.menus.popups.open('info')
        if (this.unSubscribers.sort)
        {
          this.unSubscribers.sort();
          this.unSubscribers.sort = null;
        }

        this.unSubscribers.itemsList();
        this.itemsListSubscriber();
        return;
      }

      this.unSubscribers.sort = onSnapshot(queryRef, (querySnapshot) =>
      {

        if (querySnapshot.docs.length)
        {
          this.unSubscribers.itemsList();
          this.itemsListSubscriber(querySnapshot);
        }
        else
        {
          this.manageBookstore.searchTitle = this.manageBookstore.searchISBN = "";
          this.manageBookstore.sortSelectedOption = 'Choose an option :'
          this.menus.popups.info.generatePopup('Filter Complete', `There are 0 books with that filter`);
          this.menus.popups.open('info')
          if (this.unSubscribers.sort)
          {
            this.unSubscribers.sort();
            this.unSubscribers.sort = null;
          }

          this.unSubscribers.itemsList();
          this.itemsListSubscriber();
        }
      })

    },
    async creatingAQuery(input)
    {
      this.clearSearchInput(input)

      //Filters are ought to be applied from left to right, otherwise cleared

      if (this.manageBookstore.sortSelectedOption !== 'Choose an option :')
      {
        this.manageBookstore.sortSelectedOption = 'Choose an option :';
        await this.createSortOption();
      }

      if (this.manageBookstore.filterBY !== 'Choose an option :')
      {
        this.manageBookstore.filterBY = 'Choose an option :';
        await this.filterBookstore();
      }
      //---------------------------------//

      const booksRef = collection(this.$db, "books");
      let queryRef = null

      if (this.manageBookstore.searchTitle)
      {
        queryRef = query(booksRef,
            where("title", ">=", this.manageBookstore.searchTitle),
            where("title", "<=", this.manageBookstore.searchTitle + "\uf8ff"));

      }
      else if (this.manageBookstore.searchISBN)
      {

        queryRef = query(booksRef,
            where("isbn", ">=", this.manageBookstore.searchISBN),
            where("isbn", "<=", this.manageBookstore.searchISBN + "\uf8ff"));

      }
      else
      {
        if (this.unSubscribers.query)
        {
          this.unSubscribers.query();
          this.unSubscribers.query = null;
        }

        this.unSubscribers.itemsList();
        this.itemsListSubscriber();
        return;
      }


      this.unSubscribers.query = onSnapshot(queryRef, (querySnapshot) =>
      {

        if (querySnapshot.docs.length)
        {
          this.unSubscribers.itemsList();
          this.itemsListSubscriber(querySnapshot);
        }
        else
        {
          this.manageBookstore.searchTitle = this.manageBookstore.searchISBN = "";
          this.menus.popups.info.generatePopup('Filter Complete', `There are 0 books with that filter`);
          this.menus.popups.open('info')
          if (this.unSubscribers.query)
          {
            this.unSubscribers.query();
            this.unSubscribers.query = null;
          }

          this.unSubscribers.itemsList();
          this.itemsListSubscriber();
        }
      })

    },
    async editPrices(action)
    {
      if (action === 'close')
      {
        this.interfaces.price.show = false;
        this.interfaces.discountAmount.show = false;
        this.interfaces.onDiscount.show = false;
        this.interfaces.stock.show = false;

        this.bookToView.price = this.savedBook.price;
        this.bookToView.oldPrice = this.savedBook.oldPrice;
        this.bookToView.discountAmount = this.savedBook.discountAmount;
        this.bookToView.onDiscount = this.savedBook.onDiscount;
        this.bookToView.stock = this.savedBook.stock;

      }
      else if (action === 'save')
      {
        const bookRef = doc(this.$db, 'books', this.bookToView.bid);

        if (this.bookToView.onDiscount && !this.bookToView.discountAmount)
        {
          this.bookToView.onDiscount = false;
          this.bookToView.discountAmount = 0;
        }

        if (!(this.bookToView.onDiscount && this.bookToView.discountAmount))
        {
          this.bookToView.oldPrice = this.bookToView.price;
        }

        if (!this.bookToView.onDiscount && !this.bookToView.discountAmount && this.savedBook.onDiscount)
        {
          this.bookToView.price = this.savedBook.oldPrice;
          this.bookToView.oldPrice = this.savedBook.oldPrice;
        }

        try
        {
          await updateDoc(bookRef, {
            price: this.bookToView.price,
            oldPrice: this.bookToView.oldPrice,
            discountAmount: this.bookToView.discountAmount,
            onDiscount: this.bookToView.onDiscount,
            stock: this.bookToView.stock,
          })
          this.menus.popups.error.generatePopup('Successfully Updated Info', 'You have successfully updated e-commerce info');
          this.menus.popups.open('error');
          this.interfaces.price.show = false;
          this.interfaces.onDiscount.show = false;
          this.interfaces.discountAmount.show = false;
          this.interfaces.stock.show = false;
        } catch (e)
        {
          this.menus.popups.error.generatePopup('Error Occurred', 'An error occurred while updating the book. Try again later.');
          this.menus.popups.open('error');
        }
      }

    },

    async editMoreInfo(action)
    {
      if (action === 'close')
      {
        this.interfaces.language.show = false;
        this.interfaces.yearOfRelease.show = false;
        this.interfaces.originalTitle.show = false;
        this.interfaces.numberOfPages.show = false;
        this.interfaces.publisher.show = false;
        this.interfaces.dimensions.show = false;

        for (const info in this.bookToView.moreInfo)
        {
          this.bookToView.moreInfo[info] = this.savedBook.moreInfo[info];

        }

      }
      else if (action === 'save')
      {
        const bookRef = doc(this.$db, 'books', this.bookToView.bid);


        try
        {
          await updateDoc(bookRef, {

            moreInfo: {
              language: this.bookToView.moreInfo.language,
              yearOfRelease: this.bookToView.moreInfo.yearOfRelease,
              originalTitle: this.bookToView.moreInfo.originalTitle,
              numberOfPages: this.bookToView.moreInfo.numberOfPages,
              publisher: this.bookToView.moreInfo.publisher,
              dimensions: this.bookToView.moreInfo.dimensions,
            }
          })
          this.menus.popups.error.generatePopup('Successfully Updated Info', 'You have successfully updated info.');
          this.menus.popups.open('error');
          this.interfaces.language.show = false;
          this.interfaces.yearOfRelease.show = false;
          this.interfaces.originalTitle.show = false;
          this.interfaces.numberOfPages.show = false;
          this.interfaces.publisher.show = false;
          this.interfaces.dimensions.show = false;
        } catch (e)
        {
          console.error(e);
          this.menus.popups.error.generatePopup('Error Occurred', 'An error occurred while updating the book. Try again later.');
          this.menus.popups.open('error');
        }
      }

    },
    async editTag(action, tag)
    {
      const bookRef = doc(this.$db, 'books', this.bookToView.bid);
      let newValue = null;

      if (action === 'add')
      {
        for (let i = 0; i < this.bookToView.tags.length; i++)
        {
          if (this.bookToView.tags[i] === tag)
          {
            this.menus.popups.close('addTag');
            return
          }
        }

        this.bookToView.tags.push(tag);
        this.menus.popups.close('addTag');

        newValue = this.bookToView.tags;

      }
      else if (action === 'remove')
      {

        try
        {
          if(this.bookToView.tags.length === 1)
          {
            throw new Error('The book must have at least one tag');
          }
        }
        catch (e)
        {
          console.error(e);
          this.menus.popups.error.generatePopup('Error Occurred', 'Every book must have at least one tag.');
          this.menus.popups.open('error');
          return;
        }

        for (let i = 0; i < this.bookToView.tags.length; i++)
        {
          if (this.bookToView.tags[i] === tag)
          {
            this.bookToView.tags.splice(i, 1);
            break;
          }
        }

        newValue = this.bookToView.tags;
      }


      try
      {
        await updateDoc(bookRef, {
          tags: newValue
        })
        this.menus.popups.error.generatePopup('Successfully Updated Info', 'You have successfully updated tags');
        this.menus.popups.open('error');
      } catch (e)
      {
        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred', 'An error occurred while updating the book. Try again later.');
        this.menus.popups.open('error');
      }

    },
    addTag(newTag)
    {
      for (let i = 0; i < this.newBook.tags.length; i++)
      {
        if (this.newBook.tags[i] === newTag)
        {
          this.menus.popups.close('addTag');
          return
        }
      }

      this.newBook.tags.push(newTag);
      this.menus.popups.close('addTag');
    },
    removeTag(tagToRemove)
    {
      for (let i = 0; i < this.newBook.tags.length; i++)
      {
        if (this.newBook.tags[i] === tagToRemove)
        {
          this.newBook.tags.splice(i, 1);
          return
        }
      }
    },
    discard()
    {
      if (this.allInfoEmitted())
      {
        this.menus.popups.close('addBook');
        return;
      }

      this.menus.popups.confirmation.generatePopup('Discard Input', `Are you sure you want to close this menu?
      All your inputs will reset.`, 'discardChanges');
      this.menus.popups.open('confirmation')
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
    loadLocally()
    {
      if (this.bookCoverPictureHandler.file)
      {
        const reader = new FileReader();

        reader.onload = (event) =>
        {
          this.bookCoverPictureHandler.localURL = event.target.result; // Set the image source to the selected file's data URL
        };

        reader.readAsDataURL(this.bookCoverPictureHandler.file); // Read the file as a data URL
      }
      else
      {
        this.bookCoverPictureHandler.localURL = null; // Clear the image if no file is selected
      }
      this.bookCoverPictureHandler.close();

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


        //TODO: This is specific to this page, delete accordingly
        //---------------------------------------------------------
        if (this.bookToView)
        {
          for (let i = 0; i < this.manageListItems.allItems.length; i++)
          {
            const book = this.manageListItems.allItems[i];
            if (book.bid === this.bookToView.bid)
            {
              this.bookToView = {...book};
              this.savedBook = {...book};
              this.savedBook.moreInfo = {...book.moreInfo};
              break;
            }
          }
        }
        //------------------------------------------------------------


        this.everythingLoaded = true;
      })
    },
    resetInputs()
    {
      for (const input in this.newBook)
      {
        console.log(input);
        if (input === 'tags')
        {
          this.newBook[input] = [];
          continue;
        }

        if (input === 'moreInfo')
        {
          for (const moreInfo in this.newBook[input])
          {
            this.newBook[input][moreInfo] = '';
          }
          continue;
        }
        this.newBook[input] = '';

      }
    },
    allInfoFilled()
    {
      for (const input in this.newBook)
      {

        if (input === 'tags' && this.newBook[input].length === 0)
        {
          return false;
        }

        if (input === 'moreInfo')
        {
          for (const moreInfo in this.newBook[input])
          {
            if (!this.newBook[input][moreInfo])
            {
              return false;
            }
          }
          continue;
        }


        if (!this.newBook[input])
        {
          return false;
        }

      }
      return true;
    },
    allInfoEmitted()
    {
      for (const input in this.newBook)
      {
        if (input === 'tags')
        {
          if (this.newBook[input].length !== 0)
          {
            return false
          }
          else
          {
            continue;
          }
        }

        if (input === 'moreInfo')
        {
          for (const moreInfo in this.newBook[input])
          {
            if (this.newBook[input][moreInfo])
            {
              return false;
            }
          }
          continue;
        }


        if (this.newBook[input])
        {
          return false;
        }

      }
      return true;
    },
    countWords(text)
    {
      let count = 0;
      for (let i = 0; i < text.length; i++)
      {
        if (text[i] === ' ')
        {
          count++;
        }
      }
      return count;
    },
    successfullyAddedNewBookHandler()
    {
      this.menus.popups.close('addBook');
      this.resetInputs();
      this.bookCoverPictureHandler.file = null;
      this.loadLocally();
      this.menus.popups.info.generatePopup('Successfully Added Book', `You have successfully added a new book to the bookstore.`);
      this.menus.popups.open('info');

    },
    async addNewBookValidation()
    {
      if (!this.allInfoFilled())
      {
        this.menus.popups.error.generatePopup('Error Occurred', `Please input all the information for the book.`);
        this.menus.popups.open('error')
        return false;
      }

      if (!this.bookCoverPictureHandler.file)
      {
        this.menus.popups.error.generatePopup('Error Occurred', `Please upload a cover picture for the book.`);
        this.menus.popups.open('error')
        return false;
      }

      if (this.countWords(this.newBook.description) >= 49)
      {
        this.menus.popups.error.generatePopup('Error Occurred', `Description too long! Please use maximum 50 words.`);
        this.menus.popups.open('error')
        return false;
      }


      const collectionRef = collection(this.$db, 'books');
      const queryR = query(collectionRef, where('isbn', '==', this.newBook.isbn));
      try
      {
        const snapshot = await getDocs(queryR)
        if (snapshot.docs.length !== 0)
        {
          this.menus.popups.error.generatePopup('Error Occurred', `There is already a book with the isbn:  ${this.newBook.isbn}
          in the database. You can't add the same book twice`);
          this.menus.popups.open('error')
          return false
        }
        else
        {
          return true
        }
      } catch (error)
      {
        console.log(error);
        return false
      }

    },
    async bookCoverBackendHandler(bid, book)
    {
      const storage = getStorage();
      const bookCoverRef = ref(storage, `book-covers/${bid}`);

      let title, author, isbn, pictureName = '';

      title = book.title;
      author = book.author;
      isbn = book.isbn;
      pictureName = this.bookCoverPictureHandler.file.name;

      const metaData = {
        customMetadata: {
          'title': `${title}`,
          'author': `${author}`,
          'isbn': `${isbn}`,
          'pictureName': `${pictureName}`
        }
      };

      await uploadBytes(bookCoverRef, this.bookCoverPictureHandler.file, metaData);

      const bookCoverURL = await getDownloadURL(bookCoverRef);

      return bookCoverURL;

    },
    async addNewBook()
    {
      //Basic math to convert price in cents
      this.newBook.price = this.newBook.price * 100;
      this.newBook.oldPrice = this.newBook.price;

      //All the necessary validation to continue
      if (!await this.addNewBookValidation())
      {
        return;
      }


      console.log('The new book is:', this.newBook);
      const booksRef = collection(this.$db, 'books');


      try
      {

        //Adding the book to the database
        const newBookRef = await addDoc(booksRef, this.newBook);

        const bid = newBookRef.id;
        const bookCoverURL = await this.bookCoverBackendHandler(bid, this.newBook)
        const data = {
          bid: bid,
          coverPictureURL: bookCoverURL,
          onDiscount: false,
          dateAdded: serverTimestamp(),
          discountAmount: 0,
          numOrders: 0,
          reviews: [],
          ratings: {
            ratingStars: 0,
            ratingNumber: 0,
            ratingArray: []
          }
        };
        await updateDoc(newBookRef, data);


        this.successfullyAddedNewBookHandler();
      } catch (error)
      {
        console.log(error);
      }
    },

    //TODO: DELETE this method, its temporary
    async DONOTUSEupdateBookInfo(book)
    {
      console.log('Se povika update book');
      const bid = book.bid;
      const bookRef = doc(this.$db, 'books', bid);


      try
      {
        await updateDoc(bookRef, {
          discountAmount: 0,
          numOrders: 0,
          reviews: [],
          ratings: {
            ratingStars: 0,
            ratingNumber: 0,
            ratingArray: []
          }
        })

        console.log('Updated book:', book);
      } catch (error)
      {
        console.log(error);
      }


    },

    //Edit Books
    openEditBook(book)
    {
      this.bookToView = {...book};
      this.savedBook = {...book};
      this.savedBook.moreInfo = {...book.moreInfo};

      /*for (const interfaceType in this.interfaces)
      {
        this.interfaces[interfaceType].oldValue = this.interfaces[interfaceType].value = book[interfaceType];
      }*/


      this.menus.popups.open('editBook');

      //This part is to reset all the filters when you open an edit book menu!
      this.manageBookstore.searchTitle = '';
      this.manageBookstore.searchISBN = '';
      this.creatingAQuery('title');
      //----------------------------------------------------------------------
    },
    async updateBook(field)
    {
      const bookRef = doc(this.$db, 'books', this.bookToView.bid);

      if (field === 'coverPicture')
      {
        const newURL = await this.bookCoverBackendHandler(this.bookToView.bid, this.bookToView);

        try
        {
          await updateDoc(bookRef, {
            coverPictureURL: newURL
          })
          this.bookCoverPictureHandler.file = null;
          this.bookCoverPictureHandler.show = false;
          this.menus.popups.error.generatePopup('Successfully Updated Cover', 'You have successfully updated the cover picture');
          this.menus.popups.open('error');
        } catch (e)
        {
          console.error(e);
          this.menus.popups.error.generatePopup('Error Occurred', 'An error occurred while updating the book. Try again later.');
          this.menus.popups.open('error');
        }


      }
      else if (field === 'isbn')
      {
        const newValue = this.bookToView.isbn;

        try
        {
          await updateDoc(bookRef, {
            isbn: newValue
          })
          this.closeInterface('isbn');
          this.menus.popups.error.generatePopup('Successfully Updated Info', 'You have successfully updated the isbn');
          this.menus.popups.open('error');
        } catch (e)
        {
          console.error(e);
          this.menus.popups.error.generatePopup('Error Occurred', 'An error occurred while updating the book. Try again later.');
          this.menus.popups.open('error');
        }
      }
      else if (field === 'title')
      {
        const newValue = this.bookToView.title;

        try
        {
          await updateDoc(bookRef, {
            title: newValue
          })
          this.closeInterface('title');
          this.menus.popups.error.generatePopup('Successfully Updated Info', 'You have successfully updated the title');
          this.menus.popups.open('error');
        } catch (e)
        {
          console.error(e);
          this.menus.popups.error.generatePopup('Error Occurred', 'An error occurred while updating the book. Try again later.');
          this.menus.popups.open('error');
        }
      }
      else if (field === 'author')
      {
        const newValue = this.bookToView.author;

        try
        {
          await updateDoc(bookRef, {
            author: newValue
          })
          this.closeInterface('author');
          this.menus.popups.error.generatePopup('Successfully Updated Info', 'You have successfully updated the author');
          this.menus.popups.open('error');
        } catch (e)
        {
          console.error(e);
          this.menus.popups.error.generatePopup('Error Occurred', 'An error occurred while updating the book. Try again later.');
          this.menus.popups.open('error');
        }
      }
      else if (field === 'description')
      {
        const newValue = this.bookToView.description;

        try
        {
          await updateDoc(bookRef, {
            description: newValue
          })
          this.closeInterface('description');
          this.menus.popups.error.generatePopup('Successfully Updated Info', 'You have successfully updated the description');
          this.menus.popups.open('error');
        } catch (e)
        {
          console.error(e)
          this.menus.popups.error.generatePopup('Error Occurred', 'An error occurred while updating the book. Try again later.');
          this.menus.popups.open('error');
        }
      }
    },
    calculateStars(review)
    {
      let numStars = review.ratingStar;
      numStars = Math.round(numStars);
      let stars = [];
      for (let i = 0; i < numStars; i++)
      {
        stars.push('');
      }
      return stars

    },
    calculateMissingStars(review)
    {
      let numStars = review.ratingStar;
      numStars = 5 - Math.round(numStars);
      let stars = [];
      for (let i = 0; i < numStars; i++)
      {
        stars.push('');
      }
      return stars

    },
    async deleteReview(reviewToDelete)
    {

      const ratingStarToDelete = reviewToDelete.ratingStar;
      for (let i = 0; i < this.bookToView.reviews.length; i++)
      {
        const review = this.bookToView.reviews[i];
        if (reviewToDelete.uid === review.uid &&
            reviewToDelete.displayName === review.displayName &&
            reviewToDelete.comment === review.comment &&
            reviewToDelete.email === review.email &&
            reviewToDelete.ratingStar === review.ratingStar
        )
        {
          this.bookToView.reviews.splice(i, 1);
          break;
        }
      }


      const ratingsArray = this.bookToView.ratings.ratingArray;

      for (let i = 0; i < ratingsArray.length; i++)
      {
        const rating = ratingsArray[i];
        if (rating === ratingStarToDelete)
        {
          ratingsArray.splice(i, 1);
          break;
        }
      }

      let average = 0;
      ratingsArray.forEach((rating) =>
      {
        average += rating;
      })
      average = average / ratingsArray.length;
      const newRatingNumber = average;
      const newRatingStars = average;


      try
      {
        const bookRef = doc(this.$db, 'books', this.bookToView.bid);
        updateDoc(bookRef, {
          reviews: this.bookToView.reviews,
          ratings: {
            ratingArray: ratingsArray,
            ratingNumber: newRatingNumber,
            ratingStars: newRatingStars
          }

        })
        this.menus.popups.error.generatePopup('Successfully Deleted a Review', 'You have successfully deleted a review.');
        this.menus.popups.open('error');

      } catch (e)
      {

        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred', 'An error occurred while deleting the review. Try again later.');
        this.menus.popups.open('error');

      }


    },
    deleteAllReviews()
    {
      try
      {
        const bookRef = doc(this.$db, 'books', this.bookToView.bid);
        updateDoc(bookRef, {
          reviews: [],
          ratings: {
            ratingArray: [],
            ratingNumber: 0,
            ratingStars: 0
          }

        })
        this.menus.popups.error.generatePopup('Successfully Deleted All Reviews', 'You have successfully deleted all reviews.');
        this.menus.popups.open('error');

      } catch (e)
      {

        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred', 'An error occurred while deleting the reviews. Try again later.');
        this.menus.popups.open('error');

      }
    },
    async makeBookPrivate()
    {
      try
      {
        for (const interfaceID in this.interfaces)
        {
          if(this.interfaces[interfaceID].show)
          {
            throw new Error('Please save all changes first');
          }
        }

      }
      catch (e)
      {

        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred', 'Please save all changes before you make a book private.');
        this.menus.popups.open('error');
        return
      }

      const bookRef = doc(this.$db, 'books', this.bookToView.bid);
      const bookToMakePrivate = (await getDoc(bookRef)).data();


      const hiddenBooksRef = collection(this.$db, 'hiddenBooks');

      try
      {
        await addDoc(hiddenBooksRef, bookToMakePrivate);
      }
      catch (e)
      {
        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred', 'An error occurred while trying to add this book to the hidden collection.');
        this.menus.popups.open('error');
        return;
      }

      try
      {
        await deleteDoc(bookRef);
      }
      catch (e)
      {
        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred', 'An error occurred while trying to delete the book.');
        this.menus.popups.open('error');
      }


    },
    openBookView()
    {
      try
      {
        if(!this.bookToView)
        {
          throw new Error('No book to show');
        }
      }
      catch (e)
      {
        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred', 'Book does not exist');
        this.menus.popups.open('error');
        return

      }

      this.$bus.$emit('openBookView', this.bookToView);
    },
  },
  async created()
  {
    await this.itemsListSubscriber();
  },
  beforeUnmount()
  {

    if (this.unSubscribers.itemsList)
    {
      this.unSubscribers.itemsList();
      this.unSubscribers.itemsList = null;
    }

  }

}
</script>

<template>
  <main class="user-profile-menageBookstore"
        v-if="everythingLoaded"
        :class="{'menu-click-freeze': isPopupOpen}"
  >

    <InfoPopup
        :popup="menus.popups.info"
        :popup-name="'info'"
        @close-popup="closePopup"

        :class="{'menu-freeze-bypass':menus.popups.info.show}"
    >


    </InfoPopup>
    <div class="user-profile-menageBookstore-header shadow5">
      <h3>Menage Bookstore</h3>
      <div class="user-profile-menageBookstore-header-options">
        <div class="user-profile-menageBookstore-header-option">
          <h6 class="custom-tooltip" data-title="Click Enter to apply the filter">Search by title</h6>
          <input type="text"
                 v-model="manageBookstore.searchTitle"
                 @change="clearSearchInput('title')"
                 @keydown.enter="creatingAQuery('title')"


          >
        </div>
        <div class="user-profile-menageBookstore-header-option">
          <h6 class="custom-tooltip" data-title="Click Enter to apply the filter">Search by ISBN</h6>
          <input type="text"
                 v-model="manageBookstore.searchISBN"
                 @change="clearSearchInput('ISBN')"
                 @keydown.enter="creatingAQuery('ISBN')"

          >
        </div>
        <div class="user-profile-menageBookstore-header-option">
          <h6>Sort by:</h6>
          <select v-model="manageBookstore.sortSelectedOption"
                  @change="creatingAQueryWithSort()"
          >
            <option v-for="(option,index) in manageBookstore.sortBy"
                    :key="index"
                    :selected="option.selected"
            >{{ option.name }} : {{ option.order }}
            </option>
          </select>
        </div>
        <div class="user-profile-menageBookstore-header-option">
          <h6>Filter by:</h6>
          <select v-model="manageBookstore.filterBY" @change="filterBookstore()">
            <option selected>Choose an option :</option>
            <option>On Discount</option>
            <option>New</option>
            <option>Out of Stock</option>
            <option>In Stock</option>
          </select>
        </div>
        <div class="user-profile-menageBookstore-header-option">
          <button class="shadow2 btn-default"
                  @click.prevent="menus.popups.open('addBook')"

          >Add Book
          </button>
        </div>
      </div>
    </div>
    <div class="user-profile-menageBookstore-items">
      <div class="user-profile-menageBookstore-item"
           v-for="(book, index) in manageListItems.itemsToShow"
           :key="index"
           @click="openEditBook(book)"

      >
        <div class="user-profile-menageBookstore-img">
          <img class="shadow2" :src="book.coverPictureURL" alt="Book Cover">
        </div>
        <div class="user-profile-menageBookstore-coverInfo">
          <h4>{{ book.title }}</h4>
          <h5>{{ book.author }}</h5>
          <h6>ISBN: {{ book.isbn }}</h6>
        </div>
        <div class="user-profile-menageBookstore-saleInfo">
          <div>
            <h5>Current Price</h5>
            <div>${{ book.price / 100 }}</div>
          </div>
          <div>
            <h5>In stock:</h5>
            <div>{{ book.stock }} psc</div>
          </div>
          <div>
            <h5>On Discount</h5>
            <div>{{ book.onDiscount ? 'Yes' : 'No' }}</div>
          </div>
        </div>
      </div>

    </div>
    <div class="user-profile-menageBookstore-footer shadow5">
      <nav>
        <div class="user-profile-menageBookstore-footer-link shadow2"
             :class="{freeze:manageListItems.navBar.activeNavBar === 0}"
             @click.prevent="manageListItems.previous()"

        >&lt;
        </div>
        <div class="user-profile-menageBookstore-footer-link shadow2"
             v-for="(navLink, index) in manageListItems.navBar.show"
             :key="index"
             :class="{'user-profile-menageBookstore-footer-activeLink': manageListItems.activePage === navLink}"
             @click.prevent="manageListItems.createPage(navLink)"


        >{{ navLink +1  }}
        </div>

        <div class="user-profile-menageBookstore-footer-link shadow2"
             :class="{freeze:manageListItems.navBar.activeNavBar === manageListItems.numPages - 1}"
             @click.prevent="manageListItems.next()"

        >>
        </div>
      </nav>
    </div>

  </main>
  <div class="user-profile-popup-bg"
       v-if="menus.popups.editBook.slide ||
       menus.popups.addBook.slide ||
       menus.popups.manageDetails.slide ||
       menus.popups.manageReviews.slide"
  ></div>
  <div class="user-profile-popup-wrapper"
       v-if="menus.popups.editBook.show ||
       menus.popups.addBook.show ||
       menus.popups.manageDetails.show ||
       menus.popups.manageReviews.show"

       :class="{'menu-click-freeze': menus.popups.error.show || menus.popups.addTag.show || menus.popups.confirmation.show ||menus.popups.info.show}"

  >
    <div class="user-profile-popup-editBook"
         v-if="menus.popups.editBook.show"
         :class="{'user-profile-popup-editBook-appear': menus.popups.editBook.slide}"
    >
      <div class="user-profile-popup-editBook-header shadow5">
        <h4>Edit view for: <span>{{ savedBook.title }}</span></h4>
        <h5>ISBN: {{bookToView.isbn}} </h5>
        <h5>Click on a property to edit it</h5>
        <div class="close-cross"
             @click="menus.popups.close('editBook')"

        >&#10060;
        </div>
      </div>
      <div class="user-profile-popup-editBook-main">
        <div class="user-profile-popup-editBook-img">
          <img class="shadow2" :src="bookToView.coverPictureURL" alt="Book Cover">
          <div>
            <input type="file" v-if="bookCoverPictureHandler.show" @change="bookCoverPictureHandler.handleFileChange">
            <button class="shadow2 user-profile-popup-editBook-button"
                    v-if="!bookCoverPictureHandler.show"
                    @click.prevent="bookCoverPictureHandler.open()"

            >Change Cover Picture
            </button>
            <button class="shadow2 user-profile-popup-editBook-button"
                    v-if="bookCoverPictureHandler.show"
                    @click.prevent="updateBook('coverPicture')"

            >Upload
            </button>
          </div>
        </div>
        <div class="user-profile-popup-editBook-bookInfo shadow5">
          <div>
            <h4>Title:</h4>
            <div v-if="!interfaces.title.show"
                 @click.prevent="openInterface('title')"
                 class="clickable"

            >{{ bookToView.title }}
            </div>
            <input type="text" v-model="bookToView.title" v-if="interfaces.title.show">
            <button class="btn-default shadow2 alert" v-if="interfaces.title.show"
                    @click.prevent="closeInterface('title')"
            >Cancel
            </button>
            <button class="btn-default shadow2 bgc-1"
                    :class="{'hidden': !interfaces.title.show || bookToView.title === savedBook.title}"
                    @click.prevent="updateBook('title')"
            >Save
            </button>

          </div>
          <div>
            <h4>Author:</h4>
            <div v-if="!interfaces.author.show"
                 @click.prevent="openInterface('author')"
                 class="clickable"

            >{{ bookToView.author }}
            </div>
            <input type="text" v-model="bookToView.author" v-if="interfaces.author.show">
            <button class="btn-default shadow2 alert" v-if="interfaces.author.show"
                    @click.prevent="closeInterface('author')"
            >Cancel
            </button>
            <button class="btn-default shadow2 bgc-1"
                    :class="{'hidden': !interfaces.author.show || bookToView.author === savedBook.author}"
                    @click.prevent="updateBook('author')"
            >Save
            </button>
          </div>
          <div>
            <h4>Tags:</h4>
            <div v-for="(tag,index) in bookToView.tags"
                 :key="index"
                 class="clickable"
                 @click.prevent="editTag('remove',tag)"

            >{{ tag }}
            </div>
            <button class="shadow2 btn-default primary-clr"
                    v-if="bookToView.tags.length < 5"
                    @click.prevent="menus.popups.open('addTag')"

            >Add Tag
            </button>
          </div>
        </div>
      </div>
      <div class="user-profile-popup-editBook-sec">
        <div class="user-profile-popup-editBook-description shadow5"
             :class="{'user-profile-popup-editBook-description-interface': interfaces.description.show}"

        >
          <h5>Description</h5>
          <p v-if="!interfaces.description.show"
             @click.prevent="openInterface('description')"
             class="clickable"

          >{{ bookToView.description }}</p>
          <textarea v-model="bookToView.description" v-if="interfaces.description.show"> </textarea>
          <div v-if="interfaces.description.show">
            <button class="btn-default shadow2 alert" v-if="interfaces.description.show"
                    @click.prevent="closeInterface('description')"
            >Cancel
            </button>
            <button class="btn-default shadow2 bgc-1"
                    :class="{'hidden': !interfaces.description.show || bookToView.description === savedBook.description}"
                    @click.prevent="updateBook('description')"
            >Save
            </button>
          </div>


        </div>
        <div class="user-profile-popup-editBook-storeInfo shadow5">
          <div class="user-profile-popup-editBook-prices ">
            <div>
              <h6>Current Price</h6>
              <div v-if="!interfaces.price.show"
                   @click.prevent="openInterface('price')"
                   class="clickable"

              >${{ (bookToView.price / 100).toFixed(2) }}
              </div>
              <input type="number" v-model="bookToView.price" v-if="interfaces.price.show"
                     @keydown.enter="editPrices('save')">

            </div>
            <div>
              <h6>In Stock</h6>
              <div v-if="!interfaces.stock.show"
                   @click.prevent="openInterface('stock')"
                   class="clickable"

              >{{ bookToView.stock }} psc
              </div>
              <input type="number" v-model="bookToView.stock" v-if="interfaces.stock.show"
                     @keydown.enter="editPrices('save')">
            </div>
            <div>
              <h6 @click="bookToView.onDiscount = !bookToView.onDiscount; bookToView.discountAmount=0; interfaces.onDiscount.show = true"
                  class="clickable"

              >Discount: {{ bookToView.onDiscount ? 'Yes' : 'No' }}</h6>
              <div v-if="bookToView.onDiscount && !interfaces.discountAmount.show"
                   @click.prevent="openInterface('discountAmount')"
                   class="clickable"

              >Amount: {{ bookToView.discountAmount }}%
              </div>
              <input type="number" v-model="bookToView.discountAmount" v-if="interfaces.discountAmount.show"
                     @keydown.enter="editPrices('save')">
            </div>
            <div>
              <h6>Old Price:</h6>
              <div>${{ (bookToView.oldPrice / 100).toFixed(2) }}</div>
            </div>
          </div>
          <div class=" user-profile-popup-editBook-storeInfo-buttons">
            <button class="shadow2 btn-default alert"
                    v-if="interfaces.price.show || interfaces.stock.show || interfaces.onDiscount.show || interfaces.discountAmount.show"
                    @click.prevent="editPrices('close')"

            >Cancel
            </button>
            <button class="btn-default shadow2 bgc-1"
                    :class="{'hidden': (!interfaces.price.show
                    && !interfaces.stock.show
                    && !interfaces.onDiscount.show
                    && !interfaces.discountAmount.show
                    ) ||
                    (bookToView.price === savedBook.price
                    && bookToView.discountAmount === savedBook.discountAmount
                    && bookToView.onDiscount === savedBook.onDiscount
                    && bookToView.stock === savedBook.stock)

            }"
                    @click.prevent="editPrices('save')"
            >Save
            </button>

          </div>
        </div>
        <div class="user-profile-popup-editBook-buttons">
          <div>
            <button class="shadow2 btn-default"
                    @click="menus.popups.fastClose('editBook');
                    menus.popups.manageReviews.show = true; menus.popups.manageReviews.slide = true"

            >Manage Reviews
            </button>
            <button class="shadow2 btn-default"
                    @click="menus.popups.fastClose('editBook');
                     menus.popups.manageDetails.show = true; menus.popups.manageDetails.slide = true"
            >Manage Details
            </button>
          </div>
          <div>
<!--            <button class="shadow2 btn-default"
                    @click.prevent="makeBookPrivate()"

            >Make Book Private</button>-->
            <button class="shadow2 btn-default secondary-clr"
                    @click.prevent="openBookView()"

            >View Book Page</button>
          </div>
        </div>
      </div>
    </div>
    <div class="user-profile-popup-addBook"
         v-if="menus.popups.addBook.show"
         :class="{'user-profile-popup-addBook-appear': menus.popups.addBook.slide}"
    >
      <div class="user-profile-popup-addBook-header shadow5">
        <h4>Add Book</h4>
        <div class="close-cross"
             @click="discard()"

        >&#10060;
        </div>
      </div>
      <div class="user-profile-popup-addBook-main">
        <div class="user-profile-popup-addBook-img shadow5">

          <img v-if="bookCoverPictureHandler.localURL"
               class="shadow2"
               :src="bookCoverPictureHandler.localURL"
               alt="Book Cover">
          <div>
            <input type="file"
                   v-if="bookCoverPictureHandler.show"
                   accept="image/*"
                   @change="bookCoverPictureHandler.handleFileChange">

            <button v-if="!bookCoverPictureHandler.show && !bookCoverPictureHandler.file"
                    class="user-profile-popup-editBook-button shadow2"
                    @click="bookCoverPictureHandler.open()"
            >Upload Cover Picture
            </button>
            <button v-if="!bookCoverPictureHandler.show && bookCoverPictureHandler.file"
                    class="user-profile-popup-editBook-button shadow2"
                    @click="bookCoverPictureHandler.open()"
            >Upload Another Cover Picture
            </button>

            <button class="user-profile-popup-editBook-button shadow2"
                    v-if="bookCoverPictureHandler.show"
                    @click.prevent="loadLocally()"

            >Preview
            </button>

          </div>
        </div>
        <form class="user-profile-popup-addBook-coverInfo">
          <div>
            <h5>ISBN:</h5>
            <input type="text" v-model="newBook.isbn">
          </div>
          <div>
            <h5>Title:</h5>
            <input type="text" v-model="newBook.title">
          </div>
          <div>
            <h5>Author:</h5>
            <input type="text" v-model="newBook.author">
          </div>
          <div class="user-profile-popup-addBook-tags">
            <h5>Tags:</h5>
            <div v-for="(tag, index) in newBook.tags"
                 @click.prevent="removeTag(tag)"
                 class="clickable"

            >{{ tag }}
            </div>
            <button class="shadow2 btn-default"
                    v-if="newBook.tags.length < 5"
                    @click.prevent="menus.popups.open('addTag')"

            >Add Tag
            </button>
          </div>
        </form>
        <form class="user-profile-popup-addBook-moreInfo">
          <div>
            <h5>Language:</h5>
            <input type="text" v-model="newBook.moreInfo.language">
          </div>
          <div>
            <h5>Year of Release:</h5>
            <input type="text" v-model="newBook.moreInfo.yearOfRelease">
          </div>
          <div>
            <h5>Original Title:</h5>
            <input type="text" v-model="newBook.moreInfo.originalTitle">
          </div>
          <div>
            <h5>Number Of Pages:</h5>
            <input type="number" v-model="newBook.moreInfo.numberOfPages">
          </div>
          <div>
            <h5>Publisher:</h5>
            <input type="text" v-model="newBook.moreInfo.publisher">
          </div>
          <div>
            <h5>Dimensions (cm):</h5>
            <input type="text" v-model="newBook.moreInfo.dimensions">
          </div>
        </form>
      </div>
      <div class="user-profile-popup-addBook-sec">
        <div class="user-profile-popup-addBook-description">
          <h5>Description</h5>
          <div>
            <textarea placeholder="Max 50 word" v-model="newBook.description"></textarea>
          </div>

        </div>
        <form class="user-profile-popup-addBook-prices">
          <div>
            <h5>Price (US Dollar):</h5>
            <input type="number" v-model="newBook.price">
          </div>
          <div>
            <h5>Stock:</h5>
            <input type="number" v-model="newBook.stock">
          </div>
        </form>
      </div>
      <div class="user-profile-popup-addBook-footer">
        <button class="shadow2 btn-default"
                @click.prevent="addNewBook()"

        >Add Book
        </button>
        <button class="shadow2 btn-default"
                @click.prevent="discard()"

        >Discard
        </button>
      </div>

    </div>
    <div class="user-profile-popup-menageDetails"
         v-if="menus.popups.manageDetails.show"

    >
      <div class="user-profile-popup-menageDetails-header shadow5">
        <div class="back-arrow"
             @click="menus.popups.fastClose('manageDetails');
                      menus.popups.editBook.show = true; menus.popups.editBook.slide = true"


        >&#10140;
        </div>
        <h3>Menage Details for: "<span>Letters to Milena</span>"</h3>
      </div>
      <div class="user-profile-popup-menageDetails-main">
        <div>
          <h5>Language:</h5>
          <div class="clickable"
               @click.prevent="openInterface('language')"
               v-if="!interfaces.language.show"

          >{{bookToView.moreInfo.language}}</div>
                      <input type="text" v-model="bookToView.moreInfo.language" v-if="interfaces.language.show">
        </div>
        <div>
          <h5>Year of Release:</h5>
          <div class="clickable"
               @click.prevent="openInterface('yearOfRelease')"
               v-if="!interfaces.yearOfRelease.show"

          >{{bookToView.moreInfo.yearOfRelease}}</div>
          <input type="text" v-model="bookToView.moreInfo.yearOfRelease" v-if="interfaces.yearOfRelease.show">
        </div>
        <div>
          <h5>Original Title:</h5>
          <div class="clickable"
               @click.prevent="openInterface('originalTitle')"
               v-if="!interfaces.originalTitle.show"

          >{{bookToView.moreInfo.originalTitle}}</div>
          <input type="text" v-model="bookToView.moreInfo.originalTitle" v-if="interfaces.originalTitle.show">
        </div>
        <div>
          <h5>Number Of Pages:</h5>
          <div class="clickable"
               @click.prevent="openInterface('numberOfPages')"
               v-if="!interfaces.numberOfPages.show"

          >{{bookToView.moreInfo.numberOfPages}}</div>
          <input type="text" v-model="bookToView.moreInfo.numberOfPages" v-if="interfaces.numberOfPages.show">
        </div>
        <div>
          <h5>Publisher:</h5>
          <div class="clickable"
               @click.prevent="openInterface('publisher')"
               v-if="!interfaces.publisher.show"

          >{{bookToView.moreInfo.publisher}}</div>
          <input type="text" v-model="bookToView.moreInfo.publisher" v-if="interfaces.publisher.show">
        </div>
        <div>
          <h5>Dimensions (cm):</h5>
          <div class="clickable"
               @click.prevent="openInterface('dimensions')"
               v-if="!interfaces.dimensions.show"

          >{{bookToView.moreInfo.dimensions}}</div>
          <input type="text" v-model="bookToView.moreInfo.dimensions" v-if="interfaces.dimensions.show">
        </div>
      </div>
      <div class="user-profile-popup-menageDetails-footer shadow5">
        <button class="shadow2 btn-default"
                :class="{freeze: bookToView.moreInfo.language === savedBook.moreInfo.language
                && bookToView.moreInfo.yearOfRelease === savedBook.moreInfo.yearOfRelease
                && bookToView.moreInfo.originalTitle === savedBook.moreInfo.originalTitle
                && bookToView.moreInfo.numberOfPages === savedBook.moreInfo.numberOfPages
                && bookToView.moreInfo.publisher === savedBook.moreInfo.publisher
                && bookToView.moreInfo.dimensions === savedBook.moreInfo.dimensions
        }"
                @click.prevent="editMoreInfo('save')"

        >Save Changes</button>
        <button class="shadow2 btn-default"
                :class="{freeze: !interfaces.language.show
              && !interfaces.yearOfRelease.show
              && !interfaces.originalTitle.show
              && !interfaces.numberOfPages.show
              && !interfaces.publisher.show
              && !interfaces.dimensions.show}"
                @click.prevent="editMoreInfo('close')"

        >Discard Changes</button>
      </div>

    </div>
    <div class="user-profile-popup-menageReviews"
         v-if="menus.popups.manageReviews.show"
    >
      <div class="user-profile-popup-menageReviews-header shadow5">
        <h3>Manage Reviews for: "<span>{{ bookToView.title }}</span>"</h3>
        <div class="back-arrow"
             @click="menus.popups.fastClose('manageReviews');
                      menus.popups.editBook.show = true; menus.popups.editBook.slide = true"


        >&#10140;
        </div>
      </div>
      <div class="user-profile-popup-menageReviews-items"
           :class="{'user-profile-popup-menageReviews-items-noReviews': this.bookToView.reviews.length === 0}"

      >
        <div class="user-profile-popup-menageReviews-item-noReviews"
             v-if="this.bookToView.reviews.length ===0"

        >
          <p>This book has no reviews yet.</p>

        </div>

        <div class="user-profile-popup-menageReviews-item"
             v-else
             v-for="(review,index) in this.bookToView.reviews"

        >
          <div class="user-profile-popup-menageReviews-item-reviewData">
            <h5>{{review.displayName}}</h5>
            <h6>{{review.email}}</h6>
            <div>
              <div class="user-profile-popup-menageReviews-reviewStars">
                <span v-for="(star,index) in calculateStars(review)"
                      :key="index"
                >&#9733;</span>
                <span v-for="(missingStar,index) in calculateMissingStars(review)"
                      :key="index"
                >&#9734;</span>
              </div>
              <div class="user-profile-popup-menageReviews-reviewRating">
                {{review.ratingStar}}/5
              </div>
            </div>
          </div>
          <p class="user-profile-popup-menageReviews-reviewContent">
            {{review.comment}}
          </p>
          <div class="user-profile-popup-menageReviews-options">
            <button class="shadow2 btn-default"
                    @click.prevent="deleteReview(review)"

            >Delete Review</button>
          </div>

        </div>
      </div>
      <div class="user-profile-popup-menageReviews-footer shadow5">
        <div>
          <button class="shadow2 btn-default"
                  v-if="bookToView.reviews.length !== 0"
                  @click.prevent="deleteAllReviews()"
          >Delete All reviews</button>
        </div>
      </div>
    </div>

    <div class="menu-info-popup shadow2"
         v-if="menus.popups.addTag.show"
         :class="{'menu-info-popup-appear': menus.popups.addTag.slide,
         'menu-freeze-bypass':menus.popups.addTag.show}"

    >
      <h4>Add a Tag</h4>
      <div class="user-profile-popup-addBook-tags-menu">
        <div v-for="(tag,index) in tags"
             v-if="menus.popups.addBook.show"
             :key="index"
             class="clickable shadow5"
             @click.prevent="addTag(tag)"

        >{{ tag }}
        </div>

        <div v-for="(tag,index) in tags"
             v-if="menus.popups.editBook.show"
             :key="index"
             class="clickable shadow5"
             @click.prevent="editTag('add',tag)"

        >{{ tag }}
        </div>
      </div>
      <button class="btn-default shadow2"
              @click.prevent="menus.popups.close('addTag')"

      >Close
      </button>

    </div>

    <ErrorPopup
        :popup="menus.popups.error"
        :popup-name="'error'"
        @close-popup="closePopup"

        :class="{'menu-freeze-bypass':menus.popups.error.show}"
    >


    </ErrorPopup>

    <ConfirmationPopup
        :popup="menus.popups.confirmation"
        :popup-name="'confirmation'"
        :actions="['Discard', 'Cancel']"
        :cancel-action="cancelAction"
        :confirm-action="confirmAction"
        :class="{'menu-freeze-bypass':menus.popups.confirmation.show}"
    >


    </ConfirmationPopup>
  </div>
</template>

<style scoped>

</style>