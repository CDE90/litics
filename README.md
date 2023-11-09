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
-   Make /get-started and /dashboard pages protected (redirect to login if not logged in)

20/10/2023

-   Add ui and input options to /get-started page

22/10/2023

-   Add functionality to /get-started page so that it can create a site and redirect to the dashboard
    -   Fix issue with get request being sent whenever site url input is changed
-   TODO:
    -   Add error handling for invalid site url
    -   Add number of sites restriction? maybe limit to 5 sites per user?
    -   Add site deletion functionality
    -   Add site editing functionality
    -   Add dashboard page
-   Fix issue with /api/data attempting to create a new site automatically. This should be done on the /get-started page
    -   The endpoint will return a 404 if the site doesn't exist.
-   Update script so hashchange doesn't trigger another locationchange event
-   Revert previous script change (hashchange should trigger locationchange event)
-   Add extra check to script for exit event to ensure data is only sent when the page is being exited (prev page is not the same as current page)
-   Added extra check to script for page load event to ensure data is only sent once per page load
-   Start work on layout for dashboard page
    -   Add sidebar...
        -   This took way longer than it should have
        -   I had to mess around with tailwind classes for ages to make sure the top section of the sidebar didn't merge into the navbar when you scroll down
        -   One good thing about the sidebar is that it's responsive, so on smaller screens it gives a hamburger menu which can be pressed to open the sidebar over the top of the page
    -   Apply basic styling to sidebar for now
    -   Add user profile section at bottom of sidebar
    -   Also required to change base layout to use min-h-screen which then needed other pages to have flex-grow to fit the screen properly
    -   Main navbar also became sticky on all pages with a little shadow

23/10/2023

-   Add a site dropdown to the sidebar on /dashboard
    -   This dropdown will be used to select which site's data is being displayed
    -   The dropdown is populated with the user's sites
    -   TODO: The dropdown should also populated with a "create new site" button

25/10/2023

-   Add 'Add site' button to site selector dropdown.
-   Add upstash qstash for periodic cron jobs
-   Add database schemas for aggregation tables
    -   Tables are: page_stats, referrer_stats, site_stats, browser_stats, device_type_stats, location_stats
    -   These tables will be used to store hourly aggregated data for each site
-   Edited aggregation schemas:
    -   Change ID to be autoincremented int
    -   Remove hostname from models (as covered with site_id)
    -   Add timestamp to models (how did I forget this?)
-   Start work on aggregation endpoint.
-   Write some basic SQL statements for aggregation endpoint

26/10/2023

-   Finish aggregation endpoint
    -   This endpoint will be called by a cron job every hour to aggregate data from the pageviews table into the aggregation tables
    -   Should the endpoint delete pageviews after aggregating them??
-   Update script to not send data on localhost
-   Update script to move timestamp from client to server (so the timestamp is more accurate and consistent - also can't be tampered with)
-   Add minification for script
-   Add self-tracking for litics website

27/10/2023

-   TODO: Avg duration is way too high. This will be because people just leave the page open in the background. I need to find a way to detect when the user is inactive and stop the timer. This will either require me to move duration calculations back to the client, add a new event type for inactivity and focus, or just send the inactive duration from the client to the server and use that to calculate the duration.
-   TODO: Have a look at the /api/data endpoint and find a way to optimise the rows read for every page view
    -   Probably just requires adding indexes to some fields. The query that is reading the most rows is line 111 of /src/app/api/data/route.ts
    -   Look at indexing user_signature, hostname, pathname, has_exited and timestamp
-   Add additional db indexes to pageviews table
-   Track user inactivity with the script so that the duration is calculated more accurately.
    -   This was done by listening to the focus and blur events.

09/11/2023

-   TODO: Change the way data is aggregated.
    -   Instead of automatically aggregating data every hour, it would be better to aggregate data on the fly when it is requested.
    -   This is because users will be able to filter the data they see on the dashboard page, and this would be impossible if the data was already aggregated with different filters.
    -   Aggregations should still be saved after calculating them to reduce the number of rows that need to be read when the same aggregation is requested again. With each stored aggregation, the filters used to create it should also be stored - maybe in a separate table or as a json object/list (would need to be consistently ordered)
