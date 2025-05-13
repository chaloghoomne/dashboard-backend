require("dotenv/config");
const express = require("express");
const cors = require("cors");
const connectDB = require("./db/connection");
// const morgan = require("morgan");
// const logger = require("./utils/logger");
const decryptionMiddleware = require("./middlewares/decryptionMiddleware");
// const parserMiddleware = require("./middlewares/parserMiddleware");

const app = express();

// Configure CORS with specific origins and options
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://www.chaloghoomne.com',
      'https://chaloghoomne.com'
    ];
    
    // Allow requests with no origin (like mobile apps, curl requests, etc.)
    if (!origin) return callback(null, true);
    
    // Allow localhost in development
    if (process.env.NODE_ENV === 'development' && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  credentials: true,
  maxAge: 86400 // 24 hours in seconds
};

// Apply CORS configuration to all routes
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

// Add CORS error handler
app.use((err, req, res, next) => {
  if (err.message.includes('CORS')) {
    console.error(`CORS Error: ${err.message} - Origin: ${req.headers.origin}`);
    return res.status(403).json({
      success: false,
      message: 'CORS Error: Request origin not allowed',
      error: err.message
    });
  }
  next(err);
});

// app.use(express.json({ limit: '50mb' }));


app.use(express.json({ limit: '50mb' }));  // Set the JSON body limit to 50mb
app.use(express.urlencoded({ extended: true, limit: '50mb' }));  // Set the URL-encoded body limit to 50mb

// Handle 404 - Not Found
// app.use((req, res, next) => {
//     res.status(404).json({ success: false, message: "404 Not Found" });
// });

// Handle 503 - Service Unavailable
app.use((err, req, res, next) => {
    if (err.status === 503) {
        res.status(503).json({ success: false, message: "503 Service Unavailable" });
    } else {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

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
