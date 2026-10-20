const express = require('express');
const {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver
} = require('../controllers/driverController');
const { protect, isSuperOrAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getAllDrivers); // Example: Add middleware
router.get('/:id', protect, getDriverById);
router.post('/', protect, isSuperOrAdmin, createDriver); // Example: Restrict to admins
router.put('/:id', protect, isSuperOrAdmin, updateDriver);
router.delete('/:id', protect, isSuperOrAdmin, deleteDriver);

module.exports = router;