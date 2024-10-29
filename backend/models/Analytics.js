const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    event: {
        type: String,
        required: true
    },
    properties: mongoose.Schema.Types.Mixed,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Analytics', analyticsSchema);
