/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
// Stripe ist ein Objekt, das in base.pug als Skript eingebettet wurde
// auf der Front-End-Seite liegt der private key (pk), auf der Back-End-Seite der secret key (vgl. bookingController)
const stripe = Stripe(
  'pk_test_51HeEC1EQqHHM760j9wwZZqu5CQ1WiJoa749s7NzKdZn80agR9Wy02fKmPWQYfQClru4EKRT7Sm6Lg6T5Ka4MkogF00yVFMYTyV'
);
// tourId kommt von tour.pug (siehe dort ganz unten beim letzten Button)
export const bookTour = async tourId => {
  try {
    // 1) Get checkout session from API
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
