var express = require('express');
var router = express.Router();
const sessionValidation = require('../middleware/authmiddleware').sessionValidation

const authController=require('../controllers/adminController/authController');
const vendorController = require("../controllers/adminController/vendorController");
const eventController = require('../controllers/adminController/eventControllers');
const eventcateController = require("../controllers/adminController/eventcateController");
const CmsControler = require('../controllers/adminController/cmsController');
// /* GET users listing. */
// router.get('/', function(req, res, next) {
//   res.send('respond with a resource');
// });

router.get('/login',authController.login_page)
router.post('/login',authController.login)

router.get('/errorPage', authController.errorPage)
router.use(sessionValidation)
router.get('/dashboard',authController.dashboard)
router.get('/profile', authController.profile)
router.post('/edit_profile', authController.edit_profile)
router.post('/change_password', authController.change_password)
router.get('/logout', authController.logout)

////Vendor/////
router.get('/vendor_list',vendorController.vendor_list)
router.get('/vendor_add',vendorController.vendor_add)
router.post('/vendor_save',vendorController.vendor_save)
router.get('/vendor_view/:id',vendorController.vendor_view)
router.get('/vendor_edit/:id',vendorController.vendor_edit)
router.post('/vendor_update',vendorController.vendor_update)
router.get('/vendor_deleted/:id',vendorController.vendor_deleted);
router.get('/all_vendor_deleted',vendorController.all_vendor_deleted);
router.get('/vendor_event_list/:id',vendorController.vendor_event_list);
router.get('/vendor_event_view/:id',vendorController.vendor_event_view);

///Event Category///
router.get('/event_categories_add',eventcateController.event_categories_add);
router.post('/event_categories_save',eventcateController.event_categories_save);
router.get('/event_categories_list',eventcateController.event_categories_list);
router.get('/event_categories_view/:id',eventcateController.event_categories_view);
router.get('/event_categories_edit/:id',eventcateController.event_categories_edit);
router.post('/event_categories_update',eventcateController.event_categories_update);
router.get('/event_categories_deleted/:id',eventcateController.event_categories_deleted);
router.get('/all_eventcate_deleted',eventcateController.all_eventcate_deleted);
router.post('/event_categories_status',eventcateController.event_categories_status);

// CMS // 
router.get('/privacy_policy', CmsControler.privacy_policy)
router.get('/about-us', CmsControler.AboutUs)
router.get('/terms-conditions', CmsControler.terms)
router.post('/privacy_policy',CmsControler.privacy_policy_update)
router.post('/aboutus', CmsControler.AboutUs_update)
router.post('/terms', CmsControler.terms_update)
 
/// Events ///
router.get('/event_listing',eventController.event_listing);
router.get('/event_view/:id',eventController.event_view);






module.exports = router;
