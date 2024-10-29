const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../models/User');
const auth = require('../middleware/auth');

const client = new OAuth2Client(config.get('google.clientId'));

// Google Sign In
router.post('/google', async (req, res) => {
    try {
        const { token } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: config.get('google.clientId')
        });

        const payload = ticket.getPayload();
        
        let user = await User.findOne({ email: payload.email });
        
        if (!user) {
            user = new User({
                email: payload.email,
                googleId: payload.sub,
                name: payload.name,
                picture: payload.picture
            });
            await user.save();
        }

        const jwtToken = jwt.sign(
            { id: user._id },
            config.get('jwtSecret'),
            { expiresIn: '1d' }
        );

        res.json({
            token: jwtToken,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                picture: user.picture
            }
        });
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-googleId')
            .populate('subscription');
        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
