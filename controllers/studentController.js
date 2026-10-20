const Student = require('../models/Student');
const User = require('../models/User'); // Ajout de User pour la liaison

/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: Get all students
 *     tags: [Students]
 *     responses:
 *       200:
 *         description: List of students
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Internal server error
 */
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().populate('parent');
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/students/{id}:
 *   get:
 *     summary: Get a student by ID
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Student not found
 *       500:
 *         description: Internal server error
 */
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('parent');
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/students:
 *   post:
 *     summary: Create a new student
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - badgeId
 *               - cinParent
 *               - phoneParent
 *               - level
 *             properties:
 *               username:
 *                 type: string
 *               badgeId:
 *                 type: string
 *               cinParent:
 *                 type: string
 *               phoneParent:
 *                 type: string  
 *               level:
 *                 type: string
 *     responses:
 *       201:
 *         description: Student created
 *       400:
 *         description: Missing required fields or bad request
 */
const createStudent = async (req, res) => {
  const { username, badgeId, cinParent, phoneParent, level } = req.body;

  if (!username || !badgeId || !cinParent || !phoneParent || !level) {
    return res.status(400).json({ message: "username, badgeId, cinParent, phoneParent, and level are required" });
  }
 
  try {
    const parent = await User.findOne({ cinNumber: cinParent });
    if (!parent) return res.status(404).json({ message: "Parent not found with the provided CIN" });

    const newStudent = new Student({ username, badgeId, cinParent, phoneParent, level, parent: parent._id });
    const savedStudent = await newStudent.save();

    await User.findByIdAndUpdate(parent._id, { $push: { students: savedStudent._id } });

    res.status(201).json(savedStudent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/students/{id}:
 *   put:
 *     summary: Update a student
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               cinParent:
 *                 type: string
 *               phoneParent:
 *                 type: string
 *               level:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student updated
 *       400:
 *         description: Bad request
 *       404:
 *         description: Student not found
 */
const updateStudent = async (req, res) => {
  try {
    const { cinParent } = req.body;
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedStudent) return res.status(404).json({ message: "Student not found" });

    if (cinParent) {
      const oldParentId = updatedStudent.parent;
      const newParent = await User.findOne({ cinNumber: cinParent });
      if (!newParent) return res.status(404).json({ message: "New parent not found with the provided CIN" });

      if (oldParentId && oldParentId.toString() !== newParent._id.toString()) {
        await User.findByIdAndUpdate(oldParentId, { $pull: { students: updatedStudent._id } });
        await User.findByIdAndUpdate(newParent._id, { $addToSet: { students: updatedStudent._id } });
        updatedStudent.parent = newParent._id;
        await updatedStudent.save();
      }
    }

    res.status(200).json(updatedStudent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/students/{id}:
 *   delete:
 *     summary: Delete a student
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student deleted successfully
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 */
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (student.parent) {
      await User.findByIdAndUpdate(student.parent, { $pull: { students: student._id } });
    }

    const deleted = await Student.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Student not found" });
    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};