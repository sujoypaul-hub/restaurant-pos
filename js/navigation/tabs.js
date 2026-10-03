/*
==================================================
TAB NAVIGATION
==================================================

Controls:

- Sidebar navigation
- URL
- Browser Back
- Browser Forward
- Page refresh

Example:

?tab=billing
?tab=orders
?tab=customers
?tab=marketing

==================================================
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
==================================================
ELEMENTS
==================================================
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
==================================================
GET TAB FROM URL
==================================================
*/

function getTabFromURL() {

    const params =
        new URLSearchParams(window.location.search);

    const tab =
        params.get("tab");


    if (!tab) {
        return "billing";
    }


    if (!tabs[tab]) {
        return "billing";
    }


    return tab;

}


/*
==================================================
ACTIVATE TAB
==================================================
*/

function activateTab(
    tabName,
    updateURL = true
) {

    if (!tabs[tabName]) {
        tabName = "billing";
    }


    /*
    Sidebar
    */

    navButtons.forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.tab === tabName
        );

    });


    /*
    Page sections
    */

    tabContents.forEach(content => {

        content.classList.toggle(
            "active",
            content.dataset.tabContent === tabName
        );

    });


    /*
    Header
    */

    pageTitle.textContent =
        tabs[tabName].title;

    pageDescription.textContent =
        tabs[tabName].description;


    /*
    URL
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
==================================================
CLICK EVENTS
==================================================
*/

navButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            activateTab(
                button.dataset.tab
            );

        }
    );

});


/*
==================================================
BROWSER BACK / FORWARD
==================================================
*/

window.addEventListener(
    "popstate",
    () => {

        activateTab(
            getTabFromURL(),
            false
        );

    }
);


/*
==================================================
INITIAL LOAD
==================================================
*/

activateTab(
    getTabFromURL(),
    false
);
