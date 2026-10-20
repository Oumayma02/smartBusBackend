const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const { swaggerUI, swaggerSpec } = require('./config/swagger');

const app = express();

app.use(cookieParser());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/api/health', (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? 'ok' : 'unavailable',
    database: databaseConnected ? 'connected' : 'disconnected',
  });
});

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

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

app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

module.exports = app;
