const db = require("../../models");
const helper = require("../../helpers/helper");
const ENV = process.env;
const events_categories = db.events_categories;
const title = "Event Category";
var sequelize = require("sequelize");
const fileFolder = "Admin/eventcategories/";
module.exports = {
  event_categories_add: async (req, res) => {
    try {
      let session = req.session.admin;
      res.render(`${fileFolder}add`, { session, title });
    } catch (error) {
      res.redirect("/errorPage");
    }
  },

  event_categories_save: async (req, res) => {
    try {
      const hashId = helper.generateHash();

      req.body.hash_id = hashId;
      const createquestions = await events_categories.create(req.body);
      req.flash("success", "Event Category add successfully");
      res.redirect("/event_categories_list");
    } catch (error) {
      console.log(error, ">>>>>>>>>");
      res.redirect("/errorPage");
    }
  },
  event_categories_list: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const currentPage = parseInt(req.query.page) || 1;
      const offset = (currentPage - 1) * limit;

      const {
        rows: find_categories,
        count: totalcat,
      } = await events_categories.findAndCountAll({
        order: [["id", "DESC"]],
        offset: offset,
        limit: limit,
        raw: true,
      });

      const totalPages = Math.ceil(totalcat / limit);
      let session = req.session.admin;
      res.render(`${fileFolder}list`, {
        session,
        title,
        find_categories,
        currentPage,
        totalPages,
        limit,
      });
    } catch (error) {
      console.log(error, ">>>>>>>>");
      // res.redirect('/errorPage')
    }
  },
  event_categories_view: async (req, res) => {
    try {
      let session = req.session.admin;
      const eventcateview = await events_categories.findOne({
        where: {
          hash_id: req.params.id,
        },
        raw: true,
        nest: true,
      });
      console.log(
        eventcateview,
        "eventcatevieweventcatevieweventcatevieweventcatevieweventcateview"
      );

      res.render(`${fileFolder}view.ejs`, { eventcateview, session, title });
    } catch (error) {
      res.redirect('/errorPage')
    }
  },
  event_categories_edit: async (req, res) => {
    try {
      let session = req.session.admin;
      const eventcateview = await events_categories.findOne({
        where: {
          hash_id: req.params.id,
        },raw:true,nest:true,
      });

      res.render(`${fileFolder}edit`, { eventcateview, session, title });
    } catch (error) {       
      res.redirect("/errorPage");
    }
  },
  event_categories_update: async (req, res) => {
    try {
      const upadtequestions = await events_categories.update(req.body, {
        where: {
          id: req.body.id,
        },
      });
      req.flash("success", "Event Category updated successfully");
      res.redirect("/event_categories_list");
    } catch (error) {
      res.redirect("/errorPage");
    }
  },

   event_categories_status: async (req, res) => {
    try {
      const find_status = await events_categories.update(
        { status: req.body.value },
        {
          where: {
            id: req.body.id,
          },
        }
      );
      req.flash("success", "Event Category status updated succesfully");
      res.send(true);
    } catch (error) {
      res.redirect("/errorPage");
    }
  },

  event_categories_deleted: async (req, res) => {
    try {
      // let deletedTime = sequelize.literal('CURRENT_TIMESTAMP')
      const department_delete = await events_categories.destroy({
        where: {
          hash_id: req.params.id,
        },
      });
      req.flash("success", "Event Category deleted successfully");
      res.redirect("/event_categories_list");
    } catch (error) {
      res.redirect("/errorPage");
    }
  },

  all_eventcate_deleted: async (req, res) => {
      try {
        let all_ids = req.query.ids.split(",");
        // let deletedTime = sequelize.literal("CURRENT_TIMESTAMP");
        const department_delete = await events_categories.destroy(
          {
            where: {
              hash_id: all_ids,
            },
          }
        );
        req.flash("success", "All event category deleted successfully");
        res.redirect("/event_categories_list");
      } catch (error) {
        res.redirect("/errorPage");
      }
    },

};
