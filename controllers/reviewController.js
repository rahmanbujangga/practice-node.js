const Review = require('../model/reviewModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.setTourAndUserWithId = (req, res, next) => {
  //set user id
  if (!req.body.user) req.body.user = req.user.id;
  console.log(req.body.user);

  //set tour id
  if (!req.body.tour) req.body.tour = req.params.tourId;
  console.log(req.body.tour);

  //to next middleware
  next();
};

//controller to get all reviews
exports.getAllReviews = factory.getAll(Review);

//controller get one review by id
exports.getReview = factory.getOne(Review);

//controller to create review
exports.createReview = factory.createOne(Review);

//controller to update review
exports.updateReview = factory.updateOne(Review);

//controller to delete review
exports.deleteReview = factory.deleteOne(Review);
