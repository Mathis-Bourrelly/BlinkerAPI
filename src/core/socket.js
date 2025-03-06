const { Server } = require("socket.io");
const MessagesService = require("../services/messages.service");

class SocketManager {
    io = null;
    userSockets = new Map(); // Stocke les sockets associées aux userID

    initialize(server) {
        this.io = new Server(server, { cors: { origin: "*" } });

        this.io.on("connection", (socket) => {
            console.log(`🟢 Utilisateur connecté : ${socket.id}`);

            // Récupérer l'userID à la connexion
            socket.on("join", (userID) => {
                if (userID) {
                    socket.join(userID);
                    this.userSockets.set(userID, socket.id);
                    console.log(`👤 Utilisateur ${userID} rejoint sa room privée`);
                }
            });

            // Gestion de l'envoi de messages
            socket.on("sendMessage", async ({ senderID, receiverID, content }) => {
                try {
                    const message = await MessagesService.sendMessage(senderID, receiverID, content);

                    // Envoyer le message aux utilisateurs concernés
                    this.io.to(senderID).emit("newMessage", message);
                    this.io.to(receiverID).emit("newMessage", message);
                } catch (error) {
                    console.error("❌ Erreur lors de l'envoi du message :", error);
                }
            });

            // 📌 Gestion du marquage des messages comme lus
            socket.on("markAsRead", async ({ senderID, receiverID }) => {
                try {
                    await MessagesService.markMessagesAsRead(senderID, receiverID);
                    console.log(`✅ Messages de ${senderID} à ${receiverID} marqués comme lus.`);

                    // Notifier l'expéditeur que ses messages ont été lus
                    this.io.to(senderID).emit("messagesRead", { receiverID });
                } catch (error) {
                    console.error("❌ Erreur lors du marquage des messages comme lus :", error);
                }
            });

            // Déconnexion d'un utilisateur
            socket.on("disconnect", () => {
                console.log(`🔴 Utilisateur déconnecté : ${socket.id}`);
                this.userSockets.forEach((value, key) => {
                    if (value === socket.id) {
                        this.userSockets.delete(key);
                        console.log(`👤 Utilisateur ${key} déconnecté et retiré des rooms.`);
                    }
                });
            });
        });
    }

    getIO() {
        if (!this.io) throw new Error("Socket.IO n'a pas été initialisé !");
        return this.io;
    }
}

module.exports = new SocketManager();