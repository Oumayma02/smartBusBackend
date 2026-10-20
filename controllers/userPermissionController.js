const User = require('../models/User');
const Agency = require('../models/Agency');
const Route = require ('../models/Route');
const Trip = require('../models/Trip');



/**
 * @swagger
 * /api/userpermission/assign-agency:
 *   post:
 *     summary: Assign an agency to an admin user
 *     tags: [User Permissions]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - agencyId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The ID of the admin user
 *                 example: "60f5a3b8e1b4a824d8e4f123"
 *               agencyId:
 *                 type: string
 *                 description: The ID of the agency to assign
 *                 example: "60f5b3b8e1b4a824d8e4f456"
 *     responses:
 *       200:
 *         description: Agency successfully assigned to the admin user
 *       400:
 *         description: Bad request (e.g., agency already assigned)
 *       403:
 *         description: Forbidden (only superadmin can assign agencies)
 *       404:
 *         description: User or agency not found
 *       500:
 *         description: Internal server error
 */

const assignAgencyToAdmin = async (req, res) => {
    const { userId, agencyId } = req.body;
    console.log(userId);

    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Seul le superadmin peut affecter une agence à un utilisateur admin' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        if (user.role !== 'admin') {
            return res.status(400).json({ message: 'Une agence ne peut être affectée qu\'à un utilisateur admin' });
        }

        if (user.agencies.length === 0) {
            user.agencies.push(agencyId);
        } else {
            console.log(user.agencies);
            return res.status(400).json({ message: 'Cet utilisateur a déjà une agence assignée' });
        }

        const agency = await Agency.findById(agencyId);
        if (!agency) {
            return res.status(404).json({ message: 'Agence non trouvée' });
        }

        await user.save();

        await User.updateMany(
            { myadmin: user.email, role: 'consultant' },
            { $addToSet: { agencies: agencyId } } 
        );

        return res.status(200).json({ 
            message: 'Agence assignée à l\'utilisateur admin et mise à jour des consultants avec succès', 
            user 
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * @swagger
 * /api/userpermission/unassign-agency:
 *   post:
 *     summary: Unassign an agency from an admin user
 *     tags: [User Permissions]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - agencyId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The ID of the admin user
 *                 example: "60f5a3b8e1b4a824d8e4f123"
 *               agencyId:
 *                 type: string
 *                 description: The ID of the agency to unassign
 *                 example: "60f5b3b8e1b4a824d8e4f456"
 *     responses:
 *       200:
 *         description: Agency successfully unassigned from the admin user
 *       400:
 *         description: Bad request (e.g., agency not assigned to the user)
 *       403:
 *         description: Forbidden (only superadmin can unassign agencies)
 *       404:
 *         description: User or agency not found
 *       500:
 *         description: Internal server error
 */


const unassignAgencyFromAdmin = async (req, res) => {
    const { userId, agencyId } = req.body;

    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Seul le superadmin peut retirer une agence à un utilisateur admin' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        if (user.role !== 'admin') {
            return res.status(400).json({ message: 'Seuls les utilisateurs admin peuvent être désassignés d\'une agence' });
        }

        const agencyIndex = user.agencies.indexOf(agencyId);
        if (agencyIndex === -1) {
            return res.status(400).json({ message: 'Cet utilisateur n\'a pas cette agence assignée' });
        }

        user.agencies.splice(agencyIndex, 1);

        await user.save();

        await User.updateMany(
            { myadmin: user.email, role: 'consultant' },
            { $pull: { agencies: agencyId } } // $pull removes the agencyId from the array
        );

        return res.status(200).json({ 
            message: 'Agence retirée de l\'utilisateur admin et mise à jour des consultants avec succès', 
            user 
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


/**
 * @swagger
 * /api/userpermission/assign-route:
 *   post:
 *     summary: Assign a route to an agency
 *     tags: [User Permissions]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agencyId
 *               - routeId
 *             properties:
 *               agencyId:
 *                 type: string
 *                 description: The ID of the agency
 *                 example: "60f5b3b8e1b4a824d8e4f456"
 *               routeId:
 *                 type: string
 *                 description: The ID of the route to assign
 *                 example: "R001"
 *     responses:
 *       200:
 *         description: Route successfully assigned to the agency.
 *       400:
 *         description: Bad request (e.g., route already assigned).
 *       403:
 *         description: Forbidden (only superadmin can assign routes).
 *       404:
 *         description: Agency or route not found.
 *       500:
 *         description: Internal server error.
 */
const assignRouteToAgency = async (req, res) => {
    const { agencyId, routeId } = req.body;

    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Seul le superadmin peut affecter une route à une agence.' });
        }

        const agency = await Agency.findById(agencyId);
        if (!agency) {
            return res.status(404).json({ message: 'Agence non trouvée.' });
        }

        const route = await Route.findById(routeId);
        if (!route) {
            return res.status(404).json({ message: 'Route non trouvée.' });
        }

        if (route.agency && route.agency.toString() === agencyId) {
            return res.status(400).json({ message: 'Cette route est déjà assignée à cette agence.' });
        }

        route.agency = agencyId;
        await route.save();

        agency.routes.push(routeId);
        await agency.save();

        return res.status(200).json({ message: 'Route assignée avec succès à l\'agence.', route, agency });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * @swagger
 * /api/userpermission/unassign-route:
 *   post:
 *     summary: Unassign a route from an agency
 *     tags: [User Permissions]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agencyId
 *               - routeId
 *             properties:
 *               agencyId:
 *                 type: string
 *                 description: The ID of the agency
 *                 example: "60f5b3b8e1b4a824d8e4f456"
 *               routeId:
 *                 type: string
 *                 description: The ID of the route to unassign
 *                 example: "R001"
 *     responses:
 *       200:
 *         description: Route successfully unassigned from the agency.
 *       400:
 *         description: Bad request (e.g., route not assigned to the agency).
 *       403:
 *         description: Forbidden (only superadmin can unassign routes).
 *       404:
 *         description: Agency or route not found.
 *       500:
 *         description: Internal server error.
 */
const unassignRouteFromAgency = async (req, res) => {
    const { agencyId, routeId } = req.body;

    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Seul le superadmin peut retirer une route d\'une agence.' });
        }

        const agency = await Agency.findById(agencyId);
        if (!agency) {
            return res.status(404).json({ message: 'Agence non trouvée.' });
        }

        const route = await Route.findById(routeId);
        if (!route || route.agency.toString() !== agencyId) {
            return res.status(404).json({ message: 'Route non assignée à cette agence ou route non trouvée.' });
        }

        route.agency = null;
        await route.save();

        agency.routes = agency.routes.filter((id) => id.toString() !== routeId);
        await agency.save();

        return res.status(200).json({ message: 'Route retirée avec succès de l\'agence.', route, agency });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


/**
 * @swagger
 * /api/userpermission/assign-trip-route:
 *   post:
 *     summary: Assign a trip to a route
 *     tags: [User Permissions]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tripId
 *               - routeId
 *             properties:
 *               tripId:
 *                 type: string
 *                 description: The ID of the trip
 *                 example: "T001"
 *               routeId:
 *                 type: string
 *                 description: The ID of the route to assign
 *                 example: "R001"
 *     responses:
 *       200:
 *         description: Trip successfully assigned to the route.
 *       400:
 *         description: Bad request (e.g., trip already assigned).
 *       404:
 *         description: Trip or route not found.
 *       500:
 *         description: Internal server error.
 */
const assignTripToRoute = async (req, res) => {
    const { tripId, routeId } = req.body;

    try {
        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found.' });
        }

        const route = await Route.findById(routeId);
        if (!route) {
            return res.status(404).json({ message: 'Route not found.' });
        }

        if (trip.route && trip.route.toString() === routeId) {
            return res.status(400).json({ message: 'This trip is already assigned to the specified route.' });
        }

        trip.route = routeId;
        await trip.save();

        route.trips = route.trips || [];
        route.trips.push(tripId);
        await route.save();

        return res.status(200).json({ message: 'Trip successfully assigned to the route.', trip });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * @swagger
 * /api/userpermission/unassign-trip-route:
 *   post:
 *     summary: Unassign a trip from a route
 *     tags: [User Permissions]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tripId
 *               - routeId
 *             properties:
 *               tripId:
 *                 type: string
 *                 description: The ID of the trip
 *                 example: "T001"
 *               routeId:
 *                 type: string
 *                 description: The ID of the route to unassign
 *                 example: "R001"
 *     responses:
 *       200:
 *         description: Trip successfully unassigned from the route.
 *       400:
 *         description: Bad request (e.g., trip not assigned to the route).
 *       404:
 *         description: Trip or route not found.
 *       500:
 *         description: Internal server error.
 */
const unassignTripFromRoute = async (req, res) => {
    const { tripId, routeId } = req.body;

    try {
        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found.' });
        }

        if (!trip.route || trip.route.toString() !== routeId) {
            return res.status(400).json({ message: 'This trip is not assigned to the specified route.' });
        }

        const route = await Route.findById(routeId);
        if (!route) {
            return res.status(404).json({ message: 'Route not found.' });
        }

        trip.route = null;
        await trip.save();

        route.trips = (route.trips || []).filter((id) => id.toString() !== tripId);
        await route.save();

        return res.status(200).json({ message: 'Trip successfully unassigned from the route.', trip });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};




module.exports = { assignAgencyToAdmin ,unassignAgencyFromAdmin,assignRouteToAgency,unassignRouteFromAgency,assignTripToRoute,unassignTripFromRoute};
