<script>
import {collection, doc, getDoc, getDocs, onSnapshot, query, updateDoc, where} from "firebase/firestore";
import InfoPopup from "@/components/InfoPopup.vue";
import ErrorPopup from "@/components/ErrorPopup.vue";

export default {
  components: {ErrorPopup, InfoPopup},
  props: ['bookToView', 'goToLink', 'bookTitle', 'user','userInfo'],
  name: "BookProductView",
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
    stars()
    {
      let numStars = this.fetchedBook.ratings.ratingStars;
      numStars = Math.round(numStars);
      let stars = [];
      for (let i = 0; i < numStars; i++)
      {
        stars.push('');
      }
      return stars
    },
    missingStars()
    {
      let numStars = this.fetchedBook.ratings.ratingStars;
      numStars = 5 - Math.round(numStars);
      let stars = [];
      for (let i = 0; i < numStars; i++)
      {
        stars.push('');
      }
      return stars
    },
    isBookInSaved()
    {
      if(!this.userInfo)
      {
        return false;
      }
      const userSavedBooks = this.userInfo.savedBooks;
      const bid = this.fetchedBook.bid;

      for (let i = 0; i < userSavedBooks.length; i++)
      {
        const book = userSavedBooks[i];
        if(book.bid === bid)
        {
          return true;
        }
      }

      return false
    }
  },
  beforeRouteLeave(from, to, next)
  {
    localStorage.removeItem('savedBook');
    next();

  },
  data()
  {
    return {
      fetchedBook: null,
      everythingLoaded: false,
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
        fetchByBID: null,
        fetchByTitle: null
      },
      rateTheBook: {
        selectedStats: 0,
        yourReview: '',
      }
    }
  },
  watch: {
    async bookToView(newValue, oldValue)
    {
      this.everythingLoaded = false;
      await this.fetchBookByBID(newValue.bid, newValue.title);
    },
    async bookTitle(newValue, oldValue)
    {
      if (this.fetchedBook && this.fetchedBook.title !== this.bookTitle)
      {
        this.everythingLoaded = false;
        await this.fetchBookByTitle(newValue);
      }

    }
  },
  methods: {
    async addBookToSaved()
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
        this.menus.popups.error.generatePopup('Error Occurred',`You must sign in before you can add books`)
        this.menus.popups.open('error');
        console.error(e);
        return
      }

      try
      {
        if(this.isBookInSaved)
        {
          throw new Error('Book is already saved');
        }

      }
      catch (e)
      {
        this.menus.popups.error.generatePopup('Error Occurred',`This book is already in your 'Saved Books' list.`)
        this.menus.popups.open('error');
        console.error(e);
        return
      }

      const bookToSave = {
        bid: this.fetchedBook.bid,
        title:this.fetchedBook.title,
        author:this.fetchedBook.author,
        coverPictureURL: this.fetchedBook.coverPictureURL
      }

      const userSavedBooks = this.userInfo.savedBooks;

      console.log("Users saved books are:",this.userInfo.savedBooks);


      userSavedBooks.push(bookToSave);

      console.log(userSavedBooks);


      const userRef = doc(this.$db,'usersList', this.user.uid);

      try
      {
        await updateDoc(userRef, {
          savedBooks: userSavedBooks,
        })
        this.menus.popups.info.generatePopup('Book Added To Saved',`${this.fetchedBook.title} was added to your 'Saved books' list.`)
        this.menus.popups.open('info');
      }
      catch (e)
      {
        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred',`There was a problem adding this book to your 'Saved books' list. Try again later`)
        this.menus.popups.open('error');
      }



    },
    async removeBookFromSaved()
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

      try
      {
        if(!this.isBookInSaved)
        {
          throw new Error('Book is not saved');
        }

      }
      catch (e)
      {
        this.menus.popups.error.generatePopup('Error Occurred',`This book is not in your 'Saved Books' list.`)
        this.menus.popups.open('error');
        console.error(e);
        return
      }

      const userSavedBooks = [...this.userInfo.savedBooks];
      const bid = this.fetchedBook.bid;

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
        })
        this.menus.popups.info.generatePopup('Book Removed from Saved',`${this.fetchedBook.title} was removed from your 'Saved books' list.`)
        this.menus.popups.open('info');
      }
      catch (e)
      {
        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred',`There was a problem removing this book from your 'Saved books' list. Try again later`)
        this.menus.popups.open('error');
      }



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
    selectStarts(index)
    {

      if (this.rateTheBook.selectedStats === index + 1)
      {
        this.rateTheBook.selectedStats = 0;
        console.log(this.rateTheBook.selectedStats);
        return;

      }
      this.rateTheBook.selectedStats = index + 1;
      console.log(this.rateTheBook.selectedStats);

    },
    async fetchBookByBID(bookBID, bookTitle)
    {
      if (this.unSubscriber.fetchByTitle)
      {
        this.unSubscriber.fetchByTitle();
        this.unSubscriber.fetchByTitle = null
      }

      console.log('In fetchBookByBID:', bookBID);
      this.fetchedBook = null;

      const bid = bookBID
      const docRef = doc(this.$db, 'books', bid);
      this.unSubscriber.fetchByBID = onSnapshot(docRef, (snapshot) =>
      {
        this.fetchedBook = snapshot.data();
        this.everythingLoaded = true;
        console.log("Fetched book by bid:", this.fetchedBook);
      });

      const savedBook = {
        bid: bid,
        title: bookTitle
      }

      await localStorage.setItem("savedBook", JSON.stringify(savedBook));
    },
    async fetchBookByTitle(title)
    {
      if (this.unSubscriber.fetchByBID)
      {
        this.unSubscriber.fetchByBID();
        this.unSubscriber.fetchByBID = null
      }

      console.log('In fetchBookByTitle:', title);
      this.fetchedBook = null;

      const booksRef = collection(this.$db, 'books');
      const queryRef = query(booksRef,
          where('title', '==', title)
      );
      let fetchedBook = null;
      this.unSubscriber.fetchByTitle = await onSnapshot(queryRef, (snapshot) =>
      {
        snapshot.docs.forEach((book) =>
        {
          fetchedBook = book.data();
        })
        this.fetchedBook = fetchedBook;
        this.everythingLoaded = true;
        console.log("Fetched book by title:", this.fetchedBook);
      });


    },
    validateReview()
    {
      try
      {
        if (this.rateTheBook.yourReview === '')
        {
          throw new Error('Invalid review');
        }

        const numWords = this.rateTheBook.yourReview.split(" ").length;
        if (numWords < 7 || numWords > 50)
        {
          throw new Error('Invalid review');
        }
      } catch (e)
      {
        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred', `Please write a review between 7 and 50 words.`);
        this.openPopup('error');
        return false;
      }

      try
      {
        if (this.rateTheBook.selectedStats === 0)
        {
          throw new Error('Invalid ratings');
        }
      } catch (e)
      {
        this.menus.popups.error.generatePopup('Error Occurred', `Please select your rating of the book.`);
        this.openPopup('error');
        return false;
      }

      return true;


    },
    async postAReview()
    {
      if (!this.validateReview())
      {
        return;
      }

      const reviewObj = {
        uid: this.user.uid,
        email: this.user.email,
        displayName: this.user.displayName,
        comment: this.rateTheBook.yourReview,
        ratingStar: this.rateTheBook.selectedStats
      }

      const reviewsArray = this.fetchedBook.reviews;
      reviewsArray.push(reviewObj);

      const ratingsArray = this.fetchedBook.ratings.ratingArray;
      ratingsArray.push(this.rateTheBook.selectedStats);


      let average = 0;
      ratingsArray.forEach((rating) =>
      {
        average += rating;
      })
      average = average / ratingsArray.length;
      const newRatingNumber = average;
      const newRatingStars = average;


      const ratingsObj = {
        ratingArray: ratingsArray,
        ratingNumber: newRatingNumber,
        ratingStars: newRatingStars
      }


      const bookRef = doc(this.$db, 'books', this.fetchedBook.bid);

      try
      {
        await updateDoc(bookRef, {
          reviews: reviewsArray,
          ratings: ratingsObj
        })
        console.log('Successfully added Review');
        this.rateTheBook.yourReview = "";
        this.rateTheBook.selectedStats = 0;
      } catch (e)
      {
        console.error(e);
      }
    },
    updateScreenWidth()
    {
      this.screenWidth = window.innerWidth;
    },
    checkUser()
    {
      console.log(this.userInfo);
    },
    async addBookToCart(book)
    {

      //TODO: Validate
      if (!this.user)
      {
        console.error('You must be signed in to add books to your cart');
        return;
      }

      if(book.stock === 0)
      {
        console.error('Book out of stock');
        return;
      }


      const bid = book.bid;
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

    }
  },
  async beforeCreate()
  {

    if (!this.bookToView && !this.bookTitle)
    {
      this.goToLink('/');
    }
  },
  async created()
  {
    this.updateScreenWidth();
    const savedBook = JSON.parse(localStorage.getItem("savedBook"));
    if (this.bookToView)
    {
      await this.fetchBookByBID(this.bookToView.bid, this.bookToView.title);
    }
    else if (savedBook && savedBook.title === this.bookTitle)
    {
      console.log('Dojde tuka');
      await this.fetchBookByBID(savedBook.bid, savedBook.title);
    }
    else if (this.bookTitle)
    {
      await this.fetchBookByTitle(this.bookTitle);
    }
    else
    {
      this.goToLink('/');
    }
  },
  beforeUnmount()
  {
    if (this.unSubscriber.fetchByTitle)
    {
      this.unSubscriber.fetchByTitle();
      this.unSubscriber.fetchByTitle = null;
    }
    if (this.unSubscriber.fetchByBID)
    {
      this.unSubscriber.fetchByBID();
      this.unSubscriber.fetchByTitle = null;
    }

  }
}
</script>

<template>
  <div class="book-product-wrapper">
    <div class="book-product" v-if="everythingLoaded"
         :class="{'menu-freeze': isPopupOpen}"
    >
      <div class="book-product-grid">

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
            :class="{'menu-freeze-bypass':menus.popups.error.show}"
        >
        </ErrorPopup>
        <div class="book-product-img">
          <img class="shadow2" :src="fetchedBook.coverPictureURL" alt="Book Cover">
        </div>
        <div class="book-product-main-info">
          <div class="book-product-cover-info">
            <div class="book-product-title">
              {{ fetchedBook.title }}
            </div>
            <div class="book-product-author">{{ fetchedBook.author }}</div>
          </div>
          <div class="book-product-genres">
            <div v-for="(tag, index) in fetchedBook.tags"
                 :key="index"
                 class="book-product-tag tag-clr-1 shadow5">{{ tag }}
            </div>
          </div>
          <div class="book-product-e-commerce-info">
            <div class="book-product-stock-info">
              <div v-if="fetchedBook.stock > 0"><span class="in-stock">&#x2611;</span> In Stock</div>
              <div v-else><span class="out-of-stock">&#x2612;</span> Out of Stock</div>
            </div>
            <div class="book-product-prices">
              <div class="book-product-old-price"
                   v-if="fetchedBook.oldPrice !== fetchedBook.price"
              >
                ${{ (fetchedBook.oldPrice / 100 ).toFixed(2)}}
              </div>
              <div class="book-product-regular-price">
                ${{ (fetchedBook.price / 100).toFixed(2) }}
              </div>
              <div class="book-product-sale-percentage shadow2"
                   v-if="fetchedBook.discountAmount !== 0"
              >
                -{{ fetchedBook.discountAmount }}%
              </div>
            </div>

          </div>

          <div class="book-product-buttons">
            <button class="btn-default book-product-btn shadow2 primary-clr"
                    v-if="user && fetchedBook.stock > 0"
                    @click.prevent="addBookToCart(fetchedBook)"

            >Add to Cart
            </button>
            <button class="btn-default book-product-btn shadow2 freeze primary-clr"
                    v-if="user && fetchedBook.stock === 0"
            >Out Of Stock
            </button>

            <button class="btn-default book-product-btn shadow2 primary-clr"
                    v-if="!user"
                    @click.prevent="this.goToLink('/auth/sign-in')"

            >Sign in to add books to your cart
            </button>
            <button class="btn-default book-product-btn shadow2 secondary-clr"
                    @click.prevent="addBookToSaved()"
                    v-if="user && !isBookInSaved"

            >Save for Later</button>
            <button class="btn-default book-product-btn shadow2 secondary-clr"
                    @click.prevent="removeBookFromSaved()"
                    v-if="user && isBookInSaved"

            >Remove from Saved</button>
            <button class="btn-default book-product-btn shadow2 secondary-clr"
                    v-if="!user"
                    @click.prevent="this.goToLink('/auth/sign-in')"

            >Sign in to save books
            </button>

          </div>
        </div>
        <div class="book-product-sec-info">
          <div class="book-product-sec-info-container">
            <div class="book-product-language book-product-sec-info-item">
              <h5>Language</h5>
              <div>{{ fetchedBook.moreInfo.language }}</div>
            </div>
            <div class="book-product-nmb-of-pages book-product-sec-info-item">
              <h5>Number of Pages</h5>
              <div>{{ fetchedBook.moreInfo.numberOfPages }}</div>
            </div>
            <div class="book-product-year-of-release book-product-sec-info-item">
              <h5>Year of Release</h5>
              <div>{{ fetchedBook.moreInfo.yearOfRelease }}</div>
            </div>
            <div class="book-product-publisher book-product-sec-info-item">
              <h5>Publisher</h5>
              <div>{{ fetchedBook.moreInfo.publisher }}</div>
            </div>
            <div class="book-product-original-title book-product-sec-info-item">
              <h5>Original Title</h5>
              <div>{{ fetchedBook.moreInfo.originalTitle }}</div>
            </div>
            <div class="book-product-dimensions book-product-sec-info-item">
              <h5>Dimensions (cm)</h5>
              <div>{{ fetchedBook.moreInfo.dimensions }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="book-product-more-info">
        <div class="book-product-description">
          <h3>Short Description</h3>
          <p>
            {{ fetchedBook.description }}
          </p>

        </div>

        <div class="book-product-user-review">
          <div class="book-product-user-review-header">
            <div class="book-product-user-review-header-title">
              Review for
              <span class="book-product-user-review-book-title">
                                "{{ fetchedBook.title }}"
                            </span>
            </div>
            <div class="book-product-user-review-header-review-data">
              <div class="book-product-review-stars">
                <span v-for="star in stars">&#9733;</span>
                <span v-for="missingStar in missingStars">&#9734;</span>
              </div>
              <div class="book-product-review-rating">
                {{ fetchedBook.ratings.ratingNumber !== 0 ? fetchedBook.ratings.ratingNumber.toFixed(2) : 0 }}/5
              </div>
            </div>
            <div class="book-product-user-review-header-numRatings">
              <div>{{ fetchedBook.ratings.ratingArray.length }}
                rating{{ fetchedBook.ratings.ratingArray.length === 1 ? '' : 's' }}
              </div>
              &dot;
              <div>{{ fetchedBook.reviews.length }} review{{ fetchedBook.reviews.length === 1 ? '' : 's' }}</div>
            </div>
          </div>
          <div class="book-product-user-review-main shadow2">
            <div class="book-product-user-review-main-your-rating">
              <h4>What did you think ?</h4>
              <div class="book-product-your-stars">
                <div class="book-product-your-stars-star"
                     v-for="(start,index) in ['','','','','']"
                     @click="selectStarts(index)"
                     :class="{'book-product-your-stars-star-selected':this.rateTheBook.selectedStats - 1 >= index}"

                >&#9734;
                </div>

              </div>
            </div>
            <div class="book-product-user-review-main-your-review">
              <h4>Write a review</h4>
              <h5>Review must be at least 7 words</h5>
              <textarea placeholder="Tell others what you thought of this book (max 50 words)"
                        v-model="rateTheBook.yourReview"

              ></textarea>
            </div>
            <button class="btn-default shadow2"
                    v-if="user"
                    @click.prevent="postAReview()"

            >Post
            </button>

            <button class="btn-default shadow2"
                    v-else
                    :class="{'custom-tooltip': !user}"
                    data-title="Please sign in to post a review"
                    @click="goToLink('/auth/sign-in')"

            >Sign in to post a review
            </button>
          </div>
        </div>
        <ErrorPopup
            :popup="menus.popups.error"
            :popup-name="'error'"
            @close-popup="closePopup"

            :class="{'menu-freeze-bypass':menus.popups.error.show}"
        >


        </ErrorPopup>

      </div>
      <div class="book-product-other-reviews">
        <h2 class="book-product-other-reviews-header">
          Other Reviews
        </h2>
        <div class="book-product-other-reviews-listOfReviews">

          <div class="book-product-other-reviews-noReviews shadow5"
               v-if="fetchedBook.reviews.length === 0"

          >
            <p>There are no reviews for <span>"{{ fetchedBook.title }}"</span>
              <br>Be the first to write a review
            </p>
            <!--            <button class="btn-default accent-clr-2 shadow2">Write a review</button>-->
          </div>
          <div class="book-product-other-reviews-reviewsList-container"
               v-else

          >
            <div class="book-product-other-reviews-review shadow2"
                 v-for="(review,index) in this.fetchedBook.reviews"

            >
              <div class="book-product-other-reviews-review-reviewData">
                <h5>{{ review.displayName }}</h5>
                <div>
                  <div class="book-product-review-stars">
                    <span v-for="star in calculateStars(review)">&#9733;</span>
                    <span v-for="star in calculateMissingStars(review)">&#9734;</span>
                  </div>
                  <div class="book-product-review-rating">
                    {{ review.ratingStar }}/5
                  </div>
                </div>
              </div>
              <p class="book-product-other-reviews-review-reviewContent">
                {{ review.comment }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>