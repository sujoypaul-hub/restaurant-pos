/*
==================================================
UNIVERSAL TAB SYSTEM
==================================================

This file handles reusable page-level tabs.

Example:

?route=orders&tab=new
?route=orders&tab=ongoing

The system is NOT page-specific.

Any page can use:

data-tabs="group-name"

and define its tabs through HTML.

==================================================
*/


/*
==================================================
INITIALIZE TABS
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

    const tabGroup =
        container.dataset.tabs;


    if (!tabGroup) {

        return;

    }


    const tabs =
        container.querySelectorAll(
            "[data-tab]"
        );


    if (!tabs.length) {

        return;

    }


    /*
    ==============================================
    FIND DEFAULT TAB
    ==============================================
    */

    const defaultTab =
        container.dataset.defaultTab ||
        tabs[0].dataset.tab;


    /*
    ==============================================
    GET CURRENT TAB FROM URL
    ==============================================
    */

    const params =
        new URLSearchParams(
            window.location.search
        );


    const urlTab =
        params.get("tab");


    /*
    ==============================================
    DETERMINE ACTIVE TAB
    ==============================================
    */

    let activeTab =
        urlTab;


    /*
    URL tab must actually exist
    in this tab group.
    */

    const validTab =
        Array.from(tabs)
            .some(
                tab =>
                    tab.dataset.tab ===
                    activeTab
            );


    if (!validTab) {

        activeTab =
            defaultTab;

    }


    /*
    ==============================================
    ACTIVATE TAB
    ==============================================
    */

    activateTab(
        container,
        activeTab,
        false
    );


    /*
    ==============================================
    TAB CLICK EVENTS
    ==============================================
    */

    tabs.forEach(
        tab => {

            /*
            Prevent duplicate listeners
            when the page is opened again.
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

}


/*
==================================================
ACTIVATE TAB
==================================================
*/

async function activateTab(
    container,
    tabName,
    updateURL
) {

    const tabs =
        container.querySelectorAll(
            "[data-tab]"
        );


    const tab =
        Array.from(tabs)
            .find(
                item =>
                    item.dataset.tab ===
                    tabName
            );


    if (!tab) {

        return;

    }


    /*
    ==============================================
    UPDATE ACTIVE BUTTON
    ==============================================
    */

    tabs.forEach(
        item => {

            item.classList.toggle(
                "active",
                item === tab
            );

            item.setAttribute(
                "aria-selected",
                item === tab
                    ? "true"
                    : "false"
            );

        }
    );


    /*
    ==============================================
    LOAD TAB CONTENT
    ==============================================
    */

    const contentTarget =
        container.dataset.tabContent;


    if (contentTarget) {

        await loadTabContent(
            contentTarget,
            tab.dataset.tabPage
        );

    }


    /*
    ==============================================
    UPDATE URL
    ==============================================
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
LOAD TAB CONTENT
==================================================
*/

async function loadTabContent(
    targetId,
    pagePath
) {

    const target =
        document.getElementById(
            targetId
        );


    if (!target || !pagePath) {

        return;

    }


    try {

        const response =
            await fetch(
                `pages/${pagePath}.html`
            );


        if (!response.ok) {

            throw new Error(
                `Tab page not found: ${pagePath}`
            );

        }


        target.innerHTML =
            await response.text();


    } catch (error) {

        console.error(
            "Tab content loading error:",
            error
        );


        target.innerHTML =
            "<p>Unable to load tab content.</p>";

    }

}


/*
==================================================
BROWSER BACK / FORWARD
==================================================

When browser navigation happens, reload
the currently selected tab.

==================================================
*/

function refreshCurrentTabs() {

    initializeTabs();

}


/*
==================================================
PUBLIC API
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
