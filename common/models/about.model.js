const mongoose = require("mongoose");

const aboutSchema = new mongoose.Schema(
	{
		title: String,
		heading: String,
		description: String,
		imageUrl: String,
		imageAlt: String,
		metaTitle: { type: String, default: "" },
		metaDescription: { type: String, default: "" },
		metaKeywords: { type: [String], default: [] },
	},
	{
		timestamps: true,
	}
);

const About = mongoose.model("About", aboutSchema);

module.exports = About;
