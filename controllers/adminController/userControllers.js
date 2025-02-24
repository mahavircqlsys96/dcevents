const db = require('../../models')
var CryptoJS = require("crypto-js");
const ENV = process.env
const users = db.users
const title = "Manager"
var sequelize = require('sequelize');
const helper = require('../../helpers/helper');
const fileFolder = 'Admin/managers/'




module.exports={

    vender_list: async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const currentPage = parseInt(req.query.page) || 1;
            const offset = (currentPage - 1) * limit;

            const {
                rows: find_users,
                count: totalUsers,
            } = await users.findAndCountAll({
                where: {
                    role: "1",
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
            res.redirect('/errorPage')
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
}