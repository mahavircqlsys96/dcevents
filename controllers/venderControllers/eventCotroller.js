const db = require("../../models");
const helper = require("../../helpers/helper");
var moment = require("moment");
const ENV = process.env;
const events = db.events;
const users = db.users;
const event_images = db.event_images;
const event_tickets = db.event_tickets;
const products = db.products;
const event_products = db.event_products;
const events_categories = db.events_categories;
const categories = db.categories;
const event_managers = db.event_managers;

const title = "Events";
var sequelize = require("sequelize");
const fileFolder = "Vender/events/";
events.hasMany(event_tickets, {
  foreignKey: "event_id",
  as: "ticket_data",
});
events.hasMany(event_images, {
  foreignKey: "event_id",
  as: "event_images",
});
events.hasMany(event_products, {
  foreignKey: "event_id",
  as: "eventProductList",
});
event_products.belongsTo(products, {
  foreignKey: "product_id",
  as: "productName",
});
events.hasMany(event_managers, {
  foreignKey: "event_id",
  as: "eventManagerList",
});
event_managers.belongsTo(users, {
  foreignKey: "manager_id",
  as: "managerName",
});
products.belongsTo(categories, {
  foreignKey: "category_id",
  as: "catName",
});
events.belongsTo(events_categories, {
  foreignKey: "event_category_id",
  as: "eventCatName",
});
events.belongsTo(users, {
  foreignKey: "vender_id",
  as: "venderName",
});

module.exports = {
  events_add: async (req, res) => {
    try {
      let session = req.session.admin;
      let get_events_categories = await events_categories.findAll({
        raw: true,
      });

      res.render(`${fileFolder}add`, { session, title, get_events_categories });
    } catch (error) {
      res.redirect("/errorPage");
    }
  },

  events_save: async (req, res) => {
    try {
      const hashId = helper.generateHash();
      let folder = "events";
      if (req.files && req.files.image) {
        let images = Array.isArray(req.files.image)
          ? req.files.image
          : [req.files.image]; // Handle multiple or single file
        for (let image of images) {
          if (!image || !image.name) {
            throw new Error("Invalid image file or missing file name.");
          }
        }
        let uploadedImages = [];
        for (let image of images) {
          let uploadedImage = await helper.fileUpload(image, folder); // Pass each image separately to fileUpload
          uploadedImages.push(uploadedImage);
        }
        req.body.image = uploadedImages; // Store all uploaded image paths
      }
      let localDateTime = `${req.body.date} ${req.body.time}`;
      const venderTimeZone = req.session.admin.time_zone || "Asia/Calcutta";
      let utcDateTime = moment
        .tz(localDateTime, "YYYY-MM-DD HH:mm", venderTimeZone)
        .utc()
        .format();

      req.body.hash_id = hashId;
      req.body.vender_id = req.session.admin.id;
      req.body.utc_date_time = utcDateTime;

      const createEvent = await events.create(req.body);

      if (req.files && req.files.image) {
        let imagesArray = Array.isArray(req.body.image)
          ? req.body.image
          : [req.body.image];

        for (let image of imagesArray) {
          await event_images.create({
            event_id: createEvent.id,
            image: image,
          });
        }
      }
      let add_tickets = await event_tickets.bulkCreate([
        {
          event_id: createEvent.id,
          type: "0",
          no_of_tickets: req.body.general,
          amount: req.body.general_amount,
        },
        {
          event_id: createEvent.id,
          type: "1",
          no_of_tickets: req.body.vip,
          amount: req.body.vip_amount,
        },
        {
          event_id: createEvent.id,
          type: "2",
          no_of_tickets: req.body.vvip,
          amount: req.body.vvip_amount,
        },
      ]);
      req.flash("success", "Event added successfully");
      res.redirect("/events_list");
    } catch (error) {
      console.error(
        error,
        "Error while adding event@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@:"
      );
      // req.flash('error', 'Error while adding event. Please try again.');
      // res.redirect('/errorPage');
    }
  },
  events_list: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const currentPage = parseInt(req.query.page) || 1;
      const offset = (currentPage - 1) * limit;

      const {
        rows: find_events,
        count: totalcat,
      } = await events.findAndCountAll({
        include: [
          {
            model: event_tickets,
            as: "ticket_data",
          },
          {
            model: events_categories,
            as: "eventCatName",
          },
        ],
        where: {
          vender_id: req.session.admin.id,
          deletedAt: null,
        },
        order: [["id", "DESC"]],
        offset: offset,
        limit: limit,
      });

      const totalPages = Math.ceil(totalcat / limit);
      let session = req.session.admin;
      res.render(`${fileFolder}list`, {
        session,
        title,
        find_events,
        currentPage,
        totalPages,
        limit,
      });
    } catch (error) {
      console.log(error, ">>>>>>>>");
      res.redirect("/errorPage");
    }
  },
  events_view: async (req, res) => {
    try {
      let session = req.session.admin;
      const event_data = await events.findOne({
        include: [
          {
            model: event_tickets,
            as: "ticket_data",
          },
          {
            model: event_images,
            as: "event_images",
          },
        ],
        where: { hash_id: req.params.id },
      });

      if (!event_data) {
        req.flash("error", "Event not found.");
        return res.redirect("/events_list");
      }
      res.render(`${fileFolder}view`, { event_data, title, moment, session });
    } catch (error) {
      console.error(error, "Error fetching event details:");
      req.flash("error", "Error fetching event details.");
      res.redirect("/errorPage");
    }
  },
  events_edit: async (req, res) => {
    try {
      let session = req.session.admin;
      let get_events_categories = await events_categories.findAll({
        raw: true,
      });

      const event_data = await events.findOne({
        include: [
          {
            model: event_tickets,
            as: "ticket_data",
          },
        ],

        where: {
          hash_id: req.params.id,
        },
      });

      res.render(`${fileFolder}edit`, {
        event_data,
        session,
        title,
        get_events_categories,
      });
    } catch (error) {
      res.redirect("/errorPage");
    }
  },
  events_edit_save: async (req, res) => {
    try {
      const eventId = req.body.event_id;
      if (!eventId) {
        req.flash("error", "Invalid event ID");
        return res.redirect("/events_list");
      }

      const existingEvent = await events.findOne({ where: { id: eventId } });
      if (!existingEvent) {
        req.flash("error", "Event not found");
        return res.redirect("/events_list");
      }

      let folder = "events";
      let uploadedImages = [];

      if (req.files && req.files.image) {
        let images = Array.isArray(req.files.image)
          ? req.files.image
          : [req.files.image];
        for (let image of images) {
          if (image && image.name) {
            let uploadedImage = await helper.fileUpload(image, folder);
            uploadedImages.push(uploadedImage);
          }
        }
      }

      req.body.image = uploadedImages;

      let localDateTime = `${req.body.date} ${req.body.time}`;
      const venderTimeZone = req.session.admin.time_zone || "Asia/Calcutta";
      req.body.utc_date_time = moment
        .tz(localDateTime, "YYYY-MM-DD HH:mm", venderTimeZone)
        .utc()
        .format();

      await events.update(req.body, { where: { id: eventId } });

      // Delete old tickets and create new ones
      await event_tickets.destroy({ where: { event_id: eventId } });
      await event_tickets.bulkCreate([
        {
          event_id: eventId,
          type: "0",
          no_of_tickets: req.body.general,
          amount: req.body.general_amount,
        },
        {
          event_id: eventId,
          type: "1",
          no_of_tickets: req.body.vip,
          amount: req.body.vip_amount,
        },
        {
          event_id: eventId,
          type: "2",
          no_of_tickets: req.body.vvip,
          amount: req.body.vvip_amount,
        },
      ]);

      req.flash("success", "Event updated successfully");
      res.redirect("/events_list");
    } catch (error) {
      console.error(error, "Error while updating event:");
      req.flash("error", "Error while updating event. Please try again.");
      res.redirect("/errorPage");
    }
  },
  events_details: async (req, res) => {
    try {
      let session = req.session.admin;

      // Fetch event data with associated event products and product details
      const event_data = await events.findOne({
        include: [
          {
            model: event_products,
            as: "eventProductList",
            include: [
              {
                model: products,
                as: "productName",
                include: [
                  {
                    model: categories,
                    as: "catName",
                  },
                ],
              },
            ],
          },
          {
            model: event_managers,
            as: "eventManagerList",
            include: [
              {
                model: users,
                as: "managerName",
              },
            ],
          },
        ],
        where: { hash_id: req.params.id },
      });

      if (!event_data) {
        req.flash("error", "Event not found.");
        return res.redirect("/events_list");
      }

      // Fetch all products
      const productList = await products.findAll({
        raw: true,
        nest: true,
      });
      const managersList = await users.findAll({
        where: {
          role: "3",
          vender_id: req.session.admin.id,
        },
        raw: true,
        nest: true,
      });

      res.render(`${fileFolder}event_details`, {
        title: "manage_events",
        event_data,
        productList,
        managersList,
        moment,
        session,
      });
    } catch (error) {
      console.error(error, "Error fetching event details:");
      req.flash("error", "Error fetching event details.");
      return res.redirect("/errorPage");
    }
  },

  save_selected_products: async (req, res) => {
    try {
      const productIds = req.body["productIds[]"];
      const productsQty = req.body["productsQty[]"];
      const event_id = req.body.event_id;

      if (!productIds || !event_id || !productsQty) {
        return res
          .status(400)
          .json({ message: "Missing productIds, event_id, or productsQty" });
      }

      if (productIds.length !== productsQty.length) {
        return res
          .status(400)
          .json({
            message: "Product IDs and quantities do not match in length",
          });
      }

      for (let i = 0; i < productIds.length; i++) {
        const productId = productIds[i];
        const quantity = productsQty[i];

        const exists = await event_products.findOne({
          where: {
            event_id: event_id,
            product_id: productId,
          },
        });

        if (!exists) {
          await event_products.create({
            event_id: event_id,
            product_id: productId,
            qty: quantity,
          });
        }
      }

      return res.status(200).json({ message: "Products added successfully!" });
    } catch (error) {
      console.error("Error saving selected products:", error);
      return res.status(500).json({ message: "Error saving products" });
    }
  },

  //     save_selected_products: async (req, res) => {
  //         try {
  // //      'productIds[]': [ '1', '2' ],
  // // [0]   event_id: '2',
  // // [0]   'productsQty[]': [ '786', '7687' ]

  //             const productIds = req.body['productIds[]'];
  //             const productsQty = req.body['productsQty[]'];
  //             const event_id = req.body.event_id;

  //             if (!productIds || !event_id) {
  //                 return res.status(400).json({ message: "Missing productIds or event_id" });
  //             }

  //             for (const productId of productIds) {

  //                 const exists = await event_products.findOne({
  //                     where: {
  //                         event_id: event_id,
  //                         product_id: productId,
  //                     },
  //                 });

  //                 if (!exists) {
  //                     await event_products.create({
  //                         event_id: event_id,
  //                         product_id: productId,
  //                         qty:quantity[i]
  //                     });
  //                 }

  //             }

  //             return res.status(200).json({ message: "Products added successfully!" });
  //         } catch (error) {
  //             console.error("Error saving selected products:", error);
  //             return res.status(500).json({ message: "Error saving products" });
  //         }
  //     },

  save_selected_managers: async (req, res) => {
    try {
      const managerIds = Array.isArray(req.body["managerIds[]"])
        ? req.body["managerIds[]"]
        : [req.body["managerIds[]"]];
      const event_id = req.body.event_id;

      if (!managerIds || !event_id) {
        return res
          .status(400)
          .json({ message: "Missing managerIds or event_id" });
      }

      const event = await events.findOne({ where: { id: event_id } });

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      for (const managerId of managerIds) {
        const exists = await event_managers.findOne({
          where: {
            event_id: event_id,
            manager_id: managerId,
            date: event.utc_date_time,
          },
        });

        if (!exists) {
          await event_managers.create({
            event_id: event_id,
            manager_id: managerId,
            date: event.utc_date_time,
          });
        }
      }

      return res.status(200).json({ message: "Managers added successfully!" });
    } catch (error) {
      console.error("Error saving selected Managers:", error.message || error);
      return res.status(500).json({ message: "Error saving Managers" });
    }
  },

  events_status: async (req, res) => {
    try {
      const find_status = await events.update(
        { status: req.body.value },
        {
          where: {
            id: req.body.id,
          },
        }
      );
      res.send(true);
    } catch (error) {
      console.log(error);
      res.redirect("/errorPage");
    }
  },
  events_deleted: async (req, res) => {
    try {
      let deletedTime = sequelize.literal("CURRENT_TIMESTAMP");
      const department_delete = await events.update(
        { deletedAt: deletedTime },
        {
          where: {
            hash_id: req.params.id,
          },
        }
      );
      req.flash("success", "Event deleted successfully");
      res.redirect("/events_list");
    } catch (error) {
      console.log(error);

      res.redirect("/errorPage");
    }
  },
  product_deleted: async (req, res) => {
    try {
      const deleted = await event_products.destroy({
        where: {
          id: req.params.id,
        },
      });

      if (deleted) {
        return res
          .status(200)
          .json({ success: true, message: "Product deleted successfully" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }
    } catch (error) {
      console.error("Error deleting event product:", error);
      req.flash("error", "An error occurred while deleting the event");
      return res.redirect("/errorPage");
    }
  },

  manager_deleted: async (req, res) => {
    try {
      const deleted = await event_managers.destroy({
        where: {
          id: req.params.id,
        },
      });

      if (deleted) {
        return res
          .status(200)
          .json({ success: true, message: "Manager deleted successfully" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Manager not found" });
      }
    } catch (error) {
      console.error("Error deleting manager:", error);
      return res.redirect("/errorPage");
    }
  },
};
