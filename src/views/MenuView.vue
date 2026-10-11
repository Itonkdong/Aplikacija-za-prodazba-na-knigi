<script>
import {signOut} from "firebase/auth";
import UserInfoView from "@/views/menu/UserInfoView.vue";

export default {
  name: "ProfileView",
  components: {UserInfoView},
  computed: {},
  props: ['goToLink','userInfo','user'],
  watch: {
  },
  data()
  {
    return {
      books: [],
      menus: {
        popups: {
          order: {
            show: false,
            slide: false,
            alreadyOpen: false
          },
          menageOrder: {
            show: false,
            slide: false,
            alreadyOpen: false
          },
          addBook: {
            show: false,
            slide: false,
            alreadyOpen: false
          },
          editBook: {
            show: false,
            slide: false,
            alreadyOpen: false
          },
          menageDetails: {
            show: false,
            slide: false,
            alreadyOpen: false
          },
          menageReviews: {
            show: false,
            slide: false,
            alreadyOpen: false
          },
          open(popup)
          {
            this[popup].show = true;
          },
          close(popup)
          {
            this[popup].show = false;
          }
        }
      },
    }
  },
  methods: {
    signOut()
    {
      this.goToLink('/');
      signOut(this.$auth())
          .then(()=>{
            setTimeout(()=>{
              location.reload();
            },100)
          });
    }
  },
}
</script>

<template>
  <div class="user-profile-wrapper">
    <div class="user-profile">
      <nav class="user-profile-nav shadow5">
        <div class="user-profile-nav-header">
          <h3>Menu</h3>
          <!--                    <div>User</div>-->
        </div>
        <div class="user-profile-nav-items">

          <div class="user-profile-nav-item"
               @click="goToLink('/menu')"
          >&#128100; User Info
          </div>

          <div class="user-profile-nav-item"
               @click="goToLink('/menu/saved-books')"
          >&#128278; Saved Books
          </div>

          <div class="user-profile-nav-item"
               @click="goToLink('/menu/orders')"
          >&#128230; Orders
          </div>

          <div class="user-profile-nav-item"
               @click="goToLink('/menu/manage-orders')"
               v-if="userInfo &&  (userInfo.role ==='administrator' || userInfo.role === 'manager')"
          >&#127981; Manage Orders
          </div>

          <div class="user-profile-nav-item"
               @click="goToLink('/menu/manage-bookstore')"
               v-if="userInfo &&  (userInfo.role ==='administrator' || userInfo.role === 'manager')"
          >&#128218; Manage Bookstore
          </div>

          <div class="user-profile-nav-item"
               @click="goToLink('/menu/manage-users')"
               v-if="userInfo &&  (userInfo.role ==='administrator')"
          >
            &#128101; Manage Users
          </div>

        </div>
        <div class="user-profile-nav-buttons">
          <button class="btn-default shadow2"
                  @click.prevent="signOut()"

          >&#128219; Log out</button>
        </div>

      </nav>

      <router-view :user="user"
                   :user-info="userInfo"
                   :go-to-link="goToLink"
      >
      </router-view>

    </div>
  </div>
</template>