const express = require('express');
const { createStopTime, getStopTimes, getStopTimeById, updateStopTime, deleteStopTime, getStopTimesByTrip} = require('../controllers/stopTimeController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createStopTime);
router.get('/trips/:tripId', protect, getStopTimesByTrip);
router.get('/:id', protect, getStopTimeById);
router.get('/', protect, getStopTimes);
router.put('/:id', protect, updateStopTime);
router.delete('/:id', protect, deleteStopTime);

module.exports = router;
