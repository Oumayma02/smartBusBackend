const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');




/**
 * @swagger
 * /api/session:
 *   post:
 *     summary: Authenticate user and return a JWT token
 *     description: Authenticate a user with email and password. Returns a JWT token if credentials are valid.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: service.info@emkamed.tn
 *               password:
 *                 type: string
 *                 example: HbB6yq+R+U
 *     responses:
 *       200:
 *         description: Successful authentication, returns user info and token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: 507f1f77bcf86cd799439011
 *                 username:
 *                   type: string
 *                   example: JohnDoe
 *                 role:
 *                   type: string
 *                   example: admin
 *                 email:
 *                   type: string
 *                   example: user@example.com
 *                 token:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: string
 *                       example: jwt.token.here
 *                     expiresIn:
 *                       type: number
 *                       example: 1714004554
 *       400:
 *         description: Invalid email or password
 *       500:
 *         description: Internal server error
 */
const session = async (req, res) => {

    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(400).json({ message: 'User does not exist! ' });
        }
        const isEqual = await bcrypt.compare(req.body.password, user.password);
        if (!isEqual) {
            return res.status(400).json({ message: 'Password is incorrect! ' });
        }

        const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
}

const token = jwt.sign(
    {
        userId: user.id,
        email: user.email,
        role: user.role,
        myadmin: user.myadmin,
        passwordtracking: user.passwordtracking,
        agencies: user.agencies,
    },
    jwtSecret,
    {
        algorithm: 'HS256',
        expiresIn: '1d',
    }
);

        const expiresIn = JSON.parse(
            Buffer.from(token.split('.')[1], 'base64').toString('ascii')
        ).exp;
    
        return res.status(200).json({
            _id: user._id,
            username: user.username,
            role: user.role,
            email: user.email,
            myadmin: user.myadmin,
        
            agencies: user.agencies,
            token: {
                data: token,
                expiresIn,
            },
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

module.exports = { session, };
