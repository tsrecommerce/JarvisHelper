const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    googleId: String,
    name: String,
    picture: String,
    subscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription'
    },
    marketingPreferences: {
        email: { type: Boolean, default: true },
        notifications: { type: Boolean, default: true }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
