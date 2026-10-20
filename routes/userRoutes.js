const express = require('express');
const { createUser, getUsers, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const { protect,isSuperOrAdmin } = require('../middleware/authMiddleware');
const router = express.Router();
// Routes protégées par JWT
router.post('/', protect,isSuperOrAdmin, createUser);      
router.get('/', protect,isSuperOrAdmin, getUsers);         
router.get('/:id',protect, getUserById);    
router.put('/:id', protect,isSuperOrAdmin, updateUser);    
router.delete('/:id', protect,isSuperOrAdmin, deleteUser);  

module.exports = router;
