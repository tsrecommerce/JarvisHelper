class AnalyticsManager {
    constructor() {
        this.events = [];
    }

    trackEvent(eventName, eventData) {
        const event = {
            name: eventName,
            data: eventData,
            timestamp: new Date().toISOString()
        };
        this.events.push(event);
        // Implement your analytics logging logic here
    }

    // Add other analytics methods as needed
}

// Make sure to export the class
export { AnalyticsManager };  // Named export
// OR
export default AnalyticsManager;  // Default export 