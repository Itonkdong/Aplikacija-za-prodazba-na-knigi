<template>
  <div class="page-wrapper"
       v-if="!fullPage"
       :class="{
         'shop-page-wrapper': $route.name === 'shop',
         // TODO: This should be updated
         'product-page-wrapper':pathToBook,
         'cart-page-wrapper': $route.fullPath === '/cart',
         'user-profile-page-wrapper': $route.fullPath === '/menu',
         'legal-page-wrapper': ($route.fullPath === '/terms-of-use'  || $route.fullPath === '/privacy-policy'||  $route.fullPath === '/shipping-policy'),
         'contact-page-wrapper': $route.fullPath === '/contact',
         'aboutUs-page-wrapper': $route.fullPath === '/about-us'
       }"
  >
    <header class="header">
      <div class="header-item header-logo"
           @click.prevent = "this.$router.push('/')"

      >
        <img class="clickable header-logo-img shadow2" src="@/Assets/Images/client/logo-2.png" alt="logo">
      </div>
      <div class="header-item header-searchbar">
        <input type="text" placeholder="Search available books" class="shadow2" v-model="searchBookByTitle"
               @keydown.enter="searchByTitle()"

        >
        <button class="btn-default secondary-clr shadow2"
                :class="{freeze:!searchBookByTitle}"
                @click.prevent="searchByTitle()"

        >Search</button>
      </div>
      <div class="header-item header-options "
           :class="{'header-options-signedIn':userSignedIn,
           'shadow5':userSignedIn

           }"
      >

        <button class="header-option-item header-option-item-signIn shadow2"
                v-if="!userSignedIn"
                @click.prevent="goToLink('/auth/sign-in')"

        >Sign In</button>

        <button class="header-option-item header-option-item-signIn shadow2"
                v-if="!userSignedIn"
                @click.prevent="goToLink('/auth/sign-up')"
        >
          Sign Up</button>




<!--        <div class="header-option-item profile-icon custom-tooltip"
             @click.prevent = "$router.push('/auth')"
             data-title="Sign Up / Sign In"
             v-if="false"
        >
          <img src="@/Assets/Images/icons/profile-icon.svg" alt="Profile">
        </div>-->

        <div class="header-option-item custom-tooltip profile-icon-user "
             v-if="userSignedIn"
             :data-title="profileTag"
             @click.prevent="goToLink('/menu')"

        >
          <img  :src="user.photoURL"
                alt="Profile Icon"
                :class="{shadow2: user.photoURL !== 'https://firebasestorage.googleapis.com/v0/b/book-store-app-a6ae9.appspot.com/o/profile-picture%2Fdefault-profile-picture?alt=media&token=5e4c7407-8e6a-4170-9faa-eb2c9513721c'}"
                ref="profile-picture-header"
          >

        </div>
        <div class="header-option-item cart-icon custom-tooltip" data-title="Cart"
             @click.prevent = "$router.push('/cart')"
             v-if="userSignedIn"
        >
          <img src="@/Assets/Images/icons/shopping-cart-icon.svg" alt="Cart">

        </div>
        <div class="header-option-item menu-icon custom-tooltip" data-title="Menu"
             @click.prevent = "$router.push('/menu/saved-books')"
             v-if="userSignedIn"
        >
          <img src="@/Assets/Images/icons/hamburger-menu-icon-2.svg" alt="Menu">
        </div>


      </div>
    </header>
    <nav class="nav-bar shadow4">
      <div class="nav-link shadow2"
           @click.prevent = "this.$router.push('/shop')"

      >Books</div>

      <div class="nav-link shadow2"
           @click.prevent = "this.$router.push('/shop/new')"

      >New</div>

      <div class="nav-link accent shadow2"
           @click.prevent = "this.$router.push('/shop')"
      >Shop Now</div>

      <div class="nav-link shadow2"
           @click.prevent = "this.$router.push('/shop/bestsellers')"

      >Best Sellers</div>

      <div class="nav-link shadow2"
           @click.prevent = "this.$router.push('/shop/on-discount')"

      >On Discount</div>
    </nav>
    <router-view
                 :go-to-link="goToLink"
                 :user="user"
                 :user-info="userInfo"
                 @open-book-view="openBookView"
                 :book-to-view="bookToView"
                 @opened-popup="popupIsOpen = true"
                 @closed-popup="popupIsOpen = false"

    ></router-view>
  </div>


  <router-view v-if="fullPage"
               :go-to-link="goToLink"
               :user="user"
               :user-info="userInfo"

  >
  </router-view>

  <LandingPage v-if="$route.name === 'home'"
               @open-book-view="openBookView"
               :go-to-link="goToLink"
               :user="user"
               :user-info="userInfo"

  ></LandingPage>

  <SmallBooksSection v-if="$route.name === 'book'"
                     :class="{'menu-freeze':popupIsOpen}"
                     @open-book-view="openBookView"
                     :user="user"
                     :user-info="userInfo"

  >
  </SmallBooksSection>

  <footer class="footer"
          v-if="$route.name === 'home' ||
          $route.name === 'termsOfUse' ||
          $route.name === 'privacyPolicy' ||
          $route.name === 'shippingPolicy' ||
          $route.name === 'contact' ||
          $route.name === 'aboutUs'"

  >
    <div class="footer-gird-wrapper">
      <div class="footer-grid bg ">
        <div class="footer-column">
          <h4 class="footer-title">Shop</h4>
          <ul>
            <li class="footer-link shop-link"
                @click.prevent = "this.$router.push('/shop')"
            >Books</li>
            <li class="footer-link shop-link"
                @click.prevent = "this.$router.push('/shop/new')"
            >New</li>
            <li class="footer-link shop-link"
                @click.prevent = "this.$router.push('/shop/bestsellers')"
            >Best Sellers</li>
            <li class="footer-link shop-link"
                @click.prevent = "this.$router.push('/shop/on-discount')"
            >On Discount</li>
          </ul>

        </div>
        <div class="footer-column">
          <h4 class="footer-title">Help</h4>
          <ul>
            <li class="footer-link help-link"
                @click="$router.push('/shipping-policy')"
            >Shipping policy</li>

            <li class="footer-link help-link"
                @click="$router.push('/privacy-policy')"
            >Privacy policy</li>

            <li class="footer-link help-link"
                @click="$router.push('/terms-of-use')"
            >Therms of use</li>
          </ul>
        </div>
        <div class="footer-column">
          <h4 class="footer-title">Information</h4>
          <ul>
            <li class="footer-link information-link"
                @click="$router.push('/about-us')"
            >About us</li>

            <li class="footer-link information-link"
                @click="$router.push('/contact')"
            >Contact</li>
          </ul>
        </div>
      </div>

    </div>
    <div class="legal-info">
      <p>&copy;All rights reserved. LuminaLeaf Skopje 2023</p>
    </div>
  </footer>


</template>

<script>

import {defineComponent} from "vue";
import LandingPage from "@/components/LandingPage.vue";
import SmallBooksSection from "@/components/SmallBooksSection.vue";
import {onAuthStateChanged} from "firebase/auth";
import {getFirestore, collection, getDocs,
  addDoc, deleteDoc, doc,
  onSnapshot,
  query, where,
  orderBy,
  serverTimestamp,
  getDoc,
  updateDoc} from "firebase/firestore"


import {getDownloadURL, getStorage, ref} from "firebase/storage";

export default defineComponent({
  components: {SmallBooksSection, LandingPage},
  computed:{
    pathToBook()
    {
      const path = this.$route.fullPath;
      const subPath = path.substr(0,5);
      if(subPath === '/book')
      {
        return true;
      }
      return false;
    },
    fullPage()
    {
      //TODO: This should be updated
      if(this.$route.fullPath === '/' ||
          this.$route.name === 'shop' ||
          this.pathToBook ||
          this.$route.fullPath === '/cart' ||
          this.menuPaths(this.$route.fullPath) ||
          this.$route.fullPath === '/terms-of-use' ||
          this.$route.fullPath === '/privacy-policy' ||
          this.$route.fullPath === '/shipping-policy' ||
          this.$route.fullPath === '/contact' ||
          this.$route.fullPath === '/about-us'
      )
      {
        return false;
      }

      return true;
    },
    profileTag()
    {
      if(this.$auth().currentUser)
      {
        return this.$auth().currentUser.displayName;
      }
      else
      {
        return 'Sign up / Sign in'
      }
    },
    userSignedIn()
    {
      return this.user
    }
  },
  data()
  {
    return{
      searchBookByTitle: '',
      checkoutButton:false,
      popupIsOpen:false,
      bookToView:null,
      user: null,
      userInfo: null,
      unSubscribers: {
        auth: null,
        usersList : null,
      },
    }
  },
  methods:{
    searchByTitle()
    {
      if(!this.searchBookByTitle)
      {
        return;
      }

      const title = this.searchBookByTitle;
      this.goToLink(`/shop/${title}`);
      this.searchBookByTitle = '';
    },
    openBookView(book)
    {
      console.log('Idi vo app:',book);
      this.bookToView = book;
      this.goToLink(`/book/${book.title}`);
    },

    menuPaths(path)
    {
      if(path.substr(0,5) === '/menu')
      {
        return true;
      }
      return false;
    },
    goToLink(path)
    {
      this.$router.push(path);
    },
    getCurrentUserInfo()
    {
      if(!this.user)
      {
        // console.log('There is no user signed in!');
        return;
      }


      const userRef = doc(this.$db, 'usersList', this.user.uid);
      getDoc(userRef)
          .then((user)=>{
            this.userInfo = user.data();
            // console.log('The current user role is: ',this.userInfo.role);
          })
          .catch((error)=>{
            console.log(error.code);
            console.log('Missing User Role');
          });

    },
    usersListSubscriber()
    {
      const usersListRef = collection(this.$db, 'usersList');

      this.unSubscribers.usersList = onSnapshot(usersListRef, (snapshot)=>{
        this.getCurrentUserInfo();
        console.log('Povikano');

        // this.authSubscriber()

        //TODO: Mozebi tuka e podobro da se stavi this.authSubscriber
      })
    },
    authSubscriber()
    {
      this.unSubscribers.auth  = onAuthStateChanged(this.$auth(), (user) =>
      {
        this.user = user;
        // console.log('On auth state changed detected, user: ', this.user);

        if(user)
        {
          this.getCurrentUserInfo();
          // this.downloadProfilePicture('profile-picture-header');
        }
      })
    }
  },
  async created()
  {
    await this.authSubscriber();
    await this.usersListSubscriber();

    this.$bus.$on('profilePictureChanged', this.authSubscriber);
    this.$bus.$on('openBookView', this.openBookView);
  },
   async mounted()
  {

  },
  beforeUnmount()
  {
    this.unSubscribers.auth();
    this.unSubscribers.usersList();
  }
})
</script>

<style>

</style>
