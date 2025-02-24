
const db = require('../../models')
const cms = db.cms

module.exports = {

    content: async (req, res) => {
        try {
            const cms_data = await cms.findOne({
                where: {
                    deletedAt: null, type: req.query.type
                }, raw: true
            })
            let session = req.session.admin
            let title = cms_data.title
            res.render('Admin/content', { session, title, cms_data })
        } catch (error) {
            res.redirect('/errorPage')
        }
    },

    content_update: async (req, res) => {
        try {
            const upadteprivacy = await cms.update(req.body, {
                where: {
                    type: req.body.type
                }
            },)
            res.redirect(`back`)
        } catch (error) {
            res.redirect('/errorPage')
        }
    },


}