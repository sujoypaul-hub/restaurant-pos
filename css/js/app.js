/*
    ==========================================
    RESTAURANT POS - APPLICATION
    ==========================================

    This file controls the one-page application.

    We use:

    1. JavaScript
       To switch between tabs.

    2. URL parameters
       To remember which tab is open.

    3. History API
       To allow browser Back / Forward.

    Example URLs:

    ?tab=billing
    ?tab=orders
    ?tab=customers
    ?tab=marketing
*/


/*
    ==========================================
    TAB CONFIGURATION
    ==========================================
*/

const tabs = {

    billing: {
        title: "Billing",
        description: "Create a new order"
    },

    orders: {
        title: "Orders",
        description: "View and manage restaurant orders"
    },

    customers: {
        title: "Customers",
        description: "Manage customers and order history"
    },

    products: {
        title: "Products",
        description: "Manage restaurant products"
    },

    reports: {
        title: "Reports",
        description: "View sales and business reports"
    },

    marketing: {
        title: "Marketing",
        description: "Manage customer marketing and campaigns"
    },

    "coming-soon": {
        title: "Coming Soon",
        description: "New features are coming soon"
    },

    settings: {
        title: "Settings",
        description: "Application settings"
    }

};


/*
    ==========================================
    GET ELEMENTS
    ==========================================
*/

const navButtons =
    document.querySelectorAll(".nav-btn");

const tabContents =
    document.querySelectorAll(".tab-content");

const pageTitle =
    document.getElementById("page-title");

const pageDescription =
    document.getElementById("page-description");


/*
    ==========================================
    GET TAB FROM URL
    ==========================================
*/

function getTabFromURL() {

    const params =
        new URLSearchParams(window.location.search);

    const tab =
        params.get("tab");

    /*
        If the URL doesn't contain a tab,
        open Billing.
    */

    if (!tab) {
        return "billing";
    }


    /*
        Make sure the requested tab actually
        exists in our application.
    */

    if (!tabs[tab]) {
        return "billing";
    }


    return tab;
}


/*
    ==========================================
    ACTIVATE TAB
    ==========================================
*/

function activateTab(tabName, updateURL = true) {

    /*
        Safety check.
    */

    if (!tabs[tabName]) {
        tabName = "billing";
    }


    /*
        --------------------------------------
        Update sidebar buttons
        --------------------------------------
    */

    navButtons.forEach(button => {

        const buttonTab =
            button.dataset.tab;

        button.classList.toggle(
            "active",
            buttonTab === tabName
        );

    });


    /*
        --------------------------------------
        Update page content
        --------------------------------------
    */

    tabContents.forEach(content => {

        const contentTab =
            content.dataset.tabContent;

        content.classList.toggle(
            "active",
            contentTab === tabName
        );

    });


    /*
        --------------------------------------
        Update page title
        --------------------------------------
    */

    pageTitle.textContent =
        tabs[tabName].title;

    pageDescription.textContent =
        tabs[tabName].description;


    /*
        --------------------------------------
        Update URL
        --------------------------------------

        We use pushState instead of loading
        another HTML page.

        Therefore the entire application
        remains a single page.
    */

    if (updateURL) {

        const url =
            new URL(window.location.href);

        url.searchParams.set(
            "tab",
            tabName
        );


        history.pushState(
            {
                tab: tabName
            },
            "",
            url
        );

    }

}


/*
    ==========================================
    NAVIGATION BUTTONS
    ==========================================
*/

navButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const tabName =
                button.dataset.tab;

            activateTab(tabName);

        }
    );

});


/*
    ==========================================
    BROWSER BACK / FORWARD
    ==========================================

    When the user presses:

        Back
        Forward

    the browser changes the URL.

    popstate detects that change and
    activates the correct tab.
*/

window.addEventListener(
    "popstate",
    () => {

        const tabName =
            getTabFromURL();

        activateTab(
            tabName,
            false
        );

    }
);


/*
    ==========================================
    INITIAL APPLICATION LOAD
    ==========================================

    This is extremely important.

    When the application is refreshed,
    JavaScript reads the URL.

    Example:

    ?tab=marketing

    The Marketing tab will automatically
    open after refresh.
*/

const initialTab =
    getTabFromURL();

activateTab(
    initialTab,
    false
);
