const db = require('../../models')
const ENV = process.env
const helper = require('../../helpers/helper')
const sub_categories = db.sub_categories
const categories = db.categories
const products = db.products
const title = "Products"
var sequelize = require('sequelize')
const fileFolder = 'Vender/products/'
products.belongsTo(categories, {
    foreignKey: "category_id",
    as: "categoryName"
})

module.exports = {
    product_add: async (req, res) => {
        try {
            let get_categories = await categories.findAll({
                where: {
                    deletedAt: null,
                }, raw: true,
                order: [["id", "DESC"]],
            })

            let session = req.session.admin
            res.render(`${fileFolder}add`, { session, get_categories, title })
        } catch (error) {
            res.redirect('/errorPage')
        }
    },
    product_add_save: async (req, res) => {
        try {
            
            const hashId = helper.generateHash()
            let folder = "products";
            if (req.files && req.files.image) {
                let images = await helper.fileUpload(req.files.image, folder);
                req.body.image = images;
            }
            req.body.hash_id = hashId,
            req.body.user_id=req.session.admin.id
            const createquestions = await products.create(req.body)

            req.flash('success', 'Product updated successfully');
            res.redirect('/product_list');

        } catch (error) {
            console.log(error, ">>>>>>>>>");
            res.redirect('/errorPage')
        }
    },

    product_list: async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 5;
            const currentPage = parseInt(req.query.page) || 1;
            const offset = (currentPage - 1) * limit;

            const {
                rows: get_product,
                count: totalproducts,
            } = await products.findAndCountAll({
                include:[
                    {
                        model:categories,
                        as:"categoryName"
                    }
                ],
                where: {
                    user_id:req.session.admin.id,
                    deletedAt: null,
                },
                order: [["id", "DESC"]],
                offset: offset,
                limit: limit,
            });

            const totalPages = Math.ceil(totalproducts / limit);
            let session = req.session.admin
            res.render(`${fileFolder}list`, {
                session,
                title,
                get_product,
                currentPage,
                totalPages,
                limit,
            });
        } catch (error) {
            res.redirect('/errorPage')
        }
    },

    product_edit: async (req, res) => {
        try {
            let session = req.session.admin
            let get_categories = await categories.findAll({
                where: {
                    deletedAt: null,
                }, raw: true,
                order: [["id", "DESC"]],
            })
            const product_view = await products.findOne({
                where: {
                    hash_id: req.params.id
                }
            })
            res.render(`${fileFolder}edit`, { product_view,get_categories, session, title })
        } catch (error) {
            res.redirect('/errorPage')

        }
    },
    product_update: async (req, res) => {
        try {
 
            let folder = "products";
            if (req.files && req.files.image) {
                let images = await helper.fileUpload(req.files.image, folder);
                req.body.image = images;
            }
                const upadtequestions = await products.update(req.body, {
                    where: {
                        id: req.body.id
                    }
                })
                req.flash('success', 'Product updated successfully');
                res.redirect(`back`)
            

        } catch (error) {
            console.log(error);
            
            res.redirect('/errorPage')

        }
    },
    product_status: async (req, res) => {
        try {
    
            const find_status = await products.update({ status: req.body.value }, {
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
    product_deleted: async (req, res) => {
        try {
            let deletedTime = sequelize.literal('CURRENT_TIMESTAMP')
            const department_delete = await products.update({ deletedAt: deletedTime }, {
                where: {
                    hash_id: req.params.id
                }
            })
            req.flash('success', 'This product deleted successfully');
            res.redirect('/product_list');
        } catch (error) {
                   
            res.redirect('/errorPage')
        }
    },

    sub_cat_list: async (req, res) => {
        try {

            const get_sub_cat = await sub_categories.findAll({
                where: {
                    category_id: req.body.category_id,
                    deletedAt: null,
                },
                order: [["id", "DESC"]],
            })
            res.status(200).json({ "subcategory": get_sub_cat });
        } catch (error) {
            console.log(error, ">>>>>>>>");
            res.redirect('/errorPage')
        }
    },
}