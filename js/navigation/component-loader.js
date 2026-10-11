const loadedScripts = {};


/* ==========================================
   LOAD PAGE
   ========================================== */

async function loadPage(pageConfig) {

    const container =
        document.getElementById("page-container");

    try {

        /* --------------------------------------
           LOAD HTML
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
           LOAD SCRIPTS
           -------------------------------------- */

        if (pageConfig.scripts) {

            for (
                const scriptPath
                of pageConfig.scripts
            ) {

                if (!loadedScripts[scriptPath]) {

                    await loadScript(
                        scriptPath
                    );

                    loadedScripts[scriptPath] =
                        true;
                }
            }
        }


        /* --------------------------------------
           INITIALIZE PAGE
           -------------------------------------- */

        if (
            pageConfig.scripts &&
            window.POSPageInitializers
        ) {

            for (
                const scriptPath
                of pageConfig.scripts
            ) {

                const initializer =
                    window.POSPageInitializers[
                        scriptPath
                    ];

                if (
                    typeof initializer ===
                    "function"
                ) {

                    initializer();

                }
            }
        }

       /*
      ==========================================
      INITIALIZE UNIVERSAL TABS
      ==========================================
      */
      
      if (window.POSTabs) {
      
          window.POSTabs.initialize();
      
      }

    } catch (error) {

        console.error(
            "Page loading error:",
            error
        );

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
                document.createElement(
                    "script"
                );

            script.src = src;

            script.onload =
                resolve;

            script.onerror =
                reject;

            document.body.appendChild(
                script
            );
        }
    );
}
