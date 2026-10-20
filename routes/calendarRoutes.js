const express = require('express');
const { createCalendar,getCalendars, getCalendarById, updateCalendar, deleteCalendar } = require('../controllers/calendarController');
const { protect,isSuperOrAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/',protect , createCalendar);       
router.get('/',protect, getCalendars);        
router.get('/:id',protect, getCalendarById);    
router.put('/:id',protect,isSuperOrAdmin, updateCalendar);     
router.delete('/:id', protect ,isSuperOrAdmin, deleteCalendar);

module.exports = router;
