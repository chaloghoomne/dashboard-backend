const Package = require("../models/package.model");

module.exports = {
	async CountriesImage(req, res) {
		try {
			const country = req.body.country;
			console.log(country);
			const img = await Package.findOne({ country: country });
            console.log("imghghg",img.image)
			return res.status(200).json({image:img.image});

		} catch (error) {
			console.log("Error in countries image", error);
		}
	},
};
