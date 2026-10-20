const Trip = require('../models/Trip');
const Route = require('../models/Route');
const Calendar = require('../models/Calendar');


// Create a new trip
/**
 * @swagger
 * /api/trips:
 *   post:
 *     summary: Create a new trip
 *     tags: [Trips]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               route:
 *                 type: string
 *                 description: ID of the associated route
 *               trip_id:
 *                 type: string
 *                 description: Unique identifier for the trip
 *               trip_headsign:
 *                 type: string
 *                 description: Trip headsign
 *               direction_id:
 *                 type: integer
 *                 description: Direction ID (0 or 1)
 *               shape_id:
 *                 type: string
 *                 description: Shape ID for the trip
 *               block_id:
 *                 type: string
 *                 description: Block ID for the trip
 *               trip_short_name:
 *                 type: string
 *                 description: trip_short_name
 *               vehicle_id:
 *                 type: string
 *                 description: ID of the associated vehicle
 *               service_id:
 *                 type: string
 *                 description: ID of the associated service (Calendar)
 *     responses:
 *       201:
 *         description: Trip created successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Route not found
 *       500:
 *         description: Server error
 */
const createTrip = async (req, res) => {
    const { route, trip_id, trip_headsign, direction_id, shape_id,block_id, vehicle_id, service_id, trip_short_name} = req.body;

    try {
        // Validate route existence
        const existingRoute = await Route.findById(route);
        if (!existingRoute) {
            return res.status(404).json({ message: 'Route not found' });
        }

        // Validate service existence
        const existingService = await Calendar.findById(service_id);
        if (!existingService) {
            return res.status(404).json({ message: 'Service not found' });
        }

        // Check for duplicate trip_id
        const existingTrip = await Trip.findOne({ trip_id });
        if (existingTrip) {
            return res.status(400).json({ message: 'This trip already exists' });
        }

        // Create the new trip
        const trip = await Trip.create({
            route,
            trip_id,
            trip_headsign,
            direction_id,
            shape_id,
            block_id,
            vehicle_id,
            service_id,
            trip_short_name // Make sure to add service_id here
        });

        // Add trip to the corresponding route
        existingRoute.trips.push(trip._id);
        await existingRoute.save();

        res.status(201).json(trip);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }};
// Retrieve all trips
/**
 * @swagger
 * /api/trips:
 *   get:
 *     summary: Retrieve all trips
 *     tags: [Trips]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of trips
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Trip'
 *       500:
 *         description: Server error
 */
const getTrips = async (req, res) => {
    try {
        const trips = await Trip.find()
            .populate('route') // Populate the associated Route
            .populate('stop_times') // Populate the associated StopTimes
            .populate('vehicle_id') // Populate the associated Vehicle
            .populate('service_id'); // Populate the associated Calendar (Service)

        res.status(200).json(trips);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Retrieve a specific trip by ID
/**
 * @swagger
 * /api/trips/{id}:
 *   get:
 *     summary: Retrieve a trip by ID
 *     tags: [Trips]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Trip's ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trip'
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Server error
 */
const getTripById = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id)
            .populate('route') // Populate the associated Route
            .populate('stop_times') // Populate the associated StopTimes
            .populate('vehicle_id') // Populate the associated Vehicle
            .populate('service_id'); // Populate the associated Calendar (Service)

        if (!trip) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        res.status(200).json(trip);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a trip
/**
 * @swagger
 * /api/trips/{id}:
 *   put:
 *     summary: Update a trip
 *     tags: [Trips]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Trip's ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trip_headsign:
 *                 type: string
 *               direction_id:
 *                 type: integer
 *               shape_id:
 *                 type: string
 *               block_id:
 *                 type: string
 *               vehicle_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Trip updated successfully
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Server error
 */
const updateTrip = async (req, res) => {
    try {
        const updatedTrip = await Trip.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!updatedTrip) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        res.status(200).json(updatedTrip);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a trip
/**
 * @swagger
 * /api/trips/{id}:
 *   delete:
 *     summary: Delete a trip
 *     tags: [Trips]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Trip's ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip deleted successfully
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Server error
 */
const deleteTrip = async (req, res) => {
    try {
        const trip = await Trip.findByIdAndDelete(req.params.id);
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        // Remove the trip from the corresponding route
        await Route.findByIdAndUpdate(trip.route, {
            $pull: { trips: trip._id },
        });

        res.status(200).json({ message: 'Trip deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
/**
 * @swagger
 * /api/trips/routes/{routeId}:
 *   get:
 *     summary: Retrieve all trips for a specific route
 *     tags: [Trips]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: routeId
 *         in: path
 *         required: true
 *         description: Route's ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of trips for the specified route
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Trip'
 *       404:
 *         description: No trips found for the specified route
 *       500:
 *         description: Server error
 */
/**
 * Get all trips for a specific route
 * @param {Object} req
 * @param {Object} res
 */
const getTripsByRoute = async (req, res) => {
    const { routeId } = req.params;

    try {
        const trips = await Trip.find({ route: routeId }).populate('stop_times vehicle_id');
        if (!trips.length) {
            return res.status(404).json({ message: 'No trips found for this route.' });
        }

        return res.status(200).json(trips);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
module.exports = {
    createTrip,
    getTrips,
    getTripById,
    updateTrip,
    deleteTrip,
    getTripsByRoute
};
