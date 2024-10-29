// Import managers
import { AuthManager } from './auth.js';
import { SubscriptionManager } from './subscription.js';
import { AnalyticsManager } from '../services/analytics.js';
import { NotificationManager } from './notifications.js';
import { MarketingManager } from './marketing.js';

// Initialize managers
const authManager = new AuthManager();
const subscriptionManager = new SubscriptionManager();
const notificationManager = new NotificationManager();
const marketingManager = new MarketingManager();
const analytics = new AnalyticsManager();

// Screen Recording variables
let mediaRecorder = null;
let recordedChunks = [];
let stream = null;

// Screen Recording Functions
async function startScreenRecording(sendResponse) {
    try {
        await analytics.trackFeatureUsage('screen_recording_start');

        const tab = await chrome.tabs.create({
            url: chrome.runtime.getURL('/editor/screen-select.html')
        });

        chrome.runtime.onMessage.addListener(function handleScreen(message) {
            if (message.action === 'getStreamId') {
                chrome.runtime.onMessage.removeListener(handleScreen);
                startRecordingWithStream(message.streamId, sendResponse);
            }
        });
    } catch (error) {
        console.error('Failed to start recording:', error);
        sendResponse({ error: error.message });
    }
    return true;
}

async function startRecordingWithStream(streamId, sendResponse) {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: streamId
                }
            }
        });

        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const blob = new Blob(recordedChunks, {
                type: 'video/webm'
            });

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `screen-recording-${timestamp}.webm`;

            await analytics.trackEvent('recording_completed', {
                duration: mediaRecorder.duration,
                fileSize: blob.size
            });

            const tab = await chrome.tabs.create({
                url: chrome.runtime.getURL('/editor/save-recording.html')
            });

            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === tab.id && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'saveRecording',
                        blob: blob,
                        filename: filename
                    });
                }
            });

            recordedChunks = [];
            stream = null;
        };

        mediaRecorder.start(1000);
        sendResponse({ success: true });

    } catch (error) {
        console.error('Failed to start recording with stream:', error);
        sendResponse({ error: error.message });
    }
}

function stopScreenRecording(sendResponse) {
    try {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            analytics.trackFeatureUsage('screen_recording_stop');
        }
        sendResponse({ success: true });
    } catch (error) {
        console.error('Failed to stop recording:', error);
        sendResponse({ error: error.message });
    }
    return true;
}

// Screenshot capture functionality
async function captureCurrentTab(sendResponse) {
    try {
        await analytics.trackFeatureUsage('screenshot_capture');

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        const dimensions = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => ({
                width: Math.max(
                    document.documentElement.scrollWidth,
                    document.body.scrollWidth
                ),
                height: Math.max(
                    document.documentElement.scrollHeight,
                    document.body.scrollHeight
                ),
                viewportWidth: window.innerWidth,
                viewportHeight: window.innerHeight,
                scrollX: window.scrollX,
                scrollY: window.scrollY
            })
        });

        const pageInfo = dimensions[0].result;
        console.log('Page dimensions:', pageInfo);

        const imageData = await chrome.tabs.captureVisibleTab(null, { 
            format: 'png'
        });

        if (pageInfo.height > pageInfo.viewportHeight || 
            pageInfo.width > pageInfo.viewportWidth) {
            
            const captures = [];
            captures.push({
                data: imageData,
                x: pageInfo.scrollX,
                y: pageInfo.scrollY
            });

            await openEditor({
                images: captures,
                dimensions: pageInfo
            });
        } else {
            await openEditor({
                images: [{
                    data: imageData,
                    x: 0,
                    y: 0
                }],
                dimensions: pageInfo
            });
        }

        sendResponse({ success: true });
    } catch (error) {
        console.error('Capture failed:', error);
        sendResponse({ error: error.message });
    }
}

async function openEditor(captureData) {
    try {
        console.log('Opening editor with data:', captureData);
        
        const editorURL = chrome.runtime.getURL('editor/editor.html');
        const tab = await chrome.tabs.create({ url: editorURL });
        
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === tab.id && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                
                const messageData = {
                    action: 'loadImage',
                    captureData: {
                        images: [{
                            data: captureData.images[0].data,
                            x: captureData.images[0].x || 0,
                            y: captureData.images[0].y || 0
                        }],
                        dimensions: captureData.dimensions || {
                            width: 0,
                            height: 0
                        }
                    }
                };

                console.log('Sending message to editor:', messageData);

                chrome.tabs.sendMessage(tab.id, messageData)
                    .catch(error => {
                        console.error('Failed to send message to editor:', error);
                    });
            }
        });
    } catch (error) {
        console.error('Failed to open editor:', error);
    }
}

// Enhanced Message Handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Received message:', message);

    // Handle auth-related messages
    if (message.type === 'INITIALIZE_AUTH') {
        chrome.storage.sync.get(['user', 'token'], (result) => {
            sendResponse({ success: true, result: result.user || null });
        });
        return true;
    }

    if (message.type === 'SIGN_IN') {
        chrome.identity.getAuthToken({ 
            interactive: true,
            scopes: [
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile'
            ]
        }, async function(token) {
            if (chrome.runtime.lastError) {
                console.error('Auth Error:', chrome.runtime.lastError);
                sendResponse({ 
                    success: false, 
                    error: chrome.runtime.lastError.message 
                });
                return;
            }

            try {
                const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to get user info');
                }

                const user = await response.json();
                
                await chrome.storage.sync.set({ 
                    user: user,
                    token: token
                });

                sendResponse({ success: true, user: user });
            } catch (error) {
                console.error('User info error:', error);
                sendResponse({ 
                    success: false, 
                    error: error.message 
                });
            }
        });
        return true;
    }

    // Default response for unhandled messages
    sendResponse({ success: false, error: 'Unknown message type' });
    return false;
});

// Listen for installation/update events
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        // Track installation
        await analytics.trackEvent('extension_installed', {
            version: chrome.runtime.getManifest().version
        });

        // Initialize default settings
        await chrome.storage.sync.set({
            settings: {
                captureFormat: 'png',
                recordingQuality: 'high',
                notifications: true
            }
        });
    } else if (details.reason === 'update') {
        // Track update
        await analytics.trackEvent('extension_updated', {
            fromVersion: details.previousVersion,
            toVersion: chrome.runtime.getManifest().version
        });
    }
});

// Listen for subscription status changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        if (changes.subscription) {
            const newStatus = changes.subscription.newValue;
            analytics.trackEvent('subscription_status_changed', {
                status: newStatus
            });
        }

        if (changes.user) {
            const newUser = changes.user.newValue;
            const oldUser = changes.user.oldValue;
            if (newUser && !oldUser) {
                analytics.trackEvent('user_signed_in', {
                    method: 'google'
                });
            } else if (!newUser && oldUser) {
                analytics.trackEvent('user_signed_out');
            }
        }
    }
});

// Error handling for uncaught errors
self.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    analytics.trackEvent('uncaught_error', {
        message: event.error?.message,
        stack: event.error?.stack
    });
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    analytics.trackEvent('unhandled_rejection', {
        message: event.reason?.message,
        stack: event.reason?.stack
    });
});

// Add message handler for popup refresh
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'REFRESH_POPUP') {
        chrome.runtime.sendMessage({ type: 'REFRESH_POPUP' });
    }
    // ... other message handlers ...
});
