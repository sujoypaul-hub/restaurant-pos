
/* =====================================================
   COMPONENT LOADER
   Loads pages, reusable HTML components and page scripts.
   All HTML paths are relative to the project root.
===================================================== */

// Track loaded scripts and cache HTML requests.
const loadedScripts = new Map();
const htmlCache = new Map();

// Resolve paths relative to index.html.
function resolveProjectPath(path) {
    return new URL(path.replace(/^\/+/, ""), document.baseURI).href;
}

// Fetch HTML and reuse cached requests.
async function fetchHTML(path) {
    const url = resolveProjectPath(path);

    if (!htmlCache.has(url)) {
        const request = fetch(url).then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);
            return response.text();
        });

        htmlCache.set(url, request);
        request.catch(() => htmlCache.delete(url));
    }

    return htmlCache.get(url);
}

// Load one component and any components nested inside it.
async function loadComponent(element, parentPaths = []) {
    if (!element?.dataset.include || element.dataset.componentLoaded === "true") return;

    const filePath = element.dataset.include.trim();
    const componentURL = resolveProjectPath(filePath);

    // Stop only if this file already exists in its ancestor chain.
    if (parentPaths.includes(componentURL)) {
        console.error(`Circular component include detected: ${filePath}`, parentPaths);
        return;
    }

    // Prevent simultaneous duplicate loads on this element.
    if (element._componentPromise) return element._componentPromise;

    element._componentPromise = (async () => {
        element.dataset.componentLoading = "true";

        try {
            element.innerHTML = await fetchHTML(filePath);

            // Only inspect descendants here. Do not reload this element.
            await loadComponents(element, [...parentPaths, componentURL]);

            element.dataset.componentLoaded = "true";

            element.dispatchEvent(new CustomEvent("pos:component-loaded", {
                bubbles: true,
                detail: { path: filePath }
            }));
        } catch (error) {
            console.error(`Component loading failed: ${filePath}`, error);
            element.innerHTML = `<!-- Failed to load ${filePath} -->`;
        } finally {
            delete element.dataset.componentLoading;
            delete element._componentPromise;
        }
    })();

    return element._componentPromise;
}

// Load all include elements inside a container.
async function loadComponents(container = document, parentPaths = []) {
    const components = [...container.querySelectorAll("[data-include]")];

    await Promise.all(components.map(element => loadComponent(element, parentPaths)));
}

// Load a JavaScript file once.
function loadScript(scriptPath) {
    const url = resolveProjectPath(scriptPath);

    if (loadedScripts.has(url)) return loadedScripts.get(url);

    const promise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = url;
        script.onload = resolve;
        script.onerror = () => {
            script.remove();
            reject(new Error(`Could not load script: ${scriptPath}`));
        };
        document.body.appendChild(script);
    });

    loadedScripts.set(url, promise);
    promise.catch(() => loadedScripts.delete(url));

    return promise;
}

// Load a page, its components, scripts and initializers.
async function loadPage(pageConfig) {
    const container = document.getElementById("page-container");

    if (!container || !pageConfig?.page) {
        console.error("Page container or page configuration is missing.");
        return;
    }

    try {
        if (window.POSShellReady) await window.POSShellReady;

        container.innerHTML = await fetchHTML(`pages/${pageConfig.page}.html`);
        await loadComponents(container);

        for (const scriptPath of pageConfig.scripts || []) {
            await loadScript(scriptPath);
        }

        for (const scriptPath of pageConfig.scripts || []) {
            const init = window.POSPageInitializers?.[scriptPath];
            if (typeof init === "function") await init();
        }

        if (typeof window.POSTabs?.initialize === "function") {
            window.POSTabs.initialize();
        }

        document.dispatchEvent(new CustomEvent("pos:page-loaded", {
            detail: { page: pageConfig.page, config: pageConfig }
        }));
    } catch (error) {
        console.error(`Page loading failed: ${pageConfig.page}`, error);
        container.innerHTML = `<div class="page-load-error"><h3>Unable to load this page</h3><p>Check the file paths and try again.</p></div>`;
    }
}

// Load the global sidebar and header from index.html.
window.POSShellReady = loadComponents(document).then(() => {
    const route = new URLSearchParams(location.search).get("route") || "billing";
    const topRoute = route.split("/").filter(Boolean)[0];

    document.querySelectorAll(".nav-btn").forEach(button => {
        button.classList.toggle("active", button.dataset.route === topRoute);
    });
});

// Public API.
window.POSComponents = { load: loadComponent, loadAll: loadComponents };
window.loadPage = loadPage;
