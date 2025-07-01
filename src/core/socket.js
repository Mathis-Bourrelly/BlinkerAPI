const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');
// Import services lazily to avoid circular dependencies
let MessagesService;
let ConversationService;
const { logger } = require("../utils/logger.utils");

// Initialize services lazily
const getMessagesService = () => {
    if (!MessagesService) {
        MessagesService = require("../services/messages.service");
    }
    return MessagesService;
};

const getConversationService = () => {
    if (!ConversationService) {
        ConversationService = require("../services/conversations.service");
    }
    return ConversationService;
};

class SocketManager {
    io = null;
    userSockets = new Map(); // Stocke les sockets associées aux userID

    initialize(server) {
        // Planifier la vérification périodique des messages expirés
        setInterval(async () => {
            try {
                const expiredMessages = await getMessagesService().deleteExpiredMessages();

                if (expiredMessages && expiredMessages.length > 0) {
                    logger.info(`${expiredMessages.length} messages expirés supprimés`);

                    // Notifier les clients concernés de la suppression des messages
                    const conversationMessages = {};

                    // Regrouper les messages par conversation
                    expiredMessages.forEach(message => {
                        if (!conversationMessages[message.conversationID]) {
                            conversationMessages[message.conversationID] = [];
                        }
                        conversationMessages[message.conversationID].push(message.messageID);
                    });

                    // Envoyer les notifications par conversation
                    Object.entries(conversationMessages).forEach(([conversationID, messageIDs]) => {
                        this.io.to(`conversation:${conversationID}`).emit("messagesExpired", {
                            conversationID,
                            messageIDs
                        });
                    });
                }
            } catch (error) {
                logger.error(`Erreur lors de la suppression des messages expirés: ${error.message}`);
            }
        }, 60000); // Vérifier toutes les minutes
        this.io = new Server(server, {
            cors: {
                origin: [
                    'http://localhost:3000',
                    'http://localhost:3004',
                    'http://localhost:3011',
                    'http://localhost:8081',
                    'https://dev.blinker.eterny.fr',
                    'https://app.dev.blinker.eterny.fr'
                ],
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        // Middleware d'authentification pour Socket.IO
        this.io.use((socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    logger.warn(`Tentative de connexion WebSocket sans token: ${socket.id}`);
                    return next(new Error('Authentication error: No token provided'));
                }

                // Vérifier le token JWT
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.user = decoded;
                logger.info(`Authentification WebSocket réussie pour l'utilisateur: ${decoded.userID}`);
                next();
            } catch (error) {
                logger.error(`Erreur d'authentification WebSocket: ${error.message}`);
                next(new Error('Authentication error: Invalid token'));
            }
        });

        this.io.on("connection", (socket) => {
            const userID = socket.user.userID;
            logger.info(`🟢 Utilisateur connecté: ${userID} (${socket.id})`);

            // Rejoindre la salle personnelle de l'utilisateur
            socket.join(userID);
            this.userSockets.set(userID, socket.id);

            // Récupérer et rejoindre les conversations de l'utilisateur
            getConversationService().getUserConversations(userID)
                .then(conversations => {
                    conversations.forEach(conversation => {
                        socket.join(`conversation:${conversation.conversationID}`);
                        logger.info(`👥 Utilisateur ${userID} a rejoint la conversation: ${conversation.conversationID}`);
                    });
                })
                .catch(error => {
                    logger.error(`Erreur lors de la récupération des conversations: ${error.message}`);
                });

            // Gestion de l'envoi de messages avec conversationID
            socket.on("sendMessage", async ({ content, conversationID, receiverID, requestId }) => {
                try {
                    const userID = socket.user.userID;
                    let targetConversationID = conversationID;
                    let conversation;

                    logger.info(`Demande d'envoi de message: ${userID} à ${receiverID || 'conversation ' + conversationID}`);

                    // Validation du contenu
                    if (!content || content.trim() === '') {
                        socket.emit("error", {
                            message: "Le contenu du message ne peut pas être vide",
                            code: "EMPTY_CONTENT",
                            requestId
                        });
                        return;
                    }

                    // Si conversationID n'est pas fourni mais receiverID l'est, trouver ou créer la conversation
                    if (!targetConversationID && receiverID) {
                        conversation = await getConversationService().findConversationByParticipants([userID, receiverID]);
                        if (!conversation) {
                            logger.info(`Création d'une nouvelle conversation entre ${userID} et ${receiverID}`);
                            conversation = await getConversationService().createConversation([userID, receiverID]);
                            // Faire rejoindre la nouvelle conversation à l'utilisateur actuel
                            socket.join(`conversation:${conversation.conversationID}`);
                        }
                        targetConversationID = conversation.conversationID;
                    } else if (targetConversationID) {
                        // Vérifier que l'utilisateur fait partie de la conversation
                        conversation = await getConversationService().findConversationById(targetConversationID);
                        if (!conversation) {
                            logger.warn(`Conversation ${targetConversationID} non trouvée pour l'utilisateur ${userID}`);
                            socket.emit("error", {
                                message: "Conversation non trouvée",
                                code: "CONVERSATION_NOT_FOUND",
                                requestId
                            });
                            return;
                        }

                        if (!conversation.participants.includes(userID)) {
                            logger.warn(`Utilisateur ${userID} non autorisé pour la conversation ${targetConversationID}`);
                            socket.emit("error", {
                                message: "Vous n'êtes pas autorisé à envoyer des messages dans cette conversation",
                                code: "UNAUTHORIZED_ACCESS",
                                requestId
                            });
                            return;
                        }
                    } else {
                        socket.emit("error", {
                            message: "Vous devez spécifier un destinataire ou une conversation",
                            code: "MISSING_RECIPIENT",
                            requestId
                        });
                        return;
                    }

                    // Créer le message dans la base de données
                    // Le service MessagesService.sendMessage s'occupe d'envoyer les notifications WebSocket
                    // pour éviter les doublons d'événements
                    const message = await getMessagesService().sendMessage(userID, receiverID, content, targetConversationID);

                    // Envoyer une confirmation au client
                    socket.emit("messageSent", {
                        success: true,
                        messageID: message.messageID,
                        conversationID: targetConversationID,
                        timestamp: Date.now(),
                        requestId
                    });

                    logger.info(`Message envoyé par ${userID} dans la conversation ${targetConversationID}`);
                } catch (error) {
                    logger.error(`Erreur lors de l'envoi du message: ${error.message}`);
                    socket.emit("error", {
                        message: "Erreur lors de l'envoi du message",
                        code: "SEND_MESSAGE_ERROR",
                        details: error.message,
                        requestId
                    });
                }
            });

            // Gestion du marquage des messages comme lus
            socket.on("markAsRead", async ({ conversationID, requestId }) => {
                try {
                    const userID = socket.user.userID;
                    logger.info(`Demande de marquage des messages comme lus: ${userID} pour conversation ${conversationID}`);

                    // Vérifier que l'utilisateur fait partie de la conversation
                    const conversation = await getConversationService().findConversationById(conversationID);
                    if (!conversation) {
                        logger.warn(`Conversation ${conversationID} non trouvée pour l'utilisateur ${userID}`);
                        socket.emit("error", {
                            message: "Conversation non trouvée",
                            code: "CONVERSATION_NOT_FOUND",
                            requestId
                        });
                        return;
                    }

                    if (!conversation.participants.includes(userID)) {
                        logger.warn(`Utilisateur ${userID} non autorisé pour la conversation ${conversationID}`);
                        socket.emit("error", {
                            message: "Vous n'êtes pas autorisé à accéder à cette conversation",
                            code: "UNAUTHORIZED_ACCESS",
                            requestId
                        });
                        return;
                    }

                    // Marquer les messages comme lus
                    const result = await getMessagesService().markConversationAsRead(conversationID, userID);
                    logger.info(`${result[0]} messages marqués comme lus par ${userID} dans la conversation ${conversationID}`);

                    // Envoyer une confirmation au client
                    socket.emit("markAsReadConfirmation", {
                        success: true,
                        conversationID,
                        count: result[0],
                        requestId
                    });

                    // Si des messages ont été mis à jour, informer les autres participants
                    if (result[0] > 0) {
                        // Utiliser le service WebSocket pour envoyer la notification avec un ID d'événement unique
                        WebSocketService.notifyMessagesRead(conversationID, userID);
                    }
                } catch (error) {
                    logger.error(`Erreur lors du marquage des messages comme lus: ${error.message}`);
                    socket.emit("error", {
                        message: "Erreur lors du marquage des messages comme lus",
                        code: "MARK_READ_ERROR",
                        details: error.message,
                        requestId
                    });
                }
            });

            // Gestion de la récupération des messages d'une conversation
            socket.on("getConversationMessages", async ({ conversationID, requestId }) => {
                try {
                    const userID = socket.user.userID;
                    logger.info(`Demande de récupération des messages: ${userID} pour conversation ${conversationID}`);

                    // Vérifier que l'utilisateur fait partie de la conversation
                    const conversation = await getConversationService().findConversationById(conversationID);
                    if (!conversation) {
                        logger.warn(`Conversation ${conversationID} non trouvée pour l'utilisateur ${userID}`);
                        socket.emit("error", {
                            message: "Conversation non trouvée",
                            code: "CONVERSATION_NOT_FOUND",
                            requestId
                        });
                        return;
                    }

                    if (!conversation.participants.includes(userID)) {
                        logger.warn(`Utilisateur ${userID} non autorisé pour la conversation ${conversationID}`);
                        socket.emit("error", {
                            message: "Vous n'êtes pas autorisé à accéder à cette conversation",
                            code: "UNAUTHORIZED_ACCESS",
                            requestId
                        });
                        return;
                    }

                    // Récupérer les messages
                    const messages = await getMessagesService().getConversationMessages(conversationID);

                    // Transformer les objets Sequelize en objets JavaScript simples
                    const plainMessages = messages.map(message => message.get({ plain: true }));

                    // Envoyer les messages au client avec l'ID de requête pour le suivi
                    socket.emit("conversationMessages", {
                        conversationID,
                        messages: plainMessages,
                        count: plainMessages.length,
                        timestamp: Date.now(),
                        requestId
                    });

                    logger.info(`${plainMessages.length} messages envoyés pour la conversation ${conversationID}`);
                } catch (error) {
                    logger.error(`Erreur lors de la récupération des messages: ${error.message}`);
                    socket.emit("error", {
                        message: "Erreur lors de la récupération des messages",
                        code: "GET_MESSAGES_ERROR",
                        details: error.message,
                        requestId
                    });
                }
            });

            // Déconnexion d'un utilisateur
            socket.on("disconnect", () => {
                const userID = socket.user?.userID;
                logger.info(`🔴 Utilisateur déconnecté: ${userID || socket.id}`);

                if (userID) {
                    this.userSockets.delete(userID);
                }
            });
        });
    }

    getIO() {
        if (!this.io) throw new Error("Socket.IO n'a pas été initialisé !");
        return this.io;
    }
}

module.exports = new SocketManager();