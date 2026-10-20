const express = require('express');
const { createAgency, getAgencies, getAgencyById, updateAgency, deleteAgency } = require('../controllers/agencyController');
const { protect,isSuperAdmin,isSuperOrAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/',protect, isSuperAdmin , createAgency);       
router.get('/',protect, isSuperAdmin, getAgencies);        
router.get('/:id',protect, getAgencyById);    
router.put('/:id',protect, isSuperOrAdmin, updateAgency);     
router.delete('/:id', protect, isSuperAdmin , deleteAgency);

module.exports = router;
