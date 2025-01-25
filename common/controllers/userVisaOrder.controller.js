const OrderDetails = require("../models/orderDetails.model");
const VisaOrder = require("../models/visaOrder.model");
const { uploadQueue } = require("../../queue/upload.queue");
const VisaCategory = require("../models/visaCategory.model");
const Package = require("../models/package.model");
const paginate = require("../../utils/paginate");
const uploadImages = require("../../utils/uploadImages");
const uploadToBunny = require("../../utils/uploadToBunny");

module.exports = {
  async createVisaOrder(req, res) {
    try {
      const data = req.body;
      const visaCategory = await VisaCategory.findById(data.visaCategory);

      if (!visaCategory) {
        return res.status(404).json({
          message: "Visa Category Not Found",
          success: false,
        });
      }

      const visaOrder = await VisaOrder.create({
        ...data,
        user: req.user.id,
      });

      const orderDetails = await OrderDetails.create({
        visaOrder: visaOrder._id,
      });

      return res.status(201).json({
        data: { visaOrder, orderDetails },
        message: "Visa Order and Initial Order Details Created Successfully",
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
      const { id } = req.body;

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

      const visaOrder = await Promise.all(
        result.map(async (order) => {
          if (order?.visaCategory?.package) {
            const { country, tourTypes } = order?.visaCategory?.package;
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
          }
        })
      );

      return res.status(200).json({
        data: visaOrder,
        message: "Visa Orders Fetched Successfully",
        success: true,
      });
    } catch (error) {
      console.log(error);
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
            throw new Error(`Missing name for document at index ${index}`);
          }

          const fileBuffer = document.buffer;
          const fileName = `${Date.now()}-${document.originalname}`;

          // Upload document to Bunny.net
          const uploadResult = await uploadToBunny(fileBuffer, fileName);
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
      const { visaOrderId } = req.params;
      const orderDetails = await OrderDetails.find({
        visaOrder: visaOrderId,
      }).populate("visaOrder");

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

  async editOrderDetails(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;

      const documents =
        req.files && req.files.documents ? req.files.documents : [];
      const updatedDocuments = [];

      // Update basic order details
      const orderDetails = await OrderDetails.findById(id);
      if (!orderDetails) {
        return res.status(404).json({
          message: "Order details not found",
          success: false,
        });
      }

      // Handle document uploads
      if (documents.length > 0) {
        for (let index = 0; index < documents.length; index++) {
          const document = documents[index];
          const documentName = data[`documents[${index}][name]`]; // Get document name from the request body

          if (!documentName) {
            throw new Error(`Missing name for document at index ${index}`);
          }

          const fileBuffer = document.buffer;
          const fileName = `${Date.now()}-${document.originalname}`;

          // Upload document to Bunny.net
          const uploadResult = await uploadToBunny(fileBuffer, fileName);
          if (uploadResult.success) {
            updatedDocuments.push({
              name: documentName,
              image: uploadResult.cdnUrl,
            });
          } else {
            throw new Error(
              `Failed to upload document: ${document.originalname}`
            );
          }
        }

        // Update the `documents` field in the database
        orderDetails.documents = updatedDocuments;
      }

      // Update other fields provided in the request body
      Object.keys(data).forEach((key) => {
        if (key !== "documents") {
          orderDetails[key] = data[key];
        }
      });

      // Save the updated order details
      await orderDetails.save();

      return res.status(200).json({
        data: orderDetails,
        message: "Visa Order Updated Successfully",
        success: true,
      });
    } catch (error) {
      console.error("Error in editOrderDetails:", error);
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async getAllVisaOrders(req, res) {
    try {
      const { page, limit, status } = req.query;
      const { skip, take } = paginate(page, limit);

      let query = { isSubmitted: true };

      if (status === "approved" || status === "rejected") {
        query.status = { $in: ["approved", "rejected"] };
      } else if (status === "pending" || status === "sent-back") {
        query.status = { $in: ["pending", "sent-back"] };
      } else if (status) {
        query.status = status;
      }

      const totalItems = await VisaOrder.countDocuments(query);
      const totalPages = Math.ceil(totalItems / take);
      let startNumber;
      let visaOrders;
      if (page && page !== undefined && page !== null) {
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
      console.log(error);
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
          const uploadResult = await uploadToBunny(fileBuffer, fileName);

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
    try {
      const { id } = req.params;
      const { description, status } = req.body;
      const document =
        req.files && req.files.documents ? req.files.documents[0] : null;
      let documents = [];

      let updatdeData = { status };

      if (description) {
        updatdeData.description = description;
      }

      if (document) {
        documents.push({
          buffer: document.buffer,
          originalname: document.originalname,
          mimetype: document.mimetype,
          filename: document.filename,
          id: id,
          modelName: "VisaOrder",
          field: "document",
        });
      }
      console.log(documents);

      if (documents.length > 0) {
        uploadImages(documents)
          .then((results) => {
            console.log("All uploads completed", results);
          })
          .catch((error) => {
            console.error("Error in batch upload:", error);
          });
      }

      const visaOrder = await VisaOrder.findByIdAndUpdate(id, updatdeData, {
        new: true,
      });

      const jobId = `notification-${Date.now()}`;
      await notificationQueue.add(jobId, {
        title: "Visa Order Updated",
        body: `Your visa order has been updated. Check it out!`,
        image: null,
        userIds: [visaOrder.user],
      });

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
      if (page && page !== undefined && page !== null) {
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
      console.log(error);
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },
};
