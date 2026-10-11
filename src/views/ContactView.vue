<script>
import {addDoc, collection, getDocs, query, where} from "firebase/firestore";
import ErrorPopup from "@/components/ErrorPopup.vue";

export default {
  name: "ContactView",
  components: {ErrorPopup},
  data()
  {
    return{
      fullName:'',
      email:'',
      message:'',
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
    async sendMessage()
    {
      const collectionRef = collection(this.$db, 'contactMessages');



      try
      {
        const message= {
          fullName: this.fullName,
          email: this.email,
          message: this.message
        }
        await addDoc(collectionRef, message);
        this.menus.popups.error.generatePopup('Message Successfully Sent', `Your message was successfully sent. Will try and reach out as soon as possible.`);
        this.menus.popups.open('error');
        this.email = '';
        this.fullName = '';
        this.message='';
      }
      catch (e)
      {
        console.error(e);
        this.menus.popups.error.generatePopup('Error Occurred', `Error occurred while trying to send your message.Try again later.`);
        this.menus.popups.open('error');
      }





    },
  }
}
</script>

<template>

  <main class="contact-wrapper">
    <ErrorPopup
        :popup="menus.popups.error"
        :popup-name="'error'"
        @close-popup="closePopup"
        class="position-fixed"

        :class="{'menu-freeze-bypass':menus.popups.error.show}"
    >


    </ErrorPopup>
    <div class="contact-img">
      <img src="@/Assets/Images/backgrounds/contact-2.png" alt="Books and watches">
    </div>
    <div class="contact-grid">
      <div class="contact-header">
        <h2>Contact</h2>

      </div>
      <div class="contact-introduction">
        <h4>Get in Touch:</h4>
        <p>We're always here to help you with any questions or concerns you might have. Whether you're looking for a
          specific book, need assistance with an order, or just want to share your thoughts, feel free to reach out to
          us.</p>
      </div>
      <div class="contact-info-container">
        <div class="contact-info">
          <h5>Contact Information:</h5>
          <ul>
            <li>Email: luminaleaf.contact@luminaleaf.com</li>
            <li>Phone: +389 78 456 654</li>
            <li>Address: We are an online-based shop ONLY</li>
          </ul>
        </div>
        <div class="contact-info contact-supportHours">
          <h5>Customer Support Hours</h5>
          <p>Our dedicated customer support team is available to assist you during the following hours:</p>
          <ul>
            <li>Monday to Friday: 9:00 AM - 6:00 PM (CEST)</li>
            <li>Saturday-Sunday: 10:00 AM - 4:00 PM (CEST)</li>
          </ul>
        </div>
        <div class="contact-socialMedia ">
          <i class="fab fa-facebook clickable"></i>
          <i class="fab fa-twitter clickable"></i>
          <i class="fab fa-instagram clickable"></i>
        </div>

      </div>
      <div class="contact-form">
        <h4>Ask us a Question</h4>

        <form>
          <input type="text" placeholder="Full Name" v-model="fullName">
          <input type="email" placeholder="Email" v-model="email">
          <textarea placeholder="Message" v-model="message"></textarea>
        </form>

        <button class="shadow2 btn-default"
                :class="{freeze:!email || !fullName || !message}"
                @click.prevent="sendMessage()"


        >Submit Message</button>

      </div>
    </div>


  </main>

</template>

<style scoped>

</style>