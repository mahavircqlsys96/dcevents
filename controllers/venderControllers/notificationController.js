
const db = require('../../models')
const notifications = db.notifications

module.exports = {

    notification_list: async (req, res) => {
        try {
            // const notifications_data = await notifications.findOne({
            //     where: {
            //         deletedAt: null, type: req.query.type
            //     }, raw: true
            // })
            let session = req.session.admin
            let title = "Notifications"
            res.render('Admin/notifications/list', { session, title })
        } catch (error) {
            res.redirect('/errorPage')
        }
    },

    content_update: async (req, res) => {
        try {
            const upadteprivacy = await notifications.update(req.body, {
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