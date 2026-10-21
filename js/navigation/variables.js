/* =====================================================
   GLOBAL APPLICATION VARIABLES
===================================================== */

window.appVariables = {
    // Current page
    pageTitle: "",
    pageDescription: "",
    pageName: "",
    currentRoute: "billing",

    // Restaurant identity (static for now; can be populated by the backend later)
    restaurantName: "Restaurant POS",
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

window.setPageVariables = function (config, route = "") {
    const routeParts = route.split("/").filter(Boolean);
    window.appVariables.pageTitle = config.title || "";
    window.appVariables.pageDescription = config.description || "";
    window.appVariables.currentRoute = route || config.page || "";
    window.appVariables.pageName = config.pageName || routeParts.join("-") || config.page || "";

    window.printAppVariables();
};

window.printAppVariables = function (container = document) {
    if (!container || typeof container.querySelectorAll !== "function") return;

    // Include the container itself when it is a variable-bound element.
    const elements = [];
    if (container.matches?.("[data-app-variable]")) elements.push(container);
    elements.push(...container.querySelectorAll("[data-app-variable]"));

    elements.forEach(element => {
        const variable = element.dataset.appVariable;
        const value = window.appVariables[variable];
        element.textContent = value ?? "";
    });
};

document.addEventListener("pos:component-loaded", event => {
    window.printAppVariables(event.target);
});
