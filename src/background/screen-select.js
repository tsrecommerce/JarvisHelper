document.getElementById('startBtn').addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true
        });
        
        // Get the stream ID
        const track = stream.getVideoTracks()[0];
        const streamId = track.getSettings().deviceId;
        
        // Stop the stream immediately as we only need the ID
        stream.getTracks().forEach(track => track.stop());
        
        // Send the stream ID back to the background script
        chrome.runtime.sendMessage({
            action: 'getStreamId',
            streamId: streamId
        });
        
        // Close this tab
        window.close();
    } catch (error) {
        console.error('Error selecting screen:', error);
    }
});