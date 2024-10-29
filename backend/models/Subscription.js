const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    plan: {
        type: String,
        enum: ['free', 'pro', 'enterprise'],
        default: 'free'
    },
    status: {
        type: String,
        enum: ['active', 'canceled', 'past_due'],
        default: 'active'
    },
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
