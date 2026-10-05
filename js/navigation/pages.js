```javascript
const loadedScripts = {};


/* ==========================================
   LOAD PAGE
   ========================================== */

async function loadPage(pageConfig) {

    const container =
        document.getElementById("page-container");

    try {

        /* --------------------------------------
           Load page HTML
           -------------------------------------- */

        const response =
            await fetch(
                `pages/${pageConfig.page}.html`
            );

        if (!response.ok) {
            throw new Error(
                `Page not found: ${pageConfig.page}`
            );
        }

        const html =
            await response.text();

        container.innerHTML = html;


        /* --------------------------------------
           Load page scripts
           -------------------------------------- */

        if (pageConfig.scripts) {

            for (const scriptPath of pageConfig.scripts) {

                /*
                 * Load each script only once.
                 */

                if (!loadedScripts[scriptPath]) {

                    await loadScript(scriptPath);

                    loadedScripts[scriptPath] = true;

                }
            }
        }


        /* --------------------------------------
           Initialize page
           --------------------------------------

           Scripts are loaded only once.

           But the HTML is recreated every time
           the user opens the page.

           Therefore we must initialize the
           page again after every page load.
        */

        initializePage(pageConfig);

    } catch (error) {

        console.error(error);

        container.innerHTML =
            "<p>Unable to load page.</p>";
    }
}


/* ==========================================
   LOAD SCRIPT
   ========================================== */

function loadScript(src) {

    return new Promise(
        (resolve, reject) => {

            const script =
                document.createElement("script");

            script.src = src;

            script.onload = resolve;

            script.onerror = reject;

            document.body.appendChild(script);
        }
    );
}


/* ==========================================
   INITIALIZE PAGE
   ========================================== */

function initializePage(pageConfig) {

    /*
     * Every page script can expose its own
     * initialization function through
     * window.POSPageInitializers.
     *
     * This keeps page logic separate from
     * the router.
     */

    if (!pageConfig.scripts) {
        return;
    }

    pageConfig.scripts.forEach(
        scriptPath => {

            const initializer =
                window.POSPageInitializers &&
                window.POSPageInitializers[scriptPath];

            if (
                typeof initializer === "function"
            ) {

                initializer();

            }
        }
    );
}
```
