# Documentation des événements WebSocket

Ce document décrit les événements WebSocket utilisés dans l'application Blinker pour la messagerie en temps réel.

> **Important** : Les fonctionnalités de messagerie en temps réel (envoi de messages, récupération des messages d'une conversation, marquage des messages comme lus) doivent être implémentées via WebSockets plutôt que via les API REST. Les routes REST API correspondantes ont été supprimées ou marquées comme dépréciées.

## Principes généraux

- Tous les événements WebSocket incluent un identifiant unique `eventId` pour faciliter le suivi et la déduplication côté client.
- Les événements d'erreur incluent un code d'erreur standardisé et des détails supplémentaires.
- Les requêtes client peuvent inclure un `requestId` optionnel qui sera renvoyé dans la réponse pour faciliter la correspondance.
- Les timestamps sont fournis en millisecondes (Date.now()).

## Événements émis par le client

### `sendMessage`

Envoie un nouveau message dans une conversation.

**Payload:**
```javascript
{
  content: string,           // Contenu du message (obligatoire)
  conversationID?: string,   // ID de la conversation (optionnel si receiverID est fourni)
  receiverID?: string,       // ID du destinataire (optionnel si conversationID est fourni)
  requestId?: string         // ID de requête pour le suivi (optionnel)
}
```

**Réponses possibles:**
- Événement `messageSent` en cas de succès
- Événement `error` en cas d'échec

### `markAsRead`

Marque tous les messages d'une conversation comme lus.

**Payload:**
```javascript
{
  conversationID: string,    // ID de la conversation (obligatoire)
  requestId?: string         // ID de requête pour le suivi (optionnel)
}
```

**Réponses possibles:**
- Événement `markAsReadConfirmation` en cas de succès
- Événement `error` en cas d'échec

### `getConversationMessages`

Récupère les messages d'une conversation.

**Payload:**
```javascript
{
  conversationID: string,    // ID de la conversation (obligatoire)
  requestId?: string         // ID de requête pour le suivi (optionnel)
}
```

**Réponses possibles:**
- Événement `conversationMessages` en cas de succès
- Événement `error` en cas d'échec

## Événements émis par le serveur

### `messageNotification`

Notifie un utilisateur d'un nouveau message. Cet événement est envoyé à tous les participants de la conversation, y compris l'expéditeur.

**Payload:**
```javascript
{
  conversationID: string,    // ID de la conversation
  message: {                 // Objet message complet
    messageID: string,
    content: string,
    senderID: string,
    conversationID: string,
    isRead: boolean,
    createdAt: string,
    expiresAt: string,
    sender: {                // Informations sur l'expéditeur
      userID: string,
      email: string
    }
  },
  timestamp: number,         // Timestamp de l'événement
  eventId: string            // ID unique de l'événement
}
```

### `messageSent`

Confirmation qu'un message a été envoyé avec succès.

**Payload:**
```javascript
{
  success: boolean,          // Toujours true en cas de succès
  messageID: string,         // ID du message créé
  conversationID: string,    // ID de la conversation
  timestamp: number,         // Timestamp de l'événement
  requestId?: string,        // ID de la requête originale si fourni
  eventId: string            // ID unique de l'événement
}
```

### `markAsReadConfirmation`

Confirmation que des messages ont été marqués comme lus.

**Payload:**
```javascript
{
  success: boolean,          // Toujours true en cas de succès
  conversationID: string,    // ID de la conversation
  count: number,             // Nombre de messages marqués comme lus
  requestId?: string,        // ID de la requête originale si fourni
  eventId: string            // ID unique de l'événement
}
```

### `messagesRead`

Notifie que des messages ont été lus par un utilisateur. Cet événement est envoyé à tous les participants de la conversation.

**Payload:**
```javascript
{
  conversationID: string,    // ID de la conversation
  userID: string,            // ID de l'utilisateur qui a lu les messages
  timestamp: number,         // Timestamp de l'événement
  eventId: string            // ID unique de l'événement
}
```

### `conversationMessages`

Réponse à une demande de récupération de messages.

**Payload:**
```javascript
{
  conversationID: string,    // ID de la conversation
  messages: Array,           // Tableau des messages
  count: number,             // Nombre de messages
  timestamp: number,         // Timestamp de l'événement
  requestId?: string,        // ID de la requête originale si fourni
  eventId: string            // ID unique de l'événement
}
```

### `error`

Notification d'erreur.

**Payload:**
```javascript
{
  message: string,           // Message d'erreur lisible
  code: string,              // Code d'erreur standardisé
  details?: string,          // Détails supplémentaires (optionnel)
  requestId?: string,        // ID de la requête originale si fourni
  eventId: string            // ID unique de l'événement
}
```

**Codes d'erreur standardisés:**
- `EMPTY_CONTENT`: Le contenu du message est vide
- `CONVERSATION_NOT_FOUND`: Conversation non trouvée
- `UNAUTHORIZED_ACCESS`: Accès non autorisé à la conversation
- `MISSING_RECIPIENT`: Destinataire ou conversation non spécifié
- `SEND_MESSAGE_ERROR`: Erreur lors de l'envoi du message
- `MARK_READ_ERROR`: Erreur lors du marquage des messages comme lus
- `GET_MESSAGES_ERROR`: Erreur lors de la récupération des messages

## Routes REST API toujours disponibles

Les routes REST API suivantes sont toujours disponibles pour des cas d'utilisation spécifiques :

### `GET /messages/between/:userID`

Récupère les messages entre l'utilisateur connecté et un autre utilisateur. Utile pour le chargement initial des messages.

### `GET /messages/unread`

Récupère tous les messages non lus de l'utilisateur connecté. Utile pour afficher les notifications de messages non lus.

### `PUT /messages/read/:senderID`

Marque tous les messages d'un expéditeur spécifique comme lus. Utile pour marquer les messages comme lus par expéditeur plutôt que par conversation.

### `DELETE /messages/expired`

Supprime les messages expirés. Réservé aux administrateurs.

## Bonnes pratiques pour le frontend

1. **Utiliser les WebSockets pour les opérations en temps réel**: Envoi de messages, récupération des messages d'une conversation, marquage des messages comme lus.
2. **Utiliser les API REST pour le chargement initial**: Chargement initial des conversations et des messages non lus.
3. **Gestion des doublons**: Utiliser l'`eventId` pour déduire les événements dupliqués.
4. **Suivi des requêtes**: Utiliser le `requestId` pour associer les réponses aux requêtes.
5. **Gestion des erreurs**: Traiter les erreurs en fonction de leur code pour une meilleure expérience utilisateur.
6. **Mise à jour de l'interface**: Mettre à jour l'interface utilisateur en fonction des événements reçus.
