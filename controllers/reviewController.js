const Review = require('../models/reviewModel');
// const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.setTourUserId = (req, res, next) => {
  // Allows nested routes
  // wenn im body die tour-id nicht eingegeben wurde, dann soll diese tour-id der Parameter der URL sein
  if (!req.body.tour) req.body.tour = req.params.tourId;

  // wenn im body die user-id nicht eingegeben wurde, dann soll diese von der protect-Middleware kommen
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
