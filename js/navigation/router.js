
/* =====================================================
   APPLICATION ROUTER
   Owns page navigation, route history, page classes,
   menu active state, and document metadata.
===================================================== */

function getRouteFromURL() {
    const route = new URLSearchParams(window.location.search).get("route");
    return route ? route.split("/").filter(Boolean) : ["billing"];
}

function findRoute(routeParts) {
    let routes = appRoutes;
    let config = null;

    for (const part of routeParts) {
        if (!routes || !routes[part]) return null;
        config = routes[part];
        routes = config.children || {};
    }

    return config;
}

function routeToString(route) {
    return (Array.isArray(route) ? route : String(route).split("/"))
        .filter(Boolean)
        .join("/");
}

function getAppElement() {
    return document.querySelector(".app");
}

/* Manage router-owned classes without removing unrelated classes. */
function updateAppClasses(routeParts, config) {
    const app = getAppElement();
    const body = document.body;

    const configuredPageName = config.pageName || routeParts.join("-");
    const safePageName = String(configuredPageName)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const pageClass = `page-${safePageName || "unknown"}`;

    // Remove the previous page class.
    if (app) {
        const previousPageClass = app.dataset.posPageClass;
        if (previousPageClass) app.classList.remove(previousPageClass);

        // Remove custom classes applied by the previous route.
        const previousCustomClasses = (
            app.dataset.posCustomClasses || ""
        ).split(/\s+/).filter(Boolean);

        previousCustomClasses.forEach(className => {
            app.classList.remove(className);
        });

        // Apply the current page class.
        app.classList.add(pageClass);
        app.dataset.posPageClass = pageClass;

        // Apply or remove full-width layout.
        app.classList.toggle("fullwidth", config.fullwidth === true);

        // Apply custom classes configured in pages.js.
        const customClasses = typeof config.className === "string"
            ? config.className.split(/\s+/).filter(Boolean)
            : [];

        customClasses.forEach(className => {
            app.classList.add(className);
        });

        // Remember custom classes so they can be removed on navigation.
        app.dataset.posCustomClasses = customClasses.join(" ");
    }

    // Keep the body page class synchronized for legacy CSS.
    if (body) {
        const previousBodyPageClass = body.dataset.posPageClass;
        if (previousBodyPageClass) body.classList.remove(previousBodyPageClass);

        body.classList.add(pageClass);
        body.dataset.posPageClass = pageClass;
    }
}

function updateMainMenu(routeParts) {
    const topLevelRoute = routeParts[0];
    const buttons = document.querySelectorAll(
        ".main-menu [data-route], .menu-container [data-route], .nav-btn[data-route]"
    );

    buttons.forEach(button => {
        const buttonRoute = routeToString(button.dataset.route);
        const isActive = buttonRoute === topLevelRoute;

        button.classList.toggle("active", isActive);

        if (isActive) {
            button.setAttribute("aria-current", "page");
        } else {
            button.removeAttribute("aria-current");
        }
    });
}

function ensureMeta(selector, attributes) {
    let element = document.head.querySelector(selector);

    if (!element) {
        element = document.createElement("meta");

        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });

        document.head.appendChild(element);
    }

    return element;
}

function updateDocumentMetadata(config) {
    const restaurantName = window.appVariables?.restaurantName || "Restaurant POS";
    const pageTitle = config.title || "Restaurant POS";
    const fullTitle = pageTitle === restaurantName
        ? pageTitle
        : `${pageTitle} | ${restaurantName}`;
    const description = config.description || `${pageTitle} for ${restaurantName}.`;

    document.title = fullTitle;

    ensureMeta('meta[name="application-name"]', { name: "application-name" })
        .setAttribute("content", restaurantName);

    ensureMeta('meta[name="page-name"]', { name: "page-name" })
        .setAttribute("content", pageTitle);

    ensureMeta('meta[name="description"]', { name: "description" })
        .setAttribute("content", description);

    ensureMeta('meta[property="og:title"]', { property: "og:title" })
        .setAttribute("content", fullTitle);

    ensureMeta('meta[property="og:description"]', { property: "og:description" })
        .setAttribute("content", description);

    ensureMeta('meta[property="og:site_name"]', { property: "og:site_name" })
        .setAttribute("content", restaurantName);

    ensureMeta('meta[name="twitter:title"]', { name: "twitter:title" })
        .setAttribute("content", fullTitle);

    ensureMeta('meta[name="twitter:description"]', { name: "twitter:description" })
        .setAttribute("content", description);
}

async function navigateTo(route, updateURL = true) {
    const parts = Array.isArray(route)
        ? route.filter(Boolean)
        : String(route).split("/").filter(Boolean);

    const config = findRoute(parts);

    if (!config) {
        if (parts.join("/") !== "billing") {
            return navigateTo(["billing"], updateURL);
        }

        console.error("The fallback Billing route is not configured.");
        return;
    }

    const routeString = parts.join("/");

    if (updateURL) {
        const url = new URL(window.location.href);
        url.searchParams.set("route", routeString);
        url.searchParams.delete("tab");

        history.pushState(
            { posRoute: routeString, posInternal: true },
            "",
            url
        );
    }

    window.setPageVariables(config, routeString);
    updateAppClasses(parts, config);
    updateDocumentMetadata(config);

    // Wait for the shell to load before updating the menu.
    if (window.POSShellReady) {
        try {
            await window.POSShellReady;
        } catch (error) {
            console.error("Application shell failed to load:", error);
        }
    }

    updateMainMenu(parts);

    const container = document.getElementById("page-container");
    if (!container) return;

    await window.loadHTML(container, `html/pages/${config.page}.html`, {
        pageConfig: config
    });

    window.printAppVariables(container);

    // Reapply the active menu state after asynchronous loading.
    updateMainMenu(parts);
}

// Delegate clicks so dynamically loaded buttons work too.
document.addEventListener("click", event => {
    const backButton = event.target.closest("#app-back-button");

    if (backButton) {
        event.preventDefault();

        if (history.state?.posInternal) {
            history.back();
        } else {
            const parts = getRouteFromURL();
            navigateTo(parts.length > 1 ? parts.slice(0, -1) : ["billing"]);
        }

        return;
    }

    const routeElement = event.target.closest("[data-route]");
    if (!routeElement) return;

    const route = routeElement.dataset.route;
    if (!route) return;

    if (routeElement.tagName === "A") event.preventDefault();

    navigateTo(route);
});

window.addEventListener("popstate", () => {
    navigateTo(getRouteFromURL(), false);
});

window.POSRouter = {
    navigate: navigateTo,
    getCurrentRoute: getRouteFromURL,
    findRoute
};

// Initialize after the global HTML shell has loaded.
(async function initializeRouter() {
    if (window.POSShellReady) {
        try {
            await window.POSShellReady;
        } catch (error) {
            console.error("Application shell failed to load:", error);
        }
    }

    await navigateTo(getRouteFromURL(), false);
})();
