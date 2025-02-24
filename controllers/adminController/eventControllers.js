const db = require("../../models");
var CryptoJS = require("crypto-js");
const moment = require("moment");
const ENV = process.env;
const users = db.users;
const events = db.events;
const event_tickets = db.event_tickets;
const events_categories = db.events_categories;
const event_images = db.event_images;
const title = "Events";
var sequelize = require("sequelize");
const helper = require("../../helpers/helper");
const { raw } = require("body-parser");
const fileFolder = "Admin/Event/";

events.hasMany(event_tickets, {
  foreignKey: "event_id",
  as: "ticket_data_2",
});

events.belongsTo(events_categories, {
  foreignKey: "event_category_id",
  as: "eventCatName_2",
});
events.hasMany(event_images, {
    foreignKey: "event_id",
    as: "event_images_2"
})
module.exports = {
 
  event_listing: async (req, res) => {
    try {
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
            as: "ticket_data_2",
          },
          {
            model: events_categories,
            as: "eventCatName_2",
          },
        ],
        where: {
            deletedAt: null,
        },
        order: [["id", "DESC"]],
        offset: offset,
        limit: limit,
      });

      const totalPages = Math.ceil(totalUsers / limit);

      let session = req.session.admin;
      res.render(`${fileFolder}list`, {
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

  event_view: async (req, res) => {
    try {

      const find_event = await events.findOne({
        include: [
          {
            model: event_tickets,
            as: "ticket_data_2",
          },
          {
            model: events_categories,
            as: "eventCatName_2",
          },
          {
            model: event_images,
            as: "event_images_2",
          },
        ],
        where: {
          hash_id: req.params.id,
          deletedAt: null,
        },
      
      });
  
      let session = req.session.admin;
      res.render(`${fileFolder}eventview`, {
        session,
        title,
        moment,
        find_event,
      });
    } catch (error) {
      res.redirect("/errorPage");
    }
  },
};
