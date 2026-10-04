/*
==================================================
TAB NAVIGATION
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

    if (!tab || !tabs[tab]) {
        return "billing";
    }

    return tab;
}


/*
==================================================
ACTIVATE TAB
==================================================
*/

async function activateTab(
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


    /*
    Load Page
    */

    await loadPage(tabName);

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
