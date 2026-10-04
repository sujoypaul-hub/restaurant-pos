const pageScripts = {
    billing: [
        "js/billing/cart.js",
        "js/billing/order-type.js",
        "js/billing/customer-input.js",
        "js/billing/billing.js"
    ]
};


async function loadPage(page) {

    const container =
        document.getElementById("page-container");

    try {

        const response =
            await fetch(`pages/${page}.html`);

        if (!response.ok) {
            throw new Error(`Page not found: ${page}`);
        }

        const html =
            await response.text();

        container.innerHTML = html;


        /*
        Load page-specific JavaScript
        */

        if (pageScripts[page]) {

            for (const scriptPath of pageScripts[page]) {

                await loadScript(scriptPath);

            }

        }

    } catch (error) {

        console.error(error);

        container.innerHTML =
            "<p>Unable to load page.</p>";

    }

}


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
