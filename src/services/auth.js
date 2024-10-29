class AuthService {
  constructor() {
    this.user = null;
    this.token = null;
  }

  async initialize() {
    // Check if user is already logged in
    const userData = await chrome.storage.sync.get(['user', 'token']);
    if (userData.user && userData.token) {
      this.user = userData.user;
      this.token = userData.token;
      return true;
    }
    return false;
  }

  async loginWithGoogle() {
    try {
      const token = await new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(token);
          }
        });
      });

      // Fetch user info from Google
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const user = await response.json();

      // Store user data
      await chrome.storage.sync.set({ user, token });
      this.user = user;
      this.token = token;

      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async logout() {
    await chrome.storage.sync.remove(['user', 'token']);
    this.user = null;
    this.token = null;
  }
}

export const authService = new AuthService(); 