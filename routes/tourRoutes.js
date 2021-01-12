const express = require('express');
const { protect, restrictTo } = require('./../controllers/authcontroller');
const reviewRouter = require('./../routes/reviewRoutes');

const {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  uploadTourImages,
  resizeTourImages
} = require('./../controllers/tourController');

const router = express.Router();

// router
//   .route('/:tourId/reviews') /* '/' = '/api/v1/tours' */
//   .post(protect, restrictTo('user'), createReview);

/* '/' steht für '/api/v1/tours' , vgl. app.js */

router.use('/:tourId/reviews', reviewRouter);
/* verweist auf einen anderen Router, den reviewRouter, d.h. wird /api/v1/tours/:tourID/reviews in der URL eingegeben, wird der reviewRouter ausgeführt */

router.route('/top-5-cheap').get(aliasTopTours, getAllTours);
router.route('/tour-stats').get(getTourStats);
router
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);
// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/-40,45/unit/mi

router.route('/distances/:latlng/unit/:unit').get(getDistances);
// /tours/distances/34.111745,-118.113491/unit/mi

router
  .route('/')
  .get(getAllTours)
  .post(protect, restrictTo('admin', 'lead-guide'), createTour);
router
  .route('/:id')
  .get(getTour)
  .patch(
    protect,
    restrictTo('admin', 'lead-guide'),
    uploadTourImages,
    resizeTourImages,
    updateTour
  )
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

module.exports = router;
