const db = require("../../models");
const helper = require("../../helpers/helper");
const Content = db.cms;
module.exports = {
 
    terms_conditions: async (req, res) => {
        try {
            const termsAndConditions = await Content.findOne({
                where: {
                    id: 1,
                },
            });
            if (termsAndConditions) {
                return helper.success(res, "Terms And Conditions Get Succesfully ", termsAndConditions);
            }
        } catch (error) {
            return helper.error403(res, error);
        }
    },
    privacy_policy: async (req, res) => {
        try {
            const termsAndConditions = await Content.findOne({
                where: {
                    id: 2,
                },
            });
            if (termsAndConditions) {
                return helper.success(res, "Privacy Policy Get Succesfully ", termsAndConditions);
            }
        } catch (error) {
            return helper.error403(res, error);
        }
    },
    about_us: async (req, res) => {
        try {
            const termsAndConditions = await Content.findOne({
                where: {
                    id: 3,
                },
            });
            if (termsAndConditions) {
                return helper.success(res, "About Us Get Succesfully ", termsAndConditions);
            }
        } catch (error) {
            return helper.error403(res, error);
        }
    },
};