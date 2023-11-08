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
        if (window.location.hostname === "localhost") return;
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

    let prevPage = {
        hostname: window.location.hostname,
        pathname: window.location.pathname,
    };

    /** @type {{hostname: null | string, pathname: null | string}} */
    let lastPageLoad = {
        hostname: null,
        pathname: null,
    };

    // Function to collect and send pageview data
    function sendPageviewData() {
        if (lastPageLoad.pathname === window.location.pathname) {
            return;
        }

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
            screenSize: window.screen.width + "x" + window.screen.height,
        };

        sendData(pageviewData);

        applyEventPatch();

        lastPageLoad = {
            hostname: window.location.hostname,
            pathname: window.location.pathname,
        };
    }

    // Function to update the duration when the user leaves the page
    function handlePageExit() {
        if (prevPage.pathname === window.location.pathname) {
            return;
        }

        console.log(
            "Sending exit data... " +
                prevPage.hostname +
                prevPage.pathname +
                " -> " +
                window.location.hostname +
                window.location.pathname,
        );

        const pageviewData = {
            type: "exit",
            site: {
                hostname: prevPage.hostname,
                pathname: prevPage.pathname,
            },
            inactiveTime,
        };

        sendData(pageviewData);

        applyEventPatch();

        prevPage = {
            hostname: window.location.hostname,
            pathname: window.location.pathname,
        };

        inactiveTime = 0;
    }

    // Function to periodically send data for duration calculations
    function sendPingData() {
        console.log(
            "Sending ping data... " +
                window.location.hostname +
                window.location.pathname,
        );

        if (prevPage.hostname !== window.location.hostname) {
            window.dispatchEvent(new Event("locationchange"));
            return;
        }

        if (hasExitedByInactivity) {
            return;
        }

        if (
            inactiveTime === durationPingInterval / 1000 &&
            !hasExitedByInactivity
        ) {
            hasExitedByInactivity = true;
            handlePageExit();
            return;
        } else if (inactiveTime === durationPingInterval / 1000) {
            sendPageviewData();
            hasExitedByInactivity = false;
            return;
        }

        const pageviewData = {
            type: "ping",
            site: {
                hostname: window.location.hostname,
                pathname: window.location.pathname,
            },
            inactiveTime,
        };

        sendData(pageviewData);

        applyEventPatch();

        inactiveTime = 0;
    }

    applyEventPatch();

    const scriptStart = new Date();

    let isActive = true;
    let inactiveTime = 0;
    let hasExitedByInactivity = false;

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
    });

    // If the page hash changes, send an exit and pageview event
    window.addEventListener("hashchange", () => {
        // send the locationchange event
        window.dispatchEvent(new Event("locationchange"));
    });

    // track user inactivity.
    const inactivityCheckInterval = 1000; // 1 second
    setInterval(() => {
        if (!isActive) inactiveTime++;
    }, inactivityCheckInterval);

    window.addEventListener("focus", () => {
        isActive = true;
    });
    window.addEventListener("blur", () => {
        isActive = false;
    });

    // Periodically send data for duration calculations (e.g., every 30 seconds)
    const durationPingInterval = 30000; // 30 seconds
    setInterval(sendPingData, durationPingInterval);
})();
