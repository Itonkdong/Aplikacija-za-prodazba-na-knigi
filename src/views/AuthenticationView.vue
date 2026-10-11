<script>

import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail

} from 'firebase/auth'

import {getFirestore, collection, getDocs,
    setDoc,
  addDoc, deleteDoc, doc,
  onSnapshot,
  query, where,
  orderBy,
  serverTimestamp,
  getDoc,
  updateDoc} from "firebase/firestore"
import {getDownloadURL, getMetadata, getStorage, ref} from "firebase/storage";

function animateMenu()
{
  const signUpButton = document.getElementById('signUp');
  const signInButton = document.getElementById('signIn');
  const container = document.getElementById('container');

  signUpButton.addEventListener('click', () =>
  {
    container.classList.add("right-panel-active");
  });

  signInButton.addEventListener('click', () =>
  {
    container.classList.remove("right-panel-active");
  });
}


export default {
  name: "AuthenticationView",
  props: ['action', 'goToLink', 'user'],
  data()
  {
    return {
      credentials: {
        signIn: {
          email: '',
          password: ''
        },
        signUp: {
          displayName: '',
          email: '',
          password: ''
        },
        resetPassword: {
          email: ''
        }
      },
      errors: {
        serverSide: {
          message: ''
        },
        clientSide: {
          message: ''
        },
        missingInput: {
          signIn: false,
          signUp: false,
        }
      },
      messages: {
        resetPassword: false,
        creatingAccount: false,
        signingIn: false,
      },
      menus: {
        popups: {
          error: {
            show: false,
            slide: false,
            alreadyOpen: false
          },
          resetPassword: {
            show: false,
            slide: false,
            alreadyOpen: false
          },
          authStatus: {
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
            }, 500)
          },
          fastClose(popup)
          {
            this[popup].show = false;
            this[popup].slide = false;
          }
        }
      }

    }
  },
  methods: {
    resetFields(object)
    {
      for (const key in object)
      {
        object[key] = '';
      }

    },
    handleOpeningErrorPopup()
    {
      if (this.menus.popups.open('error') === 'already-opened')
      {
        return;
      }

      setTimeout(() =>
      {
        this.menus.popups.close('error');
        setTimeout(() =>
        {
          this.errors.clientSide.message = this.errors.serverSide.message = '';
        }, 300);

      }, 3000)

    },
    authErrorHandler(errorCode)
    {
      if (errorCode === 'auth/email-already-in-use')
      {
        this.errors.serverSide.message = 'There is already an account with that email';
      }
      else if (errorCode === 'auth/invalid-email')
      {
        this.errors.serverSide.message = 'Please input a valid email address';
      }
      else if (errorCode === 'auth/wrong-password' || errorCode === 'auth/wrong-email')
      {
        this.errors.serverSide.message = 'Incorrect password or email';
      }
      else if (errorCode === 'auth/missing-password')
      {
        this.errors.serverSide.message = 'Please enter your password';
      }
      else if (errorCode === 'auth/user-not-found')
      {
        this.errors.serverSide.message = 'User does not exist';
      }
      else if (errorCode === 'auth/weak-password')
      {
        this.errors.clientSide.message = 'Your password must be at least 6 characters long';
      }
      else if (errorCode === 'auth/too-many-requests')
      {
        this.errors.serverSide.message = 'Too many failed requests. Please try again later';
      }

      this.handleOpeningErrorPopup();


    },
    handleResetPasswordPopup(error = null)
    {
      if (!error)
      {
        this.messages.resetPassword = `'Reset Password Link' was sent to ${this.credentials.resetPassword.email}`
      }
      else
      {
        if (error.code === 'auth/user-not-found')
        {
          this.messages.resetPassword = `Error: User does not exist`
        }
        else if (error.code === 'auth/invalid-email')
        {
          this.messages.resetPassword = 'Please input a valid email address';
        }
      }

      setTimeout(() =>
      {
        this.menus.popups.close('resetPassword');
        this.messages.resetPassword = '';
        this.credentials.resetPassword.email = ''
      }, 2000)
    },
    clientSideDataValidator(form)
    {
      const validation = {
        error: false,
        code: ''
      }


      if (form === 'signUp')
      {
        if (this.credentials.signUp.password.length < 6)
        {
          validation.error = true;
          validation.errorCode = 'auth/weak-password';
        }
      }
      else if (form === 'signIn')
      {

        if (!this.credentials.signIn.password)
        {
          validation.error = true;
          validation.errorCode = 'auth/missing-password';
        }
      }
      return validation;


    },
    missingInput(form)
    {
      if (form === 'signIn')
      {
        if (!this.credentials.signIn.email)
        {
          this.errors.missingInput.signIn = true;
          this.$nextTick(() =>
          {
            this.$refs["signIn-email"].focus();
          })
          return true
        }
        else if (!this.credentials.signIn.password)
        {
          this.errors.missingInput.signIn = true;
          this.$nextTick(() =>
          {
            this.$refs["signIn-password"].focus();
          })
          return true
        }
      }
      else if (form === 'signUp')
      {
        if (!this.credentials.signUp.displayName)
        {
          this.errors.missingInput.signUp = true;
          this.$nextTick(() =>
          {
            this.$refs["signUp-displayName"].focus();
          })
          return true
        }
        else if (!this.credentials.signUp.email)
        {
          this.errors.missingInput.signUp = true;
          this.$nextTick(() =>
          {
            this.$refs["signUp-email"].focus();
          })
          return true
        }
        else if (!this.credentials.signUp.password)
        {
          this.errors.missingInput.signUp = true;
          this.$nextTick(() =>
          {
            this.$refs["signUp-password"].focus();
          })
          return true
        }
      }
      return false
    },
    successfullyAssignedRole()
    {
      this.messages.creatingAccount = false;
      this.menus.popups.open('authStatus');
      setTimeout(() =>
      {

        this.menus.popups.close('authStatus');
        this.messages.creatingAccount = true;
        this.goToLink('/');
        this.resetFields(this.credentials.signUp);
        // console.log(this.user);
        location.reload();
      }, 5000)
    },
    successfulRegistrationHandler()
    {
      // console.log('Ovde baraj date joined',this.user);

      const newUser = {
        displayName: this.user.displayName,
        photoURL: this.user.photoURL,
        uid: this.user.uid,
        email: this.user.email,
        role: 'user',
        orders: 0,
        dateJoined: this.user.metadata.creationTime,
        savedBooks: [],
        cart: [],
      }

      // const usersListRef = collection(this.$db, 'usersList');

      setDoc(doc(this.$db, 'usersList', this.user.uid), newUser)
          .then(()=>{
            this.successfullyAssignedRole()
          })
    },
    signUp()
    {

      if (this.missingInput('signUp'))
      {
        return;
      }

      const validation = this.clientSideDataValidator('signUp');
      if (validation.error)
      {
        this.authErrorHandler(validation.errorCode)
        return;
      }


      //Callback hell, i guess
      createUserWithEmailAndPassword(this.$auth(), this.credentials.signUp.email, this.credentials.signUp.password)
          .then(() =>
          {

            sendEmailVerification(this.$auth().currentUser)
                .then(async () =>
                {
                  const storage = getStorage();
                  const defaultRef = ref(storage, `profile-picture/default-profile-picture`);

                  let url = null;
                  try
                  {
                    url = await getDownloadURL(defaultRef);
                  }
                  catch (error)
                  {
                    console.log('Error occurred while fetching profile picture:');
                  }


                  updateProfile(this.$auth().currentUser, {
                    displayName: this.credentials.signUp.displayName,
                    photoURL: url
                  })
                      .then(() =>
                      {
                        this.successfulRegistrationHandler();
                      })
                })
          })
          .catch((error) =>
          {
            console.log(error.code);
            this.authErrorHandler(error.code);
            this.menus.popups.fastClose('authStatus');
          });


      if(!this.menus.popups.error.show)
      {
        this.messages.creatingAccount = true;
        this.menus.popups.open('authStatus');
      }
    },
    async signIn()
    {
      //Checking if there is a missing input
      if (this.missingInput('signIn'))
      {
        return;
      }

      //Validating the data on the client
      const validation = this.clientSideDataValidator('signIn');
      if (validation.error)
      {
        this.authErrorHandler(validation.errorCode)
        return;
      }

      //Opening status popup
      if(!this.menus.popups.error.show)
      {
        this.messages.signingIn = true;
        this.menus.popups.open('authStatus');
      }

      let errorOccurred = false

      //The main auth function
      await signInWithEmailAndPassword(this.$auth(), this.credentials.signIn.email, this.credentials.signIn.password)
          .then(() =>
          {
            //Resetting the inputs and automatic redirection
            // console.log('Successfully sign-in: ', this.user);
            this.resetFields(this.credentials.signIn);
            this.goToLink('/');

          })
          .catch((error) =>
          {
            //Handling errors
            console.log('error:', error.code);
            this.authErrorHandler(error.code);
            errorOccurred = true;
          });

      //Closing status popup
      this.menus.popups.fastClose('authStatus');
      this.messages.signingIn = false;

      if(!errorOccurred)
      {
        location.reload();
      }

    },
    resetPassword()
    {
      // console.log('Reset Password');
      sendPasswordResetEmail(this.$auth(), this.credentials.resetPassword.email)
          .then(() =>
          {
            this.handleResetPasswordPopup();
          })
          .catch((error) =>
          {
            console.log(error);
            this.handleResetPasswordPopup(error);
          });
    }
  },
  mounted()
  {
    animateMenu()

    if (!this.action)
    {
      this.goToLink('/auth/sign-in');
    }
  }
}
</script>


<template>

  <div class="auth-main-popup shadow2"
       v-if="this.menus.popups.resetPassword.show"
       :class="{'appear': this.menus.popups.resetPassword.slide,
         'alreadyOpened': this.menus.popups.resetPassword.alreadyOpen
         }"

  >
    <div class="auth-close-cross"
         @click="menus.popups.close('resetPassword')"
         v-if="!messages.resetPassword"

    > &#10006;
    </div>
    <h4 v-if="!messages.resetPassword">Reset Password</h4>
    <p v-if="!messages.resetPassword">Please enter your email address.<br> If your email is associated with an account
      on this website, we will send a
      'Reset Password Link'</p>
    <div v-if="!messages.resetPassword">
      <input class="shadow5" type="email" placeholder="Email Address"
             v-model="credentials.resetPassword.email"
      >
    </div>
    <button class="shadow2 btn-default"
            @click.prevent="resetPassword()"
            v-if="!messages.resetPassword"
            :class="{'freeze': !this.credentials.resetPassword.email}"

    >Send reset link
    </button>
    <p v-if="messages.resetPassword">{{ messages.resetPassword }}</p>

  </div>
  <div class="auth-main-popup shadow2"
       v-if="this.menus.popups.authStatus.show"
       :class="{'appear': this.menus.popups.authStatus.slide,
         }"
  >
    <h4 v-if="messages.signingIn">Signing in...</h4>
    <h4 v-if="messages.creatingAccount">Creating account...</h4>
    <h4 v-if="!messages.creatingAccount && !messages.signingIn">Successful Registration</h4>
    <p v-if="!messages.creatingAccount && !messages.signingIn" >You successfully created an account.<br>An 'Email Verification Link' was sent to {{ credentials.signUp.email }}
    </p>
  </div>

  <div class="form-container-wrapper" id="container"
       :class="{'right-panel-active':action === 'sign-up',
       'freeze': menus.popups.resetPassword.slide || menus.popups.authStatus.slide
       }"


  >
    <div class="error-popup shadow2"
         v-if="this.menus.popups.error.show"
         :class="{'slide': this.menus.popups.error.slide,
         'alreadyOpened': this.menus.popups.error.alreadyOpen
         }"

    >
      <p>
        &#9888; Error:
        <span>{{ errors.clientSide.message ? errors.clientSide.message : errors.serverSide.message }}</span></p>
    </div>

    <div class="auth-go-home-arrow"
         @click="goToLink('/')"
    >&#10140;
    </div>


    <div class="form-container sign-up-container">
      <form class="sign-form">
        <h1 class="sign-form-title">Sign up</h1>
        <h3 class="sign-from-subtitle">Create a free account with your email.</h3>
        <input type="text" placeholder="Display Name" class="sign-input shadow5"
               v-model="credentials.signUp.displayName"
               :class="{'missing-input':!credentials.signUp.displayName && errors.missingInput.signUp}"
               ref="signUp-displayName"
        >

        <input type="email" placeholder="Email" class="sign-input shadow5"
               v-model="credentials.signUp.email"
               :class="{'missing-input':!credentials.signUp.email && errors.missingInput.signUp}"
               ref="signUp-email"
        >

        <input type="password" placeholder="Password" class="sign-input shadow5"
               v-model="credentials.signUp.password"
               :class="{'missing-input':!credentials.signUp.password && errors.missingInput.signUp}"
               ref="signUp-password"
        >
        <button class="shadow2 sign-btn sign-form-btn" type="button"
                @click.prevent="signUp()"
                @keydown.enter.prevent="signUp()"

        >Create a free account
        </button>


        <div class="form-legal-info">
          <p>By continuing, you agree to our <span class="hover-link"
                                                   @click.prevent="goToLink('/terms-of-use')"

          >Terms of Use</span>.</p>
          <p>Read our <span class="hover-link"
                            @click.prevent="goToLink('/privacy-policy')"

          >Privacy Policy</span>.
          </p>
        </div>

      </form>
    </div>
    <div class="form-container sign-in-container">
      <form class="sign-form">
        <h1 class="sign-form-title">Sign in</h1>
        <h3 class="sign-from-subtitle">Sign in with your email here.</h3>
        <input type="email" placeholder="Email" class="sign-input shadow5"
               v-model="credentials.signIn.email"
               :class="{'missing-input':!credentials.signIn.email && errors.missingInput.signIn}"
               ref="signIn-email"
        >

        <input type="password" placeholder="Password" class="sign-input shadow5"
               v-model="credentials.signIn.password"
               :class="{'missing-input': !credentials.signIn.password && errors.missingInput.signIn}"
               ref="signIn-password"
        >

        <button class="shadow2 sign-btn sign-form-btn" type="button"
                @click.prevent="signIn()"
                @keydown.enter.prevent="signIn()"

        >Sign In
        </button>

      </form>
      <div class="form-legal-info">
        <p>By continuing, you agree to our <span class="hover-link"
                                                 @click.prevent="goToLink('/terms-of-use')"

        >Terms of Use</span>. </p>
        <p>Read our <span class="hover-link"
                          @click.prevent="goToLink('/privacy-policy')"

        >Privacy Policy</span>.
        </p>
      </div>

      <div class="form-forgot-password">Forgot your password? <span class="hover-link"
                                                                    @click.prevent="menus.popups.open('resetPassword')"

      >Reset</span>
      </div>

    </div>
    <div class="overlay-container">
      <div class="overlay">
        <div class="overlay-panel overlay-left">
          <h1 class="sign-form-title">Welcome Back!</h1>
          <p class="sign-from-para">Already have an account? Please sign in with your credentials.</p>
          <button class="sign-btn ghost" id="signIn"
                  @click.prevent="goToLink('/auth/sign-in')"

          >Sign In
          </button>
        </div>
        <div class="overlay-panel overlay-right">
          <h1 class="sign-form-title">Hello, Friend!</h1>
          <p class="sign-from-para"> Don't have an account? Create one for free!</p>
          <p></p>
          <button class="sign-btn ghost" id="signUp"
                  @click.prevent="goToLink('/auth/sign-up')"

          >Sign Up
          </button>
        </div>
      </div>
    </div>
  </div>

</template>

<style scoped>

</style>