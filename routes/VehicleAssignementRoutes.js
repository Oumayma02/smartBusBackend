const express = require('express');
const {createAssignment,getAllAssignments,getAssignmentById,updateAssignment,deleteAssignment } = require('../controllers/VehicleAssignementController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post("/", protect,createAssignment);
router.get("/",protect, getAllAssignments);
router.get("/:id",protect, getAssignmentById);
router.put("/:id",protect, updateAssignment);
router.delete("/:id",protect, deleteAssignment);

module.exports = router;
