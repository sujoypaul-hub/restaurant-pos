
/*
=========================================================
COMPONENT LOADER
=========================================================

Responsibilities:
1. Load reusable HTML files from anywhere in the project.
2. Support nested HTML components.
3. Load page HTML using the existing pages.js configuration.
4. Load each JavaScript file only once.
5. Run page initializers and existing POS tab initialization.
6. Support GitHub Pages project paths.

Example HTML:
<div data-include="layout/sidebar.html"></div>
<div data-include="shared/online-status.html"></div>

Paths are relative to the project root, not the HTML file.
=========================================================
*/


// -------------------------------------------------------
// 1. INTERNAL TRACKING
// -------------------------------------------------------

// Prevent duplicate script loading.
const loadedScripts = new Map();

// Cache fetched HTML so repeated components avoid
// downloading the same file multiple times.
const htmlCache = new Map();


// -------------------------------------------------------
// 2. PROJECT PATH HELPER
// -------------------------------------------------------

/*
Resolve a project-relative path.

Example:
"pages/billing.html"

On GitHub Pages, this resolves to:
"/restaurant-pos/pages/billing.html"

Do not start paths with "/" because that would point
to the domain root instead of the project folder.
*/

function resolveProjectPath(path) {
    return new URL(
        path.replace(/^\/+/, ""),
        document.baseURI
    ).href;
}


// -------------------------------------------------------
// 3. FETCH HTML
// -------------------------------------------------------

async function fetchHTML(path) {
    const url = resolveProjectPath(path);

    // Reuse cached HTML when possible.
    if (htmlCache.has(url)) {
        return htmlCache.get(url);
    }

    const request = fetch(url).then(response => {
        if (!response.ok) {
            throw new Error(
                `Could not load "${path}". HTTP ${response.status}`
            );
        }

        return response.text();
    });

    htmlCache.set(url, request);

    try {
        return await request;
    } catch (error) {
        // Allow another attempt if the request fails.
        htmlCache.delete(url);
        throw error;
    }
}


// -------------------------------------------------------
// 4. LOAD ONE HTML COMPONENT
// -------------------------------------------------------

async function loadComponent(element, parentPaths = []) {
    if (!element || !element.dataset.include) {
        return;
    }

    // Avoid loading the same element twice.
    if (element.dataset.componentLoaded === "true") {
        return;
    }

    const filePath = element.dataset.include.trim();

    if (!filePath) {
        return;
    }

    const componentURL = new URL(
    filePath.replace(/^\/+/, ""),
    document.baseURI ).pathname;


// Prevent a component from including itself recursively.
const normalizedPath = new URL(filePath.replace(/^\/+/, ""), document.baseURI).pathname;

if (parentPaths.includes(normalizedPath)) {
    console.error(`Circular component include detected: ${filePath}`);
    element.innerHTML = `<!-- Circular include prevented: ${filePath} -->`;
    return;
}

    // Mark the element as loading.
    element.dataset.componentLoading = "true";

    try {
        // Fetch and insert the component HTML.
        const html = await fetchHTML(filePath);

        element.innerHTML = html;

        // Find nested components inside this component.
        await loadComponents(
            element,
            [...parentPaths, componentURL]
        );

        element.dataset.componentLoaded = "true";

        // Notify other app features that a component is ready.
        element.dispatchEvent(
            new CustomEvent("pos:component-loaded", {
                bubbles: true,
                detail: { path: filePath }
            })
        );

    } catch (error) {
        console.error(
            `Component loading failed: ${filePath}`,
            error
        );

        element.innerHTML =
            `<!-- Failed to load component: ${filePath} -->`;

    } finally {
        delete element.dataset.componentLoading;
    }
}


// -------------------------------------------------------
// 5. LOAD ALL COMPONENTS INSIDE AN ELEMENT
// -------------------------------------------------------

async function loadComponents(
    container = document,
    parentPaths = []
) {
    const components = [];

    // Include the container itself if it is a component.
    if (
        container instanceof Element &&
        container.matches("[data-include]")
    ) {
        components.push(container);
    }

    // Find all components inside the container.
    if (container.querySelectorAll) {
        components.push(
            ...container.querySelectorAll("[data-include]")
        );
    }

    // Load components in parallel.
    await Promise.all(
        components.map(element =>
            loadComponent(element, parentPaths)
        )
    );
}


// -------------------------------------------------------
// 6. LOAD A JAVASCRIPT FILE ONCE
// -------------------------------------------------------

function loadScript(scriptPath) {
    const scriptURL = resolveProjectPath(scriptPath);

    // Reuse an existing loading promise or loaded script.
    if (loadedScripts.has(scriptURL)) {
        return loadedScripts.get(scriptURL);
    }

    const promise = new Promise((resolve, reject) => {
        const script = document.createElement("script");

        script.src = scriptURL;
        script.async = false;

        script.onload = () => resolve();
        script.onerror = () => {
            script.remove();

            reject(
                new Error(`Could not load script: ${scriptPath}`)
            );
        };

        document.body.appendChild(script);
    });

    loadedScripts.set(scriptURL, promise);

    // Permit retries if the script fails to load.
    promise.catch(() => {
        loadedScripts.delete(scriptURL);
    });

    return promise;
}


// -------------------------------------------------------
// 7. LOAD A PAGE USING pages.js CONFIGURATION
// -------------------------------------------------------

async function loadPage(pageConfig) {
    const container = document.getElementById("page-container");

    if (!container) {
        console.error(
            'Missing required element: id="page-container"'
        );
        return;
    }

    if (!pageConfig || !pageConfig.page) {
        console.error("Invalid page configuration:", pageConfig);
        return;
    }

    try {
        // Wait until reusable components in index.html
        // have loaded before rendering the requested page.
        if (window.POSShellReady) {
            await window.POSShellReady;
        }

        // Load the requested page HTML.
        const pagePath = `pages/${pageConfig.page}.html`;
        const html = await fetchHTML(pagePath);

        container.innerHTML = html;

        // Load reusable components inside this page.
        await loadComponents(container);

        // Load page-specific scripts in configuration order.
        if (Array.isArray(pageConfig.scripts)) {
            for (const scriptPath of pageConfig.scripts) {
                await loadScript(scriptPath);
            }

            // Run registered initializers after scripts load.
            if (window.POSPageInitializers) {
                for (const scriptPath of pageConfig.scripts) {
                    const initializer =
                        window.POSPageInitializers[scriptPath];

                    if (typeof initializer === "function") {
                        await initializer();
                    }
                }
            }
        }

        // Preserve the existing tab initialization system.
        if (
            window.POSTabs &&
            typeof window.POSTabs.initialize === "function"
        ) {
            window.POSTabs.initialize();
        }

        // Notify the application that the page is ready.
        document.dispatchEvent(
            new CustomEvent("pos:page-loaded", {
                detail: {
                    page: pageConfig.page,
                    config: pageConfig
                }
            })
        );

    } catch (error) {
        console.error(
            `Page loading failed: ${pageConfig.page}`,
            error
        );

        container.innerHTML = `
            <div class="page-load-error">
                <h3>Unable to load this page</h3>
                <p>Please check your file paths and try again.</p>
            </div>
        `;
    }
}


// -------------------------------------------------------
// 8. INITIALIZE GLOBAL COMPONENTS
// -------------------------------------------------------

/*
Load components placed directly in index.html.

The router can wait for POSShellReady before rendering
the initial page. This prevents page loading from racing
with the sidebar/header loading process.
*/

window.POSShellReady = loadComponents(document).then(() => {

    // Correct the active sidebar item after it is inserted.
    const params = new URLSearchParams(window.location.search);
    const route = params.get("route") || "billing";
    const topLevelRoute = route.split("/").filter(Boolean)[0];

    document.querySelectorAll(".nav-btn").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.route === topLevelRoute
        );
    });

});


// -------------------------------------------------------
// 9. PUBLIC COMPONENT LOADER API
// -------------------------------------------------------

window.POSComponents = {
    load: loadComponent,
    loadAll: loadComponents
};

// Keep the existing page-loader API.
window.loadPage = loadPage;
