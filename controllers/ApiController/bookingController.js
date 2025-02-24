const envfile = process.env;
let CryptoJS = require("crypto-js");
const crypto = require("crypto");
const helper = require("../../helpers/helper");
const { Validator } = require("node-input-validator");
const sequelize = require("sequelize");
const Op = sequelize.Op;
const stripe = require("stripe")(envfile.secret_key);
const publish_key = envfile.publish_key;
const secret_key = envfile.secret_key;
let jwt = require("jsonwebtoken");
const { req } = require("express");
const {
  bookings,
  booking_tickets,
  booking_products,
  users,
  events,
  transactions,
  event_images,
  event_tickets,
  event_products,
  products,
  categories,
  events_categories,
} = require("../../models");
var moment = require("moment");
const currentDate = moment().format("DD-MM-YYYY"); // For date in DD-MM-YYYY format
const currentTime = moment().format("HH:mm:ss"); // For time in HH:mm:ss format

const currentdate_time = moment().format("YYYY-MM-DD HH:mm:ss");
var deletedTime = sequelize.literal("CURRENT_TIMESTAMP");

bookings.belongsTo(events, {
  foreignKey: "event_id",
  as: "eventsName",
});
bookings.hasMany(booking_products, {
  foreignKey: "booking_id",
  as: "products",
});
bookings.hasMany(booking_tickets, {
  foreignKey: "booking_id",
  as: "tickets",
});
booking_products.belongsTo(products, {
  foreignKey: "product_id",
  as: "productNames",
});

module.exports = {
  add_cart: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        event_id: "required",
      });

      let errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) {
        return helper.failed(res, errorsResponse);
      }

      let findEvent = await events.findByPk(req.body.event_id, {
        raw: true,
        nest: true,
      });

      if (!findEvent) {
        return helper.failed(res, "Event not found");
      }

      let existingCart = await bookings.findOne({
        where: {
          date: {
            [Op.gte]: currentdate_time, // Ensure the date is in the future or today
          },
          user_id: req.auth.id,
          booking_type: "0", // Cart type
        },
        raw: true,
        nest: true,
      });

      if (existingCart) {
        return helper.failed(
          res,
          "You already have an active cart for this event. Please complete the payment or delete the existing cart."
        );
      }

      let findEventTickets = await event_tickets.findAll({
        where: { event_id: req.body.event_id },
        raw: true,
        nest: true,
      });

      let noOfTickets = JSON.parse(req.body.no_of_tickets);
      let productsdata = JSON.parse(req.body.products);

      let add_booking = await bookings.create({
        event_id: req.body.event_id,
        user_id: req.auth.id,
        vender_id: findEvent.vender_id,
        booking_type: "0", // Cart
        date: findEvent.utc_date_time,
        price: 2,
      });

      for (let ticket of noOfTickets) {
        let eventTicket = findEventTickets.find(
          (et) => et.type === ticket.type
        );
        if (eventTicket) {
          await booking_tickets.create({
            booking_id: add_booking.id,
            ticket_id: eventTicket.id, // Assuming you want to use the ticket's ID from eventTicket
            type: ticket.type,
            quantity: ticket.qty,
            price: eventTicket.amount,
            amount: eventTicket.amount * ticket.qty,
            event_id: req.body.event_id.trim(),
            user_id: req.auth.id,
          });
        }
      }

      for (const product of productsdata) {
        const foundProduct = await products.findOne({
          where: {
            id: product.product_id,
          },
          raw: true,
        });

        await booking_products.create({
          booking_id: add_booking.id,
          product_id: product.product_id,
          price: foundProduct.price,
          quantity: product.qty,
          amount: product.qty * foundProduct.price,
        });
      }

      return helper.success(
        res,
        "Event booking added successfully",
        add_booking
      );
    } catch (error) {
      console.error(error);
      return helper.failed(res, error.message);
    }
  },
  my_cart_list: async (req, res) => {
    try {
      let my_carts = await bookings.findAll({
        include: [
          {
            model: events,
            as: "eventsName",
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
            ],
          },

          {
            model: booking_tickets,
            as: "tickets",
            attributes: {
              include: [
                [
                  sequelize.literal(
                    `(SELECT no_of_tickets FROM event_tickets WHERE event_tickets.id = tickets.ticket_id AND event_tickets.event_id = eventsName.id)`
                  ),
                  "totalTicket",
                ],
              ],
            },
          },

          {
            model: booking_products,
            as: "products",
            attributes: {
              include: [
                // Fetch total quantity of the product from event_products
                [
                  sequelize.literal(
                    `(SELECT qty FROM event_products WHERE event_products.product_id = products.product_id AND event_products.event_id = eventsName.id)`
                  ),
                  "totalQty",
                ],
              ],
            },

            include: [
              {
                model: products,
                as: "productNames",
              },
            ],
          },
        ],
        where: {
          date: {
            [Op.gte]: currentdate_time, // Use the correctly formatted date
          },
          user_id: req.auth.id,
          booking_type:1
        },
      });

      return helper.success(res, "My cart get successfully", my_carts);
    } catch (error) {
      console.error(error);
      return helper.failed(res, error.message);
    }
  },

  delete_cart: async (req, res) => {
    try {
      let my_carts_delete = await bookings.destroy({
        where: {
          user_id: req.auth.id,
          id: req.body.cart_id,
        },
      });
      return helper.success(res, "My cart deleted successfully", {});
    } catch (error) {
      console.error(error);
      return helper.failed(res, error.message);
    }
  },
  delete_cart_product: async (req, res) => {
    try {
      let my_carts_product = await booking_products.findByPk(
        req.body.product_id
      );

      if (my_carts_product) {
        await booking_products.destroy({
          where: { id: my_carts_product.id },
        });

        return helper.success(res, "Cart products deleted successfully", {});
      } else {
        return helper.failed(res, "Cart not found");
      }
    } catch (error) {
      console.error(error);
      return helper.failed(res, error.message);
    }
  },

  edit_cart: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        booking_id: "required",
        event_id: "required",
      });

      let errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) {
        return helper.failed(res, errorsResponse);
      }

      let findBooking = await bookings.findByPk(req.body.booking_id);

      if (!findBooking) {
        return helper.failed(res, "Booking not found");
      }

      let findEvent = await events.findByPk(req.body.event_id, {
        raw: true,
        nest: true,
      });

      if (!findEvent) {
        return helper.failed(res, "Event not found");
      }

      let findEventTickets = await event_tickets.findAll({
        where: { event_id: req.body.event_id },
        raw: true,
        nest: true,
      });

      let noOfTickets = JSON.parse(req.body.no_of_tickets);
      let products = JSON.parse(req.body.products);

      // Destroy all associated tickets and products before creating new ones
      await booking_tickets.destroy({
        where: { booking_id: req.body.booking_id },
      });

      await booking_products.destroy({
        where: { booking_id: req.body.booking_id },
      });

      // Recreate booking tickets
      for (let ticket of noOfTickets) {
        let eventTicket = findEventTickets.find(
          (et) => et.type === ticket.type
        );
        if (eventTicket) {
          await booking_tickets.create({
            booking_id: findBooking.id,
            type: ticket.type,
            quantity: ticket.qty,
            amount: eventTicket.amount * ticket.qty,
            event_id: req.body.event_id,
            user_id: req.auth.id,
          });
        }
      }

      // Recreate booking products
      for (let product of products) {
        await booking_products.create({
          booking_id: findBooking.id,
          product_id: product.product_id,
          quantity: product.qty,
        });
      }

      return helper.success(res, "Cart updated successfully", findBooking);
    } catch (error) {
      console.error(error);
      return helper.failed(res, error.message);
    }
  },
  ticket_qty_update: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        ticket_id: "required",
        qty: "required|integer|min:1",
      });

      let errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) {
        return helper.failed(res, errorsResponse);
      }

      let ticket = await booking_tickets.findByPk(req.body.ticket_id);

      if (!ticket) {
        return helper.failed(res, "Ticket not found");
      }

      let newAmount = ticket.price * parseInt(req.body.qty);
      console.log(newAmount, "fffffffffffffffffff");

      let updatedTicket = await booking_tickets.update(
        {
          quantity: req.body.qty,
          amount: newAmount,
        },
        { where: { id: req.body.ticket_id } }
      );
      return helper.success(
        res,
        "Ticket quantity updated successfully",
        updatedTicket
      );
    } catch (error) {
      console.error(error);
      return helper.failed(res, error.message);
    }
  },
  product_qty_update: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        product_id: "required",
        qty: "required|integer|min:1",
      });

      let errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) {
        return helper.failed(res, errorsResponse);
      }

      let product_data = await booking_products.findByPk(req.body.product_id);

      if (!product_data) {
        return helper.failed(res, "Product not found");
      }

      let newAmount = product_data.price * parseInt(req.body.qty);
      let updatedProduct = await booking_products.update(
        {
          quantity: req.body.qty,
          amount: newAmount,
        },
        { where: { id: req.body.product_id } }
      );
      return helper.success(
        res,
        "Product quantity updated successfully",
        updatedProduct
      );
    } catch (error) {
      console.error(error);
      return helper.failed(res, error.message);
    }
  },
  payment_api: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        cart_id: "required",
        amount: "required",
      });
      let errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) {
        return helper.error403(res, errorsResponse);
      }

      const find_admincomission = await users.findOne({
        attributes: [`commission`],
        where: { role: "0" },
        raw: true,
      });

      const find_booking = await bookings.findOne({
        where: { id: req.body.cart_id },
        raw: true,
      });

      req.body.amount = parseFloat(req.body.amount).toFixed(2);
      const Amount = req.body.amount;

      const adminCommison = parseFloat(find_admincomission.commission);
      const adminFees = ((adminCommison / 100) * Amount).toFixed(2);

      const stripe_fee = 0.029;
      const Fixed_Fee = 0.3;
      const stripeVariableFee = Amount * stripe_fee;
      const stripe_total_fee = stripeVariableFee + Fixed_Fee;

      const StripeFee = parseFloat(stripe_total_fee).toFixed(2);

      const adminFeesAfterStripe = adminFees - StripeFee;

      const netAmount = Amount - parseFloat(adminFees);

      let user_details = await users.findOne({
        where: {
          id: req.auth.id,
        },
        raw: true,
      });

      let vender_details = await users.findOne({
        where: {
          id: find_booking.vender_id,
        },
        raw: true,
        nest: true,
      });

      let payment_type = 1;
      let payment = await helper.stripePayment(
        req.body.amount,
        user_details,
        find_booking,
        vender_details,
        payment_type
      );

      if (payment) {
        let paymentResponse = {
          paymentIntent: payment.paymentIntent.client_secret,
          ephemeralKey: payment.ephemeralKey.secret,
          customer: user_details.stripe_id,
          publishableKey: publish_key,
          transactionId: payment.paymentIntent.id,
        };

        let transaction_data = await transactions.create({
          user_id: req.auth.id,
          event_id: find_booking.event_id,
          type: 1, // booking
          booking_id: find_booking.id,
          amount: req.body.amount,
          commission: find_admincomission.commission,
          commission_amount: adminFeesAfterStripe.toFixed(2),
          vender_amount: netAmount,
          settlement_status: 0,
          stripe_charge: StripeFee,
          net_amount: netAmount,
          payment_mode: 0,
          transaction_id: payment.paymentIntent.id,
        });

        return helper.success(res, "Payment process complete Successfully", {
          paymentResponse,
        });
      }
    } catch (error) {
      return helper.error403(res, "Error occurred while processing payment");
    }
  },

  stripe_status_update: async (req, res) => {
    try {
      const findBooking = await transactions.findOne({
        where: {
          transaction_id: req.body.transaction_id,
        },
        raw: true,
      });

      if (findBooking) {
        const job_detatils = await bookings.findOne({
          where: {
            id: findBooking.booking_id,
          },
          raw: true,
          nest: true,
        });

        await transactions.update(
          {
            payment_status: 1, //   1= success 
          },
          {
            where: {
              id: findBooking.id,
            },
          }
        );
      const randomNO = Math.floor(1000000+ Math.random() * 9000);

        await bookings.update(
          {
            random_ticket:randomNO,
            price:findBooking.amount,
            booking_type: "2",
            payment_status: 1, // 1= success
          },
          {
            where: {
              id: findBooking.booking_id,
            },
          }
        );
        const Order_detatils = await bookings.findOne({
          include: [
            {
              model: events,
              as: "eventsName",
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
              ],
            },

            {
              model: booking_tickets,
              as: "tickets",
              attributes: {
                include: [
                  [
                    sequelize.literal(
                      `(SELECT no_of_tickets FROM event_tickets WHERE event_tickets.id = tickets.ticket_id AND event_tickets.event_id = eventsName.id)`
                    ),
                    "totalTicket",
                  ],
                ],
              },
            },

            {
              model: booking_products,
              as: "products",
              attributes: {
                include: [
                  [
                    sequelize.literal(
                      `(SELECT qty FROM event_products WHERE event_products.product_id = products.product_id AND event_products.event_id = eventsName.id)`
                    ),
                    "totalQty",
                  ],
                ],
              },

              include: [
                {
                  model: products,
                  as: "productNames",
                },
              ],
            },
          ],
          where: {
            id: findBooking.booking_id,
          },
          raw: true,
          nest: true,
        });

        return helper.success(res, "Payment successfully done", Order_detatils);
      }
    } catch (error) {
      return helper.error403(res, "Error occurred while processing payment");
    }
  },

  //*********For user side**************** */
  order_history: async (req, res) => {
    try {
      let value = "";
      if (req.body.type == 1) {
        value = [0, 1];
      }
      if (req.body.type == 2) {
        value = [2, 3, 4];
      }
      let page = parseInt(req.query.page) || 1;
      let limit = parseInt(req.query.limit) || 10;
      let offset = (page - 1) * limit;
      let booking_history = await bookings.findAll({
        include: [
          {
            model: events,
            as: "eventsName",
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
            ],
          },

          {
            model: booking_tickets,
            as: "tickets",
            attributes: {
              include: [
                [
                  sequelize.literal(
                    `(SELECT no_of_tickets FROM event_tickets WHERE event_tickets.id = tickets.ticket_id AND event_tickets.event_id = eventsName.id)`
                  ),
                  "totalTicket",
                ],
              ],
            },
          },

          {
            model: booking_products,
            as: "products",
            attributes: {
              include: [
                // Fetch total quantity of the product from event_products
                [
                  sequelize.literal(
                    `(SELECT qty FROM event_products WHERE event_products.product_id = products.product_id AND event_products.event_id = eventsName.id)`
                  ),
                  "totalQty",
                ],
              ],
            },

            include: [
              {
                model: products,
                as: "productNames",
              },
            ],
          },
        ],
        where: {
          // date: {
          //   [Op.gte]: currentdate_time, // Use the correctly formatted date
          // },
          booking_type: "2",
          booking_status: value,
        },
        limit: limit,
        offset: offset,
      });
      const response = {
        totalItems: booking_history.length,
        totalPages: Math.ceil(booking_history.length / limit),
        currentPage: page,
        booking_history: booking_history,
      };
      return helper.success(res, "all booking history successfully", response);
    } catch (error) {
      return helper.failed(res, error.message);
    }
  },

  booking_details: async (req, res) => {
    try {
      const Order_detatils = await bookings.findOne({
        include: [
          {
            model: events,
            as: "eventsName",
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
            ],
          },

          {
            model: booking_tickets,
            as: "tickets",
            attributes: {
              include: [
                [
                  sequelize.literal(
                    `(SELECT no_of_tickets FROM event_tickets WHERE event_tickets.id = tickets.ticket_id AND event_tickets.event_id = eventsName.id)`
                  ),
                  "totalTicket",
                ],
              ],
            },
          },

          {
            model: booking_products,
            as: "products",
            attributes: {
              include: [
                // Fetch total quantity of the product from event_products
                [
                  sequelize.literal(
                    `(SELECT qty FROM event_products WHERE event_products.product_id = products.product_id AND event_products.event_id = eventsName.id)`
                  ),
                  "totalQty",
                ],
              ],
            },

            include: [
              {
                model: products,
                as: "productNames",
              },
            ],
          },
        ],
        where: {
          id: req.query.booking_id,
          booking_type: "2",
        },
     
      });

   

      return helper.success(
        res,
        "Order detatil get successfully",
        Order_detatils
      );
    } catch (error) {
      return helper.failed(res, error.message);
    }
  },
   
  //********** FOR VENDOR SIDE ************* */
  
};
