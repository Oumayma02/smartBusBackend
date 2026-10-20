const express = require('express');
const {  assignAgencyToAdmin,unassignAgencyFromAdmin,assignRouteToAgency,unassignRouteFromAgency,assignTripToRoute,unassignTripFromRoute} = require('../controllers/userPermissionController');
const { protect,isSuperAdmin,isSuperOrAdmin } = require('../middleware/authMiddleware');
const router = express.Router();



router.post('/assign-agency', protect,isSuperAdmin, assignAgencyToAdmin);    
router.post('/unassign-agency', protect,isSuperAdmin, unassignAgencyFromAdmin);      
router.post('/assign-route-agency', protect,isSuperOrAdmin, assignRouteToAgency);         
router.post('/unassign-route-agency', protect,isSuperOrAdmin, unassignRouteFromAgency);  
router.post('/assign-trip-route', protect,isSuperOrAdmin, assignTripToRoute);         
router.post('/unassign-trip-route', protect,isSuperOrAdmin, unassignTripFromRoute);         


module.exports = router;
