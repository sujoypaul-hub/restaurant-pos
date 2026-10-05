const loadedScripts = {};


/* ==========================================
   LOAD PAGE
   ========================================== */

async function loadPage(pageConfig) {

    const container =
        document.getElementById("page-container");

    try {

        /* Load page HTML */

        const response = await fetch(
            `pages/${pageConfig.page}.html`
        );

        if (!response.ok) {
            throw new Error(
                `Page not found: ${pageConfig.page}`
            );
        }

        const html = await response.text();

        container.innerHTML = html;


        /* Load page scripts */

        if (pageConfig.scripts) {

            for (const scriptPath of pageConfig.scripts) {

                if (!loadedScripts[scriptPath]) {

                    await loadScript(scriptPath);

                    loadedScripts[scriptPath] = true;
                }
            }
        }


        /* Initialize page */

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

    return new Promise((resolve, reject) => {

        const script =
            document.createElement("script");

        script.src = src;

        script.onload = resolve;

        script.onerror = reject;

        document.body.appendChild(script);
    });
}


/* ==========================================
   INITIALIZE PAGE
   ========================================== */

function initializePage(pageConfig) {

    if (!pageConfig.scripts) {
        return;
    }

    pageConfig.scripts.forEach(scriptPath => {

        const initializer =
            window.POSPageInitializers &&
            window.POSPageInitializers[scriptPath];

        if (typeof initializer === "function") {

            initializer();
        }
    });
}
