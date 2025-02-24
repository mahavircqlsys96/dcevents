const db = require("../../models");
var CryptoJS = require("crypto-js");
const moment = require("moment");
const ENV = process.env;
const users = db.users;
const events = db.events;
const event_tickets = db.event_tickets;
const events_categories = db.events_categories;
const event_images = db.event_images;
const title = "Vendor";
var sequelize = require("sequelize");
const helper = require("../../helpers/helper");
const { raw } = require("body-parser");
const fileFolder = "Admin/vendor/";

events.hasMany(event_tickets, {
  foreignKey: "event_id",
  as: "ticket_data_1",
});

events.belongsTo(events_categories, {
  foreignKey: "event_category_id",
  as: "eventCatName_1",
});
events.hasMany(event_images, {
    foreignKey: "event_id",
    as: "event_images_1"
})
module.exports = {
  vendor_add: async (req, res) => {
    try {
      let session = req.session.admin;
      res.render(`${fileFolder}add`, { session, title });
    } catch (error) {
      res.redirect("/errorPage");
    }
  },

  vendor_save: async (req, res) => {
    try {
      let folder = "users";
      if (req.files && req.files.image) {
        let images = await helper.fileUpload(req.files.image, folder);
        req.body.image = images;
      }

      const hashId = helper.generateHash();
      var data = req.body.password;
      var Newpassword = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        ENV.crypto_key
      ).toString();
      (req.body.password = Newpassword), (req.body.role = "1");
      req.body.hash_id = hashId;
      req.body.vender_id = req.session.admin.id;
      const createUser = await users.create(req.body);
      req.flash("success", "vendor added successfully");
      res.redirect("/vendor_list");
    } catch (error) {
      console.log(error);

      res.redirect("/errorPage");
    }
  },

  vendor_list: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const currentPage = parseInt(req.query.page) || 1;
      const offset = (currentPage - 1) * limit;

      const {
        rows: find_users,
        count: totalUsers,
      } = await users.findAndCountAll({
        where: {
          role: "1",
          deletedAt: null,
        },
        order: [["id", "DESC"]],
        offset: offset,
        limit: limit,
        raw: true,
      });

      const totalPages = Math.ceil(totalUsers / limit);
      let session = req.session.admin;
      res.render(`${fileFolder}list`, {
        session,
        title,
        find_users,
        currentPage,
        totalPages,
        limit,
      });
    } catch (error) {
      console.log(error, ">>>>>>>>");
      res.redirect("/errorPage");
    }
  },

  vendor_view: async (req, res) => {
    try {
      let session = req.session.admin;
      const userview = await users.findOne({
        where: {
          hash_id: req.params.id,
        },
        raw: true,
        nest: true,
      });

      res.render(`${fileFolder}view`, { userview, session, title });
    } catch (error) {
      res.redirect("/errorPage");
    }
  },

  vendor_edit: async (req, res) => {
    try {
      let session = req.session.admin;

      let get_departments = await users.findAll({
        where: {
          deletedAt: null,
        },
        raw: true,
        nest: true,
        order: [["id", "DESC"]],
      });

      const user_view = await users.findOne({
        where: {
          hash_id: req.params.id,
        },
        raw: true,
      });

      res.render(`${fileFolder}edit`, {
        user_view,
        get_departments,
        session,
        title,
      });
    } catch (error) {
      res.redirect("/errorPage");
    }
  },

  vendor_update: async (req, res) => {
    try {
      const upadate_profile = await users.update(req.body, {
        where: {
          id: req.body.id,
        },
      });
      res.redirect(`back`);
    } catch (error) {
      res.redirect("/errorPage");
    }
  },
  vendor_status: async (req, res) => {
    try {
      const find_status = await users.update(
        { status: req.body.value },
        {
          where: {
            id: req.body.id,
          },
        }
      );

      console.log(find_status, ">>>>>>");
      res.send(true);
    } catch (error) {
      console.log(error);
      res.redirect("/errorPage");
    }
  },
  vendor_deleted: async (req, res) => {
    try {
      let deletedTime = sequelize.literal("CURRENT_TIMESTAMP");
      const department_delete = await users.update(
        { deletedAt: deletedTime },
        {
          where: {
            hash_id: req.params.id,
          },
        }
      );
      req.flash("success", "This vendor deleted successfully");
      res.redirect("/vendor_list");
    } catch (error) {
      res.redirect("/errorPage");
    }
  },

  all_vendor_deleted: async (req, res) => {
    try {
      let all_ids = req.query.ids.split(",");

      let deletedTime = sequelize.literal("CURRENT_TIMESTAMP");
      const department_delete = await users.update(
        { deletedAt: deletedTime },
        {
          where: {
            hash_id: all_ids,
          },
        }
      );
      req.flash("success", "All vendor deleted successfully");
      res.redirect("/vendor_list");
    } catch (error) {
      res.redirect("/errorPage");
    }
  },

  vendor_event_list: async (req, res) => {
    try {
      const finduser = await users.findOne({
        where: {
          hash_id: req.params.id,
        },
        raw: true,
        nest: true,
      });
      const vender_id = finduser.id;

      const limit = parseInt(req.query.limit) || 10;
      const currentPage = parseInt(req.query.page) || 1;
      const offset = (currentPage - 1) * limit;
      const {
        rows: find_event,
        count: totalUsers,
      } = await events.findAndCountAll({
        include: [
          {
            model: event_tickets,
            as: "ticket_data_1",
          },
          {
            model: events_categories,
            as: "eventCatName_1",
          },
        ],
        where: {
          vender_id: vender_id,
          deletedAt: null,
        },
        order: [["id", "DESC"]],
        offset: offset,
        limit: limit,
      });

      const totalPages = Math.ceil(totalUsers / limit);

      let session = req.session.admin;
      res.render(`${fileFolder}event`, {
        session,
        title,
        moment,
        find_event,
        currentPage,
        totalPages,
        limit,
      });
    } catch (error) {
      res.redirect("/errorPage");
    }
  },

  vendor_event_view: async (req, res) => {
    try {

      const find_event = await events.findOne({
        include: [
          {
            model: event_tickets,
            as: "ticket_data_1",
          },
          {
            model: events_categories,
            as: "eventCatName_1",
          },
          {
            model: event_images,
            as: "event_images_1",
          },
        ],
        where: {
          hash_id: req.params.id,
          deletedAt: null,
        },
      
      });

       const finduser = await users.findOne({
        where: {
          id: find_event.vender_id,
        },
        raw: true,
        nest: true,
      });
      const hash_id = finduser.hash_id;
      let session = req.session.admin;
      res.render(`${fileFolder}eventview`, {
        session,
        title,
        moment,
        hash_id,
        find_event,
      });
    } catch (error) {
      res.redirect("/errorPage");
    }
  },

};
