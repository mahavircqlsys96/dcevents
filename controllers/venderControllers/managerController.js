const db = require('../../models')
var CryptoJS = require("crypto-js");
const ENV = process.env
const users = db.users
const title = "Manager"
var sequelize = require('sequelize');
const helper = require('../../helpers/helper');
const fileFolder = 'Vender/managers/'


module.exports = {
    manager_add: async (req, res) => {
        try {

            let session = req.session.admin
            res.render(`${fileFolder}add`, { session, title })
        } catch (error) {
            res.redirect('/errorPage')
        }
    },
    manager_save: async (req, res) => {
        try {
            
            let folder = "users";
            if (req.files && req.files.image) {
                let images = await helper.fileUpload(req.files.image, folder);
                req.body.image = images;
            }


            const hashId = helper.generateHash();
            var data = req.body.password
            var Newpassword = CryptoJS.AES.encrypt(JSON.stringify(data), ENV.crypto_key).toString();
            req.body.password = Newpassword,
                req.body.role = "3"
            req.body.hash_id = hashId
            req.body.vender_id = req.session.admin.id
            const createUser = await users.create(req.body)
            req.flash('success', 'Manager added successfully');
            res.redirect('/manager_list');


        } catch (error) {
            console.log(error);

            res.redirect('/errorPage')
        }
    },

    manager_list: async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const currentPage = parseInt(req.query.page) || 1;
            const offset = (currentPage - 1) * limit;

            const {
                rows: find_users,
                count: totalUsers,
            } = await users.findAndCountAll({
                where: {
                    vender_id:req.session.admin.id,
                    role: "3",
                    deletedAt: null,
                },
                order: [["id", "DESC"]],
                offset: offset,
                limit: limit,
                raw: true,
            });

         

            const totalPages = Math.ceil(totalUsers / limit);
            let session = req.session.admin
            res.render(`${fileFolder}list`, {
                session,
                title,
                find_users,
                currentPage,
                totalPages,
                limit,
            });
        } catch (error) {
            console.log(error, ">>>>>>>>");
            // res.redirect('/errorPage')
        }
    },

    manager_view: async (req, res) => {
        try {

            let session = req.session.admin
            const userview = await users.findOne({
                include: [
                    {
                        model: departments,
                        as: "departmentName"
                    }
                ],
                where: {
                    hash_id: req.params.id
                }, raw: true, nest: true
            })

            res.render(`${fileFolder}view`, { userview, session, title })
        } catch (error) {
            res.redirect('/errorPage')

        }
    },
    manager_edit: async (req, res) => {
        try {
            let session = req.session.admin

            

            const user_view = await users.findOne({

                where: {
                    hash_id: req.params.id
                }, raw: true
            })

            res.render(`${fileFolder}edit`, { user_view,  session, title })
        } catch (error) {
            res.redirect('/errorPage')

        }
    },
    manager_update: async (req, res) => {
        try {

            const upadate_profile = await users.update(req.body, {
                where: {
                    id: req.body.id
                }
            })
            res.redirect(`back`)


        } catch (error) {
            res.redirect('/errorPage')

        }
    },
    manager_status: async (req, res) => {
        try {
            console.log(req.body, ">>>>>>>error>>>");
            const find_status = await users.update({ status: req.body.value }, {
                where: {
                    id: req.body.id
                }
            })

            console.log(find_status, ">>>>>>");
            res.send(true)
        } catch (error) {
            console.log(error);
            res.redirect('/errorPage')
        }
    },
    manager_deleted: async (req, res) => {
        try {

            let deletedTime = sequelize.literal('CURRENT_TIMESTAMP')
            const department_delete = await users.update({ deletedAt: deletedTime }, {
                where: {
                    hash_id: req.params.id
                }
            })
            req.flash('success', 'This department deleted successfully');
            res.redirect('/manager_list');
        } catch (error) {

            res.redirect('/errorPage')
        }
    },
}