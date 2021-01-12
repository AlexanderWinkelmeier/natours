const express = require('express');
const router = express.Router({
  mergeParams: true
}); /* mergeParams bewirkt, dass auch auf die Parameter anderer Router zugegriffen werden kann, hier: auf die Paramter des tour-Router */

const {
  getReview,
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  setTourUserId
} = require('./../controllers/reviewController');
const { protect, restrictTo } = require('./../controllers/authController');

router.use(protect);
// alle nachfolgenden Routes sind protected, d.h. registrierte und eingeloggte User haben Zugriff

router
  .route('/')
  .get(getAllReviews)
  .post(restrictTo('user'), setTourUserId, createReview);

router
  .route('/:id')
  .get(getReview)
  .patch(restrictTo('user', 'admin'), updateReview)
  .delete(restrictTo('user', 'admin'), deleteReview);

module.exports = router;
