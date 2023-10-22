/* eslint-disable @typescript-eslint/ban-ts-comment */
"use strict";

(function () {
    function applyEventPatch() {
        // Check if the patch has already been applied
        if (
            window.history.pushState.toString().indexOf("locationchange") !== -1
        ) {
            return;
        }

        // eslint-disable-next-line @typescript-eslint/unbound-method
        let oldPushState = history.pushState;
        history.pushState = function pushState() {
            // @ts-ignore
            let ret = oldPushState.apply(this, arguments);
            window.dispatchEvent(new Event("pushstate"));
            window.dispatchEvent(new Event("locationchange"));
            return ret;
        };

        // eslint-disable-next-line @typescript-eslint/unbound-method
        let oldReplaceState = history.replaceState;
        history.replaceState = function replaceState() {
            // @ts-ignore
            let ret = oldReplaceState.apply(this, arguments);
            window.dispatchEvent(new Event("replacestate"));
            window.dispatchEvent(new Event("locationchange"));
            return ret;
        };

        window.addEventListener("popstate", () => {
            window.dispatchEvent(new Event("locationchange"));
        });
    }

    // Function to send data to the API endpoint
    /**
     * @param {Object} data
     */
    function sendData(data) {
        fetch("https://litics.ecwrd.com/api/data", {
            // fetch("http://localhost:3000/api/data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
            mode: "no-cors",
        }).catch((error) => {
            console.error("Error:", error);
        });
    }

    let prevSite = {
        hostname: window.location.hostname,
        pathname: window.location.pathname,
    };

    // Function to collect and send pageview data
    function sendPageviewData() {
        console.log(
            "Sending pageview data... " +
                window.location.hostname +
                window.location.pathname,
        );

        const pageviewData = {
            type: "load",
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
            timestamp: new Date().toISOString(),
            screenSize: window.screen.width + "x" + window.screen.height,
        };

        sendData(pageviewData);

        applyEventPatch();
    }

    // Function to update the duration when the user leaves the page
    function handlePageExit() {
        console.log(
            "Sending exit data... " +
                prevSite.hostname +
                prevSite.pathname +
                " -> " +
                window.location.hostname +
                window.location.pathname,
        );

        if (prevSite.pathname === window.location.pathname) {
            return;
        }

        const currentTime = new Date();

        const pageviewData = {
            type: "exit",
            site: {
                hostname: prevSite.hostname,
                pathname: prevSite.pathname,
            },
            timestamp: currentTime.toISOString(),
        };

        sendData(pageviewData);

        applyEventPatch();
    }

    // Function to periodically send data for duration calculations
    function sendPingData() {
        console.log(
            "Sending ping data... " +
                window.location.hostname +
                window.location.pathname,
        );

        if (prevSite.hostname !== window.location.hostname) {
            window.dispatchEvent(new Event("locationchange"));
            return;
        }

        const currentTime = new Date();

        const pageviewData = {
            type: "ping",
            site: {
                hostname: window.location.hostname,
                pathname: window.location.pathname,
            },
            timestamp: currentTime.toISOString(),
        };

        sendData(pageviewData);

        applyEventPatch();
    }

    applyEventPatch();

    const scriptStart = new Date();

    // Send initial pageview data
    sendPageviewData();

    // Add an event listener to update the duration when the user leaves the page
    window.addEventListener("beforeunload", () => handlePageExit);

    // Listen for location changes
    window.addEventListener("locationchange", () => {
        // if the script has only just loaded, don't send exit data
        if (new Date().getTime() - scriptStart.getTime() < 1 * 1000) {
            return;
        }

        handlePageExit();

        sendPageviewData();

        prevSite = {
            hostname: window.location.hostname,
            pathname: window.location.pathname,
        };
    });

    // If the page hash changes, send an exit and pageview event
    window.addEventListener("hashchange", () => {
        // send the locationchange event
        window.dispatchEvent(new Event("locationchange"));
    });

    // Periodically send data for duration calculations (e.g., every 30 seconds)
    const durationPingInterval = 30000; // 30 seconds
    setInterval(sendPingData, durationPingInterval);
})();
