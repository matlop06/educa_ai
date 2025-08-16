const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

let transporter;

const setupMailService = () => {
    if (!process.env.SENDGRID_API_KEY) {
        console.error('SENDGRID_API_KEY not found in .env file. Mail service disabled.');
        return;
    }

    const options = {
        auth: {
            api_key: process.env.SENDGRID_API_KEY
        }
    };

    transporter = nodemailer.createTransport(sendgridTransport(options));
    console.log('Mail service configured for SendGrid.');
};

const sendInvitationEmail = async (to, token) => {
    if (!transporter) {
        console.error('Mail service is not initialized or configured.');
        // Throw an error to be caught by the route handler
        throw new Error('Mail service is not available.');
    }

    const invitationLink = `${process.env.BASE_URL || 'http://localhost:3000'}/complete-invitation.html?token=${token}`;
    const senderEmail = process.env.SENDGRID_FROM_EMAIL;

    if (!senderEmail) {
        console.error('SENDGRID_FROM_EMAIL not set in .env file.');
        throw new Error('Sender email is not configured.');
    }

    try {
        const info = await transporter.sendMail({
            from: senderEmail,
            to: to,
            subject: 'Invitación para unirte a Educa AI',
            html: `
                <p>Has sido invitado a unirte a Educa AI.</p>
                <p>Por favor, haz clic en el siguiente enlace para completar tu registro. El enlace es válido por 24 horas.</p>
                <a href="${invitationLink}">${invitationLink}</a>
            `,
        });
        console.log('Invitation email sent successfully to %s. Response from SendGrid:', to, info);
        return info;
    } catch (error) {
        console.error('Error sending email via SendGrid:', error);
        if (error.response) {
            console.error(error.response.body.errors);
        }
        throw error; // Re-throw the error to be caught by the route handler
    }
};

module.exports = { setupMailService, sendInvitationEmail };
