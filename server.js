const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
dotenv.config({ path: './.env' });

// DB 
const connectDB = require('./config/db');
const createDefaultSuperAdmin = require('./config/defaultAdmin');

// Swagger
const { swaggerUI, swaggerSpec } = require('./config/swagger');

const app = express();
app.get('/api/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;

  if (dbState === 1) {
    return res.status(200).json({
      status: 'ok',
      database: 'connected'
    });
  }

  return res.status(503).json({
    status: 'error',
    database: 'disconnected'
  });
});

// Middleware
app.use(cookieParser());
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Mongoose setup
mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("✅ Connected to MongoDB");

  // Create default super admin only after DB is connected
  createDefaultSuperAdmin();

  // Start server
const PORT = process.env.PORT || 80;
  app.listen(PORT, () => {
    console.log(`🚀 Server started at port ${PORT}`);
  });

})
.catch((error) => {
  console.error("❌ MongoDB connection error:", error);
});

// Swagger docs
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

// Routes
app.use('/api/session', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/agencies', require('./routes/agencyRoutes.js'));
app.use('/api/routes', require('./routes/routeRoutes'));
app.use('/api/trips', require('./routes/tripRoutes'));
app.use('/api/stops', require('./routes/stopRoutes'));
app.use('/api/stopTimes', require('./routes/stopTimesRoutes'));
app.use('/api/calendars', require('./routes/calendarRoutes.js'));
app.use('/api/shapes', require('./routes/shapeRoutes.js'));
app.use('/api/userpermission', require('./routes/permissionRoutes.js'));
app.use('/api/vehicle-assignments', require('./routes/VehicleAssignementRoutes.js'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/drivers', require('./routes/driverRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));


// Serve frontend build
app.use(express.static(path.join(__dirname, "build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});
