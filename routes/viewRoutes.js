const express = require('express');

const router = express.Router();
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

router.get('/', authController.isLoggedIn, viewsController.getHome);

router.get('/login', authController.isLoggedIn, viewsController.getLoginScreen);

router.get(
  '/overview',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewsController.getOverview
);

router.get(
  '/tours/:slug',
  authController.isLoggedIn,
  viewsController.getTourDetaiPage
);

router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyTour);

router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData
);

module.exports = router;
