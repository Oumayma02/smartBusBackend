const express = require('express');
const { createTrip, getTrips, getTripById, updateTrip, deleteTrip ,getTripsByRoute} = require('../controllers/tripController');
const { protect,isSuperOrAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/',protect, isSuperOrAdmin, createTrip);      
router.get('/', protect, getTrips);  
router.get('/routes/:routeId', protect, getTripsByRoute);        
router.get('/:id', protect, getTripById);   
router.put('/:id',protect, isSuperOrAdmin, updateTrip);     
router.delete('/:id',protect, isSuperOrAdmin, deleteTrip);  

module.exports = router;
