const helper = require("../../helpers/helper");
var CryptoJS = require("crypto-js");
const ENV = process.env;
const { Op, fn, col } = require("sequelize");
const sequelize = require("sequelize");
var moment = require("moment");
const {
  users,
  categories,
  events_categories,
  products,
  bookings,
} = require("../../models");

module.exports = {
  login_page: async (req, res) => {
    try {
      res.render("Admin/auth/login", { layout: false });
    } catch (error) {
      console.log(error);

      // res.redirect('/errorPage')
    }
  },
  errorPage: async (req, res) => {
    try {
      res.render("Admin/error_page", { layout: false });
    } catch (error) {
      console.log(error, "Print error here");
      res.redirect("/errorPage");
    }
  },
  login: async (req, res) => {
    try {
      const find_data = await users.findOne({
        where: {
          email: req.body.user_name,
          role: "0",
        },
      });

      if (find_data == null) {
        req.flash("error", "Please enter valid email");
        res.redirect("/login");
      } else {
        // Decrypt

        var bytes = CryptoJS.AES.decrypt(find_data.password, ENV.crypto_key);
        let decryptedString = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

        if (!decryptedString) {
          throw new Error("Decryption failed or returned empty string");
        }
        decryptedString = decryptedString.trim();
        let providedPassword = req.body.password.trim();
        let check_password = decryptedString == providedPassword;

        if (check_password == true) {
          req.session.admin = find_data;

          req.flash("success", "You are login successfully");
          res.redirect("/dashboard");
        } else {
          req.flash("error", "Please enter valid  password");
          res.redirect("/login");
        }
      }
    } catch (error) {
      console.log(error, "Print error here");
      // res.redirect('/errorPage')
    }
  },

  dashboard: async (req, res) => {
    try {
      let session = req.session.admin;
      const vendor_count = await users.count({
        where: { role: "1" },
      });
      const users_count = await users.count({
        where: { role: "2" },
      });
      const managers_count = await users.count({
        where: { role: "3" },
      });
      const categories_count = await categories.count();
      const events_category = await events_categories.count();
      const product_count = await products.count();
      const booking_count = await bookings.count();

      res.render("Admin/dashboard", {
        session,
        vendor_count,
        managers_count,
        users_count,
        categories_count,
        events_category,
        product_count,
        booking_count,
        title: "Dashboard",
      });
    } catch (error) {
      //   return helper.error(res, error)
      console.log(error, "Print error here");
      res.redirect("/admin/errorPage");
    }
  },

  profile: async (req, res) => {
    try {
      let session = req.session.admin;

      const profile = await users.findOne({
        where: {
          email: req.session.admin.email,
        },
        raw: true,
        nest: true,
      });

      res.render("Admin/profile", { profile, session, title: "Profile" });
    } catch (error) {
      //   return helper.error(res, error)
      console.log(error, "Print error here");
      // res.redirect('/errorPage')
    }
  },
  edit_profile: async (req, res) => {
    try {
      let folder = "users";
      if (req.files && req.files.image) {
        let images = await helper.fileUpload(req.files.image, folder);
        req.body.image = images;
      }
      req.body.first_name = req.body.name;
      const profile = await users.update(req.body, {
        where: {
          id: req.session.admin.id,
        },
      });

      const find_data = await users.findOne({
        where: {
          id: req.session.admin.id,
        },
      });

      req.session.admin = find_data;
      res.redirect("/profile");
    } catch (error) {
      console.log(error, "Print error here");
      res.redirect("/errorPage");
    }
  },
  change_password: async (req, res) => {
    try {
      let session = req.session.admin;
      let findAdmin = await users.findOne({
        where: {
          id: session.id,
        },
      });
      let Encrypt_data = findAdmin.password;
      // Decrypt
      var bytes = CryptoJS.AES.decrypt(Encrypt_data, ENV.crypto_key);
      var Decrypt_data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      let check_old = Decrypt_data === req.body.old_password;
      // Encrypt
      var data = req.body.new_password;
      var Newpassword = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        ENV.crypto_key
      ).toString();
      if (check_old == true) {
        let update_password = await users.update(
          { password: Newpassword },
          {
            where: {
              id: session.id,
            },
          }
        );
        req.flash("success", "Update password succesfully");
        res.redirect("/login");
      } else {
        req.flash("error", "Please enter valid old password");
        res.redirect("/changepasswordpage");
      }
    } catch (error) {
      //   return helper.error(res, error)
      console.log(error, "Print error here");
      res.redirect("/errorPage");
    }
  },
  logout: async (req, res) => {
    try {
      delete req.session.admin;
      req.flash("success", "Logout succesfully");
      res.redirect("/login");
    } catch (error) {
      //   return helper.error(res, error)
      console.log(error, "Print error here");
      res.redirect("/errorPage");
    }
  },
};
