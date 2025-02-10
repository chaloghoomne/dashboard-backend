const mongoose = require("mongoose");

async function connectDB() {
	try {
		console.log("env: ", process.env.PORT, process.env.MONGO_URL);
		const connection = await mongoose.connect(process.env.MONGO_URL, {
			dbName: "chaloghoomne",
		});
		if (connection) console.log("Connected to MongoDB");
	} catch (error) {
		throw new Error(error);
	}
}

module.exports = connectDB;
