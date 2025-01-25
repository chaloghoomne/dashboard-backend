const Notes = require("../models/notes.model");
const { uploadQueue } = require("../../queue/upload.queue");
const paginate = require("../../utils/paginate");
const uploadImages = require("../../utils/uploadImages");
const uploadToBunny = require("../../utils/uploadToBunny");
const Package = require("../models/package.model");

module.exports = {
  async addNotes(req, res) {
    try {
      const data = req.body;
      const image = req.files && req.files.image ? req.files.image[0] : null;

      if (image) {
        const fileBuffer = image.buffer;
        const fileName = `${Date.now()}-${image.originalname}`;
        const uploadImage = await uploadToBunny(fileBuffer, fileName);
        if (uploadImage.success) {
          data.image = uploadImage.cdnUrl;
        }
      }

      const newNote = await Notes.create(data);

      // const images = [];

      // if (image) {
      //   images.push({
      //     buffer: image.buffer,
      //     originalname: image.originalname,
      //     mimetype: image.mimetype,
      //     filename: image.filename,
      //     id: newNote._id,
      //     modelName: "Note",
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
        data: newNote,
        message: "Note added successfully",
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

  async getNotes(req, res) {
    try {
      const { page, limit } = req.query;
      const { skip, take } = paginate(page, limit);

      const totalItems = await Notes.countDocuments();
      const totalPages = Math.ceil(totalItems / take);

      let notes;
      let startNumber;

      if (page && page !== undefined && page !== null) {
        startNumber = (page - 1) * take + 1;
        notes = await Notes.find()
          .skip(skip)
          .limit(take)
          .sort({ createdAt: -1 });

        notes = await Promise.all(
          notes.map(async (note, index) => {
            const packageData = await Package.findById(note.packageId);
            return {
              ...note.toObject(),
              packageName: packageData ? packageData.country : "N/A",
              s_no: startNumber + index,
            };
          })
        );
      } else {
        startNumber = 1;

        notes = await Notes.find().sort({ createdAt: -1 });

        notes = await Promise.all(
          notes.map(async (note, index) => {
            const packageData = await Package.findById(note.packageId);
            return {
              ...note.toObject(),
              packageName: packageData ? packageData.country : "N/A",
              s_no: startNumber + index,
            };
          })
        );
      }

      return res.status(200).json({
        data: notes,
        message: "Notes fetched successfully",
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

  async deleteNote(req, res) {
    try {
      const id = req.params.id;
      const note = await Notes.findByIdAndDelete(id);
      if (!note) {
        return res.status(404).json({
          message: "Note not found",
          success: false,
        });
      }
      return res.status(200).json({
        message: "Note deleted successfully",
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

  async getNoteByType(req, res) {
    try {
      const type = req.params.type;
      const notes = await Notes.findOne({ type: type });
      return res.status(200).json({
        data: notes,
        message: "Notes fetched successfully",
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

  async getNoteById(req, res) {
    try {
      const id = req.params.id;
      const note = await Notes.findById(id);
      if (!note) {
        return res.status(404).json({
          message: "Note not found",
          success: false,
        });
      }
      return res.status(200).json({
        data: note,
        message: "Note fetched successfully",
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

  async editNote(req, res) {
    try {
      const id = req.params.id;
      let data = req.body;
      const image = req.files && req.files.image ? req.files.image[0] : null;
      let note;

      if (image) {
        const fileBuffer = image.buffer;
        const fileName = `${Date.now()}-${image.originalname}`;
        const uploadImage = await uploadToBunny(fileBuffer, fileName);
        if (uploadImage.success) {
          data.image = uploadImage.cdnUrl;
        }
      }

      note = await Notes.findByIdAndUpdate(id, data, {
        new: true,
      });

      // const images = [];

      // if (image) {
      //   images.push({
      //     buffer: image.buffer,
      //     originalname: image.originalname,
      //     mimetype: image.mimetype,
      //     filename: image.filename,
      //     id: id,
      //     modelName: "Note",
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

      if (!note) {
        return res.status(404).json({
          message: "Note not found",
          success: false,
        });
      }

      return res.status(200).json({
        data: note,
        message: "Note updated successfully",
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

  async getNotesByPackage(req, res) {
    try {
      const { packageId } = req.params;
      const notes = await Notes.find({ packageId: packageId });

      const package = await Package.findById(packageId);

      notes.map((note) => {
        return { ...note.toObject(), packageName: package.country };
      });

      return res.status(200).json({
        data: notes,
        message: "Notes fetched successfully",
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
};
