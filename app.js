const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const path = require('path');

// Swagger
const { swaggerUI, swaggerSpec } = require('./config/swagger');

const app = express();

// Health check
app.get('/api/health', (req, res) => {
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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Swagger
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

// Routes
app.use('/api/session', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/agencies', require('./routes/agencyRoutes'));
app.use('/api/routes', require('./routes/routeRoutes'));
app.use('/api/trips', require('./routes/tripRoutes'));
app.use('/api/stops', require('./routes/stopRoutes'));
app.use('/api/stopTimes', require('./routes/stopTimesRoutes'));
app.use('/api/calendars', require('./routes/calendarRoutes'));
app.use('/api/shapes', require('./routes/shapeRoutes'));
app.use('/api/userpermission', require('./routes/permissionRoutes'));
app.use('/api/vehicle-assignments', require('./routes/VehicleAssignementRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/drivers', require('./routes/driverRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

// Serve frontend build
app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

module.exports = app;
