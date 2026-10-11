<template>

  <main class="user-profile-info"
        :class="{'menu-freeze': isPopupOpen}"
  >

    <!--    Email verification link popup-->
    <div class="menu-info-popup shadow2"
         v-if="menus.popups.emailVerification.show"
         :class="{'menu-info-popup-appear': menus.popups.emailVerification.slide,
         'menu-freeze-bypass':isPopupOpen
         }"

    >
      <h4>Email Verification</h4>
      <p>{{menus.popups.emailVerification.message}}</p>
      <button class="btn-default shadow2"
              @click.prevent="menus.popups.close('emailVerification')"

      >OK
      </button>
    </div>

    <!--    Successfully changed info popup-->
    <div class="menu-info-popup shadow2"
         v-if="menus.popups.successfullyChangedInfo.show"
         :class="{'menu-info-popup-appear': menus.popups.successfullyChangedInfo.slide,
         'menu-freeze-bypass':isPopupOpen
         }"

    >
      <h4>Successfully Changed Info</h4>
      <p>You have successfully changed your info.</p>
      <button class="btn-default shadow2"
              @click.prevent="menus.popups.close('successfullyChangedInfo')"

      >OK
      </button>
    </div>

    <!--    Successfully changed password popup-->
    <div class="menu-info-popup shadow2"
         v-if="menus.popups.successfullyChangedPassword.show"
         :class="{'menu-info-popup-appear': menus.popups.successfullyChangedPassword.slide,
         'menu-freeze-bypass':isPopupOpen
         }"

    >
      <h4>Successfully Changed Password</h4>
      <p>You have successfully changed your password.</p>
      <button class="btn-default shadow2"
              @click.prevent="menus.popups.close('successfullyChangedPassword')"

      >OK
      </button>
    </div>

    <!--    Reauthenticate popup-->
    <div class="menu-info-popup shadow2"
         v-if="menus.popups.errorSavingChanges.show"
         :class="{'menu-info-popup-appear': menus.popups.errorSavingChanges.slide,
         'menu-freeze-bypass':isPopupOpen
         }"

    >
      <h4>Error Occurred!</h4>
      <p>Please sign out and sign in again. Try changing your info after that.</p>
      <button class="btn-default shadow2"
              @click.prevent="menus.popups.close('errorSavingChanges')"

      >OK
      </button>
    </div>

    <!--    Feature not implemented popup-->
    <div class="menu-info-popup shadow2"
         v-if="menus.popups.notImplemented.show"
         :class="{'menu-info-popup-appear': menus.popups.notImplemented.slide,
         'menu-freeze-bypass':isPopupOpen
         }"

    >
      <h4>Error Occurred!</h4>
      <p>You can't add phone number yet. Try again later.</p>
      <button class="btn-default shadow2"
              @click.prevent="menus.popups.close('notImplemented')"

      >OK
      </button>
    </div>

    <!--    Save all changes popup-->
    <div class="menu-info-popup shadow2"
         v-if="menus.popups.saveAllChangesFirst.show"
         :class="{'menu-info-popup-appear': menus.popups.saveAllChangesFirst.slide,
         'menu-freeze-bypass':isPopupOpen
         }"

    >
      <h4>Error Occurred!</h4>
      <p>Please save all changes first.</p>
      <button class="btn-default shadow2"
              @click.prevent="menus.popups.close('saveAllChangesFirst')"

      >OK
      </button>
    </div>

    <!--    Confirm all changes popup-->
    <div class="menu-info-popup shadow2"
         v-if="menus.popups.confirmAllChangesFirst.show"
         :class="{'menu-info-popup-appear': menus.popups.confirmAllChangesFirst.slide,
         'menu-freeze-bypass':isPopupOpen
         }"

    >
      <h4>Error Occurred!</h4>
      <p>Please confirm all changes.</p>
      <button class="btn-default shadow2"
              @click.prevent="menus.popups.close('confirmAllChangesFirst')"

      >OK
      </button>
    </div>

    <!--    Password change error popup-->
    <div class="menu-info-popup shadow2"
         v-if="menus.popups.errorChangingPassword.show"
         :class="{'menu-info-popup-appear': menus.popups.errorChangingPassword.slide,
         'menu-freeze-bypass':isPopupOpen
         }"

    >
      <h4>Error Occurred!</h4>
      <p>{{menus.popups.errorChangingPassword.message}}</p>
      <button class="btn-default shadow2"
              @click.prevent="menus.popups.close('errorChangingPassword')"
      >OK
      </button>
    </div>

    <!--    Change Profile Picture popup-->
    <div class="menu-info-popup shadow2"
         v-if="menus.popups.changeProfilePicture.show"
         :class="{'menu-info-popup-appear': menus.popups.changeProfilePicture.slide,
         'menu-freeze-bypass':isPopupOpen
         }"

    >
      <h4>{{menus.popups.changeProfilePicture.title}}</h4>
      <p>{{menus.popups.changeProfilePicture.message}}</p>
      <button class="btn-default shadow2"
              @click.prevent="menus.popups.close('changeProfilePicture')"
      >OK
      </button>
    </div>

    <div class="user-profile-info-header shadow5">
      <div class="user-profile-profilePicture">
        <img :src="user.photoURL" alt="Profile Picture"
             ref="profile-picture"

        >

        <button class="clickable shadow5" v-if="!profilePictureInterface.show"
                @click.prevent="profilePictureInterface.open()"

        >Change Profile Picture</button>
        <div v-if="profilePictureInterface.show">
          <input type="file" @change="profilePictureInterface.handleFileChange">
          <button class="clickable shadow5"
                  @click.prevent="saveProfilePicture()"

          >Save</button>
        </div>

      </div>
      <div class="user-profile-credentials">
        <h5 class="user-profile-displayName">
          {{ user ? user.displayName : 'Display Name' }}
        </h5>
        <h3 class="user-profile-email">{{ user ? user.email : 'Email Address' }}</h3>
      </div>
    </div>
    <div class="user-profile-info-items">
      <div class="user-profile-info-item ">
        <h5>Display Name</h5>
        <div class="shadow5 user-profile-info-item-static"
             v-if="!interfaces.displayName"
             @click.prevent="activeInterface('displayName')"
             :class="{'changed': user && user.displayName !== updatedInfo.displayName.value}"
        >{{ updatedInfo.displayName.value }}
        </div>

        <div v-if="interfaces.displayName" class="user-profile-info-item-interface">
          <input type="text" class="user-profile-info-item-input shadow5"
                 v-model="updatedInfo.displayName.value"
                 ref="interface-displayName"

          >
          <button class="btn-default shadow2 user-profile-info-item-interface-btn"
                  @click.prevent="deActiveInterface('displayName')"
          >Confirm
          </button>
        </div>
      </div>

      <div class="user-profile-info-item">
        <h5>Phone Number</h5>

        <div class="shadow5 user-profile-info-item-static"
             v-if="user && user.phoneNumber && !interfaces.phoneNumber"
             @click.prevent="menus.popups.open('notImplemented')"
        >{{ user.phoneNumber }}
        </div>

        <div class="shadow5 user-profile-info-item-static"
             v-if="user && !user.phoneNumber && !interfaces.phoneNumber"
             @click.prevent="menus.popups.open('notImplemented')"
        >Not provided
        </div>

        <div v-if="interfaces.phoneNumber" class="user-profile-info-item-interface">
          <input type="tel" class="user-profile-info-item-input shadow5">
          <button class="btn-default shadow2 user-profile-info-item-interface-btn"
                  @click.prevent="deActiveInterface('phoneNumber')"
          >Confirm
          </button>
        </div>

      </div>

      <div class="user-profile-info-item"
           :data-title="updatedInfo.email.value"

      >
        <h5>Email Address</h5>
        <div class="shadow5 user-profile-info-item-static"
             @click.prevent="activeInterface('email')"
             :class="{'changed': user &&  user.email !== updatedInfo.email.value}"
             v-if="!interfaces.email"

        >{{ updatedInfo.email.value }}
        </div>
        <div v-if="interfaces.email" class="user-profile-info-item-interface">
          <input type="text" class="user-profile-info-item-input shadow5"
                 v-model="updatedInfo.email.value"
                 ref="interface-email"
          >
          <button class="btn-default shadow2 user-profile-info-item-interface-btn"
                  @click.prevent="deActiveInterface('email')"
          >Confirm
          </button>
        </div>

      </div>

      <div class="user-profile-info-item">
        <h5 v-if="!interfaces.password">Password</h5>
        <h5 v-else>Current Password</h5>
        <div class="shadow5 user-profile-info-item-static"
             v-if="!interfaces.password"
             @click.prevent="activeInterface('password')"

        >*****
        </div>
        <div v-if="interfaces.password" class="user-profile-info-item-interface">
          <input type="password" class="user-profile-info-item-input shadow5"
                 v-model="oldPassword"
                 ref="interface-password"

          >
        </div>
      </div>

      <div class="user-profile-info-item">

        <h5>Email Verified</h5>

        <div class="shadow5 user-profile-info-item-static-small"
             v-if="user ? user.emailVerified : false"
        ><span class="email-verified"> &#x2611;</span>
        </div>

        <div class="flexy-group"
             v-else
        >
          <div class="shadow5 user-profile-info-item-static-small"
          >
            <span class="email-notVerified">&#x2612;</span>
          </div>
          <button class="btn-default shadow2"
                  @click.prevent="verifyEmail()"

          >Verify
          </button>
        </div>

      </div>

      <div class="user-profile-info-item"
           v-if="interfaces.password"

      >
        <h5>New Password</h5>
        <div v-if="interfaces.password" class="user-profile-info-item-interface">
          <input type="password" class="user-profile-info-item-input shadow5"
                 v-model="updatedInfo.password.value"

          >
          <button class="bgc-1 btn-default shadow2 user-profile-info-item-interface-btn"
                  @click.prevent="changePassword()"
          >Confirm
          </button>

          <button class="alert btn-default shadow2 user-profile-info-item-interface-btn"
                  @click.prevent="cancelChangingPassword()"
          >Cancel
          </button>
        </div>

      </div>


    </div>
    <div class="user-profile-info-footer">
      <button class="btn-default shadow2"
              @click.prevent="saveAllChanges()"
              :class="{'menu-freeze':allSaved}"

      >Save Changes
      </button>
    </div>

  </main>
</template>
<script>
import {
  updateProfile, updateEmail, sendEmailVerification,
  reauthenticateWithCredential, updatePassword, EmailAuthProvider
} from "firebase/auth";


import {doc, updateDoc} from "firebase/firestore";

import {getStorage, ref, uploadBytes, updateMetadata, getDownloadURL} from "firebase/storage";

export default {
  name: 'UserInfoView',
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
    allSaved()
    {
      // console.log('all saved envoced');
      if(this.user)
      {
        for (const info in this.updatedInfo)
        {

          // console.log(info);
          if (info === 'password')
          {
            continue;
          }

          if (this.updatedInfo[info].value !== this.user[info])
          {
            // console.log('user: ', this.user[info], 'updatedInfo: ', this.updatedInfo[info].value );
            return false
          }
        }
        return true;
      }
      return false;


    },
  },
  watch: {
    user(newValue, oldValue)
    {
      if (newValue)
      {
        // console.log('Vlez vo wather:', newValue);
        this.getUserInfo();
      }
    },
  },
  data()
  {
    return {
      profilePictureInterface:{
        file: null,
        show: false,
        handleFileChange(event)
        {
          this.file = event.target.files[0];
        },
        open()
        {
          this. show = true;
        },
        close()
        {
          this.show = false;
        }
      },
      oldPassword: '',
      interfaces: {
        displayName: false,
        email: false,
        phoneNumber: false,
        password: false,
      },
      menus: {
        popups: {
          emailVerification: {
            message: '',
            show: false,
            slide: false,
            alreadyOpen: false
          },
          errorSavingChanges: {
            show: false,
            slide: false,
            alreadyOpen: false
          },
          saveAllChangesFirst: {
            show: false,
            slide: false,
            alreadyOpen: false
          },
          successfullyChangedInfo: {
            show: false,
            slide: false,
            alreadyOpen: false
          },
          confirmAllChangesFirst: {
            show: false,
            slide: false,
            alreadyOpen: false
          },
          notImplemented: {
            show: false,
            slide: false,
            alreadyOpen: false
          },
          successfullyChangedPassword: {
            show: false,
            slide: false,
            alreadyOpen: false
          },
          errorChangingPassword: {
            show: false,
            slide: false,
            alreadyOpen: false,
            message:''
          },
          changeProfilePicture :
          {
            show: false,
            slide: false,
            alreadyOpen: false,
            message:'',
            title: ''
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
            }, 500)
          },
          fastClose(popup)
          {
            this[popup].show = false;
            this[popup].slide = false;
          }
        }
      },
      updatedInfo: {
        displayName: {
          value: '',
          confirmed: true
        },
        email: {
          value: '',
          confirmed: true
        },
        phoneNumber: {
          value: '',
          confirmed: true
        },
        password: {
          value: '',
          confirmed: true
        },
      }
    }
  },
  methods: {
    async saveProfilePicture()
    {

      if(this.profilePictureInterface.file === null)
      {
        this.menus.popups.changeProfilePicture.title = 'Error Occurred!';
        this.menus.popups.changeProfilePicture.message = 'Please select a picture.';
        this.menus.popups.open('changeProfilePicture');
        return
      }

      if(this.profilePictureInterface.file.type !== 'image/jpeg' && this.profilePictureInterface.file.type !== 'image/png')
      {

        this.menus.popups.changeProfilePicture.title = 'Error Occurred!';
        this.menus.popups.changeProfilePicture.message = 'File format not supported. Please select a .jpeg file';
        this.menus.popups.open('changeProfilePicture');
        return;
      }


      const storage = getStorage();
      const profilePictureRef = ref(storage, `profile-picture/${this.user.uid}`);


      const email = this.user.email;
      const displayName = this.user.displayName;
      const uid = this.user.uid;
      const pictureName = this.profilePictureInterface.file.name;

      const metaData = {
        customMetadata : {
          'email': `${email}`,
          'displayName': `${displayName}`,
          'uid': `${uid}`,
          'usage': 'profilePicture',
          'pictureName' : `${pictureName}`
        }
      };

      try
      {
        await uploadBytes(profilePictureRef, this.profilePictureInterface.file, metaData);
        const pictureUrl = await getDownloadURL(profilePictureRef);
        await updateProfile(this.$auth().currentUser,
            {
              photoURL: pictureUrl});

        let userInfo = doc(this.$db, 'usersList', this.user.uid);
        await updateDoc(userInfo, {
          photoURL: this.user.photoURL
        });

      }
      catch (error)
      {
        console.log(error);
      }


      this.$bus.$emit('profilePictureChanged');
      this.profilePictureInterface.close();
      this.profilePictureInterface.file = null;
      this.menus.popups.changeProfilePicture.title = 'Successfully Changed Profile Picture';
      this.menus.popups.changeProfilePicture.message = 'You have successfully changed your profile picture.';
      this.menus.popups.open('changeProfilePicture');

    },
    async verifyEmail()
    {
      if(!this.allConfirmed())
      {
        this.menus.popups.open('confirmAllChangesFirst');
        return;
      }

      if (!this.allSaved)
      {
        this.menus.popups.open('saveAllChangesFirst');
        return;
      }

      if (this.user.emailVerified)
      {
        // console.log('Email already verified');
        this.menus.popups.emailVerification.message="Your Email is already verified. Please reload the page!"
        this.menus.popups.open('emailVerification');
        return;
      }


     sendEmailVerification(this.$auth().currentUser)
          .then(() =>
          {
            // console.log('Email verification link was sent');
            this.menus.popups.emailVerification.message="`Email Verification Link` was sent to your email."
            this.menus.popups.open('emailVerification');
          })
          .catch((error)=>{
            console.log(error.code);
            this.authErrorHandler(error.code);
          })

    },
    async saveAllChanges()
    {
      let errorOccurred = false;

      if (!this.allConfirmed())
      {
        this.menus.popups.open('confirmAllChangesFirst');
        return;
      }


      if (this.updatedInfo.email.value !== this.user.email)
      {
        await updateEmail(this.user, this.updatedInfo.email.value)
            .then(() =>
            {
              // console.log('Profile Updated: Email');

              const userRef = doc(this.$db, 'usersList', this.user.uid);
              updateDoc(userRef, {
                email: this.user.email
              })


            })
            .catch((error) =>
            {
              console.log(error.code);
              this.menus.popups.open('errorSavingChanges');
              errorOccurred = true;
            })
      }

      if (this.updatedInfo.displayName.value !== this.user.displayName)
      {
        await updateProfile(this.$auth().currentUser, {
          displayName: this.updatedInfo.displayName.value
        })
            .then(() =>
            {
              // console.log('Profile Updated: Display Name');

              const userRef = doc(this.$db, 'usersList', this.user.uid);
              updateDoc(userRef, {
                displayName: this.user.displayName
              })


            })
            .catch((error) =>
            {
              console.log(error);
              this.menus.popups.open('errorSavingChanges');
              errorOccurred = true;
            })
      }

      if (errorOccurred)
      {
        return;
      }

      // console.log('New user is:', this.user);
      this.resetUpdatedInfo();
      // console.log('New updatedInfo is:', this.updatedInfo);
      this.getUserInfo();
      // console.log('New updatedInfo is:', this.updatedInfo);

      this.updatePictureMetadata();


      this.menus.popups.open('successfullyChangedInfo');


    },
    activeInterface(interfaceType)
    {
      this.interfaces[interfaceType] = true
      this.updatedInfo[interfaceType].confirmed = false;
      this.$nextTick(() =>
      {
        this.$refs[`interface-${interfaceType}`].focus();
      })
    },
    deActiveInterface(interfaceType)
    {
      this.updatedInfo[interfaceType].confirmed = true;
      this.interfaces[interfaceType] = false
    },
    authErrorHandler(errorCode)
    {
      if(errorCode === 'auth/wrong-password')
      {
        this.menus.popups.errorChangingPassword.message = 'Wrong password';
      }
      else if(errorCode === 'auth/weak-password')
      {
        this.menus.popups.errorChangingPassword.message = 'New password should be at least 6 characters!';
      }

      else if(errorCode === 'auth/too-many-requests')
      {
        this.menus.popups.emailVerification.message = "Too many requests! Please wait a couple of minutes before you ask for another 'Email Verification Link'";
        this.menus.popups.open('emailVerification');
        return;
      }


      this.menus.popups.open('errorChangingPassword');

    },
    getUserInfo()
    {
      this.updatedInfo.displayName.value = this.user.displayName;
      this.updatedInfo.email.value = this.user.email;
      this.updatedInfo.phoneNumber.value = this.user.phoneNumber;
    },
    allConfirmed()
    {
      for (const info in this.updatedInfo)
      {
        if(info==='password')
        {
          continue;
        }
        if (!this.updatedInfo[info].confirmed)
        {
          return false
        }
      }
      return true;
    },
    cancelChangingPassword()
    {
      this.oldPassword = this.updatedInfo.password.value = '';
      this.deActiveInterface('password');
    },
    resetUpdatedInfo()
    {
      for (const info in this.updatedInfo)
      {
        this.updatedInfo[info].value = ''
        if(info==='phoneNumber')
        {
          this.updatedInfo[info].value = null;
        }
      }
    },
    changePassword()
    {
      if(this.updatedInfo.password.value === '' || this.oldPassword ===' ')
      {
        this.menus.popups.errorChangingPassword.message = 'Please insert your password.';
        this.menus.popups.open('errorChangingPassword');
        return;
      }

      if(this.updatedInfo.password.value === this.oldPassword)
      {
        this.menus.popups.errorChangingPassword.message = "You can't have the same password again! Please insert a different 'New Password'."
        this.menus.popups.open('errorChangingPassword');
        return;
      }

      if (!this.allConfirmed())
      {
        this.menus.popups.open('confirmAllChangesFirst');
        // console.log('Vlez vo prv if');
        return;
      }

      if (!this.allSaved)
      {
        this.menus.popups.open('saveAllChangesFirst');
        // console.log('Updated: ', this.updatedInfo);
        // console.log('User:', this.user);
        return;
      }


      const credentials = EmailAuthProvider.credential(this.user.email, this.oldPassword);

      reauthenticateWithCredential(this.user, credentials)
          .then(() =>
          {
            updatePassword(this.user, this.updatedInfo.password.value)
                .then(() =>
                {
                  this.menus.popups.open('successfullyChangedPassword');
                  this.cancelChangingPassword();
                })
                .catch((error) =>
                {
                  console.log('New pass error: ',error);
                  this.authErrorHandler(error.code);
                });

          })
          .catch((error) =>
          {
            console.log('Reauth error: ',error);
            this.authErrorHandler(error.code);
          });
    },
    updatePictureMetadata()
    {
      if(!this.user)
      {
        return
      }

      const storage = getStorage();
      const profilePicRef = ref(storage, `profile-picture/${this.user.uid}`);


      const email = this.user.email;
      const displayName = this.user.displayName;

      const newMetadata = {
        customMetadata : {
          'email': `${email}`,
          'displayName': `${displayName}`,
        }
      };

      updateMetadata(profilePicRef, newMetadata)
          .then((metadata) => {

          }).catch((error) => {
            console.log(error);
      });
    }
  },
  mounted()
  {
    // console.log(this.user);
    this.getUserInfo()
    // console.log("Updated user info: ", this.updatedInfo)

  }
}
</script>

<style scoped>

</style>