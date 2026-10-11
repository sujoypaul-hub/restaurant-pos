
/* =====================================================
   UNIVERSAL HTML LOADER
   Loads pages and components using the same function.
===================================================== */

const loadedScripts = new Map();
const htmlCache = new Map();

// Resolve paths from the project root (index.html).
function resolveProjectPath(path) {
    return new URL(path.replace(/^\/+/, ""), document.baseURI).href;
}

// Fetch and cache HTML files.
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

// The one universal function: loads any HTML into any target.
async function loadHTML(target, path, options = {}) {
    if (!target || !path) return;

    const url = resolveProjectPath(path);
    const ancestors = options.ancestors || [];

    // Stop only genuine circular includes in this component's ancestry.
    if (ancestors.includes(url)) {
        console.error(`Circular HTML include: ${path}`, ancestors);
        return;
    }

    // Avoid duplicate concurrent loads of the same file into this target.
    if (target._htmlLoadPromise?.url === url) return target._htmlLoadPromise.promise;

    const promise = (async () => {
        try {
            target.innerHTML = await fetchHTML(path);

            // Recursively load nested components with the same function.
            const nestedTargets = [...target.querySelectorAll("[data-load]")];

            await Promise.all(nestedTargets.map(child =>
                loadHTML(child, child.dataset.load, {
                    ancestors: [...ancestors, url]
                })
            ));

            target.dataset.loadedPath = url;

            target.dispatchEvent(new CustomEvent("pos:component-loaded", {
                bubbles: true,
                detail: { path }
            }));

            // Page-specific work runs only when a page configuration is supplied.
            const pageConfig = options.pageConfig;

            if (pageConfig) {
                for (const scriptPath of pageConfig.scripts || []) {
                    await loadScript(scriptPath);
                }

                for (const scriptPath of pageConfig.scripts || []) {
                    const initializer = window.POSPageInitializers?.[scriptPath];
                    if (typeof initializer === "function") await initializer();
                }

                if (typeof window.POSTabs?.initialize === "function") {
                    window.POSTabs.initialize();
                }

                document.dispatchEvent(new CustomEvent("pos:page-loaded", {
                    detail: { page: pageConfig.page, config: pageConfig }
                }));
            }
        } catch (error) {
            console.error(`HTML loading failed: ${path}`, error);

            if (options.pageConfig) {
                target.innerHTML = `<div class="page-load-error"><h3>Unable to load this page</h3><p>Check the file path and try again.</p></div>`;
            } else {
                target.innerHTML = `<!-- Failed to load ${path} -->`;
            }
        }
    })();

    target._htmlLoadPromise = { url, promise };

    try {
        await promise;
    } finally {
        if (target._htmlLoadPromise?.promise === promise) {
            delete target._htmlLoadPromise;
        }
    }
}

// Load each JavaScript file once.
function loadScript(path) {
    const url = resolveProjectPath(path);

    if (loadedScripts.has(url)) return loadedScripts.get(url);

    const promise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = url;
        script.onload = resolve;
        script.onerror = () => {
            script.remove();
            reject(new Error(`Could not load script: ${path}`));
        };
        document.body.appendChild(script);
    });

    loadedScripts.set(url, promise);
    promise.catch(() => loadedScripts.delete(url));
    return promise;
}

// Load global components from index.html before routing starts.
window.POSShellReady = Promise.all(
    [...document.querySelectorAll("body > .app [data-load]")].map(target =>
        loadHTML(target, target.dataset.load)
    )
);

// Public API.
window.POSComponents = { load: loadHTML };
window.loadHTML = loadHTML;
window.loadScript = loadScript;
