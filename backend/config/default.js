module.exports = {
    mongoURI: 'your_mongodb_uri',
    jwtSecret: 'your_jwt_secret',
    stripe: {
        secretKey: 'your_stripe_secret_key',
        webhookSecret: 'your_stripe_webhook_secret'
    },
    google: {
        clientId: 'your_google_client_id',
        clientSecret: 'your_google_client_secret'
    },
    sendgrid: {
        apiKey: 'your_sendgrid_api_key',
        fromEmail: 'your_verified_sender_email'
    }
};
