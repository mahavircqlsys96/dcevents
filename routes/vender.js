var express = require('express');
var router = express.Router();
const AuthControler=require('../controllers/venderControllers/authController')
const contentController=require('../controllers/venderControllers/contentController')
const categoryController=require('../controllers/venderControllers/categoryCotroller')
const eventCotroller=require('../controllers/venderControllers/eventCotroller')
const managerController=require('../controllers/venderControllers/managerController')
const productController=require('../controllers/venderControllers/productCotroller')
const notificationController=require('../controllers/venderControllers/notificationController');
const authController = require('../controllers/venderControllers/authController');
const sessionValidation = require('../middleware/authmiddleware').sessionValidation

router.get('/login', AuthControler.loginPage)
router.get('/errorPage', AuthControler.errorPage)
router.post('/login', AuthControler.login)
router.get('/sign_up1',authController.sign_up1)
router.post('/sign_up1_save',authController.sign_up1_save)
router.use(sessionValidation)
router.get('/sign_up2',authController.sign_up2)
router.post('/sign_up2_save',authController.sign_up2_save)
router.get('/sign_up3',authController.sign_up3)
router.post('/sign_up3_save',authController.sign_up3_save)
router.get('/add_product',authController.add_product)
router.get('/add_new_product',authController.add_new_product)
router.post('/product_save',authController.product_save)
router.get('/dashboard', AuthControler.dashboard)
router.get('/profile', AuthControler.profile)
router.post('/edit_profile', AuthControler.edit_profile)
router.post('/change_password', AuthControler.change_password)
router.get('/logout', AuthControler.logout)
router.get('/content',contentController.content)
router.post('/content_update',contentController.content_update)

////users/////
router.get('/manager_list',managerController.manager_list)
router.get('/manager_add',managerController.manager_add)
router.post('/manager_save',managerController.manager_save)
router.get('/manager_view/:id',managerController.manager_view)
router.get('/manager_edit/:id',managerController.manager_edit)
router.post('/manager_update',managerController.manager_update)
router.get('/manager_deleted/:id',managerController.manager_deleted)

/////categories//
router.get('/categories_add',categoryController.categories_add)
router.post('/categories_save',categoryController.categories_save)
router.get('/categories_list',categoryController.categories_list)
router.get('/categories_edit/:id',categoryController.categories_edit)
router.post('/categories_update',categoryController.categories_update)
router.get('/categories_deleted/:id',categoryController.categories_deleted)

/////events//
router.get('/events_add',eventCotroller.events_add)
router.post('/events_save',eventCotroller.events_save)
router.get('/events_list',eventCotroller.events_list)
router.get('/events_edit/:id',eventCotroller.events_edit)
router.get('/events_view/:id',eventCotroller.events_view)
router.post('/events_edit_save',eventCotroller.events_edit_save)
router.get('/events_deleted/:id',eventCotroller.events_deleted)
router.get('/events_details/:id',eventCotroller.events_details)
router.post('/save_selected_products',eventCotroller.save_selected_products)
router.post('/save_selected_managers',eventCotroller.save_selected_managers)
router.delete('/manager_deleted/:id',eventCotroller.manager_deleted)
router.delete('/product_deleted/:id',eventCotroller.product_deleted)


////Products////
router.get('/product_list',productController.product_list)
router.get('/product_add',productController.product_add)
router.post('/product_add_save',productController.product_add_save)
router.get('/product_edit/:id',productController.product_edit)
router.post('/product_update',productController.product_update)
router.get('/product_deleted/:id',productController.product_deleted)
router.post('/sub_cat_list',productController.sub_cat_list)

///noifications//////
router.get('/notification_list',notificationController.notification_list)




module.exports = router;
