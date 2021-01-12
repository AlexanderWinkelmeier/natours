const express = require('express');

const router = express.Router();

const {
  getAllUsers,
  createUser,
  getMe,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  uploadUserPhoto,
  resizeUserPhoto
} = require('./../controllers/userController');
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  restrictTo,
  logout
} = require('./../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

router.use(protect);
// die folgenden Routes sind alle protected, d.h. nur registrierte und eingeloggte User haben Zugriff darauf

router.get('/me', getMe, getUser);
router.patch('/updateMyPassword/', updatePassword);
router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe);
router.delete('/deleteMe', deleteMe);

router.use(restrictTo('admin'));
// die folgenden Routes können nur Administratoren bearbeiten und sind zudem protected

router
  .route('/')
  .get(getAllUsers)
  .post(createUser);
router
  .route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router;

// Für alle User-Routes sind protected bzw. restricted
