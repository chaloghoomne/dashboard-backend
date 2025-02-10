const About = require("../models/about.model");
const uploadImages = require("../../utils/uploadImages");
const uploadToBunny = require("../../utils/uploadToBunny");

module.exports = {
	async addAbout(req, res) {
		try {
			console.log(req.body);
			const data = req.body;

			if (data.sections) {
				console.log(data.sections)
				data.sections = JSON.parse(data.sections);
			}
			console.log("Iske AAge jao")
			const image =
				req.files && req.files.image ? req.files.image[0] : null;

			let about = await About.findOne();

			let imageUrl = null;

			if (image) {
				const fileBuffer = image.buffer;
				const fileName = `${Date.now()}-${image.originalname}`;
				const uploadImage = await uploadToBunny(fileBuffer, fileName);
				if (uploadImage.success) {
					imageUrl = uploadImage.cdnUrl;
				}
			}

			if (!about) {
				about = await About.create({ ...data, image: imageUrl });
			} else {
				about = await About.findByIdAndUpdate(
					about._id,
					{ $set: { ...data, image: imageUrl } },
					{ new: true }
				);
			}

			// let images = [];

			// if (image) {
			//   images.push({
			//     buffer: image.buffer,
			//     originalname: image.originalname,
			//     mimetype: image.mimetype,
			//     filename: image.filename,
			//     id: about._id,
			//     modelName: "About",
			//     field: "image",
			//   });
			// }

			// if (images.length > 0) {
			//   uploadImages(images)
			//     .then((results) => {
			//       console.log("All uploads completed", results);
			//       // Handle the results as needed
			//     })
			//     .catch((error) => {
			//       console.error("Error in batch upload:", error);
			//     });
			// }

			return res.status(201).json({
				message: "About added successfully",
				data: about,
				success: true,
			});
		} catch (error) {
			return res.status(500).json({
				message: "Internal server error",
				error: error.message,
				success: false,
			});
		}
	},

	async getAbout(req, res) {
		try {
			const about = await About.findOne();
			console.log("about fn called: ", about);

			return res.status(200).json({
				message: "About fetched successfully",
				data: about,
				success: true,
			});
		} catch (error) {
			return res.status(500).json({
				message: "Internal server error",
				error: error.message,
				success: false,
			});
		}
	},

	async deleteAbout(req, res) {
		try {
			const about = await About.findOneAndDelete(req.params.id);

			return res.status(200).json({
				message: "About deleted successfully",
				data: about,
				success: true,
			});
		} catch (error) {
			return res.status(500).json({
				message: "Internal server error",
				error: error.message,
				success: false,
			});
		}
	},
};