let db = require("../models");
let sequelize = require("sequelize");
const helper = require("../helpers/helper");
const { Op } = require("sequelize");
const middleware = require("../middleware/authmiddleware");
const {
  users,
  events,
  event_products,
  categories,
  products,
  events_categories,
  event_images,
  event_tickets,
  event_managers,
} = require("../models");
var moment = require("moment");

const currentDate = new Date();
const formattedDate = currentDate.toISOString().split("T")[0]; // Get date in 'YYYY-MM-DD'
const currentTime = currentDate.toTimeString().slice(0, 8); // Get time in 'HH:MM:SS'
module.exports = function (io) {
  io.on("connection", (socket) => {
    socket.on("connect_user", async (data) => {
      try {
        // Authenticate token
        const isValidToken = await middleware.authenticateToken(data.token);

        if (!isValidToken.success) {
          socket.emit("connect_user", {
            status_code: 401,
            message: "Session Expired",
          });
          return;
        }
        let find_socket_id = await users.findOne({
          where: { id: isValidToken.user.id },
          raw: true,
        });

        if (find_socket_id) {
          await users.update(
            { socket_id: socket.id },
            { where: { id: isValidToken.user.id } }
          );
        }
        socket.emit("connect_user", {
          status_code: 200,
          message: "Connected successfully",
          data: {},
        });
      } catch (error) {
        console.error("Error:", error);
        socket.emit("connect_user", {
          status_code: 500,
          message: "An error occurred",
        });
      }
    });

    //   // disconnect///
    // socket.on("disconnect", async () => {
    //   try {
    //     let check_user = await db.sockets.findOne({
    //       where: {
    //         socket_id: socket.id,
    //       },
    //     });

    //     if (check_user) {
    //       await db.sockets.update(
    //         {
    //           online_status: "offline", // Set online_status to 0 when disconnecting
    //         },
    //         {
    //           where: {
    //             id: check_user.id,
    //           },
    //         }
    //       );
    //     }
    //   } catch (error) {
    //     console.error(error);
    //     throw error;
    //   }
    // });

    // socket.on("user_home", async (data) => {
    //   try {
    //     const isValidToken = await middleware.authenticateToken(data.token);

    //     if (!isValidToken.success) {
    //       socket.emit("user_home", {
    //         status_code: 401,
    //         message: "Session Expired" });
    //       return;
    //     }

    //     const userId = isValidToken.user.id;
    //     const currentDate = new Date();
    //     const formattedDate = currentDate.toISOString().split('T')[0]; // Get date in 'YYYY-MM-DD'
    //     const currentTime = currentDate.toTimeString().slice(0, 8); // Get time in 'HH:MM:SS'

    //     const localTimeZone = isValidToken.user.time_zone || 'Asia/Kolkata';
    //     let localDateTime = `${formattedDate} ${currentTime}`;
    //     let utcDateTime = moment.tz(localDateTime, 'YYYY-MM-DD HH:mm', localTimeZone).utc().format();
    //     let upcoming_event = await events.findAll({
    //       where: {
    //         utc_date_time: {
    //           [Op.gte]: utcDateTime,
    //         },
    //       },
    //       limit: 10,
    //     });

    //     let near_by_event = await events.findAll({
    //       include: [
    //         {
    //             model: event_products,
    //             as: "eventProductList",
    //             include: [
    //                 {
    //                     model: products,
    //                     as: "productName",
    //                     include:[
    //                         {model:categories,
    //                             as:"catName"
    //                         }
    //                     ]

    //                 },
    //             ],
    //         },
    //     ],
    //       attributes: {
    //         include: [
    //           [
    //             sequelize.literal(`
    //               3959 * acos(
    //                 cos(radians(${data.latitude})) *
    //                 cos(radians(events.latitude)) *
    //                 cos(radians(${data.longitude}) - radians(events.longitude)) +
    //                 sin(radians(${data.latitude})) *
    //                 sin(radians(events.latitude))
    //               )
    //             `),
    //             "distance"
    //           ],
    //         ],
    //       },
    //       where: {
    //         utc_date_time: {
    //           [Op.gte]: utcDateTime,
    //         },
    //       },
    //       having: sequelize.literal('distance <= 100'),
    //       order: [['distance', 'ASC']],
    //       limit: 10,
    //     });

    //     socket.emit("user_home", {
    //       success_message: "Get home data successfully",
    //       status_code: 200,
    //       data: {
    //         upcoming_event: upcoming_event,
    //         near_by_event:near_by_event,
    //         popular_event:[]
    //       },
    //     });
    //   } catch (error) {
    //     console.error(error);
    //     socket.emit("user_home", {
    //       status_code: 500,
    //       message:error.message || "An error occurred while user home.",
    //     });
    //   }
    // });

    socket.on("user_home", async (data) => {
      try {
        const isValidToken = await middleware.authenticateToken(data.token);

        if (!isValidToken.success) {
          socket.emit("user_home", {
            status_code: 401,
            message: "Session Expired",
          });
          return;
        }

        const userId = isValidToken.user.id;
        const localTimeZone = isValidToken.user.time_zone || "Asia/Kolkata";
        let localDateTime = `${formattedDate} ${currentTime}`;
        let utcDateTime = moment
          .tz(localDateTime, "YYYY-MM-DD HH:mm", localTimeZone)
          .utc()
          .format();

        let upcoming_event = await events.findAll({
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
          limit: 10,
        });

        let near_by_event = await events.findAll({
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
          attributes: {
            include: [
              [
                sequelize.literal(`
                  3959 * acos(
                    cos(radians(${data.latitude})) *
                    cos(radians(events.latitude)) *
                    cos(radians(${data.longitude}) - radians(events.longitude)) +
                    sin(radians(${data.latitude})) *
                    sin(radians(events.latitude))
                  )
                `),
                "distance",
              ],
            ],
          },
          where: {
            utc_date_time: {
              [Op.gte]: utcDateTime,
            },
          },
          having: sequelize.literal("distance <= 100"),
          order: [[sequelize.col("distance"), "ASC"]], // Use sequelize.col to refer to the "distance" alias
          limit: 10,
        });
        let popular_event = await events_categories.findAll({
          where: {
            status: "1",
          },
          order: [["id", "DESC"]],
          limit: 10,
        });

        socket.emit("user_home", {
          success_message: "Get home data successfully",
          status_code: 200,
          data: {
            upcoming_event: upcoming_event,
            near_by_event: near_by_event,
            popular_event: popular_event,
          },
        });
      } catch (error) {
        console.error(error);
        socket.emit("user_home", {
          status_code: 500,
          message:
            error.message || "An error occurred while getting user home data.",
        });
      }
    });

    socket.on("vender_home", async (data) => {
      try {
        const isValidToken = await middleware.authenticateToken(data.token);

        if (!isValidToken.success) {
          socket.emit("user_home", {
            status_code: 401,
            message: "Session Expired",
          });
          return;
        }

        const userId = isValidToken.user.id;
        const localTimeZone = isValidToken.user.time_zone || "Asia/Kolkata";
        let localDateTime = `${formattedDate} ${currentTime}`;
        let utcDateTime = moment
          .tz(localDateTime, "YYYY-MM-DD HH:mm", localTimeZone)
          .utc()
          .format();

        let find_assign_event = await event_managers.findAll({
          where: {
            manager_id: userId,
            date: {
              [Op.gte]: utcDateTime,
            },
          },
          raw: true,
          nest: true,
        });

        let eventIds = find_assign_event.map((e) => e.event_id);
        let upcoming_event = await events.findAll({
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
            id: eventIds,
          },
          limit: 5,
        });
        let popular_event = await events_categories.findAll({
          where: {
            status: "1",
          },
          order: [["id", "DESC"]],
          limit: 10,
        });

        socket.emit("vender_home", {
          success_message: "Get home data successfully",
          status_code: 200,
          data: {
            upcoming_event: upcoming_event,
            popular_event: popular_event,
          },
        });
      } catch (error) {
        console.error(error);
        socket.emit("vender_home", {
          status_code: 500,
          message:
            error.message || "An error occurred while getting user home data.",
        });
      }
    });
  });
};
