const path = require('path');
var uuid = require('uuid').v4;
const crypto = require('crypto');
let jwt = require('jsonwebtoken');
const envfile = process.env;
const stripe = require("stripe")(
  envfile.secret_key
);
const publish_key = envfile.publish_key
const secret_key = envfile.secret_key
const { users, categories, products } = require("../models");
module.exports = {
  fileUpload: async (file, folder) => {
    try {
        if (!file || !file.name) {
            throw new Error("Invalid file or missing file name.");
        }

        const extension = path.extname(file.name);
        const filename = uuid() + extension;
        const destinationPath = path.join(process.cwd(), `/public/images/${folder}/`, filename);
        await file.mv(destinationPath);
        return `/images/${folder}/` + filename;

    } catch (error) {
        console.error("File upload error:", error);
        throw error; 
    }
},

  generateHash: () => {
    return crypto.randomBytes(Math.ceil(20 / 2))
      .toString('hex')  // convert to hexadecimal format
      .slice(0, 20);    // return the required number of characters
  },

  success: function (res, message, body = {}) {
    return res.status(200).json({
      success: true,
      code: 200,
      message: message,
      body: body,
    });
  },
  failed: function (res, err, body = {}) {
    let code = typeof err === "object" ? (err.code ? err.code : 400) : 400;
    let message =
      typeof err === "object" ? (err.message ? err.message : "") : err;
    res.status(code).json({
      success: false,
      code: code,
      message: message,
      body: body,
    });
  },
  eroro500: function (res, err, body = {}) {
    let code = typeof err === "object" ? (err.code ? err.code : 500) : 500;
    let message =
      typeof err === "object" ? (err.message ? err.message : "") : err;
    res.status(code).json({
      success: false,
      code: code,
      message: message,
      body: body,
    });
  },
  checkValidation: async v => {
    var errorsResponse;
    await v.check().then(function (matched) {
      if (!matched) {
        var valdErrors = v.errors;
        var respErrors = [];
        Object.keys(valdErrors).forEach(function (key) {
          if (valdErrors && valdErrors[key] && valdErrors[key].message) {
            respErrors.push(valdErrors[key].message);
          }
        });
        // errorsResponse = respErrors.join(', ');
        errorsResponse = respErrors.length > 0 ? respErrors[0] : '';
      }
    });
    return errorsResponse;
  },
  unixTimestamp: function () {
    var time = Date.now();
    var n = time / 1000;
    return time = Math.floor(n);
  },
  error403: function (res, err) {
    let code = typeof err === 'object'
      ? err.statusCode ? err.statusCode : err.code ? err.code : 403
      : 403;
    let message = typeof err === 'object' ? err.message : err;
    res.status(code).json({
      success: false,
      message: message,
      code: code,
      body: {},
    });
  },
  error400: function (res, err) {
    let code = typeof err === 'object'
      ? err.statusCode ? err.statusCode : err.code ? err.code : 400
      : 400;
    let message = typeof err === 'object' ? err.message : err;
    res.status(code).json({
      success: false,
      message: message,
      code: code,
      body: {},
    });
  },
    //     STRIPE ALL FLOW DATA //
    create_stripe_connect_url: async function (stripe, getUser, stripeReturnUrl) {
      try {

        
        let account;
        let accountLink;
        let hasAccountId = "0";
        if (!getUser.stripeAccountId) {
  
          account = await stripe.accounts.create({
            country: "US",
            type: "express",
            // id: getUser.id,
            email: getUser?.email,
            capabilities: {
              card_payments: {
                requested: true,
              },
              transfers: {
                requested: true,
              },
            },
          
            business_type: 'individual',
          });
  
          accountLink = await stripe.accountLinks.create({
            account: account?.id,
            refresh_url: stripeReturnUrl,
            return_url: stripeReturnUrl,
            type: "account_onboarding",
          });
  
          hasAccountId = "0";
        } else {
          account = await stripe.accounts.retrieve(getUser?.stripeAccountId);
          if (account?.charges_enabled == false) {
            accountLink = await stripe.accountLinks.create({
              account: account?.id,
              refresh_url: stripeReturnUrl,
              return_url: stripeReturnUrl,
              type: "account_onboarding",
            });
            hasAccountId = "0";
          } else {
            hasAccountId = "1";
          }
        }
        const update_user = await users.update(
          {
            stripeAccountId: account?.id,
            hasAccountId: hasAccountId,
          },
          {
            where: {
              id: getUser.id,
            },
          }
        );
        return accountLink;
      } catch (err) {
        console.log(err, "=====================TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT=================");
        throw err;
      }
    },
  
    stripePayment: async (amounts, user_dtails, booking, account_destinationId,payment_type) => {
      let data = '';
  
      if (payment_type === 1) {
        data = {
          booking_details: booking.id,
          package_id: 0
        };
      } else {
        data = {
          booking_details: 0,
          package_details: booking.id
        };
      }
      const ephemeralKey = await stripe.ephemeralKeys.create(
        {
          customer: user_dtails.stripe_id,
        },
        {
          apiVersion: "2024-12-18.acacia",
          // apiVersion: "2023-10-16",
        }
      );
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amounts * 100),
        currency: "SGD",
        customer: user_dtails.stripe_id,
        automatic_payment_methods: {
          enabled: true,
        },
     
        metadata: {
          data: JSON.stringify(data)
        },
      });
      let obj = {
        ephemeralKey: ephemeralKey,
        paymentIntent: paymentIntent,
      };
  
      console.log("=======obj", obj);
      return obj;
    },
 


}

