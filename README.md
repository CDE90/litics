# Litics

Litics is a web analytics tool that I'm building for my A level computer science project.

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## Notes

14/10/2023

-   Initial commit with create-t3-app
-   Added very basic data collecting script (didn't with with SPAs)
-   Initial database schema with pageviews & sites (authentication stuff is already there)

15/10/2023

-   Added basic API for getting pageviews
    -   Checks if pageview exists, if not, creates it
    -   Associates pageviews with user signatures (SHA-256 hash of user agent, IP, and hostname)
    -   Checks if site exists, if not, creates it (this should be removed and added as UI. If a pageview event doesn't have a site associated, it should be ignored)
    -   Handles locations with separate table
-   Fix issue in testing script where CORS was causing issues
-   Add screen size to API
-   Big script overhauls
    -   Adds new event for locationchange
    -   Splits API with separate load, ping and exit event types
        -   Allows duration to be tracked more accurately (server-side) becuase we can now set a session to hasEnded = true when the user leaves the page
    -   Fix issue with exit payload sending current page data instead of previous page data (causing the pageview to be ended immediately)
    -   Whenever a location change event fires, it will send a page exit event for the previous page and a page load event for the new page
        -   The hashchange event also triggers a location change event
-   Fixed bug with use of new Date().getSeconds() to get durations. This function returns a number 0-59 for the number of seconds past the minute, whereas for duration calculations I need the number of seconds from a fixed point. (changed to .getTime())

16/10/2023

-   Update navbar to be dynamic (links are different colours depending on if the user is on that page or not)
-   Add navbar to global template
    -   Add test /get-started page to test navbar
-   Update login button to be dynamic (also server rendered to prevent session data being refetched)

17/10/2023

-   Update colour scheme for navbar
-   Add basic index page
    -   Basic hero section with title, description, get started button and image

18/10/2023

-   Add skeleton for getting started page
    -   Tabs at top
    -   Buttons for navigating between tabs
-   Update green buttons to be blue

19/10/2023

-   Update nextauth to v5 (experimental)
-   Make all routes use edge runtime
-   Update /api/data route to use browser crypto.subtle to hash
