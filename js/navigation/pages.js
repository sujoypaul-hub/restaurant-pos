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

    } catch (error) {

        console.error(error);

        container.innerHTML =
            "<p>Unable to load page.</p>";

    }

}
