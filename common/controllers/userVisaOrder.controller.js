const OrderDetails = require("../models/orderDetails.model");
const VisaOrder = require("../models/visaOrder.model");
const { uploadQueue } = require("../../queue/upload.queue");
const VisaCategory = require("../models/visaCategory.model");
const Package = require("../models/package.model");
const paginate = require("../../utils/paginate");
// Removed uploadImages in favor of using uploadToBunny for all file uploads
const uploadToBunny = require("../../utils/uploadToBunny");

module.exports = {
	async createVisaOrder(req, res) {
		try {
			// console.log("Request to aa rahi hai", req.body);
			const data = req.body;
			const visaCategory = await VisaCategory.findById(data.visaCategory);
			// console.log("Ye hai visa category", visaCategory);
			if (!visaCategory) {
				return res.status(404).json({
					message: "Visa Category Not Found",
					success: false,
				});
			}

			const visaOrder = await VisaOrder.create({
				...data,
				// user: req.user.id || null,
			});

			const orderDetails = await OrderDetails.create({
				visaOrder: visaOrder._id,
			});

			return res.status(201).json({
				data: { visaOrder, orderDetails },
				message:
					"Visa Order and Initial Order Details Created Successfully",
				success: true,
			});
		} catch (error) {
			return res.status(500).json({
				error: error.message,
				message: "Internal Server Error",
				success: false,
			});
		}
	},

	async editVisaOrder(req, res) {
		try {
			const { id } = req.params;
			const data = req.body;
			console.log("Data hai ye",data)

			const visaOrder = await VisaOrder.findByIdAndUpdate(id, data, {
				new: true,
			});

			if (!visaOrder) {
				return res.status(404).json({
					message: "Visa Order Not Found",
					success: false,
				});
			}

			return res.status(200).json({
				data: visaOrder,
				message: "Visa Order Updated Successfully",
				success: true,
			});
		} catch (error) {
			return res.status(500).json({
				error: error.message,
				message: "Internal Server Error",
				success: false,
			});
		}
	},

	async getVisaOrders(req, res) {
		try {
			// console.log(req)
			const  id  = req.body.user;
			// console.log(req.body.user)
			let result = await VisaOrder.find({
				user: id ? id : req.user.id,
			}).populate({
				path: "visaCategory",
				populate: {
					path: "package",
					model: "Package",
					select: "country tourTypes",
				},
			});
			// console.log(result);

			const visaOrder = await Promise.all(
				result.map(async (order, index) => {
					if (!order?.visaCategory?.package) {
					  console.log(`Order at index ${index} skipped — missing package`);
					  return null;
					}
			  
				  const { country, tourTypes } = order.visaCategory.package;
			  
				  const tourType = tourTypes.find(
					(item) =>
					  item._id?.toString() === order.visaCategory.tourType?.toString()
				  );
			  
				  const orderDetailsCount = await OrderDetails.countDocuments({
					visaOrder: order._id,
				  });
			  
				  const latestOrderDetails = await OrderDetails.findOne({
					visaOrder: order._id,
				  }).sort({ createdAt: -1 });
			  
				  let documentFulfillmentStatus = true;
				  let latestOrderDetailsId = null;
			  
				  if (
					orderDetailsCount < order.travellersCount ||
					(latestOrderDetails && !latestOrderDetails.detailsFulfilled)
				  ) {
					documentFulfillmentStatus = false;
					latestOrderDetailsId = latestOrderDetails?._id;
				  }
			  
				  return {
					...order.toObject(),
					country,
					tourType,
					documentFulfillmentStatus,
					latestOrderDetailsId,
				  };
				})
			  );
			  
			  // 🔥 Filter out nulls (e.g., orders with missing visaCategory.package)
			//   const filteredVisaOrders = visaOrder.filter(Boolean);
			//   console.log(filteredVisaOrders)
			//   console.log("visaOrder: ", visaOrder);

			return res.status(200).json({
				data: visaOrder,
				message: "Visa Orders Fetched Successfully",
				success: true,
			});
		} catch (error) {
			// console.log("Error in Visa Order");
			return res.status(500).json({
				error: error.message,
				message: "Internal Server Error",
				success: false,
			});
		}
	},

	async getVisaOrderById(req, res) {
		try {
			const { visaOrderId } = req.params;
			const visaOrder = await VisaOrder.findById(visaOrderId);
			const orderDetails = await OrderDetails.countDocuments({
				visaOrder: visaOrderId,
			});
			const visaCategory = await VisaCategory.findById(
				visaOrder.visaCategory
			).select("childPrice");

			return res.status(200).json({
				data: { visaOrder, orderDetails, visaCategory },
				message: "Visa Order Fetched Successfully",
				success: true,
			});
		} catch (error) {
			return res.status(500).json({
				error: error.message,
				message: "Internal Server Error",
				success: false,
			});
		}
	},

	async addOrderDetails(req, res) {
		try {
			const data = req.body;
			const documents =
				req.files && req.files.documents ? req.files.documents : [];
			data.user = req.user.id;

			// Create the OrderDetails document
			const orderDetails = await OrderDetails.create(data);

			// Array to store uploaded document details
			const uploadedDocuments = [];

			if (documents.length > 0) {
				for (let index = 0; index < documents.length; index++) {
					const document = documents[index];
					const documentName = data[`documents[${index}][name]`]; // Get the name for the corresponding document

					if (!documentName) {
						throw new Error(
							`Missing name for document at index ${index}`
						);
					}

					const fileBuffer = document.buffer;
					const fileName = `${Date.now()}-${document.originalname}`;

					// Upload document to Bunny.net
					const uploadResult = await uploadToBunny(
						fileBuffer,
						fileName
					);
					if (uploadResult.success) {
						uploadedDocuments.push({
							name: documentName,
							image: uploadResult.cdnUrl,
						});
					} else {
						throw new Error(
							`Failed to upload document: ${document.originalname}`
						);
					}
				}

				// Update the OrderDetails document with uploaded document details
				await OrderDetails.findByIdAndUpdate(orderDetails._id, {
					$set: { documents: uploadedDocuments },
				});
			}

			return res.status(201).json({
				data: orderDetails,
				message: "Visa Order Created Successfully",
				success: true,
			});
		} catch (error) {
			console.error("Error in addOrderDetails:", error);
			return res.status(500).json({
				error: error.message,
				message: "Internal Server Error",
				success: false,
			});
		}
	},

	async getOrderDetailsByVisaOrder(req, res) {
		try {
			console.log(req.params);
			const { visaOrderId } = req.params;
			console.log(visaOrderId);
			const orderDetails = await OrderDetails.find({
				visaOrder: visaOrderId,
			}).populate("visaOrder");
			console.log(orderDetails);

			return res.status(200).json({
				data: orderDetails,
				message: "Visa Orders fetched successfully",
				success: true,
			});
		} catch (error) {
			return res.status(500).json({
				error: error.message,
				message: "Internal Server Error",
				success: false,
			});
		}
	},

	async getOrderDetailsById(req, res) {
		try {
			const { id } = req.params;
			const orderDetails = await OrderDetails.findById(id);
			return res.status(200).json({
				data: orderDetails,
				message: "Visa Order fetched successfully",
				success: true,
			});
		} catch (error) {
			return res.status(500).json({
				error: error.message,
				message: "Internal Server Error",
				success: false,
			});
		}
	},

	async  editOrderDetails(req, res) {
		try {
			const { id } = req.params;
			console.log("🔍 Received Request Data:", req.body);
			console.log("📂 Received Files:", req.files);
	
			// Find order details
			const orderDetails = await OrderDetails.findById(id);
			if (!orderDetails) {
				return res.status(404).json({ message: "Order details not found", success: false });
			}
	
			// Process file uploads
			const updatedDocuments = [];
			if (req.files && req.files.length > 0) {
				for (let file of req.files) {
					const documentName = req.body[`documents[${updatedDocuments.length}][name]`] || req.body.names?.[updatedDocuments.length];
					if (!documentName) {
						return res.status(400).json({ message: "Missing name for document", success: false });
					}
	
					const fileBuffer = file.buffer;
					const fileName = `${Date.now()}-${file.originalname}`;
	
					// Upload file to BunnyCDN (or other storage)
					const uploadResult = await uploadToBunny(fileBuffer, fileName);
					if (uploadResult.success) {
						updatedDocuments.push({ name: documentName, image: uploadResult.cdnUrl });
					} else {
						return res.status(500).json({ message: `Failed to upload document: ${file.originalname}`, success: false });
					}
				}
	
				// Update documents in order details
				orderDetails.documents = updatedDocuments;
			}
	
			// Update other fields from form data
			Object.keys(req.body).forEach((key) => {
				if (key !== "documents") {
					orderDetails[key] = req.body[key];
				}
			});
	
			// Save updated order
			await orderDetails.save();
	
			return res.status(200).json({ data: orderDetails, message: "Visa Order Updated Successfully", success: true });
		} catch (error) {
			console.error("❌ Error in editOrderDetails:", error);
			return res.status(500).json({ error: error.message, message: "Internal Server Error", success: false });
		}
	},

	async editOrderDetailsV2(req, res) {
		try {
		  const { id } = req.params;
	  
		  const parsedData = JSON.parse(req.body.data);
		  const documents = parsedData.documents || [];
	  
		  console.log("📨 Parsed Data:", parsedData);
		  console.log("📁 Uploaded Files:", req.files);
	  
		  const orderDetails = await OrderDetails.findById(id);
		  if (!orderDetails) {
			return res.status(404).json({ message: "Order not found", success: false });
		  }
	  
		  const updatedDocuments = [];
	  
		  if (req.files && req.files.length > 0) {
			for (let i = 0; i < req.files.length; i++) {
			  const file = req.files[i];
			  const documentName = documents[i]?.name;
	  
			  if (!documentName) {
				return res.status(400).json({ message: "Missing name for document", success: false });
			  }
	  
			  const fileBuffer = file.buffer;
			  const fileName = `${Date.now()}-${file.originalname}`;
	  
			  const uploadResult = await uploadToBunny(fileBuffer, fileName);
			  if (uploadResult.success) {
				updatedDocuments.push({ name: documentName, image: uploadResult.cdnUrl });
			  } else {
				return res.status(500).json({ message: `Failed to upload ${file.originalname}`, success: false });
			  }
			}
	  
			orderDetails.documents = updatedDocuments;
		  }
	  
		  // Update other fields from data
		  Object.entries(parsedData).forEach(([key, value]) => {
			if (key !== "documents") {
			  orderDetails[key] = value;
			}
		  });
	  
		  await orderDetails.save();
	  
		  return res.status(200).json({
			data: orderDetails,
			message: "Visa Order Updated Successfully",
			success: true,
		  });
		} catch (error) {
		  console.error("❌ Error in editOrderDetailsV2:", error);
		  return res.status(500).json({
			error: error.message,
			message: "Internal Server Error",
			success: false,
		  });
		}
	  }
,	  
	
	

	async getAllVisaOrders(req, res) {
		try {
			const { page, limit, status } = req.query;
			const { skip, take } = paginate(page, limit);

			// console.log("page, limit, status: ", page, limit, status);

			let query = { isSubmitted: true };

			if (status === "approved" || status === "rejected") {
				query.status = { $in: ["approved", "rejected"] };
				// console.log("Pending", status);
			} else if (status === "pending" || status === "sent-back") {
				query.status = { $in: ["pending", "sent-back"] };
			} else if (status) {
				query.status = status;
			}

			const totalItems = await VisaOrder.countDocuments(query);
			const totalPages = Math.ceil(totalItems / take);
			// console.log("other",totalPages)
			let startNumber;
			let visaOrders;
			if (page !== undefined && page !== null) {
				startNumber = (page - 1) * take + 1;
				visaOrders = await VisaOrder.find(query)
					.populate("user")
					.skip(skip)
					.limit(take)
					.sort({ createdAt: -1 });
				visaOrders = visaOrders.map((visaOrder, index) => {
					return {
						...visaOrder.toObject(),
						s_no: startNumber + index,
					};
				});
			} else {
				startNumber = 1;
				visaOrders = await VisaOrder.find(query)
					.populate("user")
					.sort({ createdAt: -1 });
				visaOrders = visaOrders.map((visaOrder, index) => {
					return {
						...visaOrder.toObject(),
						s_no: startNumber + index,
					};
				});
			}

			return res.status(200).json({
				data: visaOrders,
				message: "Visa Orders fetched successfully",
				success: true,
				totalPages,
			});
		} catch (error) {
			return res.status(500).json({
				error: error.message,
				message: "Internal Server Error",
				success: false,
			});
		}
	},

	async editOrderDetailsImage(req, res) {
		try {
			const { id } = req.params;
			let { index } = req.body;
			index = Number(index);

			const documents =
				req.files && req.files.documents ? req.files.documents : [];
			const documentName = req.body[`documents[${index}][name]`];

			if (!documentName) {
				return res.status(400).json({
					message: `Missing name for document at index ${index}`,
					success: false,
				});
			}

			const updatedDocument = [];

			if (documents.length > 0) {
				for (const document of documents) {
					const fileBuffer = document.buffer;
					const fileName = `${Date.now()}-${document.originalname}`;

					// Upload document to Bunny.net
					const uploadResult = await uploadToBunny(
						fileBuffer,
						fileName
					);

					if (uploadResult.success) {
						updatedDocument.push({
							name: documentName,
							image: uploadResult.cdnUrl,
						});
					} else {
						return res.status(500).json({
							message: `Failed to upload document: ${document.originalname}`,
							success: false,
						});
					}
				}

				// Update the specific document in the database
				const orderDetails = await OrderDetails.findById(id);
				if (!orderDetails) {
					return res.status(404).json({
						message: "Order details not found",
						success: false,
					});
				}

				if (!orderDetails.documents[index]) {
					return res.status(400).json({
						message: `Document at index ${index} does not exist`,
						success: false,
					});
				}

				// Update the specific document
				orderDetails.documents[index] = updatedDocument[0];
				await orderDetails.save();

				return res.status(200).json({
					data: orderDetails.documents[index],
					message: "Document image updated successfully",
					success: true,
				});
			} else {
				return res.status(400).json({
					message: "No documents provided",
					success: false,
				});
			}
		} catch (error) {
			console.error("Error in editOrderDetailsImage:", error);
			return res.status(500).json({
				error: error.message,
				message: "Internal Server Error",
				success: false,
			});
		}
	},

	async processVisaOrder(req, res) {
		// sent-to-immigration
		try {
			const { id } = req.params;

			const { description, status } = await req.body;

			const document =
				req.files && req.files.documents
					? req.files.documents[0]
					: null;
			let updatdeData = { status };

			if (description) {
				updatdeData.description = description;
			}

			if (document) {
				// Upload document to Bunny.net directly
				const fileBuffer = document.buffer;
				const fileName = `${Date.now()}-${document.originalname}`;
				const uploadResult = await uploadToBunny(fileBuffer, fileName);
				if (uploadResult.success) {
					updatdeData.document = uploadResult.cdnUrl;
				} else {
					throw new Error(
						`Failed to upload document: ${document.originalname}`
					);
				}
			}

			const visaOrder = await VisaOrder.findByIdAndUpdate(
				id,
				updatdeData,
				{
					new: true,
				}
			);

			// If needed, add notifications using uploadQueue or similar here

			return res.status(200).json({
				data: visaOrder,
				message: "Visa Order updated",
				success: true,
			});
		} catch (error) {
			return res.status(500).json({
				error: error.message,
				message: "Internal Server Error",
				success: false,
			});
		}
	},

	async getDraftVisaOrders(req, res) {
		try {
			const { page, limit, status } = req.query;
			const { skip, take } = paginate(page, limit);

			let query = { isSubmitted: false };

			const totalItems = await VisaOrder.countDocuments(query);
			const totalPages = Math.ceil(totalItems / take);
			let startNumber;
			let visaOrders;
			if (page !== undefined && page !== null) {
				startNumber = (page - 1) * take + 1;
				visaOrders = await VisaOrder.find()
					.populate("user")
					.skip(skip)
					.limit(take)
					.sort({ createdAt: -1 });
				visaOrders = visaOrders.map((visaOrder, index) => {
					return {
						...visaOrder.toObject(),
						s_no: startNumber + index,
					};
				});
			} else {
				startNumber = 1;
				visaOrders = await VisaOrder.find()
					.populate("user")
					.sort({ createdAt: -1 });
				visaOrders = visaOrders.map((visaOrder, index) => {
					return {
						...visaOrder.toObject(),
						s_no: startNumber + index,
					};
				});
			}

			return res.status(200).json({
				data: visaOrders,
				message: "Visa Orders fetched successfully",
				success: true,
				totalPages,
			});
		} catch (error) {
			return res.status(500).json({
				error: error.message,
				message: "Internal Server Error",
				success: false,
			});
		}
	},
};
