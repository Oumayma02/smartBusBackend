const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Student = require('../models/Student'); // Ajout de Student pour la liaison

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               cinNumber:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *               myadmin:
 *                 type: string
 *               agencies:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: User created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
const createUser = async (req, res) => {
    const { username, email, cinNumber, phoneNumber, password, role, myadmin, agencies } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'Utilisateur déjà existant' });
        if (req.user.role == "admin" && role != "parent") return res.status(400).json({ message: 'seul le superadmin peut créer un compte administrateur' });
        if (req.user.role == "parent") return res.status(400).json({ message: 'seul les admin et superadmin peut créer un compte administrateur' });

        const hashedPassword = await bcrypt.hash(password, 12);
        const data = req.user.role == "admin" ? new User({
            username,
            email,
            cinNumber,
            phoneNumber,
            role,
            password: hashedPassword,
            myadmin: req.user.email,
            agencies: req.user.agencies,
        }) : new User({
            username,
            email,
            cinNumber,
            phoneNumber,
            role,
            password: hashedPassword,
            myadmin,
            agencies,
        });

        const dataToSave = await data.save();

        // Lier les élèves existants avec ce parent via cinNumber
        const students = await Student.find({ cinParent: cinNumber });
        if (students.length > 0) {
            await User.findByIdAndUpdate(dataToSave._id, { $push: { students: { $each: students.map(student => student._id) } } });
            await Student.updateMany({ cinParent: cinNumber }, { parent: dataToSave._id });
        }

        return res.status(200).json({ ...dataToSave._doc, password: null, message: 'Utilisateur créé avec succès' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
const getUsers = async (req, res) => {
    try {
        let users;

        if (req.user.role === 'superadmin') {
            users = await User.find()
                .populate('agencies')
                .populate('students')
                .select('-password');
        } else if (req.user.role === 'admin') {
            users = await User.find({
                $or: [
                    { myadmin: { $in: [req.user.email] } },
                    { email: req.user.email }
                ]
            })
                .populate('agencies')
                .populate('students')
                .select('-password');
        } else if (req.user.role === 'parent') {
            users = await User.find({ email: req.user.email }).populate('agencies').populate('students').select('-password');
        } else {
            return res.status(403).json({ message: 'Accès refusé' });
        }

        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User's ID
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
const getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        let user;

        if (req.user.role === 'superadmin') {
            user = await User.findById(id).populate('agencies').populate('students').select('-password');
        } else if (req.user.role === 'admin') {
            user = await User.findOne({
                _id: id,
                $or: [
                    { myadmin: { $in: [req.user.email] } },
                    { email: req.user.email }
                ]
            })
                .populate('agencies')
                .populate('students')
                .select('-password');
        } else if (req.user.role === 'parent') {
            user = await User.findOne({
                _id: id,
                $or: [
                    { email: req.user.email }
                ]
            }).populate('agencies').populate('students').select('-password');
        } else {
            return res.status(403).json({ message: 'Accès refusé' });
        }

        if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user information
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 */
const updateUser = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const userToUpdate = await User.findById(id);
        if (!userToUpdate) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        if (userToUpdate.role === 'superadmin' && userToUpdate.email === 'trackingemkatech@gmail.com') {
            if (req.user.email !== 'trackingemkatech@gmail.com') {
                return res.status(403).json({ message: 'Seul le superadmin spécifique peut mettre à jour ce compte' });
            }

            if (updates.email || updates.role) {
                return res.status(403).json({ message: 'Modification de l’e-mail ou du rôle non autorisée pour ce compte' });
            }
        }

        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 12);
        }

        if (updates.cinNumber) {
            // Mettre à jour les élèves associés avec le nouveau cinNumber
            const oldCinNumber = userToUpdate.cinNumber;
            await Student.updateMany({ cinParent: oldCinNumber }, { cinParent: updates.cinNumber, parent: id });
        }

        const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true })
            .populate('agencies')
            .populate('students')
            .select('-password');

        return res.status(200).json({
            ...updatedUser._doc,
            password: null,
            message: 'Utilisateur mis à jour avec succès',
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 */
const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const userToDelete = await User.findById(id);
        if (!userToDelete) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        if (userToDelete.role === 'superadmin' && userToDelete.email === 'trackingemkatech@gmail.com') {
            return res.status(403).json({ message: 'Suppression du superadmin spécifique non autorisée' });
        }

        let deletedUser;
        if (req.user.role === 'superadmin') {
            deletedUser = await User.findByIdAndDelete(id);
            await Student.updateMany({ parent: id }, { $unset: { parent: 1 } }); // Supprimer la référence au parent
        } else if (req.user.role === 'admin') {
            if (id === req.user.id) {
                return res.status(403).json({ message: 'Les administrateurs ne peuvent pas supprimer leur propre compte' });
            }

            deletedUser = await User.findOneAndDelete({
                _id: id,
                myadmin: { $in: [req.user.email] },
            });
            if (deletedUser) {
                await Student.updateMany({ parent: id }, { $unset: { parent: 1 } });
            }
        } else {
            return res.status(403).json({ message: 'Accès refusé' });
        }

        if (!deletedUser) {
            return res.status(404).json({ message: 'Utilisateur non trouvé ou accès refusé' });
        }

        return res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = { createUser, getUsers, getUserById, updateUser, deleteUser };