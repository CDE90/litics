"use strict";

(function () {
    // Function to send data to the API endpoint
    /**
     * @param {Object} data
     */
    function sendData(data) {
        fetch("http://localhost:3000/api/data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
            mode: "no-cors", // Uncomment this line if you're getting a CORS error
        }).catch((error) => {
            console.error("Error:", error);
        });
    }

    // Function to collect and send pageview data
    function sendPageviewData() {
        const pageviewData = {
            site: {
                hostname: window.location.hostname,
                pathname: window.location.pathname,
            },
            referrer: {
                hostname: document.referrer
                    ? new URL(document.referrer).hostname
                    : null,
                pathname: document.referrer
                    ? new URL(document.referrer).pathname
                    : null,
            },
            duration: 0, // You can update this when the user leaves the page
            timestamp: new Date().toISOString(),
            screenSize: window.screen.width + "x" + window.screen.height,
        };

        sendData(pageviewData);
    }

    // Function to update the duration when the user leaves the page
    function handlePageUnload() {
        // Calculate the time spent on the page
        const currentTime = new Date();
        const pageviewData = {
            site: {
                hostname: window.location.hostname,
                pathname: window.location.pathname,
            },
            referrer: {
                hostname: document.referrer
                    ? new URL(document.referrer).hostname
                    : null,
                pathname: document.referrer
                    ? new URL(document.referrer).pathname
                    : null,
            },
            duration: Math.round(
                (currentTime.getSeconds() - pageLoadTime.getSeconds()) / 1000
            ), // Calculate duration in seconds
            timestamp: currentTime.toISOString(),
            screenSize: window.screen.width + "x" + window.screen.height,
        };

        sendData(pageviewData);
    }

    // Function to periodically send data for duration calculations
    function sendPeriodicData() {
        // Calculate the time spent on the page since the last ping
        const currentTime = new Date();
        const duration = Math.round(
            (currentTime.getSeconds() - pageLoadTime.getSeconds()) / 1000
        ); // Calculate duration in seconds

        const pageviewData = {
            site: {
                hostname: location.hostname,
                pathname: location.pathname,
            },
            referrer: {
                hostname: document.referrer
                    ? new URL(document.referrer).hostname
                    : null,
                pathname: document.referrer
                    ? new URL(document.referrer).pathname
                    : null,
            },
            duration: duration,
            timestamp: currentTime.toISOString(),
            screenSize: window.screen.width + "x" + window.screen.height,
        };

        sendData(pageviewData);
    }

    console.debug("Initializing analytics...");

    // Capture the initial page load time
    const pageLoadTime = new Date();

    // Send initial pageview data
    sendPageviewData();

    console.debug("First pageview data sent.");

    // Add an event listener to update the duration when the user leaves the page
    window.addEventListener("beforeunload", handlePageUnload);

    // Listen for hash changes in SPAs
    window.addEventListener("hashchange", () => {
        sendPageviewData();
    });

    // Periodically send data for duration calculations (e.g., every 30 seconds)
    const durationPingInterval = 30000; // 30 seconds
    setInterval(sendPeriodicData, durationPingInterval);
})();
