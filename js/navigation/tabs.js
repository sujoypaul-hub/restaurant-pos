/*
==================================================
UNIVERSAL TAB SYSTEM
==================================================

This file handles all tab-based interfaces.

Features:

- Universal tab initialization
- Default tab
- URL-based tab state
- Browser Back / Forward support
- Loads tab content dynamically
- No page-specific IDs required
- No page-specific tab logic

Required HTML structure:

<div data-tabs="example" data-default-tab="first">

    <div class="tabs">
        <button data-tab="first" data-tab-page="example/first">
            First
        </button>

        <button data-tab="second" data-tab-page="example/second">
            Second
        </button>
    </div>

    <div class="tab-content">
        <!-- Dynamic content loads here -->
    </div>

</div>

==================================================
*/


/*
==================================================
INITIALIZE ALL TAB CONTAINERS
==================================================
*/

function initializeTabs() {

    const tabContainers =
        document.querySelectorAll(
            "[data-tabs]"
        );


    tabContainers.forEach(
        initializeTabContainer
    );

}


/*
==================================================
INITIALIZE ONE TAB CONTAINER
==================================================
*/

function initializeTabContainer(
    container
) {

    const tabs =
        container.querySelectorAll(
            "[data-tab]"
        );


    /*
    No tabs found.
    */

    if (!tabs.length) {

        return;

    }


    /*
    Find default tab.

    If data-default-tab is not provided,
    use the first tab.
    */

    const defaultTab =
        container.dataset.defaultTab ||
        tabs[0].dataset.tab;


    /*
    Read tab from URL.
    */

    const params =
        new URLSearchParams(
            window.location.search
        );


    const urlTab =
        params.get("tab");


    /*
    Check whether URL tab exists
    inside this tab group.
    */

    const validUrlTab =
        Array.from(tabs).some(
            tab =>
                tab.dataset.tab ===
                urlTab
        );


    /*
    Use URL tab if valid.
    Otherwise use default tab.
    */

    const activeTab =
        validUrlTab
            ? urlTab
            : defaultTab;


    /*
    Activate initial tab.
    */

    activateTab(
        container,
        activeTab,
        false
    );


    /*
    Add click listeners.
    */

    tabs.forEach(
        tab => {

            /*
            Prevent duplicate listeners.
            */

            if (
                tab.dataset.tabListenerInitialized ===
                "true"
            ) {

                return;

            }


            tab.addEventListener(
                "click",
                () => {

                    activateTab(
                        container,
                        tab.dataset.tab,
                        true
                    );

                }
            );


            tab.dataset.tabListenerInitialized =
                "true";

        }
    );

    // Toggle existing panels when using in-page tabs
const panels = container.querySelectorAll("[data-tab-panel]");

panels.forEach(panel => {
    const isActive = panel.dataset.tabPanel === tabName;
    panel.hidden = !isActive;
});

}


/*
==================================================
ACTIVATE TAB
==================================================
*/

async function activateTab(
    container,
    tabName,
    updateURL = true
) {

    const tabs =
        container.querySelectorAll(
            "[data-tab]"
        );


    /*
    Find selected tab.
    */

    const selectedTab =
        Array.from(tabs).find(
            tab =>
                tab.dataset.tab ===
                tabName
        );


    /*
    Invalid tab.
    */

    if (!selectedTab) {

        return;

    }


    /*
    Update tab visual state.
    */

    tabs.forEach(
        tab => {

            const isActive =
                tab === selectedTab;


            tab.classList.toggle(
                "active",
                isActive
            );


            tab.setAttribute(
                "aria-selected",
                isActive
                    ? "true"
                    : "false"
            );

        }
    );


    /*
    Find tab content automatically.

    IMPORTANT:

    No ID is required.

    The system simply looks for:

        .tab-content

    inside the current tab container.
    */

    const contentTarget =
        container.querySelector(
            ".tab-content"
        );


    /*
    Load tab page.
    */

    if (
        contentTarget &&
        selectedTab.dataset.tabPage
    ) {

        await window.loadHTML(
            contentTarget,
            selectedTab.dataset.tabPage
        );

    }


    /*
    Update URL.
    */

    if (updateURL) {

        const url =
            new URL(
                window.location.href
            );


        url.searchParams.set(
            "tab",
            tabName
        );


        /*
        Add browser history entry.
        */

        history.pushState(
            {
                route:
                    window.POSRouter
                        ?.getCurrentRoute(),

                tab:
                    tabName
            },
            "",
            url
        );

    }

}


/*
==================================================
REFRESH TABS
==================================================
*/

function refreshCurrentTabs() {

    initializeTabs();

}


/*
==================================================
PUBLIC TAB API
==================================================
*/

window.POSTabs = {

    initialize:
        initializeTabs,

    activate:
        activateTab,

    refresh:
        refreshCurrentTabs

};
