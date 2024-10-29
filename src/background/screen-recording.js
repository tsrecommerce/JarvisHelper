let mediaRecorder = null;
let recordedChunks = [];
let stream = null;

async function startScreenRecording(sendResponse) {
    try {
        // Create a new tab for screen selection
        const tab = await chrome.tabs.create({
            url: chrome.runtime.getURL('/editor/screen-select.html')
        });

        // Listen for the screen selection
        chrome.runtime.onMessage.addListener(function handleScreen(message) {
            if (message.action === 'getStreamId') {
                chrome.runtime.onMessage.removeListener(handleScreen);
                
                // Start recording with the selected stream
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
        const stream = await navigator.mediaDevices.getUserMedia({
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

            // Create object URL in a tab context
            const tab = await chrome.tabs.create({
                url: chrome.runtime.getURL('/editor/save-recording.html')
            });

            // Send blob to the tab
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
        }
        sendResponse({ success: true });
    } catch (error) {
        console.error('Failed to stop recording:', error);
        sendResponse({ error: error.message });
    }
    return true;
}

// Export functions
self.startScreenRecording = startScreenRecording;
self.stopScreenRecording = stopScreenRecording;