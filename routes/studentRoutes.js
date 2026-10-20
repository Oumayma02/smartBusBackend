const express = require('express');
const {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
} = require('../controllers/studentController');
const { protect, isSuperOrAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getAllStudents); // Example: Add middleware
router.get('/:id', protect, getStudentById);
router.post('/', protect, isSuperOrAdmin, createStudent); // Example: Restrict to admins
router.put('/:id', protect, isSuperOrAdmin, updateStudent);
router.delete('/:id', protect, isSuperOrAdmin, deleteStudent);

module.exports = router;