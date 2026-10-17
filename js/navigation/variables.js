
/* =====================================================
   GLOBAL APPLICATION VARIABLES
===================================================== */

window.appVariables = {

    // Current page
    pageTitle: "",
    pageDescription: "",

    // Restaurant
    restaurantName: "",
    activeOutletId: null,

    // User and permissions
    currentUser: null,
    userRole: null,

    // Preferences
    activeTheme: "light",
    currency: "INR",
    language: "en",

    // Connectivity and synchronization
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: null

};


/* =====================================================
   UPDATE CURRENT PAGE VARIABLES
===================================================== */

window.setPageVariables = function (config) {
    window.appVariables.pageTitle = config.title || "";
    window.appVariables.pageDescription = config.description || "";

    // Refresh any matching elements already in the DOM.
    window.printAppVariables();
};


/* =====================================================
   PRINT GLOBAL VARIABLES INTO HTML
===================================================== */

window.printAppVariables = function (container = document) {

    container.querySelectorAll("[data-app-variable]").forEach(element => {

        const variable = element.dataset.appVariable;
        const value = window.appVariables[variable];

        element.textContent = value ?? "";

    });

};


/* =====================================================
   REFRESH VARIABLES WHEN HTML COMPONENTS LOAD
===================================================== */

document.addEventListener("pos:component-loaded", event => {
    window.printAppVariables(event.target);
});
