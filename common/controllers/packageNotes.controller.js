const paginate = require("../../utils/paginate");
const PackageNote = require("../models/packageNotes.model");

module.exports = {
  async addPackageNotes(req, res) {
    try {
      const data = req.body;

      const newNote = await PackageNote.create(data);

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

  async getPackageNotes(req, res) {
    try {
      const { page, limit } = req.query;
      const { skip, take } = paginate(page, limit);

      const totalItems = await PackageNote.countDocuments();
      const totalPages = Math.ceil(totalItems / take);

      let notes;
      let startNumber;

      if (page && page !== undefined && page !== null) {
        startNumber = (page - 1) * take + 1;
        notes = await PackageNote.find()
          .skip(skip)
          .limit(take)
          .sort({ createdAt: -1 });

        notes = await Promise.all(
          notes.map(async (note, index) => {
            return {
              ...note.toObject(),
              s_no: startNumber + index,
            };
          })
        );
      } else {
        startNumber = 1;

        notes = await PackageNote.find().sort({ createdAt: -1 });

        notes = await Promise.all(
          notes.map(async (note, index) => {
            return {
              ...note.toObject(),
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

  async deletePackageNotes(req, res) {
    try {
      const id = req.params.id;
      const note = await PackageNote.findByIdAndDelete(id);
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

  async getPackageNotesByType(req, res) {
    try {
      const type = req.params.type;
      const notes = await PackageNote.find({ type: type }).sort({
        createdAt: -1,
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

  async getPackageNoteById(req, res) {
    try {
      const id = req.params.id;
      const note = await PackageNote.findById(id);
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

  async editPackageNote(req, res) {
    try {
      const id = req.params.id;
      const data = req.body;

      let note;

      note = await PackageNote.findByIdAndUpdate(id, data, {
        new: true,
      });

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
};
