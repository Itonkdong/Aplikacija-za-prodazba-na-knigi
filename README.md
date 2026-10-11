# LuminaLeaf

An online bookstore built with Vue 3 and Firebase. Browse books, save favorites, manage your cart, and place orders.

## Features

- Book catalog, product details, and reviews
- Account registration, sign-in, and profile management
- Saved books, shopping cart, checkout, and order history
- Management pages for books, orders, and user roles

## Built with

Vue 3, Vue Router, Firebase Authentication, Cloud Firestore, and Cloud Storage. Hosting is configured for Firebase Hosting.

## Run locally

Install Node.js and npm, then install the dependencies:

```sh
npm ci
```

Configure your Firebase project in `src/main.js` and enable Authentication, Firestore, and Storage. If you use Firebase deployment, update the project ID in `.firebaserc` too.

Start the development server:

```sh
npm run serve
```

Create a production build:

```sh
npm run build
```

The build is generated in `dist/`.

## Firebase setup

Firebase web configuration is public client configuration. Keep service account keys and other private credentials out of Git. Before using real customer data, configure and deploy security rules: the current Firestore rules have expired, and Storage rules allow unrestricted access.
