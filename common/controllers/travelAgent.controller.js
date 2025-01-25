const TravelAgent = require("../models/travelAgent.model");
const paginate = require("../../utils/paginate");

module.exports = {
  async addTravelAgent(req, res) {
    try {
      const data = req.body;

      const travelAgent = await TravelAgent.create(data);

      return res.status(201).json({
        message: "Travel Agent created successfully",
        success: true,
        data: travelAgent,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async editTravelAgent(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;

      const travelAgent = await TravelAgent.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true }
      );

      return res.status(201).json({
        message: "Travel Agent updated successfully",
        success: true,
        data: travelAgent,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async getTravelAgents(req, res) {
    try {
      const { page, limit } = req.body;
      const { skip, take } = paginate(page, limit);

      const totalItems = await TravelAgent.countDocuments();
      const totalPages = Math.ceil(totalItems / take);
      const startNumber = (page ? (page - 1) * take : 0) + 1;

      let travelAgents = await TravelAgent.find()
        .skip(skip)
        .limit(take)
        .sort({ createdAt: -1 });

      travelAgents = travelAgents.map((item, index) => ({
        ...item._doc,
        s_no: startNumber + index,
      }));

      return res.status(200).json({
        message: "Travel Agents fetched successfully",
        success: true,
        data: { travelAgents, totalPages },
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

  async getTravelAgentById(req, res) {
    try {
      const { id } = req.params;

      const travelAgent = await TravelAgent.findById(id);

      if (!travelAgent) {
        return res.status(404).json({
          message: "Travel Agent not found",
          success: false,
        });
      }

      return res.status(200).json({
        message: "Travel Agent fetched successfully",
        success: true,
        data: travelAgent,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async deleteTravelAgent(req, res) {
    try {
      const { id } = req.params;

      const travelAgent = await TravelAgent.findByIdAndDelete(id);

      if (!travelAgent) {
        return res.status(404).json({
          message: "Travel Agent not found",
          success: false,
        });
      }

      return res.status(200).json({
        message: "Travel Agent deleted successfully",
        success: true,
        data: travelAgent,
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
