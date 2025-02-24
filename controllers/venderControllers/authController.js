
const helper = require('../../helpers/helper')
var CryptoJS = require("crypto-js");
const ENV = process.env
const { Op, fn, col } = require('sequelize');
const sequelize = require("sequelize");
var moment = require("moment");
const { users, categories, products } = require("../../models");
const stripe = require("stripe")(
  ENV.secret_key
);
const publish_key = ENV.publish_key
const secret_key = ENV.secret_key
const stripeReturnUrl = "https://app.hicoach.app/Api/stripe_connect";
// const stripeReturnUrl = "http://localhost:1414/Api/stripe_connect";
module.exports = {

  loginPage: async (req, res) => {
    try {
      res.render('Vender/auth/login', { layout: false })
    } catch (error) {
      res.redirect('/errorPage')
    }
  },
  
  errorPage: async (req, res) => {
    try {
      res.render('Vender/error_page', { layout: false })
    } catch (error) {
      console.log(error, "Print error here");
      res.redirect('/errorPage')

    }
  },

  login: async (req, res) => {
    try {
      const find_data = await users.findOne({
        where: {
          email: req.body.user_name, deletedAt: null, role: "1",
          is_complete: "1"
        }
      })

 
      if (find_data == null) {

        req.flash('error', 'Please enter valid email')
        res.redirect("/login");
      } else {
        // Decrypt

        var bytes = CryptoJS.AES.decrypt(find_data.password, ENV.crypto_key);

        let decryptedString = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));;

        if (!decryptedString) {
          throw new Error('Decryption failed or returned empty string');
        }
        decryptedString = decryptedString.trim();
        let providedPassword = req.body.password.trim();
        let check_password = decryptedString == providedPassword;

        if (!find_data.stripe_id) {
          const customer = await stripe.customers.create({
            email: find_data.email,
          });
          const stripe_id = customer.id;
          await users.update({
            stripe_id: stripe_id,
          }, {
            where: {
              id: find_data.id,
            },
          });
        }
          if (check_password == true) {
          req.session.admin = find_data

          req.flash('success', 'You are login successfully');
          res.redirect("/dashboard");
        } else {
          req.flash("error", "Please enter valid  password");
          res.redirect("/login");
        }
      }
    } catch (error) {
      console.log(error, "Print error here");
      res.redirect('/errorPage')
    }
  },
  sign_up1: async (req, res) => {
    try {

      let find_user = ''
      if (req.query.id) {
        find_user = await users.findOne({
          where: {
            hash_id: req.query.id,

          }, raw: true, nest: true
        })

      } res.render('Vender/auth/signup1', { layout: false, find_user })

    } catch (error) {
      console.log(error);

    }
  },

  sign_up1_save: async (req, res) => {
    try {
      let find_data = await users.findOne({
        where: {
          email: req.body.email
        }, raw: true, nest: true
      });

      if (find_data && find_data.is_complete == "1") {
        req.flash('error', 'Email already exist, Please login')
        res.redirect('/login')
      }

      let responseData = {};

      if (find_data) {
        var data = req.body.password;
        var Newpassword = CryptoJS.AES.encrypt(JSON.stringify(data), ENV.crypto_key).toString();
        req.body.password = Newpassword;

        await users.update(req.body, {
          where: { email: req.body.email }
        });

        // responseData.message = "User updated successfully";
        responseData = find_data;
      } else {
        const hashId = helper.generateHash();

        var data = req.body.password;
        var Newpassword = CryptoJS.AES.encrypt(JSON.stringify(data), ENV.crypto_key).toString();
        req.body.password = Newpassword;
        req.body.role = "1";
        req.body.hash_id = hashId;
        req.body.time_zone=Intl.DateTimeFormat().resolvedOptions().timeZone
        let add_vender = await users.create(req.body);
        let find_user = await users.findOne({
          where: {
            id: add_vender.id
          },
          raw: true, nest: true
        });
        const customer = await stripe.customers.create({
          email: find_user.email,
        });
  
        const stripe_id = customer.id;
        await users.update({
          stripe_id: stripe_id,
        }, {
          where: {
            id: find_user.id,
          },
        });
   
        responseData = find_user;
      }
      req.session.admin = responseData
      res.redirect(`/sign_up2?id=${responseData.hash_id}`);
    } catch (error) {
      console.log(error);

    }
  },
  sign_up2: async (req, res) => {
    try {

      let find_date = await users.findOne({
        where: {
          hash_id: req.query.id
        }, raw: true
      })
      let session = req.session.admin
      res.render('Vender/auth/signup2', { layout: false, find_date, session })
    } catch (error) {
      console.log(error);

    }
  },
  sign_up2_save: async (req, res) => {
    try {
      let update_data = await users.update({
        phone: req.body.phone,
        bio: req.body.bio
      }, {
        where: {
          hash_id: req.body.id
        }
      })
      //product////pending//
      let userId = req.body.id

      res.redirect(`/sign_up3?id=${userId}`);

    } catch (error) {
      console.log(error);

    }
  },
  sign_up3: async (req, res) => {
    try {
      let find_user = await users.findOne({
        where: {
          hash_id: req.query.id
        }, raw: true, nest: true
      })
      let session = req.session.admin
      res.render('Vender/auth/signup3', { layout: false, find_user, session })
    } catch (error) {
      console.log(error);

    }
  },
  sign_up3_save: async (req, res) => {
    try {
      // let update_data = await users.update({
      //   phone: req.body.phone,
      //   bio: req.body.bio
      // }, {
      //   where: {
      //     hash_id: req.body.id
      //   }
      // })
      //product////pending//
      let userId = req.body.id

      res.redirect(`/add_product?id=${userId}`);

    } catch (error) {
      console.log(error);

    }
  },

  add_product: async (req, res) => {
    try {
      let find_user = ''
      let find_products = ''
      if (req.query.id) {
        find_user = await users.findOne({
          where: {
            hash_id: req.query.id
          }, raw: true, nest: true
        })
        find_products = await products.findAll({
          where: {
            user_id: find_user.id
          }
        })
      }
      let session = req.session.admin
      res.render('Vender/auth/add_product', { layout: false, find_user, find_products, session })

    } catch (error) {
      console.log(error);

    }
  },
  add_new_product: async (req, res) => {
    try {
      let find_user = ''
      let get_categories = await categories.findAll({
        where: {
          deletedAt: null,
        }, raw: true,
        order: [["id", "DESC"]],
      })
      console.log(get_categories,"get_categoriesget_categories");
      
      if (req.query.id) {
        find_user = await users.findOne({
          where: {
            hash_id: req.query.id
          }, raw: true, nest: true
        })
      }
      console.log(find_user,'find_userfind_user');
      
      let session = req.session.admin
      res.render('Vender/auth/add_new_product', { layout: false, find_user, get_categories, })

    } catch (error) {
      console.log(error);

    }
  },
  product_save: async (req, res) => {
    try {

      const hashId = helper.generateHash()
      let folder = "products";
      if (req.files && req.files.image) {
        let images = await helper.fileUpload(req.files.image, folder);
        req.body.image = images;
      }
      const createquestions = await products.create({
        hash_id: hashId,
        user_id: parseInt(req.body.user_id),
        title: req.body.title,
        image: req.body.image,
        category_id: parseInt(req.body.category_id),
        price: parseFloat(req.body.price),
        description: req.body.description
      })

      req.flash('success', 'Product added successfully');
      let userId = req.body.hash_user_id

      res.redirect(`/add_product?id=${userId}`);

    } catch (error) {
      console.log(error);

    }
  },

  dashboard: async (req, res) => {
    try {
      // const categoryCount = await categories.count({ where: { deletedAt: null } });
      // const departmentCount = await departments.count({ where: { deletedAt: null } });
      const prodcutCount = await products.count({ where: { user_id:req.session.admin.id,deletedAt: null } });
      // const subcateCount = await sub_categories.count({ where: { deletedAt: null } });
      const managerCount = await users.count({ where: { deletedAt: null } });
      let session = req.session.admin
      let update_isComplete = await users.update({
        is_complete: "1"
      }, {
        where: {
          id: req.session.admin.id
        }
      })
      res.render('Vender/dashboard', { title: "dashboard", session ,prodcutCount,managerCount})
    } catch (error) {
      //   return helper.error(res, error)
      console.log(error, "Print error here");
      res.redirect('/errorPage')

    }
  },
  profile: async (req, res) => {
    try {

      let session = req.session.admin
      const profile = await users.findOne({
        where: {
          email: req.session.admin.email
        },raw:true,nest:true
      })
      var accountLink=''

      if (profile.role == "1" && profile.hasAccountId == "0") {
 
      accountLink = await helper.create_stripe_connect_url(
          stripe,
          profile,
          stripeReturnUrl + `?state=${profile.id}`
        );
         }
            res.render('Vender/profile', { profile,accountLink, session, title: "profile" })

    } catch (error) {
        return helper.error(res, error)
      // console.log(error, "Print error here");
      res.redirect('/errorPage')

    }
  },
  edit_profile: async (req, res) => {
    try {

      let folder = "users"
      if (req.files && req.files.image) {
        let images = await helper.fileUpload(req.files.image, folder)
        req.body.image = images
      }
      req.body.first_name=req.body.name
      const profile = await users.update(req.body, {
        where: {
          id: req.session.admin.id
        }
      })

      const find_data = await users.findOne({
        where: {
          id: req.session.admin.id
        }
      })

      req.session.admin = find_data
      res.redirect('/profile')
    } catch (error) {
      console.log(error, "Print error here");
      res.redirect('/errorPage')

    }
  },
   change_password: async (req, res) => {
    try {

      let session = req.session.admin
      let findAdmin = await users.findOne({
        where: {
          id: session.id
        }
      })
      let Encrypt_data = findAdmin.password
      // Decrypt
      var bytes = CryptoJS.AES.decrypt(Encrypt_data, ENV.crypto_key);
      var Decrypt_data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      let check_old = Decrypt_data === req.body.old_password
      // Encrypt
      var data = req.body.new_password
      var Newpassword = CryptoJS.AES.encrypt(JSON.stringify(data), ENV.crypto_key).toString();
      if (check_old == true) {

        let update_password = await users.update({ password: Newpassword }, {
          where: {
            id: session.id
          }
        })
        req.flash('success', 'Update password succesfully')
        res.redirect("/login")
      } else {
        req.flash('error', 'Please enter valid old password')
        res.redirect("/changepasswordpage")
      }
    } catch (error) {
      //   return helper.error(res, error)
      console.log(error, "Print error here");
      res.redirect('/errorPage')

    }
  },
  logout: async (req, res) => {
    try {
      delete req.session.admin
      res.redirect('/login')
    } catch (error) {
      //   return helper.error(res, error)
      console.log(error, "Print error here");
      res.redirect('/errorPage')


    }
  },
//   account_link: async (req, res) => {
//     try {
//       const user1 = await users.findOne({
//         where: { id },
//         raw: true
//       });
//       if (user1.role == 2 && user1.hasAccountId == 0) {
//         console.log("add account ");

//         const accountLink = await helper.create_stripe_connect_url(
//           stripe,
//           user1,
//           stripeReturnUrl + `?state=${user1.id}`
//         );
//         return helper.success(
//           res,
//           "Please add stripe account first",
//           accountLink
//         );
//       } else {
//         if (user1) {
//           return helper.error403(res, "account already added");
//         }
//       }
//     } catch (error) {
//       console.log(error);
//       return helper.error403(
//         res,
//         "An error occurred while processing the request",
//         error
//       );

//     }
//   },
}