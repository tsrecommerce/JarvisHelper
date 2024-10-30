export class AuthModel {
    #user = null;

    constructor() {
    }

    async authenticate() {
        try {
            const token = await chrome.identity.getAuthToken({ 
                interactive: true,
                scopes: [
                    'https://www.googleapis.com/auth/userinfo.email',
                    'https://www.googleapis.com/auth/userinfo.profile'
                ]
            });
            
            const userInfo = await this.fetchUserInfo(token);
            this.#user = userInfo;
            await this.#saveUserToStorage(userInfo);
            return userInfo;
        } catch (error) {
            console.error('Authentication failed:', error);
            throw error;
        }
    }

    async fetchUserInfo(token) {
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch user info');
            }
            
            return response.json();
        } catch (error) {
            console.error('Error fetching user info:', error);
            throw error;
        }
    }

    async isAuthenticated() {
        try {
            const token = await chrome.identity.getAuthToken({ interactive: false });
            if (!token) return false;
            
            // Verify if we have user data
            const user = await this.getCurrentUser();
            return !!user;
        } catch {
            return false;
        }
    }

    async getCurrentUser() {
        if (this.#user) return this.#user;
        
        try {
            const data = await chrome.storage.sync.get('user');
            this.#user = data.user || null;
            return this.#user;
        } catch (error) {
            console.error('Error getting user from storage:', error);
            return null;
        }
    }

    async signOut() {
        try {
            const token = await chrome.identity.getAuthToken({ interactive: false });
            if (token) {
                await chrome.identity.removeCachedAuthToken({ token });
            }
            
            this.#user = null;
            await chrome.storage.sync.remove('user');
            return true;
        } catch (error) {
            console.error('Sign out failed:', error);
            throw error;
        }
    }

    async #saveUserToStorage(user) {
        try {
            await chrome.storage.sync.set({ user });
        } catch (error) {
            console.error('Error saving user to storage:', error);
            throw error;
        }
    }

    // Helper method to check if user has pro subscription
    async isProUser() {
        const user = await this.getCurrentUser();
        return user?.subscription === 'pro';
    }
} 