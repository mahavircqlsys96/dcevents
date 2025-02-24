const db = require('../../models')
const helper = require('../../helpers/helper')
const ENV = process.env
const categories = db.categories
const title = "Department"
var sequelize = require('sequelize')
const fileFolder = 'Vender/categories/'
module.exports = {
    categories_add: async (req, res) => {
        try {
            let session = req.session.admin
            res.render(`${fileFolder}add`, { session, title })
        } catch (error) {
            res.redirect('/errorPage')
        }
    },
    categories_save: async (req, res) => {
        try {
            const hashId = helper.generateHash();
            let folder = "category";
            if (req.files && req.files.image) {
                let images = await helper.fileUpload(req.files.image, folder);
                req.body.image = images;
            }
            req.body.hash_id=hashId
            const createquestions = await categories.create(req.body)
            req.flash('success', 'This department add successfully');
            res.redirect('/categories_list');

        } catch (error) {
            console.log(error, ">>>>>>>>>");
            res.redirect('/errorPage')
        }
    },
    categories_list: async (req, res) => {
        try {
            const find_categories = await categories.findAll({
                where: {
                    deletedAt: null,
                },
                order: [["id", "DESC"]],
            })
            let session = req.session.admin
            res.render(`${fileFolder}list`, { session, find_categories, title })
        } catch (error) {
            console.log(error, ">>>>>>>>");
            res.redirect('/errorPage')
        }
    },
    categories_list: async (req, res) => {
        try {
          const limit = parseInt(req.query.limit) || 10;
          const currentPage = parseInt(req.query.page) || 1;
          const offset = (currentPage - 1) * limit;
    
          const {
            rows: find_categories,
            count: totalcat,
          } = await categories.findAndCountAll({
            where: {
    
              deletedAt: null,
            },
            order: [["id", "DESC"]],
            offset: offset,
            limit: limit,
            raw: true,
          });
    
          const totalPages = Math.ceil(totalcat / limit);
          let session = req.session.admin
          res.render(`${fileFolder}list`,{
            session,
            title,
            find_categories,
            currentPage,
            totalPages,
            limit,
          });
        } catch (error) {
            console.log(error, ">>>>>>>>");
            res.redirect('/errorPage')
        }
      },
    categories_view: async (req, res) => {
        try {
            if (!req.session.admin) return res.redirect("/login");
            let session = req.session.admin
            const questionsview = await categories.findOne({
                where: {
                hash_id: req.params.id
                }
            })
            res.render(`${fileFolder}view`, { questionsview, session, title })
        } catch (error) {
            res.redirect('/errorPage')

        }
    },
    categories_edit: async (req, res) => {
        try {
            let session = req.session.admin
            const category_view = await categories.findOne({
                where: {
                    hash_id: req.params.id
                }
            })

            res.render(`${fileFolder}edit`, { category_view, session, title })
        } catch (error) {
            res.redirect('/errorPage')

        }
    },
    categories_update: async (req, res) => {
        try {
            let folder = "category";
            if (req.files && req.files.image) {
                let images = await helper.fileUpload(req.files.image, folder);
                req.body.image = images;
            }
                const upadtequestions = await categories.update(req.body, {
                    where: {
                        id: req.body.id
                    }
                })
                req.flash('success', 'Category updated successfully');
                res.redirect('/categories_list');
        
        } catch (error) {
            res.redirect('/errorPage')

        }
    },
    categories_status: async (req, res) => {
        try {
                const find_status = await categories.update({ status: req.body.value }, {
                where: {
                    id: req.body.id
                }
            })
            res.send(true)
        } catch (error) {
            console.log(error);
            res.redirect('/errorPage')
        }
    },
    categories_deleted: async (req, res) => {
        try {
            let deletedTime = sequelize.literal('CURRENT_TIMESTAMP')
            const department_delete = await categories.update({ deletedAt: deletedTime }, {
                where: {
                hash_id: req.params.id
                }
            })
            req.flash('success', 'Category deleted successfully');
            res.redirect('/categories_list');
        } catch (error) {
            res.redirect('/errorPage')
        }
    }
}