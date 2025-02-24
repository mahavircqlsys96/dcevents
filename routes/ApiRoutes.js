var express = require("express");
var router = express.Router();
const helper = require("../helpers/helper");
const middleware = require("../middleware/authmiddleware");
const AuthApis = require("../controllers/ApiController/authCountroller");
// const contentApis = require("../Controllers/ApiController/contentsController");
const contentApis = require("../controllers/ApiController/contentsController");
const eventController = require("../controllers/ApiController/eventController");
const managersController = require("../controllers/ApiController/managersController");

const bookingController = require("../controllers/ApiController/bookingController");
module.exports = (io) => {
  router.post("/encryption", AuthApis.encryption);

  // // >>>>>>>>>>>>>>>>>>>>>>>>>>>> Cms Apis<<<<<<<<<<<<<<<<<<<<<<<<<< //
  router.get("/terms_conditions", contentApis.terms_conditions);
  router.get("/privacy_policy", contentApis.privacy_policy);
  router.get("/about_us", contentApis.about_us);
  router.use(middleware.verifykey);

  router.post("/sign_up", AuthApis.sign_up);
  router.post("/login", AuthApis.login);
  router.post("/social_login", AuthApis.social_login);
  router.post("/forgot_password", AuthApis.forgot_password);

  // // Add Middleware And Apis>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Add Middleware And Apis>>>>>>>>>>>>>>>>>>>>>
  router.use(middleware.verifyUser);

  router.post("/logout", AuthApis.logout);
  router.post("/verify_otp", AuthApis.verify_otp);
  router.post("/resend_otp", AuthApis.resend_otp);
  router.delete("/account_deleted", AuthApis.account_deleted);
  router.post("/edit_profile", AuthApis.edit_profile);
  router.get("/get_profile", AuthApis.get_profile);
  router.post("/change_password", AuthApis.change_password);
  // router.post("/save_loaction", UserApis.save_loaction);
  router.get("/upcoming_event", eventController.upcoming_event);
  router.post("/near_by_event", eventController.near_by_event);
  router.post("/event_details", eventController.event_details);
  router.post("/event_assign_manager", eventController.event_assign_manager);
  router.get(
    "/popular_events_category",
    eventController.popular_events_category
  );
  router.post(
    "/popular_events_by_category",
    eventController.popular_events_by_category
  );

  router.post("/add_cart", bookingController.add_cart);
  router.get("/my_cart_list", bookingController.my_cart_list);

  router.post("/delete_cart", bookingController.delete_cart);
  router.post("/delete_cart_product", bookingController.delete_cart_product);
  router.post("/edit_cart", bookingController.edit_cart);
  router.post("/ticket_qty_update", bookingController.ticket_qty_update);
  router.post("/product_qty_update", bookingController.product_qty_update);
  router.post("/payment_api", bookingController.payment_api);
  router.post("/stripe_status_update",bookingController.stripe_status_update);
  router.post("/order_history",bookingController.order_history);
  router.get("/booking_details",bookingController.booking_details);

  router.get(
    "/upcoming_event_vendor",
    managersController.upcoming_event_vendor
  );
  router.post("/near_by_event_vendor", managersController.near_by_event_vendor);
  router.post("/event_details_vendor", managersController.event_details_vendor);
  router.post(
    "/event_assign_manager_vendor",
    managersController.event_assign_manager_vendor
  );

  return router;
};
