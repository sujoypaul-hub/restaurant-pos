async function loadPage(page) {
    const container = document.getElementById("page-container");

    const response = await fetch(`pages/${page}.html`);
    const html = await response.text();

    container.innerHTML = html;
}

loadPage("billing");
