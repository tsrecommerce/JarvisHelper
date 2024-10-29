const express = require('express');
const router = express.Router();
const stripe = require('../services/stripe');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

// Create subscription
router.post('/create', auth, async (req, res) => {
    try {
        const { priceId } = req.body;
        const user = await User.findById(req.user.id);

        // Create or get Stripe customer
        let stripeCustomerId = user.stripeCustomerId;
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    userId: user._id.toString()
                }
            });
            stripeCustomerId = customer.id;
            user.stripeCustomerId = stripeCustomerId;
            await user.save();
        }

        // Create subscription
        const subscription = await stripe.subscriptions.create({
            customer: stripeCustomerId,
            items: [{ price: priceId }],
            expand: ['latest_invoice.payment_intent']
        });

        res.json({
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice.payment_intent.client_secret
        });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ message: 'Subscription creation failed' });
    }
});

// Get current subscription
router.get('/current', auth, async (req, res) => {
    try {
        const subscription = await Subscription.findOne({
            user: req.user.id,
            status: 'active'
        });
        res.json(subscription);
    } catch (error) {
        console.error('Get subscription error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
