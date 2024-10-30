import { AuthModel } from '../models/AuthModel.js';
import { SubscriptionService } from '../services/SubscriptionService.js';

document.addEventListener('DOMContentLoaded', async () => {
    const authModel = new AuthModel();
    const subscriptionService = new SubscriptionService();
    
    const authContainer = document.getElementById('auth-container');
    const profileContainer = document.getElementById('profile-container');
    const signInBtn = document.getElementById('sign-in-btn');

    // Check initial auth state
    const isAuthenticated = await authModel.isAuthenticated();
    if (isAuthenticated) {
        const user = await authModel.getCurrentUser();
        const plan = await subscriptionService.getCurrentPlan();
        authContainer.style.display = 'none';
        profileContainer.style.display = 'block';
        updateUIForAuthenticatedUser(user, plan);
    } else {
        authContainer.style.display = 'block';
        profileContainer.style.display = 'none';
    }

    // Add sign in button listener
    signInBtn.addEventListener('click', async () => {
        try {
            const user = await authModel.authenticate();
            const plan = await subscriptionService.getCurrentPlan();
            authContainer.style.display = 'none';
            profileContainer.style.display = 'block';
            updateUIForAuthenticatedUser(user, plan);
        } catch (error) {
            console.error('Auth failed:', error);
        }
    });

    // Add profile menu listeners
    document.getElementById('sign-out').addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await authModel.signOut();
            authContainer.style.display = 'block';
            profileContainer.style.display = 'none';
        } catch (error) {
            console.error('Sign out failed:', error);
        }
    });

    document.getElementById('upgrade-link').addEventListener('click', async (e) => {
        e.preventDefault();
        if (await subscriptionService.getCurrentPlan() === 'pro') return;
        
        try {
            await subscriptionService.upgradeToPro();
            e.target.textContent = 'Pro Member';
            e.target.style.pointerEvents = 'none';
        } catch (error) {
            console.error('Upgrade failed:', error);
        }
    });

    // Wait for DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', () => {
        initializeScreenCapture();
    });

    function initializeScreenCapture() {
        // Get both buttons
        const fullPageBtn = document.querySelector('button[data-action="fullPage"]');
        const selectionBtn = document.querySelector('button[data-action="selection"]');

        // Add event listener for Full Page capture
        if (fullPageBtn) {
            fullPageBtn.addEventListener('click', async () => {
                try {
                    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
                    if (tabs[0]) {
                        await chrome.runtime.sendMessage({
                            action: 'captureFullPage',
                            tabId: tabs[0].id
                        });
                        window.close();
                    }
                } catch (err) {
                    console.error('Full page capture error:', err);
                }
            });
        }

        // Add event listener for Selection capture
        if (selectionBtn) {
            selectionBtn.addEventListener('click', async () => {
                try {
                    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
                    if (tabs[0]) {
                        await chrome.runtime.sendMessage({
                            action: 'captureSelection',
                            tabId: tabs[0].id
                        });
                        window.close();
                    }
                } catch (err) {
                    console.error('Selection capture error:', err);
                }
            });
        }
    }
});

function updateUIForAuthenticatedUser(user, plan) {
    const profileIcon = document.querySelector('.profile-icon');
    const upgradeLink = document.getElementById('upgrade-link');
    
    if (user?.picture) {
        profileIcon.src = user.picture;
    }
    
    if (plan === 'pro') {
        upgradeLink.textContent = 'Pro Member';
        upgradeLink.style.pointerEvents = 'none';
    }
}
