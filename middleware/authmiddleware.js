let jwt = require('jsonwebtoken');
const db = require('../models');
var CryptoJS = require("crypto-js");
const user = db.users;
const envfile = process.env;

module.exports = {

  sessionValidation: async (req, res, next) => {
    try {
      if (!req.session.admin) {
        return res.redirect('/login');
      } else {
        res.locals.vender = req.session.admin
        next();
      }

    } catch (error) {
      return res.redirect('/login');
    }
  },

  verifyUser: async (req, res, next) => {
    try {
      if (!req.headers.authorization) {
        return res.status(401).json({
          success: false,
          status: 401,
          message: ' Authorization Token Missing',
        });
      } else {
        const accessToken = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(accessToken, envfile.crypto_key);

        const data = await user.findOne({
          where: {
            id: decoded.data.id,
            login_time: decoded.data.login_time
          },
          raw: true,
        });
        if (data.id == decoded.data.id) {
          req.auth = data;
        } else {
          return res.status(401).json({
            success: false,
            status: 401,
            message: 'Invalid  Authorization Token ',
          });
        }
      }
    } catch (error) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Invalid  Authorization Token ',
      });
    }
    return next();
  },
  
  verifykey: async (req, res, next) => {
    try {

      if (!req.headers.secretkey && !req.headers.publishkey) {
        return module.exports.error400(res, 'secretkey & publishkey Key not found!');
      }
      var encryptedSkBuffer = req.headers.secretkey
      var encryptedPkBuffer = req.headers.publishkey
      var decryptedSkBuffer = CryptoJS.AES.decrypt(encryptedSkBuffer, envfile.crypto_key);
      const originalskText1 = decryptedSkBuffer.toString(CryptoJS.enc.Utf8);
      var decryptedPkBuffer = CryptoJS.AES.decrypt(encryptedPkBuffer, envfile.crypto_key);
      const originalpkTextr2 = decryptedPkBuffer.toString(CryptoJS.enc.Utf8);

      if (
        originalskText1 !== envfile.SECRETKEY || originalpkTextr2 !== envfile.PUBLISHKEY
      ) {
        return module.exports.error403(res, 'secretkey & publishkey Key not matched!');
      }
      return next();
    } catch (error) {

      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Invalid secretkey & publishkey',
      });
    }
  },

  authenticateToken: async function (req, res) {
    try {
      const token = req;

      const decoded = jwt.verify(token, envfile.crypto_key);

      const userDetails = await user.findOne({
        where: {
          id: decoded.data.id,
          login_time: decoded.data.login_time
        },
        raw: true,
      });

      if (userDetails) {
        return {
          success: true,
          user: userDetails
        };
      } else {
        return {
          success: false,
          user: null
        };
      }

    } catch (error) {
      console.log(error);
      return {
        success: false,
        user: null
      };
    }
  },

}