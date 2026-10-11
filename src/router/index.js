import {createRouter, createWebHistory} from 'vue-router'
import HomeView from "@/views/HomeView.vue";
import AuthenticationView from "@/views/AuthenticationView.vue";
import ShopView from "@/views/ShopView.vue";
import BookProductView from "@/views/BookProductView.vue";
import CartView from "@/views/CartView.vue";
import CheckoutView from "@/views/CheckoutView.vue";
import TermsofUseView from "@/views/TermsofUseView.vue";
import PrivacyPolicyView from "@/views/PrivacyPolicyView.vue";
import ShippingPolicyView from "@/views/ShippingPolicyView.vue";
import AboutUsView from "@/views/AboutUsView.vue";
import ContactView from "@/views/ContactView.vue";
import {getAuth, onAuthStateChanged} from "firebase/auth";
import MenuView from "@/views/MenuView.vue";
import UserInfoView from "@/views/menu/UserInfoView.vue";
import SavedBooksView from "@/views/menu/SavedBooksView.vue";
import OrdersView from "@/views/menu/OrdersView.vue";
import ManageOrdersView from "@/views/menu/ManageOrdersView.vue";
import ManageBookstoreView from "@/views/menu/ManageBookstoreView.vue";
import ManageUsersView from "@/views/menu/ManageUsersView.vue";
import {collection, doc, getDoc, getDocs, getFirestore, query, where} from "firebase/firestore";

const routes = [
    {
        path: '/',
        name: 'home',
        component: HomeView,
        props: true
    },
    {
        path: '/auth/:action?',
        name: 'auth',
        component: AuthenticationView,
        props: true
    },
    {
        path: '/shop/:filter?',
        name: 'shop',
        component: ShopView,
        props: true
    },
    {
        path: '/book/:bookTitle?',
        name: 'book',
        component: BookProductView,
        props: true
    },
    {
        path: '/cart',
        name: 'cart',
        component: CartView,
        props: true,
        meta: {
            requiresAuth: true,
        }
    },
    {
        path: '/checkout',
        name: 'checkout',
        component: CheckoutView,
        props: true,
        meta: {
            requiresAuth: true,
        }
    },
    {
        path: '/menu',
        name: 'menu',
        component: MenuView,
        props: true,
        children: [
            {
                path: '',
                name: 'userInfo',
                component: UserInfoView,
                props: true,
            },
            {
                path: 'saved-books',
                name: 'savedBooks',
                component: SavedBooksView,
                props: true
            },
            {
                path: 'orders',
                name: 'orders',
                component: OrdersView,
                props: true
            },
            {
                path: 'manage-orders',
                name: 'manageOrders',
                component: ManageOrdersView,
                props: true,
                meta: {
                    roleNeeded: true,
                }
            },
            {
                path: 'manage-bookstore',
                name: 'manageBookstore',
                component: ManageBookstoreView,
                props: true,
                meta: {
                    roleNeeded: true,
                }
            },
            {
                path: 'manage-users',
                name: 'manageUsers',
                component: ManageUsersView,
                props: true,
                meta: {
                    roleNeeded: true,
                }
            }

        ],
        meta: {
            requiresAuth: true,
        }
    },
    {
        path: '/terms-of-use',
        name: 'termsOfUse',
        component: TermsofUseView,
        props: true
    },
    {
        path: '/privacy-policy',
        name: 'privacyPolicy',
        component: PrivacyPolicyView,
        props: true
    },
    {
        path: '/shipping-policy',
        name: 'shippingPolicy',
        component: ShippingPolicyView,
        props: true
    },
    {
        path: '/about-us',
        name: 'aboutUs',
        component: AboutUsView,
        props: true
    },
    {
        path: '/contact',
        name: 'contact',
        component: ContactView,
        props: true
    },
]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
})

function getCurrentUser()
{
    return new Promise((resolve, reject) =>
    {
        const removeListener = onAuthStateChanged(getAuth(), (user) =>
            {
                removeListener();
                resolve(user);
            },
            reject
        );
    });
}

async function getCurrentUserInfo(user)
{
    if (!user)
    {
        return;
    }

    const userRef = doc(getFirestore(), 'usersList', user.uid);

    let userInfo = null;
    await getDoc(userRef)
        .then((user)=>{
            userInfo = user.data();

        })
        .catch((error)=>{
            console.log(error.code);
        });

    return userInfo;

}

function pathToAuth(path)
{
    return path.substr(0, 5) === '/auth';
}


router.beforeEach(async (to, from, next) =>
{
    window.scrollTo(0, 0);
    // console.log(to.path);
    if (to.meta.requiresAuth)
    {
        const currentUser = await getCurrentUser();
        if (currentUser)
        {
            if (to.meta.roleNeeded)
            {
                const userInfo = await getCurrentUserInfo(currentUser);
                if ((to.path === '/menu/manage-orders' || to.path === '/menu/manage-bookstore') &&
                    (userInfo.role === 'manager' || userInfo.role === 'administrator'))
                {
                    next()
                }
                else if (to.path === '/menu/manage-users' && userInfo.role === 'administrator')
                {
                    next()
                }
                else
                {
                    next('/menu')
                }

            }
            else
            {
                next();
            }

        }
        else
        {
            next('/auth');
        }
    }
    else if (pathToAuth(to.path))
    {
        if (await getCurrentUser())
        {
            next('/');
        }
        else
        {
            next();
        }
    }
    else if (to.path === '/home')
    {
        next('/');
    }
    else
    {
        next();
    }
})

export default router
