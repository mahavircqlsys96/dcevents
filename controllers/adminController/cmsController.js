const db = require("../../models");
const helper = require("../../helpers/helper");
const ENV = process.env;
const cms = db.cms;
var sequelize = require("sequelize");
const fileFolder = "Admin/cms/";
var privacy_title = "privacy";
var about_title = "about";
var terms_title = "terms";

module.exports = {
  privacy_policy: async (req, res) => {
    try {
      const privacy_policy = await cms.findOne({
        where: {
          deletedAt: null,
          type: 1,
        },
      });

      let session = req.session.admin;

      res.render(`${fileFolder}privacy_policy`, {
        session,
        title: privacy_title,
        privacy_policy,
      });
    } catch (error) {
      res.redirect("/errorPage");
    }
  },

  AboutUs: async (req, res) => {
    try {
      let session = req.session.admin;
      const aboutus = await cms.findOne({
        where: {
          deletedAt: null,
          type: 2,
        },
      });
 
      res.render(`${fileFolder}about_us`, {
        session,
        title: about_title,
        aboutus,
      });
      
    } catch (error) {
      res.redirect("/errorPage");
    }
  },

  terms: async (req, res) => {
    try {
      let session = req.session.admin;
      const terms = await cms.findOne({
        where: { type: 3, deletedAt: null },
        raw: true,
        nest: true,
      });

      res.render(`${fileFolder}term_condition`, {
        session,
        title: terms_title,
        terms,
      });
    } catch (error) {
      res.redirect("/errorPage");
    }
  },

  privacy_policy_update: async (req, res) => {
    try {
      const upadteprivacy = await cms.update(req.body, {
        where: {
          type: 1,
        },
      });
      req.flash("success", "Update privacy policy succesfully");
      res.redirect(`back`);
    } catch (error) {
      res.redirect("/errorPage");
    }
  },

  AboutUs_update: async (req, res) => {
    try {
      const upadteprivacy = await cms.update(req.body, {
        where: {
          type: 2,
        },
      });
      req.flash("success", "Update about us succesfully");
      res.redirect(`back`);
    } catch (error) {
      res.redirect("/errorPage");
    }
  },

  terms_update: async (req, res) => {
    try {
      const upadteprivacy = await cms.update(req.body, {
        where: {
          type: 3,
        },
      });
      req.flash("success", "Update terms and conditions succesfully");
      res.redirect(`back`);
    } catch (error) {
      res.redirect("/errorPage");
    }
  },
};
