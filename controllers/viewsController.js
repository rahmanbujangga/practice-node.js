const catcthAsync = require('../utils/catchAsync');
const Tour = require('../model/tourModel');
const User = require('../model/userModel');
const AppError = require('../utils/appError');
const Booking = require('../model/bookingModel');

exports.getHome = catcthAsync((req, res) => {
  res.status(200).render('base', {
    tour: 'The Forest Hiker',
    user: 'Jonas',
  });
});

exports.getOverview = catcthAsync(async (req, res) => {
  const tours = await Tour.find();
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTourDetaiPage = catcthAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }

  res.status(200).render('tour', {
    title: `${tour.name}`,
    tour,
  });
});

exports.getLoginScreen = (req, res) => {
  res.status(200).render('login', {
    title: 'Login page',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.updateUserData = catcthAsync(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).render('account', {
    title: 'Your account',
    user: user,
  });
});

exports.getMyTour = catcthAsync(async (req, res) => {
  //find all booking with current user id
  const bookings = await Booking.find({ user: req.user.id });
  console.log(bookings);

  //find all tour id based on bookings
  const tourIds = bookings.map((booking) => booking.tour);
  console.log(tourIds);
  //find all tour based on tour id
  const tours = await Tour.find({ _id: { $in: tourIds } });
  console.log(tours);

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});
