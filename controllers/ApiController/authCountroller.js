const envfile = process.env;
let CryptoJS = require("crypto-js");
const crypto = require('crypto');
const helper = require("../../helpers/helper");
const { Validator } = require("node-input-validator");
const sequelize = require("sequelize");
const Op = sequelize.Op;
let jwt = require("jsonwebtoken");
const { req } = require("express");
const { users } = require("../../models");
var deletedTime = sequelize.literal("CURRENT_TIMESTAMP");
const stripe = require("stripe")(
  envfile.secret_key
);
const publish_key = envfile.publish_key
const secret_key = envfile.secret_key
async function otp_email(otp, Username, subject, email) {

  let message = `<!DOCTYPE html>
<html>

<head>
  <title>OTP Verification - Hi-Coach</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
    rel="stylesheet">
  <style>
    body {
      font-family: 'Poppins', sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    .header {
      background-color: #2D9CDB;
      padding: 20px;
      text-align: center;
    }
    .header img {
      width: 150px;
    }
    .content {
      padding: 40px 30px;
      text-align: center;
    }
    .content h1 {
      font-size: 24px;
      color: #333333;
      margin-bottom: 10px;
    }
    .content p {
      font-size: 16px;
      color: #555555;
      margin-bottom: 30px;
    }
    .otp-box {
      display: inline-block;
      background-color: #F0F0F0;
      padding: 15px 30px;
      font-size: 22px;
      color: #333333;
      font-weight: 600;
      letter-spacing: 3px;
      border-radius: 6px;
      margin-bottom: 40px;
    }
    .footer {
      background-color: #2D9CDB;
      padding: 20px;
      text-align: center;
      color: #ffffff;
      font-size: 14px;
    }
  </style>
</head>

<body>
  <div class="container">
    <!-- Email Header -->
    <div class="header">
      <img src="https://app.hicoach.app/app-assets/images/logo.png" alt="Hi-Coach Logo">
    </div>

    <!-- Email Content -->
    <div class="content">
      <h1>Hello, ${Username}!</h1>
      <p>Thank you for using Hi-Coach. Please use the following OTP to complete your verification:</p>
      <div class="otp-box">${otp}</div>
      <p>This OTP is valid for the next 10 minutes. Do not share this OTP with anyone.</p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>&copy; 2024 Hi-Coach. All rights reserved.</p>
    </div>
  </div>
</body>

</html>`;

  await helper.send_email(message, email, subject);
}

module.exports = {
  encryption: async (req, res) => {
    try {
      const v = new Validator(req.headers, {
        secret_key: "required|string",
        publish_key: "required|string",
      });

      let errorsResponse = await helper.checkValidation(v);

      if (errorsResponse) {
        return helper.failed(res, errorsResponse);
      }

      let sk_data = req.headers.secret_key;
      let pk_data = req.headers.publish_key;
      var encryptedSkBuffer = CryptoJS.AES.encrypt(
        sk_data,
        envfile.crypto_key
      ).toString();
      var encryptedPkBuffer = CryptoJS.AES.encrypt(
        pk_data,
        envfile.crypto_key
      ).toString();
      var decryptedSkBuffer = CryptoJS.AES.decrypt(
        encryptedSkBuffer,
        envfile.crypto_key
      );
      var originalskText = decryptedSkBuffer.toString(CryptoJS.enc.Utf8);
      var decryptedPkBuffer = CryptoJS.AES.decrypt(
        encryptedPkBuffer,
        envfile.crypto_key
      );
      var originalpkTextr = decryptedPkBuffer.toString(CryptoJS.enc.Utf8);

      return helper.success(res, "data", {
        encryptedSkBuffer,
        encryptedPkBuffer,
        originalskText,
        originalpkTextr,
      });
    } catch (err) {
      console.log(err, ">>>>>>>>>>");
      // return helper.failed (res, err);
    }
  },
  sign_up: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        email: "required|email",
        password: "required",
        user_name: "required",
        first_name: "required",
        last_name: "required",
        country_name: "required",
        postal_code: "required",
        country_code: "required",
        phone: "required",
        gender: "required|in:1,2,3"

      });
      let errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) {
        return helper.failed(res, errorsResponse);
      }
      const find_user = await users.findOne({
        where: {
          email: req.body.email,
          // role: req.body.role,
        },
      });
      if (find_user) {
        return helper.failed(res, "Email already exist");
      }
      let folder = "users";
      if (req.files && req.files.image) {
        let images = await helper.fileUpload(req.files.image, folder);
        req.body.image = images;
      }
      let password = CryptoJS.AES.encrypt(
        JSON.stringify(req.body.password),
        envfile.crypto_key
      ).toString();
      let time = helper.unixTimestamp();
      const hashId = helper.generateHash();
      req.body.password = password;
      req.body.login_time = time;
      req.body.hash_id = hashId; req.body.role = "2"
      req.body.time_zone=Intl.DateTimeFormat().resolvedOptions().timeZone

      // let otp = Math.floor(1000 + Math.random() * 9000);
      req.body.otp = 1111;
      const signup_user = await users.create(req.body);
      // Generate JWT token
      const token = jwt.sign(
        {
          data: {
            id: signup_user.id,
            login_time: signup_user.login_time,
          },
        },
        envfile.crypto_key
      );
      const customer = await stripe.customers.create({
        email: signup_user.email,
      });

      const stripe_id = customer.id;
      await users.update({
        stripe_id: stripe_id,
      }, {
        where: {
          id: signup_user.id,
        },
      });
      // await otp_email(otp, findUser.email, "One time password for email verification", findUser.email);
      let findUser = await users.findOne({
        where: {
          id: signup_user.id,
        },
        raw: true,
      });

      findUser.token = token;
      return helper.success(res, "User signup successfully", findUser);
    } catch (error) {
      console.log(error,"mm");
      
      return helper.failed(res, error);
    }
  },
  login: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        email: "required|email",
        password: "required",
        role: "required",//2users, 3vender
        device_token: "required|string",
        device_type: "required|integer",
      });

      let errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) {
        return helper.failed(res, errorsResponse);
      }

      let check_user = await users.findOne({
        where: {
          email: req.body.email,
          role: req.body.role,
          deletedAt: null,
        },
      });
      if (!check_user) {
        return helper.failed(res, "Email does not exist", {});
      }

      if (check_user.status == 0) {
        return helper.failed(
          res,
          "Your account has been suspended by the admin. Please contact the admin for assistance."
        );
      }
      var bytes = CryptoJS.AES.decrypt(check_user.password, envfile.crypto_key);
      let Decrypt_data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      let isMatch = Decrypt_data == req.body.password;
      if (isMatch == true) {
        let time = helper.unixTimestamp();
        var updateuser = await users.update(
          {
            device_token: req.body.device_token,
            device_type: req.body.device_type,
            login_time: time,
          },
          {
            where: {
              id: check_user.id,
            },
          }
        );
      } else {
        return helper.failed(res, "Password not matched!");
      }
      if (!check_user.stripe_id) {
        const customer = await stripe.customers.create({
          email: check_user.email,
        });
        const stripe_id = customer.id;
        await users.update({
          stripe_id: stripe_id,
        }, {
          where: {
            id: check_user.id,
          },
        });
      }

      let find_user = await users.findOne({
        where: {
          id: check_user.id,
        },
        raw: true,
        nest: true,
      });
      let token = jwt.sign(
        {
          data: {
            id: find_user.id,
            login_time: find_user.login_time,
          },
        },
        envfile.crypto_key
      );
      find_user.password = undefined;
      find_user.token = token;
      return helper.success(res, "Login successfully.", find_user);
    } catch (err) {
      return helper.failed(res, err);
    }
  },
  logout: async (req, res) => {
    try {
      let time = helper.unixTimestamp();
      const logout = await users.update(
        {
          login_time: time,
          device_token: ""
        },
        {
          where: {
            id: req.auth.id,
          },
        }
      );
      return helper.success(res, "Logout Successfully");
    } catch (error) {
      return helper.failed(res, error);
    }
  },
  account_deleted: async (req, res) => {
    try {
      const find_user = await users.findOne({
        where: {
          id: req.auth.id,

        },
        raw: true,
        nest: true,
      });
      if (find_user) {

        let User = users.update(
          { deletedAt: deletedTime },
          {
            where: {
              id: req.auth.id,
            },
          }
        );
        return helper.success(res, "Account deleted succesfully!");
      } else {
        return helper.failed(res, "Account not found ");
      }
    } catch (error) {
      return helper.failed(res, error);
    }
  },
  edit_profile: async (req, res) => {
    try {

      let folder = "users";
      if (req.files && req.files.image) {
        let images = await helper.fileUpload(req.files.image, folder);
        req.body.image = images;
      }
      const update = await users.update(req.body, {
        where: {
          id: req.auth.id,
        },
        raw: true,
      });
      let updateduser = await users.findOne({
        where: {
          id: req.auth.id,
        },
        raw: true,
        nest: true,
      });
      updateduser.password = undefined;
      return helper.success(res, "Profile Updated Succesfully", updateduser);
    }
    catch (error) {
      return helper.failed(res, error);
    }
  },
  get_profile: async (req, res) => {
    try {
      const profile = await users.findOne({
        where: {
          id: req.auth.id,
        },
      });
      profile.password = undefined;
      return helper.success(res, "User Profile Get Successfully", profile);
    } catch (error) {

      return helper.failed(res, error);
    }
  },
  change_password: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        old_password: "required",
        new_password: "required",
      });

      let errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) {
        return helper.failed(res, errorsResponse);
      }

      const find_User = await users.findOne({
        where: {
          id: req.auth.id,
        },
        raw: true,
        nest: true,
      });
      var User_password = CryptoJS.AES.decrypt(
        find_User.password,
        envfile.crypto_key
      );
      var get_password = User_password.toString(CryptoJS.enc.Utf8);
      var compare = get_password == JSON.stringify(req.body.old_password);
      if (compare == false) {
        return helper.failed(
          res,
          "Old password is wrong! Please enter valid password"
        );
      } else {
        let Password_encrypt = CryptoJS.AES.encrypt(
          JSON.stringify(req.body.new_password),
          envfile.crypto_key
        ).toString();
        const update = await users.update(
          {
            password: Password_encrypt,
          },
          {
            where: {
              id: req.auth.id,
            },
          }
        );
      }
      return helper.success(res, "Password Updated Succesfully !");
    } catch (error) {
      return helper.failed(res, error);
    }
  },
  forgot_password: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        email: "required",
      });
      let errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) {
        return helper.failed(res, errorsResponse);
      }

      const find_email = await users.findOne({
        where: {
          email: req.body.email,
        },
        raw: true,
      });

      if (find_email == null) {
        return helper.error403(res, "This email is not registered");
      } else {

        let token = crypto.createHash('sha256').update(find_email.email + Date.now()).digest('hex');
        const update = await users.update(
          {
            hash_token: token,
          },
          {
            where: {
              email: find_email.email,
            },
          }
        );

        let getUrl = `${req.protocol}://${req.get("host")}/admin/reset_password?token=${token}`;

        let forgot_password_html = getUrl;

        // let mail = {
        //   from: "hello@hicoach.app",
        //   to: req.body.email,
        //   subject: "Hi-Coach | Hi-Coach Password Link",
        //   html: forgot_password_html,
        // };

        // helper.send_email_forgot(mail, forgot_password_html);

        return helper.success(res, "Email Sent Successfully", {
          url: getUrl,
        });
      }
    } catch (error) {
      console.log(error);
    }
  },
  social_login: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        social_id: "required|string",
        social_type: "required",
      });
      let errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) {
        return helper.failed(res, errorsResponse);
      }
      let find_user = await users.findOne({
        where: {
          social_id: req.body.social_id,
          social_type: req.body.social_type,
        },
        raw: true,
        nest: true,
      });
      const time = helper.unixTimestamp();
      if (find_user) {
        let updateUser = await users.update(req.body, {
          where: { id: find_user.id },
        });
        let getUsers = await users.findOne({
          where: { id: find_user.id },
          raw: true,
          nest: true,
        });
        const token = jwt.sign(
          {
            id: getUsers.id,
            login_time: time,
          },
          envfile.crypto_key
        );
        getUsers.token = token;
        getUsers.token = token;
        return helper.success(res, "User Logged In successfully ", getUsers);
      } else {
        let userCreate = await users.create({
          login_time: time,
          social_id: req.body.social_id,
          social_type: req.body.social_type,
          role: req.body.role,
        });
        let getUsers = await users.findOne({
          where: { id: userCreate.dataValues.id },
          raw: true,
          nest: true,
        });
        const token = jwt.sign(
          {
            id: getUsers.id,
            login_time: time,
          },
          envfile.crypto_key
        );
        getUsers.token = token;
        return helper.success(res, "User Logged In successfully ", getUsers);
      }
    } catch (err) {
      return helper.failed(res, err);
    }
  },
  verify_otp: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        otp: "required|integer",
      });
      let errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) {
        return helper.error403(res, errorsResponse);
      }
      let User_data = await users.findOne({
        where: {
          id: req.auth.id,
        },
        raw: true,
      });

      if (req.body.otp == User_data.otp) {
        var otp_random = Math.floor(1000 + Math.random() * 9000);
        var updated = await users.update(
          {
            otp: otp_random,
            otp_verify: "1",
          },
          {
            where: {
              id: req.auth.id,
            },
          }
        );

        // let find_user = await users.findOne({
        //   where: {
        //     id: req.auth.id,
        //   },
        //   raw: true,
        // });

        return helper.success(res, "Otp verify successfully", {});
      } else {
        return helper.failed(res, " Your OTP is Not Matched !");
      }
    } catch (error) {
      return helper.failed(res, error);
    }
  },
  resend_otp: async (req, res) => {
    try {
      // let otp = Math.floor(1000 + Math.random() * 9000);
      // console.log(otp);
      var otp = 1111
      // var otp = Math.floor(1000 + Math.random() * 9000);
      const sent = await users.update(
        {
          otp: otp,
          otp_verify: "0",
        },
        {
          where: {
            id: req.auth.id,
          },
        }
      );
      const user_find = await users.findOne({
        where: {
          id: req.auth.id,
        },
        raw: true,
      });
      // await otp_email(otp, user_find.email, "Resend Otp", user_find.email);
      return helper.success(res, "Otp Resend Succesfully",{});
    } catch (error) {
      console.log(error,'mmmmmmmmmmmmmmmmmmm');
      
      return helper.failed(res, "Otp Not Send ! ");
    }
  },
  fileUpload: async (req, res) => {
    try {
      let folder = "users";
      let fileData = null;

      if (req.files && req.files.file) {
        fileData = await helper.fileUpload(req.files.file, folder);
      } else {
        return helper.error(res, "No file uploaded");
      }

      return helper.success(res, "File uploaded successfully", {
        file: fileData,
      });
    } catch (error) {
      console.log(error);

      return helper.error(res, "Error occurred during file upload");
    }
  },


};
