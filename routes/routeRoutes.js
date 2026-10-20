const express = require('express');
const { createRoute, getRoutes, getRouteById, updateRoute, deleteRoute } = require('../controllers/routeController');
const { protect,isSuperOrAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/',protect,isSuperOrAdmin, createRoute);       
router.get('/',protect, getRoutes);          
router.get('/:id', protect, getRouteById);   
router.put('/:id',protect,isSuperOrAdmin,  updateRoute);     
router.delete('/:id', protect,isSuperOrAdmin, deleteRoute);  

module.exports = router;