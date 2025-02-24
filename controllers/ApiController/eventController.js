const envfile = process.env;
let CryptoJS = require("crypto-js");
const crypto = require("crypto");
const helper = require("../../helpers/helper");
const { Validator } = require("node-input-validator");
const sequelize = require("sequelize");
const Op = sequelize.Op;
let jwt = require("jsonwebtoken");
const { req } = require("express");
const {
    users,
    events,
    event_managers,
    event_images,
    event_tickets,
    event_products,
    products,
    categories,
    events_categories,
} = require("../../models");
var deletedTime = sequelize.literal("CURRENT_TIMESTAMP");
var moment = require("moment");
const currentDate = new Date();
const formattedDate = moment().format("YYYY-MM-DD");
const currentTime = moment().format("HH:mm");

const middleware = require("../../middleware/authmiddleware");

module.exports = {
  upcoming_event: async (req, res) => {
    try {
      let userId = 0;
      if (req.headers.authorization) {
        const accessToken = req.headers.authorization.split(" ")[1];
        const isValidToken = await middleware.authenticateToken(accessToken);

        if (!isValidToken.success) {
          return helper.failed(res, "Session Expired");
        }
        userId = isValidToken.user.id;
      }

      const localTimeZone = req.auth?.time_zone || req.query.time_zone; // Default time zone if not provided
      const currentDate = moment().tz(localTimeZone).format("YYYY-MM-DD"); // Format current date
      const currentTime = moment().tz(localTimeZone).format("HH:mm"); // Format current time
      let localDateTime = `${currentDate} ${currentTime}`;
      let utcDateTime = moment
        .tz(localDateTime, "YYYY-MM-DD HH:mm", localTimeZone)
        .utc()
        .format(); // Convert to UTC

      let page = parseInt(req.query.page) || 1;
      let limit = parseInt(req.query.limit) || 10;
      let offset = (page - 1) * limit;

      let upcoming_event = await events.findAndCountAll({
        include: [
          {
            model: users,
            as: "venderName",
            attributes: [
              "id",
              "hash_id",
              "role",
              "bio",
              "user_name",
              "first_name",
              "last_name",
              "vender_id",
              "email",
              "image",
            ],
          },
          {
            model: events_categories,
            as: "eventCatName",
          },
          {
            model: event_images,
            as: "event_images",
          },
          {
            model: event_tickets,
            as: "ticket_data",
          },
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
        ],
        where: {
          utc_date_time: {
            [Op.gte]: utcDateTime,
          },
        },
        limit: limit,
        offset: offset,
      });

      const totalItems = upcoming_event.count;
      const totalPages = Math.ceil(totalItems / limit);
      const response = {
        totalItems,
        totalPages,
        currentPage: page,
        upcoming_event: upcoming_event.rows,
      };

      return helper.success(
        res,
        "Upcoming events retrieved successfully",
        response
      );
    } catch (error) {
      console.error(error);
      return helper.failed(
        res,
        "An error occurred while retrieving upcoming events"
      );
    }
  },

  near_by_event: async (req, res) => {
    try {
      let userId = 0;
      if (req.headers.authorization) {
        const accessToken = req.headers.authorization.split(" ")[1];
        const isValidToken = await middleware.authenticateToken(accessToken);

        if (!isValidToken.success) {
          return helper.failed(res, "Session Expired");
        }
        userId = isValidToken.user.id;
      }

      const localTimeZone = req.auth.time_zone || req.body.time_zone;
      let localDateTime = `${formattedDate} ${currentTime}`;
      let utcDateTime = moment
        .tz(localDateTime, "YYYY-MM-DD HH:mm", localTimeZone)
        .utc()
        .format();

      let page = parseInt(req.query.page) || 1;
      let limit = parseInt(req.query.limit) || 10;
      let offset = (page - 1) * limit;

      let near_by_event = await events.findAll({
        attributes: {
          include: [
            [
              sequelize.literal(`
                    3959 * acos(
                      cos(radians(:latitude)) *
                      cos(radians(events.latitude)) *
                      cos(radians(:longitude) - radians(events.longitude)) +
                      sin(radians(:latitude)) *
                      sin(radians(events.latitude))
                    )
                  `),
              "distance",
            ],
          ],
        },
        include: [
          {
            model: users,
            as: "venderName",
            attributes: [
              "id",
              "hash_id",
              "role",
              `bio`,
              "user_name",
              "first_name",
              "last_name",
              "vender_id",
              "email",
              "image",
            ],
          },
          {
            model: events_categories,
            as: "eventCatName",
          },
          {
            model: event_images,
            as: "event_images",
          },
          {
            model: event_tickets,
            as: "ticket_data",
          },
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
        ],
        where: {
          utc_date_time: {
            [Op.gte]: utcDateTime,
          },
        },
        having: sequelize.literal("distance <= 100"),
        order: [[sequelize.col("distance"), "ASC"]],
        limit: limit,
        offset: offset,
        replacements: {
          latitude: req.body.latitude,
          longitude: req.body.longitude,
        },
      });

      const totalItems = near_by_event.length;
      const totalPages = Math.ceil(totalItems / limit);
      const response = {
        totalItems: totalItems,
        totalPages: totalPages,
        currentPage: page,
        near_by_event: near_by_event,
      };

      return helper.success(res, "data", response);
    } catch (error) {
      console.error(error);
      return helper.failed(res, error);
    }
  },
  event_details: async (req, res) => {
    try {
      let userId = 0;
      if (req.headers.authorization) {
        const accessToken = req.headers.authorization.split(" ")[1];
        const isValidToken = await middleware.authenticateToken(accessToken);

        if (!isValidToken.success) {
          return helper.failed(res, "Session Expired");
        }
        userId = isValidToken.user.id;
      }

      const v = new Validator(req.body, {
        event_id: "required",
      });
      let errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) {
        return helper.failed(res, errorsResponse);
      }
      let event_data = await events.findOne({
        include: [
          {
            model: users,
            as: "venderName",
            attributes: [
              "id",
              "hash_id",
              "role",
              `bio`,
              "user_name",
              "first_name",
              "last_name",
              "vender_id",
              "email",
              "image",
            ],
          },
          {
            model: events_categories,
            as: "eventCatName",
          },
          {
            model: event_images,
            as: "event_images",
          },
          {
            model: event_tickets,
            as: "ticket_data",
          },
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
        ],
        where: {
          id: req.body.event_id,
        },
      });

      return helper.success(res, "Get event detils successfully", event_data);
    } catch (error) {
      console.error(error);
      return helper.failed(res, error);
    }
  },
  event_assign_manager: async (req, res) => {
    try {
      const localTimeZone = req.auth.time_zone || "Asia/Kolkata";
      let date = req.body.date;
      const currentTime = moment().tz(localTimeZone).format("HH:mm");

      let localDateTime = `${date} ${currentTime}`;

      let utcDateTime = moment
        .tz(localDateTime, "YYYY-MM-DD HH:mm", localTimeZone)
        .utc()
        .format();

      let page = parseInt(req.query.page) || 1;
      let limit = parseInt(req.query.limit) || 10;
      let offset = (page - 1) * limit;

      let find_assign_event = await event_managers.findAll({
        where: {
          manager_id: req.auth.id,
          date: {
            [Op.gte]: utcDateTime,
          },
        },
        raw: true,
        nest: true,
      });

      let eventIds = find_assign_event.map((e) => e.event_id);
      let events_list = await events.findAll({
        include: [
          {
            model: users,
            as: "venderName",
            attributes: [
              "id",
              "hash_id",
              "role",
              "bio",
              "user_name",
              "first_name",
              "last_name",
              "vender_id",
              "email",
              "image",
            ],
          },
          {
            model: events_categories,
            as: "eventCatName",
          },
          {
            model: event_images,
            as: "event_images",
          },
          {
            model: event_tickets,
            as: "ticket_data",
          },
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
        ],
        where: {
          id: eventIds,
        },
        limit: limit,
        offset: offset,
      });
      let totalItems = await events.count({
        where: {
          id: eventIds,
        },
      });
      const response = {
        totalItems: totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        events_list: events_list,
      };

      return helper.success(res, "Events retrieved successfully", response);
    } catch (error) {
      console.log(error);
      return helper.failed(res, error);
    }
  },

  popular_events_category: async (req, res) => {
    try {
      let userId = 0;
      if (req.headers.authorization) {
        const accessToken = req.headers.authorization.split(" ")[1];
        const isValidToken = await middleware.authenticateToken(accessToken);

        if (!isValidToken.success) {
          return helper.failed(res, "Session Expired");
        }
        userId = isValidToken.user.id;
      }
      let events_category = await events_categories.findAll({
        where: {
          status: "1",
        },
        order: [["id", "DESC"]],
      });

      return helper.success(
        res,
        "Events categories retrieved successfully",
        events_category
      );
    } catch (error) {
      console.error(error);
      return helper.failed(
        res,
        "An error occurred while retrieving upcoming events"
      );
    }
  },

  popular_events_by_category: async (req, res) => {
    try {
      const v = new Validator(req.body, {
              event_category_id: "required",
            });
      
            let errorsResponse = await helper.checkValidation(v);
            if (errorsResponse) {
              return helper.failed(res, errorsResponse);
            }
      let userId = 0;
      if (req.headers.authorization) {
        const accessToken = req.headers.authorization.split(" ")[1];
        const isValidToken = await middleware.authenticateToken(accessToken);

        if (!isValidToken.success) {
          return helper.failed(res, "Session Expired");
        }
        userId = isValidToken.user.id;
      }

      const localTimeZone = req.auth?.time_zone || req.query.time_zone; // Default time zone if not provided
      const currentDate = moment().tz(localTimeZone).format("YYYY-MM-DD"); // Format current date
      const currentTime = moment().tz(localTimeZone).format("HH:mm"); // Format current time
      let localDateTime = `${currentDate} ${currentTime}`;
      let utcDateTime = moment
        .tz(localDateTime, "YYYY-MM-DD HH:mm", localTimeZone)
        .utc()
        .format(); // Convert to UTC

      let page = parseInt(req.query.page) || 1;
      let limit = parseInt(req.query.limit) || 10;
      let offset = (page - 1) * limit;

      let event_data = await events.findAndCountAll({
        include: [
          {
            model: users,
            as: "venderName",
            attributes: [
              "id",
              "hash_id",
              "role",
              "bio",
              "user_name",
              "first_name",
              "last_name",
              "vender_id",
              "email",
              "image",
            ],
          },
          {
            model: events_categories,
            as: "eventCatName",
          },
          {
            model: event_images,
            as: "event_images",
          },
          {
            model: event_tickets,
            as: "ticket_data",
          },
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
        ],
        where: {
          utc_date_time: {
            [Op.gte]: utcDateTime,
          },
          event_category_id: req.body.event_category_id,
        },
        limit: limit,
        offset: offset,
      });

      const totalItems = event_data.count;
      const totalPages = Math.ceil(totalItems / limit);
      const response = {
        totalItems,
        totalPages,
        currentPage: page,
        event_data: event_data.rows,
      };

      return helper.success(res, "Events retrieved successfully", response);
    } catch (error) {
      console.error(error);
      return helper.failed(
        res,
        "An error occurred while retrieving upcoming events"
      );
    }
  },
};
