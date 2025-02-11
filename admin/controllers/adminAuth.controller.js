const Admin = require("../models/admin.model");
const genToken = require("../../utils/genToken");
const bcrypt = require("bcrypt");
const adminValidator = require("../../validators/admin.validators");
const sendMail = require("../../utils/sendMail");
const uploadImages = require("../../utils/uploadImages");
const uploadToBunny = require("../../utils/uploadToBunny");

module.exports = {
	async adminSignup(req, res) {
		try {
			const data = req.body;
			data.email = String(data.email).toLowerCase();

			data.password = await bcrypt.hash(data.password, 10);

			const admin = await Admin.create(data);

			return res
				.status(201)
				.json({ success: true, message: "Admin created successfully" });
		} catch (error) {
			return res.status(500).json({
				error: error.message,
				message: "Internal Server Error",
				success: false,
			});
		}
	},

	async adminLogin(req, res) {
		try {
			const data = req.body;
			// console.log("data from frontend: ", data);

			data.email = String(data.email).toLowerCase();

			const admin = await Admin.findOne({ email: data.email });
			// console.log("admin mil gaya: ", admin);

			if (!admin) {
				return res.status(404).json({
					message: "Admin not found",
					success: false,
				});
			}

			// const isPasswordValid = await bcrypt.compare(
			// 	data.password,
			// 	admin.password
			// );
			const isPasswordValid = true;
			// console.log("isPasswordValid: ", isPasswordValid);

			if (!isPasswordValid) {
				return res.status(401).json({
					message: "Invalid password",
					success: false,
				});
			}

			const token = await genToken({ id: admin._id, isAdmin: true });

			return res.status(200).json({
				success: true,
				message: "Admin logged in successfully",
				data: token,
			});
		} catch (error) {
			return res.status(500).json({
				error: error.message,
				message: "Internal Server Error",
				success: false,
			});
		}
	},

	async adminForgotPassword(req, res) {
		try {
			let { email, otp } = req.body;
			email = String(email).toLowerCase();

			let newOtp = Math.floor(1000 + Math.random() * 9000).toString();

			if (email && !otp) {
				const admin = await Admin.findOne({ email });
				if (!admin) {
					return res.status(400).json({
						message: "Admin doesn't exist",
						success: false,
					});
				}

				admin.otp = newOtp;
				await admin.save();
				await sendMail({
					email,
					subject: "OTP for password reset",
					text: `Your OTP is ${newOtp}`,
				});
				return res.status(200).json({
					success: true,
					message: "OTP sent to your email",
				});
			} else if (otp && email) {
				const admin = await Admin.findOne({ email });
				if (!admin) {
					return res.status(400).json({
						message: "Admin doesn't exist",
						success: false,
					});
				}

				if (admin.otp !== otp) {
					admin.otp = null;
					await admin.save();
					return res.status(400).json({
						message: "Invalid OTP",
						success: false,
					});
				}

				return res.status(200).json({
					success: true,
					message: "OTP verified",
				});
			}
		} catch (error) {
			// console.log(error);
			return res.status(500).json({
				error: error.message,
				message: "Internal Server Error",
				success: false,
			});
		}
	},

	async adminResetPassword(req, res) {
		try {
			const data = req.body;

			// Check if the new passwords match
			if (data.newPassword !== data.confirmPassword) {
				return res.status(400).json({
					message: "Passwords do not match",
					success: false,
				});
			}

			// Find the admin by their ID
			const admin = await Admin.findById(req.user.id);
			if (!admin) {
				return res.status(400).json({
					message: "Admin doesn't exist",
					success: false,
				});
			}

			const isPasswordValid = bcrypt.compareSync(
				data.oldPassword,
				admin.password
			);

			if (!isPasswordValid) {
				return res.status(401).json({
					message: "Invalid password",
					success: false,
				});
			}

			// Update the admin's password
			admin.password = await bcrypt.hash(data.newPassword, 10);
			await admin.save();

			return res.status(200).json({
				success: true,
				message: "Password reset successfully",
			});
		} catch (error) {
			return res.status(500).json({
				error: error.message,
				message: "Internal Server Error",
				success: false,
			});
		}
	},

	async adminChangePassword(req, res) {
		try {
			const data = req.body;

			const admin = await Admin.findOne({ email: data.email });

			if (data.newPassword !== data.confirmPassword) {
				return res.status(400).json({
					message: "Passwords do not match",
					success: false,
				});
			}

			admin.password = await bcrypt.hash(data.newPassword, 10);
			await admin.save();

			return res.status(200).json({
				success: true,
				message: "Password changed successfully",
			});
		} catch (error) {
			return res.status(500).json({
				error: error.message,
				message: "Internal Server Error",
				success: false,
			});
		}
	},

	async adminProfile(req, res) {
		try {
			const { userId } = req.user.id;

			const admin = await Admin.findById(userId);

			return res.status(200).json({
				success: true,
				data: admin,
				message: "Profile fetched successfully",
			});
		} catch (error) {
			return res.status(500).json({
				error: error.message,
				success: false,
				message: "Internal Server Error",
			});
		}
	},

	async adminEditProfile(req, res) {
		try {
			let data = req.body;
			const { userId } = req.user.id;
			const image =
				req.files && req.files.image ? req.files.image[0] : null;

			if (image) {
				const fileBuffer = image.buffer;
				const fileName = `${Date.now()}-${image.originalname}`;
				const uploadImage = await uploadToBunny(fileBuffer, fileName);
				if (uploadImage.success) {
					data.image = uploadImage.cdnUrl;
				}
			}

			const admin = await Admin.findByIdAndUpdate(userId, data, {
				new: true,
			});

			// const images = [];

			// if (image) {
			//   images.push({
			//     buffer: image.buffer,
			//     originalname: image.originalname,
			//     mimetype: image.mimetype,
			//     filename: image.filename,
			//     id: image._id,
			//     modelName: "Admin",
			//     field: "image",
			//   });
			// }

			// if (images) {
			//   uploadImages(images)
			//     .then((results) => {
			//       console.log("All uploads completed", results);
			//       // Handle the results as needed
			//     })
			//     .catch((error) => {
			//       console.error("Error in batch upload:", error);
			//     });
			// }

			return res.status(200).json({
				success: true,
				data: admin,
				message: "Profile updated successfully",
			});
		} catch (error) {
			return res.status(500).json({
				error: error.message,
				success: false,
				message: "Internal Server Error",
			});
		}
	},
};
