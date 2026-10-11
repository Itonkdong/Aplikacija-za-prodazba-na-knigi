<script>
import {collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, updateDoc, where} from "firebase/firestore";
import {getDownloadURL, getStorage, ref, getMetadata, uploadBytes, deleteObject} from "firebase/storage";

export default {
  name: "ManageUsersView",
  props: ['user', 'goToLink'],
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
  data()
  {
    return {
      firstLoad: true,
      menus: {
        popups: {
          manageUsers: {
            title: '',
            text: '',
            show: false,
            slide: false,
            alreadyOpen: false,
            action: '',
            generatePopup(title, text, action)
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
            generatePopup(title, text, action)
            {
              this.title = title;
              this.text = text
              this.action = action;
            },
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
        usersList: null,
        query: null,
      },
      everythingLoaded: false,

      manageUsers: {
        searchEmail: '',
        userToBeChanged: null,
        oldRole: null,
        allUsers: [],
        activePage: 0,
        numPages: 0,
        usersToShow: [],
        navBar: {
          start: 0,
          end: -1,
          show: [],
          activeNavBar: 0,
        },
        calcTotalPages()
        {
          this.numPages = Math.floor(this.allUsers.length / 5);
          const afterRoundCal = this.allUsers.length - this.numPages * 5;
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

          const usersToShow = this.allUsers.slice(start, end);

          //Only needed for tha last page if there aren't a total of 5 users
          if (this.activePage === this.numPages - 1)
          {
            usersToShow.forEach((userInfo, index) =>
            {
              if (!userInfo)
              {
                usersToShow.splice(index, 1);
              }
            })
          }

          this.usersToShow = usersToShow;
          this.navBar.activeNavBar = activePage;
          return this.usersToShow;

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
      }
    }
  },
  methods: {
    async currentUserChangedRole()
    {
      const currentUserRef = doc(this.$db, 'usersList', this.$auth().currentUser.uid);
      const currentUser = (await getDoc(currentUserRef)).data();
      if(currentUser.role !== 'administrator')
      {
        location.reload();
      }
    },
    async confirmAction(action)
    {
      switch (action)
      {
        case 'changeRole':
          await this.changeRoleForUser(this.manageUsers.userToBeChanged);
          this.manageUsers.userToBeChanged = null;
          break

        case 'deleteUser':

          const uid = this.manageUsers.userToBeChanged.uid;
          await this.deleteUser(this.manageUsers.userToBeChanged);
          this.menus.popups.close('manageUsers');

          this.menus.popups.info.generatePopup('Please Take Action',
              `User's info and user's profile-picture successfully deleted!
              Please open the users auth database and delete manually the corresponding user data.
              USER'S UID: ${uid}`, '');
          this.menus.popups.open('info');
          this.manageUsers.userToBeChanged = null;
          break

      }
    },
    async cancelAction(action)
    {
      switch (action)
      {
        case 'changeRole':

          const userRef = doc(this.$db, 'usersList', this.manageUsers.userToBeChanged.uid);
          this.manageUsers.userToBeChanged.role = (await getDoc(userRef)).data().role;
          this.menus.popups.close('manageUsers');
          break

        case 'deleteUser':
          this.menus.popups.close('manageUsers');
          break

      }
    },

    confirmChangeRole(user)
    {
      this.manageUsers.userToBeChanged = user;
      this.menus.popups.manageUsers.generatePopup('Confirm Changes', `Are you sure that you want to change the role of ${user.email} to ${user.role}`, 'changeRole');
      this.menus.popups.open('manageUsers');
    },
    confirmDeleteUser(user)
    {
      this.manageUsers.userToBeChanged = user;

      const text =
          `Are you sure you want to delete the account: ${user.email}.

          This change is irreversible!`;
      console.log(text);
      this.menus.popups.manageUsers.generatePopup('Confirm Deleting User',text
          , 'deleteUser');
      this.menus.popups.open('manageUsers');
    },
    changeRoleForUser(user)
    {
      console.log('The user is:', user);
      const userRef = doc(this.$db, 'usersList', user.uid);
      updateDoc(userRef, {
        role: user.role
      })
          .then(() =>
          {
            console.log('Successfully updated role for:', user, ' to: ', user.role);
            this.manageUsers.userToBeChanged = null;
            this.menus.popups.close('manageUsers');
          })
          .catch((error) =>
          {
            console.log(error);
          })
    },
    async deleteUser(user)
    {
      const userRef = doc(this.$db, 'usersList', user.uid);

      try
      {
        await deleteDoc(userRef);
      }
      catch (error)
      {
        console.log(error);

      }

      const storage = getStorage();
      const profilePic = ref(storage, `profile-picture/${user.uid}`);

      try
      {
        await deleteObject(profilePic)
      }
      catch (error)
      {
        console.log(error);
      }

      //TODO: Delete his cart as well, when added
    },

    //TODO:This is temp, delete it
    async updateUser(user)
    {
      console.log('Se povika update user');
      const uid = user.uid;
      const userRef = doc(this.$db, 'usersList', uid);


      try
      {
        await updateDoc(userRef, {
          savedBooks:[],
          cart:[],
        })

        console.log('Updated user:', user);
      }
      catch (error)
      {
        console.error(error);
      }


    },
    async searchByEmail()
    {

      if(this.manageUsers.searchEmail)
      {

        const usersListRef = collection(this.$db, "usersList");
        const queryRef = query(usersListRef, where("email", ">=", this.manageUsers.searchEmail), where("email", "<=", this.manageUsers.searchEmail + "\uf8ff"));

        this.unSubscribers.query = onSnapshot(queryRef, (querySnapshot)=>{

          if(querySnapshot.docs.length)
          {
            this.unSubscribers.usersList();
            this.usersListSubscriber(querySnapshot);
          }
          else
          {
            this.manageUsers.searchEmail = "";
            this.searchByEmail();
          }
        })
      }
      else
      {
        if(this.unSubscribers.query)
        {
          this.unSubscribers.query();
          this.unSubscribers.query = null;
        }

        this.unSubscribers.usersList();
        this.usersListSubscriber();
      }

    },
    usersListSubscriber(query = null)
    {

      console.log('Se povika onCnapshot');
      const usersListRef = collection(this.$db, 'usersList');
      this.unSubscribers.usersList = onSnapshot(usersListRef, (snapshot) =>
      {
        this.currentUserChangedRole();

        const allUsers = [];

        //TODO: Ovoj koment treba da si sto
        if(query)
        {
          query.docs.forEach((userInfo) =>
          {
            allUsers.push(userInfo.data());
          })
        }
        else {
          snapshot.docs.forEach((userInfo) =>
          {
            allUsers.push(userInfo.data());
          })

        }
        this.manageUsers.allUsers = allUsers




        console.log(this.manageUsers.allUsers);
        this.manageUsers.createPage(this.manageUsers.activePage);

        console.log('The users to be shown are :', this.manageUsers.usersToShow);

        console.log('All users: ', this.manageUsers.allUsers);
        // console.log('Profile pictures array object: ', this.manageUsers.profilePicturesUrls);

        this.manageUsers.calcTotalPages()
        console.log('Total pages:', this.manageUsers.numPages);

        this.manageUsers.createNavBar(this.manageUsers.navBar.start - 1);


        this.everythingLoaded = true;
      })
    },
  },
  async created()
  {
    await this.usersListSubscriber();
  },
  beforeUnmount()
  {
    this.unSubscribers.usersList();
  }
}
</script>

<template>
  <main class="user-profile-menageUsers"
        v-if="everythingLoaded"
        :class="{freeze: isPopupOpen}"
  >
    <div class="menu-info-popup shadow2"
         v-if="menus.popups.manageUsers.show"
         :class="{'menu-info-popup-appear': menus.popups.manageUsers.slide,
         'menu-freeze-bypass':isPopupOpen
         }"

    >
      <h4>{{ menus.popups.manageUsers.title }}</h4>
      <p class="template-string-formatting"> {{menus.popups.manageUsers.text}}</p>
      <div class="menu-info-popup-buttons">
        <button class="btn-default shadow2 alert"
                @click.prevent="confirmAction(menus.popups.manageUsers.action)"

        >Confirm
        </button>
        <button class="btn-default shadow2"
                @click.prevent="cancelAction(menus.popups.manageUsers.action)"

        >Cancel
        </button>
      </div>


    </div>
    <div class="menu-info-popup shadow2"
         v-if="menus.popups.info.show"
         :class="{'menu-info-popup-appear': menus.popups.info.slide,
         'menu-freeze-bypass':isPopupOpen
         }"

    >
      <h4>{{ menus.popups.manageUsers.title }}</h4>
      <p class="template-string-formatting"> {{menus.popups.info.text}}</p>
      <button class="btn-default shadow2"
              @click.prevent="menus.popups.close('info')"

      >OK</button>
    </div>


    <div class="user-profile-menageUsers-header shadow5">
      <h3>Menage Users</h3>
      <div>
        <div>
          <h4>Email:</h4>
          <input type="email" v-model="manageUsers.searchEmail" @keydown.enter="searchByEmail()">
        </div>

      </div>
    </div>
    <div class="user-profile-menageUsers-items">
      <div class="user-profile-menageUsers-item"
           v-for="(userInfo,index) in manageUsers.usersToShow"
           :id="index"
           @click.prevent=""

      >
        <div class="user-profile-menageUsers-img">
          <img :src="userInfo.photoURL" alt="User Image">
        </div>
        <div class="user-profile-menageUsers-userInfo">
          <h4>{{ userInfo.displayName }}</h4>
          <h4>{{ userInfo.email }}</h4>
          <div>
            <h5>Date joined: {{ userInfo.dateJoined }}</h5>
            <h5>Number of Orders: {{ userInfo.orders }}</h5>
          </div>
        </div>
        <div class="user-profile-menageUsers-adminInfo">
          <div>
            <h5>Role:</h5>
            <select v-model="userInfo.role" @change="confirmChangeRole(userInfo)">
              <option>user</option>
              <option>manager</option>
              <option>administrator</option>
            </select>
          </div>
          <div>
            <button class="shadow2 btn-default"
                    @click.prevent="confirmDeleteUser(userInfo)"

            >Delete User</button>
          </div>

        </div>

      </div>

    </div>
    <div class="user-profile-menageUsers-footer">
      <nav>
        <div class="user-profile-menageUsers-footer-link shadow2"
             :class="{freeze:manageUsers.navBar.activeNavBar === 0}"
             @click.prevent="manageUsers.previous()"

        >&lt;
        </div>
        <div class="user-profile-menageUsers-footer-link shadow2"
             v-for="(navLink, index) in manageUsers.navBar.show"
             :id="index"
             :class="{'user-profile-menageUsers-footer-activeLink': manageUsers.activePage === navLink}"
             @click.prevent="manageUsers.createPage(navLink)"


        >{{ navLink +1 }}
        </div>

        <div class="user-profile-menageUsers-footer-link shadow2"
             :class="{freeze:manageUsers.navBar.activeNavBar === this.manageUsers.numPages - 1}"
             @click.prevent="manageUsers.next()"

        >>
        </div>
      </nav>
    </div>


  </main>
</template>

<style scoped>

</style>