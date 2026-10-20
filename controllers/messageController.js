const Message = require('../models/Message');

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Create a new message
 *     description: Allows authenticated users (parents) to send a new message.
 *     tags: [Messages]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Problème avec l'horaire du bus"
 *     responses:
 *       201:
 *         description: Message successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 sender:
 *                   type: string
 *                 content:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 isRead:
 *                   type: boolean
 *                 parentMessageId:
 *                   type: string
 *                   nullable: true
 *       400:
 *         description: Content is required.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
const createMessage = async (req, res) => {
  const { content } = req.body;

  try {
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Le contenu du message est requis' });
    }

    // Vérifier que l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    const sender = req.user.role === 'parent' ? `Parent:${req.user.email}` : 'Admin';

    const newMessage = new Message({
      sender,
      content,
      timestamp: new Date(),
      isRead: false,
      parentMessageId: null,
    });

    const savedMessage = await newMessage.save();
    return res.status(201).json(savedMessage);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: Retrieve all messages
 *     description: Admins can see all messages. Parents can only see their own messages and admin replies.
 *     tags: [Messages]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of messages retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   sender:
 *                     type: string
 *                   content:
 *                     type: string
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                   isRead:
 *                     type: boolean
 *                   parentMessageId:
 *                     type: string
 *                     nullable: true
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
const getMessages = async (req, res) => {
  try {
    let messages;
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      messages = await Message.find().sort({ timestamp: -1 });
    } else if (req.user.role === 'parent') {
      messages = await Message.find({
        $or: [
          { sender: `Parent:${req.user.email}` },
          { parentMessageId: { $ne: null } }, // Inclure les réponses de l'admin
       ],
      }).sort({ timestamp: -1 });
    } else {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    return res.json(messages);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/messages/{id}/reply:
 *   post:
 *     summary: Reply to a message
 *     description: Only admins can reply to a message.
 *     tags: [Messages]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Message ID to reply to
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Merci, nous vérifions l'horaire."
 *     responses:
 *       201:
 *         description: Reply successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 sender:
 *                   type: string
 *                 content:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 isRead:
 *                   type: boolean
 *                 parentMessageId:
 *                   type: string
 *       400:
 *         description: Content is required or message not found.
 *       403:
 *         description: Only admins can reply.
 *       404:
 *         description: Message not found.
 *       500:
 *         description: Server error.
 */
const replyToMessage = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  try {
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Le contenu de la réponse est requis' });
    }

    // Vérifier que l'utilisateur est un admin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Seul un admin peut répondre aux messages' });
    }

    // Vérifier que le message existe
    const parentMessage = await Message.findById(id);
    if (!parentMessage) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    const reply = new Message({
      sender: 'Admin',
      content,
      timestamp: new Date(),
      isRead: false,
      parentMessageId: id,
    });

    const savedReply = await reply.save();

    // Marquer le message parent comme lu
    parentMessage.isRead = true;
    await parentMessage.save();

    return res.status(201).json(savedReply);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/messages/{id}/read:
 *   put:
 *     summary: Mark a message as read
 *     description: Admins or the message sender can mark a message as read.
 *     tags: [Messages]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Message ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message marked as read.
 *       403:
 *         description: Unauthorized to mark this message as read.
 *       404:
 *         description: Message not found.
 *       500:
 *         description: Server error.
 */
const markMessageAsRead = async (req, res) => {
  const { id } = req.params;

  try {
    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    // Vérifier que l'utilisateur est l'expéditeur ou un admin
    const isSender = message.sender === `Parent:${req.user.email}`;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    if (!isSender && !isAdmin) {
      return res.status(403).json({ message: 'Non autorisé à marquer ce message comme lu' });
    }

    message.isRead = true;
    const updatedMessage = await message.save();

    return res.status(200).json({ ...updatedMessage._doc, message: 'Message marqué comme lu' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { createMessage, getMessages, replyToMessage, markMessageAsRead };