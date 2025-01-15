const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuration du transporteur SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,       // Hôte SMTP (smtp.gmail.com pour Gmail)
    port: process.env.SMTP_PORT,       // Port SMTP (587 pour TLS, 465 pour SSL)
    secure: false,                     // False pour TLS, true pour SSL
    auth: {
        user: process.env.SMTP_USER,   // Adresse e-mail de l'expéditeur
        pass: process.env.SMTP_PASSWORD, // Mot de passe d'application
    },
});

/**
 * Fonction pour envoyer un e-mail
 * @param {string} to - Adresse e-mail du destinataire
 * @param {string} subject - Sujet de l'e-mail
 * @param {string} text - Contenu texte de l'e-mail
 * @param {string} html - Contenu HTML (facultatif)
 */
exports.sendEmail = async (to, subject, text, html = '') => {
    const mailOptions = {
        from: `"Blinker Team" <${process.env.SMTP_USER}>`, // Adresse de l'expéditeur
        to,                                               // Adresse du destinataire
        subject,                                          // Sujet de l'e-mail
        text,                                             // Texte brut
        html,                                             // Contenu HTML
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`E-mail envoyé avec succès à ${to}:`, info.response);
    } catch (error) {
        console.error('Erreur lors de l’envoi de l’e-mail :', error.message);
        throw error;
    }
};
