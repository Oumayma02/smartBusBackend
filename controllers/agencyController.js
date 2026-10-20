const Agency = require('../models/Agency');
const User = require('../models/User');

/**
 * @swagger
 * /api/agencies:
 *   post:
 *     summary: Create a new agency
 *     description: Only the superadmin can create an agency.
 *     tags: [Agencies]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Agence Principale"
 *               email:
 *                 type: string
 *                 example: "contact@agence.com"
 *               phone:
 *                 type: string
 *                 example: "+216 123 456"
 *               website:
 *                 type: string
 *                 example: "https://agence.com"
 *               routes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["route1", "route2"]
 *     responses:
 *       200:
 *         description: Agency successfully created.
 *       400:
 *         description: An agency with this name already exists.
 *       403:
 *         description: Access denied.
 *       500:
 *         description: Server error.
 */
const createAgency = async (req, res) => {
    const { name, email, phone, website, routes } = req.body;

    try {
        // Check if the agency already exists
        if (await Agency.findOne({ name })) {
            return res.status(400).json({ message: 'Une agence avec ce nom existe déjà' });
        }

        // Only superadmin can create an agency
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Seul le superadmin peut créer une agence' });
        }

        // Create new agency
        const newAgency = new Agency({ name, email, phone, website, routes });
        const savedAgency = await newAgency.save();

        await User.updateMany({ role: 'superadmin' }, { $push: { agencies: savedAgency._id } });

        return res.status(200).json({ ...savedAgency._doc, message: 'Agence créée avec succès' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * @swagger
 * /api/agencies:
 *   get:
 *     summary: Retrieve the list of agencies
 *     description: Superadmins can see all agencies. Admins can only see their assigned agencies.
 *     tags: [Agencies]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of agencies retrieved successfully.
 *       500:
 *         description: Server error.
 */
const getAgencies = async (req, res) => {
    try {
        const agencies =
            req.user.role === 'superadmin'
                ? await Agency.find().populate('routes')
                : await Agency.find({ _id: { $in: req.user.agencies } }).populate('routes');

        return res.json(agencies);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * @swagger
 * /api/agencies/{id}:
 *   get:
 *     summary: Retrieve an agency by ID
 *     description: Superadmins can see all agencies. Admins can only see their assigned agencies.
 *     tags: [Agencies]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Agency ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Agency retrieved successfully.
 *       404:
 *         description: Agency not found.
 *       500:
 *         description: Server error.
 */
const getAgencyById = async (req, res) => {
    try {
        const agency =
            req.user.role === 'superadmin'
                ? await Agency.findById(req.params.id).populate('routes')
                : await Agency.findOne({
                      $and: [
                          { _id: req.params.id },
                          { _id: { $in: req.user.agencies } },
                      ],
                  }).populate('routes');

        if (!agency) {
            return res.status(404).json({ message: 'Agence non trouvée' });
        }

        return res.json(agency);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * @swagger
 * /api/agencies/{id}:
 *   put:
 *     summary: Update an agency
 *     description: Superadmins can update everything. Admins can only update certain fields (email, phone, website, routes).
 *     tags: [Agencies]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Agency ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "updated@agence.com"
 *               phone:
 *                 type: string
 *                 example: "+216 789 123"
 *               website:
 *                 type: string
 *                 example: "https://updated-agence.com"
 *               routes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["route3", "route4"]
 *     responses:
 *       200:
 *         description: Agency updated successfully.
 *       403:
 *         description: Forbidden or unauthorized fields.
 *       404:
 *         description: Agency not found.
 *       500:
 *         description: Server error.
 */
const updateAgency = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        if (req.user.role === 'admin') {
            const allowedFields = ['email', 'phone', 'website', 'routes'];
            const invalidFields = Object.keys(updates).filter((key) => !allowedFields.includes(key));

            if (invalidFields.length > 0) {
                return res.status(403).json({
                    message: "Les administrateurs ne peuvent mettre à jour que l'email, le téléphone, le site web et assigner des routes",
                });
            }
        }

        const updatedAgency = await Agency.findByIdAndUpdate(id, updates, { new: true });

        if (!updatedAgency) {
            return res.status(404).json({ message: 'Agence non trouvée' });
        }

        return res.status(200).json({ ...updatedAgency._doc, message: 'Agence mise à jour avec succès' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * @swagger
 * /api/agencies/{id}:
 *   delete:
 *     summary: Delete an agency
 *     description: Deletes an agency and updates the associated users to remove the agency from their assignments.
 *     tags: [Agencies]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Agency ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Agency successfully deleted.
 *       404:
 *         description: Agency not found.
 *       500:
 *         description: Server error.
 */
const deleteAgency = async (req, res) => {
    const { id } = req.params;

    try {
        const agency = await Agency.findById(id);
        if (!agency) {
            return res.status(404).json({ message: 'Agence non trouvée' });
        }

        await Agency.findByIdAndDelete(id);
        await User.updateMany({ agencies: id }, { $pull: { agencies: id } });

        return res.status(200).json({ message: 'Agence supprimée et utilisateurs mis à jour avec succès' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = { createAgency, getAgencies, getAgencyById, updateAgency, deleteAgency };
