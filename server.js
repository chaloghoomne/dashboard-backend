require("dotenv/config");
const express = require("express");
const cors = require("cors");
const connectDB = require("./db/connection");
// const morgan = require("morgan");
// const logger = require("./utils/logger");
const decryptionMiddleware = require("./middlewares/decryptionMiddleware");
// const parserMiddleware = require("./middlewares/parserMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
// app.use(decryptionMiddleware);
// app.use(parserMiddleware);

// const morganFormat = ":method :url :status :response-time ms";

// app.use(
//   morgan(morganFormat, {
//     stream: {
//       write: (message) => {
//         const logObject = {
//           method: message.split(" ")[0],
//           url: message.split(" ")[1],
//           status: message.split(" ")[2],
//           responseTime: message.split(" ")[3],
//         };
//         logger.info(JSON.stringify(logObject));
//       },
//     },
//   })
// );

/*===================================================ADMIN ROUTES===================================================== */
const adminAuthRoutes = require("./admin/routes/adminAuth.routes");
const adminNotificationRoutes = require("./admin/routes/adminNotification.routes");
const adminUserRoutes = require("./admin/routes/adminUsers.routes");

app.use("/api/v1", adminAuthRoutes);
app.use("/api/v1", adminNotificationRoutes);
app.use("/api/v1", adminUserRoutes);

/*===================================================USER ROUTES===================================================== */
const userAuthRoutes = require("./user/routes/userAuth.routes");
const userNotificationRoutes = require("./user/routes/userNotification.routes");

app.use("/api/v1", userAuthRoutes);
app.use("/api/v1", userNotificationRoutes);

/*===================================================OTHER ROUTES===================================================== */
const packageRoutes = require("./common/routes/package.routes");
const visaCategoryRoutes = require("./common/routes/visaCategory.routes");
const notesRoutes = require("./common/routes/notes.routes");
const pageTypeRoutes = require("./common/routes/pageType.routes");
const partnerRoutes = require("./common/routes/partner.routes");
const orderDetailsRoutes = require("./common/routes/orderDetails.routes");
const paymentRoutes = require("./common/routes/payment.routes");
const dashboardRouter = require("./common/routes/dashboard.routes");
const packageNotesRoutes = require("./common/routes/packageNotes.routes");
const subscriptionRoutes = require("./common/routes/subscription.routes");
const documentRoutes = require("./common/routes/document.routes");
const tourTypesRoutes = require("./common/routes/tourTypes.routes");
const blogRoutes = require("./common/routes/blog.routes");
const pagesRoutes = require("./common/routes/pages.routes");
const careerRoutes = require("./common/routes/career.routes");
const aboutRoutes = require("./common/routes/about.routes");
const contactRoutes = require("./common/routes/contact.routes");
const travelAgentRoutes = require("./common/routes/travelAgent.routes");
const getImagesRoues = require("./common/routes/getImages.routes");

app.use("/api/v1", packageRoutes);
app.use("/api/v1", visaCategoryRoutes);
app.use("/api/v1", notesRoutes);
app.use("/api/v1", pageTypeRoutes);
app.use("/api/v1", partnerRoutes);
app.use("/api/v1", orderDetailsRoutes);
app.use("/api/v1", paymentRoutes); // TODO
app.use("/api/v1", dashboardRouter); // TODO
app.use("/api/v1", packageNotesRoutes);
app.use("/api/v1", subscriptionRoutes);
app.use("/api/v1", documentRoutes);
app.use("/api/v1", tourTypesRoutes);
app.use("/api/v1", blogRoutes);
app.use("/api/v1", pagesRoutes);
app.use("/api/v1", careerRoutes);
app.use("/api/v1", aboutRoutes);
app.use("/api/v1", travelAgentRoutes);
app.use("/api/v1", contactRoutes);
app.use("/api/v1", getImagesRoues);

/*===================================================QUEUE WORKER===================================================== */
// const { notificationQueueWorker } = require("./queue/notification.queue");
// const { uploadQueueWorker } = require("./queue/upload.queue");

// notificationQueueWorker()
//   .then(() => {
//     console.log("Notification Queue Worker Started");
//   })
//   .catch((error) => {
//     console.log(`Error in Notification Queue Worker: ${error.message}`);
//   });

// uploadQueueWorker()
//   .then(() => {
//     console.log("Upload Queue Worker Started");
//   })
//   .catch((error) => {
//     console.log(`Error in Upload Queue Worker: ${error.message}`);
//   });

connectDB()
	.then(() => {
		app.listen(process.env.PORT || 6000, () => {
			console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
		});
	})
	.catch((error) => {
		console.log(`Error in database connection: ${error.message}`);
	});
