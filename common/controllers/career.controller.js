const Career = require("../models/carrer.model");
const uploadImages = require("../../utils/uploadImages");
const paginate = require("../../utils/paginate");
const uploadToBunny = require("../../utils/uploadToBunny");
const sendMail = require("../../utils/sendMail");
const { notificationQueue } = require("../../queue/notification.queue");

module.exports = {
  async addCareer(req, res) {
    try {
      let data = req.body;
      const resume =
        req.files && req.files.documents ? req.files.documents[0] : null;

      let url = null;

      if (resume) {
        const fileBuffer = resume.buffer;
        const fileName = `${Date.now()}-${resume.originalname}`;
        const uploadImage = await uploadToBunny(fileBuffer, fileName);
        if (uploadImage.success) {
          data.resume = uploadImage.cdnUrl;
        }
      }

      const career = await Career.create(data);

      const mailData = {
        email: data.email,
        subject: "For Career",
        text: `<p>We have successfully received your submission. Our team will review your application and get in touch with you if your qualifications match our current openings. We appreciate your interest in joining our team and will keep your information on file for future opportunities.</p>
        <br>
        <br>
        If you have any questions, feel free to contact us at info@chaloghoomne.com or +91 9555-535-252.`,
      };

      await sendMail(mailData);

      // let images = [];

      // if (resume) {
      //   images.push({
      //     buffer: resume.buffer,
      //     originalname: resume.originalname,
      //     mimetype: resume.mimetype,
      //     filename: resume.filename,
      //     id: career._id,
      //     modelName: "Career",
      //     field: "resume",
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

      const jobId = `notification-${Date.now()}`;
      await notificationQueue.add(jobId, {
        title: "New Career Submission Added",
        body: "A new career form has been submitted. Check it out!",
        image: null,
        adminId: true,
      });

      return res.status(201).json({
        message: "Career created successfully",
        success: true,
        data: career,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async editCareer(req, res) {
    try {
      const { id } = req.params.id;

      const data = req.body;
      const resume =
        req.files && req.files.documents ? req.files.documents[0] : null;

      let url = null;

      let career;

      career = await Career.findById(id);

      if (!career) {
        return res.status(404).json({
          message: "Career not found",
          success: false,
        });
      }

      if (resume) {
        const fileBuffer = resume.buffer;
        const fileName = `${Date.now()}-${resume.originalname}`;
        const uploadImage = await uploadToBunny(fileBuffer, fileName);
        if (uploadImage.success) {
          data.resume = uploadImage.cdnUrl;
        }
      }

      career = await Career.findById(id);

      // let images = [];

      // if (resume) {
      //   images.push({
      //     buffer: resume.buffer,
      //     originalname: resume.originalname,
      //     mimetype: resume.mimetype,
      //     filename: resume.filename,
      //     id: id,
      //     modelName: "Career",
      //     field: "resume",
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
        message: "Career updated successfully",
        success: true,
        data: career,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async getAllCareers(req, res) {
    try {
      const { page, limit } = req.body;
      const { skip, take } = paginate(page, limit);

      const totalItems = await Career.countDocuments();
      const totalPages = Math.ceil(totalItems / take);
      const startNumber = (page ? (page - 1) * take : 0) + 1;

      let careers = await Career.find()
        .skip(skip)
        .limit(take)
        .sort({ createdAt: -1 });

      careers = careers.map((item, index) => ({
        ...item._doc,
        s_no: startNumber + index,
      }));

      return res.status(200).json({
        message: "Careers fetched successfully",
        success: true,
        data: { careers, totalPages },
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

  async getCareerById(req, res) {
    try {
      const { id } = req.params;

      const career = await Career.findById(id);

      if (!career) {
        return res.status(404).json({
          message: "Career not found",
          success: false,
        });
      }

      return res.status(200).json({
        message: "Career fetched successfully",
        success: true,
        data: career,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async deleteCareer(req, res) {
    try {
      const { id } = req.params;

      const career = await Career.findByIdAndDelete(id);

      if (!career) {
        return res.status(404).json({
          message: "Career not found",
          success: false,
        });
      }

      return res.status(200).json({
        message: "Career deleted successfully",
        success: true,
        data: career,
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
