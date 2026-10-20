const Shape = require('../models/Shape');

// Create a new shape
/**
 * @swagger
 * /api/shapes:
 *   post:
 *     summary: Create a new shape
 *     tags: [Shapes]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shape_id:
 *                 type: string
 *                 description: Unique identifier for the shape
 *               points:
 *                 type: array
 *                 description: List of points that define the shape's path
 *                 items:
 *                   type: object
 *                   properties:
 *                     shape_pt_lat:
 *                       type: number
 *                       format: float
 *                       description: Latitude coordinate
 *                     shape_pt_lon:
 *                       type: number
 *                       format: float
 *                       description: Longitude coordinate
 *                     shape_pt_sequence:
 *                       type: number
 *                       description: Sequence of the point in the shape
 *                     shape_dist_traveled:
 *                       type: number
 *                       description: Distance traveled from the start point (optional)
 *     responses:
 *       201:
 *         description: Shape created successfully
 *       400:
 *         description: Shape ID already exists
 *       500:
 *         description: Server error
 */
const createShape = async (req, res) => {
  try {
    const { shape_id } = req.body;

    // Vérifier si le shape_id existe déjà
    const existingShape = await Shape.findOne({ shape_id });
    if (existingShape) {
      return res.status(400).json({ message: 'Shape ID already exists' });
    }

    const shape = new Shape(req.body);
    await shape.save();
    res.status(201).json(shape);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all shapes
/**
 * @swagger
 * /api/shapes:
 *   get:
 *     summary: Get all shapes
 *     tags: [Shapes]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all shapes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   shape_id:
 *                     type: string
 *                   points:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         shape_pt_lat:
 *                           type: number
 *                           format: float
 *                         shape_pt_lon:
 *                           type: number
 *                           format: float
 *                         shape_pt_sequence:
 *                           type: number
 *                         shape_dist_traveled:
 *                           type: number
 *       500:
 *         description: Server error
 */
const getShapes = async (req, res) => {
  try {
    const shapes = await Shape.find();
    res.status(200).json(shapes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get shape summary (only _id and shape_id)
/**
 * @swagger
 * /api/shapes/summary:
 *   get:
 *     summary: Get all shapes with only _id and shape_id
 *     tags: [Shapes]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of shape summaries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   shape_id:
 *                     type: string
 *       500:
 *         description: Server error
 */
const getShapesSummary = async (req, res) => {
  try {
    const shapes = await Shape.find({}, '_id shape_id');
    res.status(200).json(shapes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get shape by ID
/**
 * @swagger
 * /api/shapes/{id}:
 *   get:
 *     summary: Get a shape by ID
 *     tags: [Shapes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shape found
 *       404:
 *         description: Shape not found
 *       500:
 *         description: Server error
 */
const getShapeById = async (req, res) => {
  try {
    const shape = await Shape.findById(req.params.id);
    if (!shape) return res.status(404).json({ message: 'Shape not found' });
    res.status(200).json(shape);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a shape by ID
/**
 * @swagger
 * /api/shapes/{id}:
 *   put:
 *     summary: Update a shape by ID
 *     tags: [Shapes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               points:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     shape_pt_lat:
 *                       type: number
 *                       format: float
 *                     shape_pt_lon:
 *                       type: number
 *                       format: float
 *                     shape_pt_sequence:
 *                       type: number
 *                     shape_dist_traveled:
 *                       type: number
 *     responses:
 *       200:
 *         description: Shape updated successfully
 *       404:
 *         description: Shape not found
 *       500:
 *         description: Server error
 */
const updateShape = async (req, res) => {
  try {
    const updatedShape = await Shape.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedShape) {
      return res.status(404).json({ message: 'Shape not found' });
    }

    res.status(200).json(updatedShape);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a shape by ID
/**
 * @swagger
 * /api/shapes/{id}:
 *   delete:
 *     summary: Delete a shape by ID
 *     tags: [Shapes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shape deleted successfully
 *       404:
 *         description: Shape not found
 *       500:
 *         description: Server error
 */
const deleteShape = async (req, res) => {
  try {
    const deletedShape = await Shape.findByIdAndDelete(req.params.id);

    if (!deletedShape) {
      return res.status(404).json({ message: 'Shape not found' });
    }

    res.status(200).json({ message: 'Shape deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getShapeByShapeId = async (req, res) => {
  try {
    const shape = await Shape.findOne({ shape_id: req.params.shapeId });
    if (!shape) return res.status(404).json({ message: 'Shape not found' });
    res.status(200).json(shape);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



module.exports = { createShape, getShapes, getShapesSummary, getShapeById, updateShape, deleteShape, getShapeByShapeId };
