const Package = require("../models/package.model");
const packageValidators = require("../../validators/package.validators");
const paginate = require("../../utils/paginate");
const { uploadQueue } = require("../../queue/upload.queue");
const uploadImages = require("../../utils/uploadImages");
const uploadToBunny = require("../../utils/uploadToBunny");

module.exports = {
  async addPackage(req, res) {
    try {
      let data = req.body;
      data.price = data.price ? Number(data.price) : data.price;

      const image = req.files && req.files.image ? req.files.image[0] : null;
      // const tourTypeImages =
      //   req.files && req.files.tourTypes ? req.files.tourTypes : [];
      const documents =
        req.files && req.files.documents ? req.files.documents : null;
      // Check if a package with the same country already exists
      const countryExist = await Package.findOne({ country: data.country });
      if (countryExist) {
        return res
          .status(400)
          .json({ message: "Country already exists", success: false });
      }

      if (image) {
        const fileBuffer = image.buffer;
        const fileName = `${Date.now()}-${image.originalname}`;
        const uploadImage = await uploadToBunny(fileBuffer, fileName);
        if (uploadImage.success) {
          data.image = uploadImage.cdnUrl;
        }
      }

      if (documents) {
        const documentUploads = await Promise.all(
          documents.map(async (document, index) => {
            const fileBuffer = document.buffer;
            const fileName = `${Date.now()}-${document.originalname}`;

            // Extract the document name from the data object
            const documentName =
              data.documents[index]?.name || document.originalname;

            const uploadDocument = await uploadToBunny(fileBuffer, fileName);
            if (uploadDocument.success) {
              return {
                name: documentName, // Use the name from form data if available
                image: uploadDocument.cdnUrl,
              };
            }
            return null; // Handle failed uploads
          })
        );

        // Filter out failed uploads
        data.documents = documentUploads.filter((doc) => doc !== null);
      }

      // Create a new package document
      const newPackage = await Package.create(data);
      // const images = [];

      // Handle the main package image
      // if (image) {
      //   images.push({
      //     buffer: image.buffer,
      //     originalname: image.originalname,
      //     mimetype: image.mimetype,
      //     filename: image.filename,
      //     id: newPackage._id,
      //     modelName: "Package",
      //     field: "image",
      //   });
      // }

      // Handle tour type images
      // if (tourTypeImages) {
      //   tourTypeImages.forEach((tourTypeImage, index) => {
      //     images.push({
      //       buffer: tourTypeImage.buffer,
      //       originalname: tourTypeImage.originalname,
      //       mimetype: tourTypeImage.mimetype,
      //       filename: tourTypeImage.filename,
      //       id: newPackage._id,
      //       modelName: "Package",
      //       field: `tourTypes.${index}.image`,
      //     });
      //   });
      // }

      // if (documents) {
      //   documents.forEach((document, index) => {
      //     images.push({
      //       buffer: document.buffer,
      //       originalname: document.originalname,
      //       mimetype: document.mimetype,
      //       filename: document.filename,
      //       id: newPackage._id,
      //       modelName: "Package",
      //       field: `documents.${index}.image`,
      //     });
      //   });
      // }

      // // Upload all images
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
        data: newPackage,
        message: "Package added successfully",
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

  async getPackages(req, res) {
    try {
      const { page, limit, country } = req.query; // Default page and limit
      const { skip, take } = paginate(page, limit);

      const regex = country ? new RegExp(country, "i") : null;
      const query = country ? { country: regex } : {};
      const totalItems = await Package.countDocuments(query);
      const startNumber = (page ? (page - 1) * take : 0) + 1;

      // Fetch top-ranked packages (1 to 30)
      const topRankedPackages = await Package.find({
        rank: { $gte: 1, $lte: 30 },
        ...query,
      })
        .populate("tourTypes")
        .sort({ rank: 1 }); // Sort by rank ascending

      // Fetch all other packages sorted by createdAt
      const otherPackages = await Package.find({
        $or: [{ rank: null }, { rank: { $exists: false } }],
        ...query,
      })
        .populate("tourTypes")
        .sort({ createdAt: -1 });

      // Combine both top-ranked and other packages
      // Combine both top-ranked and other packages
      let combinedPackages = [...topRankedPackages, ...otherPackages];

      // If page is valid (not NaN and not undefined or null), apply pagination
      if (page && !isNaN(page) && page !== null && page !== undefined) {
        const { skip, take } = paginate(page, limit);
        // Apply pagination by slicing the combined packages
        combinedPackages = combinedPackages.slice(skip, skip + take);
      }

      if (combinedPackages.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No packages found",
        });
      }

      // If a country filter is applied, sort the packages based on their country position
      if (country) {
        combinedPackages.sort((a, b) => {
          const posA = a.country.toLowerCase().indexOf(country.toLowerCase());
          const posB = b.country.toLowerCase().indexOf(country.toLowerCase());
          return posA - posB;
        });
      }

      combinedPackages = combinedPackages.map((item, index) => {
        return {
          ...item.toObject(),
          s_no: startNumber + index,
        };
      });

      // Calculate totalPages only if pagination was applied
      const totalPages =
        page && !isNaN(page) && page !== "null" && page !== "undefined"
          ? Math.ceil(totalItems / take)
          : 1; // If no pagination, consider only one page

      return res.status(200).json({
        data: combinedPackages,
        message: "Packages fetched successfully",
        success: true,
        totalPages, // Total pages based on combined result length
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },
  async getPackageById(req, res) {
    try {
      const id = req.params.id;
      const package = await Package.findById(id).populate("tourTypes");
      if (!package) {
        return res.status(404).json({
          message: "Package not found",
          success: false,
        });
      }
      return res.status(200).json({
        data: package,
        message: "Package fetched successfully",
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

  async editPackage(req, res) {
    try {
      const id = req.params.id;
      const data = req.body;
      data.price = data.price ? Number(data.price) : data.price;
      const image = req.files && req.files.image ? req.files.image[0] : null;
      // const tourTypeImages =
      //   req.files && req.files.tourTypes ? req.files.tourTypes : [];

      // Find the package by ID
      const existingPackage = await Package.findById(id);
      if (!existingPackage) {
        return res.status(404).json({
          message: "Package not found",
          success: false,
        });
      }

      // Update the package data (excluding images)
      const updatedData = { ...data };

      // Prepare an array for images to be uploaded
      // const images = [];

      // If a new main image is uploaded, replace the existing one
      if (image) {
        const fileBuffer = image.buffer;
        const fileName = `${Date.now()}-${image.originalname}`;
        const uploadImage = await uploadToBunny(fileBuffer, fileName);
        if (uploadImage.success) {
          updatedData.image = uploadImage.cdnUrl;
        }
      } else {
        // If no new image is provided, keep the existing image
        updatedData.image = existingPackage.image;
      }

      // // If new tourType images are uploaded, update them; otherwise, retain the old ones
      // if (tourTypeImages.length > 0) {
      //   tourTypeImages.forEach((tourTypeImage, index) => {
      //     images.push({
      //       buffer: tourTypeImage.buffer,
      //       originalname: tourTypeImage.originalname,
      //       mimetype: tourTypeImage.mimetype,
      //       filename: tourTypeImage.filename,
      //       id: existingPackage._id,
      //       modelName: "Package",
      //       field: `tourTypes.${index}.image`,
      //     });
      //   });
      // } else {
      //   // If no new tourType images are provided, keep the existing ones
      //   updatedData.tourTypes = existingPackage.tourTypes;
      // }

      // Update the package with new data
      const updatedPackage = await Package.findByIdAndUpdate(
        id,
        { $set: updatedData },
        {
          new: true,
        }
      );

      // Upload the new images (if any)
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

      return res.status(200).json({
        data: updatedPackage,
        message: "Package updated successfully",
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

  async editImage(req, res) {
    try {
      let { index } = req.body;
      const { id } = req.params;
      const tourTypeImages =
        req.files && req.files.tourTypes ? req.files.tourTypes : [];
      index = Number(index);

      if (tourTypeImages.length === 0) {
        return res.status(400).json({
          message: "No images provided",
          success: false,
        });
      }

      // Handle tour type images
      const uploadedImages = await Promise.all(
        tourTypeImages.map(async (tourTypeImage) => {
          const fileBuffer = tourTypeImage.buffer;
          const fileName = `${Date.now()}-${tourTypeImage.originalname}`;

          // Upload to Bunny.net
          const uploadResult = await uploadToBunny(fileBuffer, fileName);
          if (uploadResult.success) {
            return uploadResult.cdnUrl;
          } else {
            throw new Error(
              `Failed to upload image: ${tourTypeImage.originalname}`
            );
          }
        })
      );

      // Update the specific field in the database
      const updatedField = `tourTypes.${index}.image`;
      const updateData = {};
      updateData[updatedField] = uploadedImages[0]; // Assuming one image per request
      await Package.findByIdAndUpdate(id, { $set: updateData });

      return res.status(200).json({
        data: uploadedImages[0],
        message: "Image updated successfully",
        success: true,
      });
    } catch (error) {
      console.error("Error in editImage:", error);
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async editDocumentImage(req, res) {
    try {
      let { index } = req.body;
      const { id } = req.params;
      const documents =
        req.files && req.files.documents ? req.files.documents : [];
      index = Number(index);

      if (documents.length === 0) {
        return res.status(400).json({
          message: "No document images provided",
          success: false,
        });
      }

      // Upload documents to Bunny.net
      const uploadedImages = await Promise.all(
        documents.map(async (document) => {
          const fileBuffer = document.buffer;
          const fileName = `${Date.now()}-${document.originalname}`;

          // Upload to Bunny.net
          const uploadResult = await uploadToBunny(fileBuffer, fileName);
          if (uploadResult.success) {
            return uploadResult.cdnUrl;
          } else {
            throw new Error(
              `Failed to upload document image: ${document.originalname}`
            );
          }
        })
      );

      // Update the specific field in the database
      const updatedField = `documents.${index}.image`;
      const updateData = {};
      updateData[updatedField] = uploadedImages[0]; // Assuming one document image per request
      await Package.findByIdAndUpdate(id, { $set: updateData });

      return res.status(200).json({
        data: uploadedImages[0],
        message: "Document image updated successfully",
        success: true,
      });
    } catch (error) {
      console.error("Error in editDocumentImage:", error);
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async deletePackage(req, res) {
    try {
      const id = req.params.id;
      const package = await Package.findById(id);
      if (!package) {
        return res.status(404).json({
          message: "Package not found",
          success: false,
        });
      }
      await Package.findByIdAndDelete(id);
      return res.status(200).json({
        message: "Package deleted successfully",
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

  async rankPackage(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;

      const checkExistingRank = await Package.findOne({ rank: data.rank });

      if (!checkExistingRank) {
        const updatedPackage = await Package.findByIdAndUpdate(
          id,
          { $set: data },
          {
            new: true,
          }
        );
        return res.status(200).json({
          data: updatedPackage,
          message: "Package updated successfully",
          success: true,
        });
      } else {
        checkExistingRank.rank = null;
        await checkExistingRank.save();
        const updatedPackage = await Package.findByIdAndUpdate(
          id,
          { $set: data },
          {
            new: true,
          }
        );
        return res.status(200).json({
          data: updatedPackage,
          message: "Package updated successfully",
          success: true,
        });
      }
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },
};
