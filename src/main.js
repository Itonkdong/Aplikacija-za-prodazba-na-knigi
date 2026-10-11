import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import $bus from '@/Unilities/Events'
import styles from '@/Assets/Styles/import.css'


/*Firebase*/
import { initializeApp } from "firebase/app";
import {getAuth} from  'firebase/auth'
import {getFirestore} from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCs_Fe048UFhT9QRbXFI8Gv3Lm7N3X1qKc",
    authDomain: "book-store-app-a6ae9.firebaseapp.com",
    projectId: "book-store-app-a6ae9",
    storageBucket: "book-store-app-a6ae9.appspot.com",
    messagingSenderId: "774188305265",
    appId: "1:774188305265:web:10691378c62657709f44d0"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
/**/





const app = createApp(App);

app.use(router);
app.config.globalProperties.$bus = $bus;
app.config.globalProperties.$auth = getAuth;
app.config.globalProperties.$db = getFirestore(firebaseApp);


app.mount('#app');
