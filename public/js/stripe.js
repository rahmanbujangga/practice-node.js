/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

const stripe = Stripe(
  'pk_test_51H4TJWCiJVbrCxa6l237OvdRAzeZSTNzmdtGAnvK5kNgfvwpxv2CW3DeSLtTYs9aa7F0vgv2wJPckKfTrErSzYP900mMUUaqpK'
);

export const bookTour = async (tourId) => {
  try {
    //get session stripe
    const session = await axios({
      url: `/api/v1/bookings/checkout-session/${tourId}`,
    });

    console.log(session);
    //create checkout form
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
