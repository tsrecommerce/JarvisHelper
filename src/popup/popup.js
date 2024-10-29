document.addEventListener('DOMContentLoaded', async () => {
    // Initialize DOM elements first
    const elements = {
        backButton: document.getElementById('backToPopup'),
        authModal: document.getElementById('authModal'),
        mainContent: document.querySelector('.sidebar'),
        googleSignIn: document.getElementById('googleSignIn'),
        emailSignIn: document.getElementById('emailSignIn')
    };

    // Check if elements exist and log any missing ones
    Object.entries(elements).forEach(([name, element]) => {
        if (!element) {
            console.warn(`Element '${name}' not found in DOM`);
        }
    });

    // Initialize view state
    let isAuthView = false;

    // Back button handler
    elements.backButton?.addEventListener('click', () => {
        console.log('Back button clicked');
        if (elements.authModal && elements.mainContent) {
            elements.authModal.style.display = 'none';
            elements.mainContent.style.display = 'block';
            isAuthView = false;
        }
    });

    // Google Sign In handler
    elements.googleSignIn?.addEventListener('click', async () => {
        try {
            const response = await chrome.runtime.sendMessage({ type: 'SIGN_IN' });
            console.log('Sign in response:', response);
            if (response?.success) {
                hideAuthModal();
            } else {
                showError(response?.error || 'Sign in failed');
            }
        } catch (error) {
            console.error('Sign in error:', error);
            showError('Failed to connect to authentication service');
        }
    });

    function showAuthModal() {
        if (!elements.authModal || !elements.mainContent) {
            console.error('Required elements not found');
            return;
        }
        
        elements.authModal.style.display = 'flex';
        elements.mainContent.style.display = 'none';
        isAuthView = true;
    }

    function hideAuthModal() {
        if (!elements.authModal || !elements.mainContent) {
            console.error('Required elements not found');
            return;
        }
        
        elements.authModal.style.display = 'none';
        elements.mainContent.style.display = 'block';
        isAuthView = false;
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        elements.authModal?.querySelector('.auth-container')?.prepend(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    // Initial state check
    try {
        const authState = await chrome.runtime.sendMessage({ type: 'INITIALIZE_AUTH' });
        if (!authState?.success) {
            showAuthModal();
        }
    } catch (error) {
        console.error('Failed to check auth state:', error);
        showError('Failed to initialize authentication');
    }
});
