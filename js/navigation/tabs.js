/* =========================================================
   UNIVERSAL TAB SYSTEM
   Supports:
   1. Preloaded panels using data-tab-panel
   2. Dynamically loaded pages using data-tab-page
   ========================================================= */

(function () {
    "use strict";

    const TAB_CONTAINER_SELECTOR = "[data-tabs]";
    const TAB_BUTTON_SELECTOR = "[data-tab]";

    /**
     * Initialize every tab container on the page.
     */
    function initialize() {
        document.querySelectorAll(TAB_CONTAINER_SELECTOR).forEach(container => {
            initializeTabContainer(container);
        });
    }

    /**
     * Initialize one tab container.
     */
    function initializeTabContainer(container) {
        if (container.dataset.tabsInitialized === "true") {
            return;
        }

        const tabs = Array.from(
            container.querySelectorAll(TAB_BUTTON_SELECTOR)
        );

        if (!tabs.length) {
            return;
        }

        // Only use buttons belonging to this tab container,
        // not buttons inside a nested tab container.
        const ownTabs = tabs.filter(tab =>
            tab.closest(TAB_CONTAINER_SELECTOR) === container
        );

        if (!ownTabs.length) {
            return;
        }

        container.dataset.tabsInitialized = "true";

        // Determine the tab requested by the URL.
        const params = new URLSearchParams(window.location.search);
        const requestedTab = params.get("tab");

        // Determine the configured default tab.
        const defaultTab = container.dataset.defaultTab;

        // Prefer a valid URL tab, then the configured default,
        // then the first available tab.
        const initialTab =
            ownTabs.find(tab => tab.dataset.tab === requestedTab) ||
            ownTabs.find(tab => tab.dataset.tab === defaultTab) ||
            ownTabs[0];

        // Bind click events.
        ownTabs.forEach(tab => {
            tab.addEventListener("click", () => {
                activateTab(container, tab.dataset.tab);
            });
        });

        // Activate the initial tab without changing the URL.
        activateTab(container, initialTab.dataset.tab, false);
    }

    /**
     * Activate a tab and update its content.
     *
     * Preloaded tabs:
     *   Uses data-tab-panel.
     *
     * Dynamic tabs:
     *   Uses data-tab-page and window.loadHTML().
     */
    function activateTab(container, tabName, updateURL = true) {
        if (!container || !tabName) {
            return;
        }

        const tabs = Array.from(
            container.querySelectorAll(TAB_BUTTON_SELECTOR)
        ).filter(tab =>
            tab.closest(TAB_CONTAINER_SELECTOR) === container
        );

        const selectedTab = tabs.find(
            tab => tab.dataset.tab === tabName
        );

        // Ignore unknown tab names.
        if (!selectedTab) {
            return;
        }

        // Update button states.
        tabs.forEach(tab => {
            const isActive = tab === selectedTab;

            tab.classList.toggle("active", isActive);
            tab.setAttribute("aria-selected", String(isActive));
            tab.setAttribute("tabindex", isActive ? "0" : "-1");
        });

        // Update preloaded panels, if this container has any.
        const panels = Array.from(
            container.querySelectorAll("[data-tab-panel]")
        ).filter(panel =>
            panel.closest(TAB_CONTAINER_SELECTOR) === container
        );

        panels.forEach(panel => {
            const isActive = panel.dataset.tabPanel === tabName;

            panel.hidden = !isActive;
            panel.classList.toggle("active", isActive);
        });

        // Preserve support for dynamically loaded tab pages.
        const pagePath = selectedTab.dataset.tabPage;

        if (pagePath) {
            const contentTarget = container.querySelector(".tab-content");

            if (contentTarget && typeof window.loadHTML === "function") {
                window.loadHTML(contentTarget, pagePath);
            } else if (contentTarget) {
                console.warn(
                    "Tab page could not be loaded. Check window.loadHTML() and the .tab-content element.",
                    pagePath
                );
            }
        }

        // Update the URL only when requested.
        if (updateURL) {
            const url = new URL(window.location.href);

            url.searchParams.set("tab", tabName);

            window.history.pushState(
                { tab: tabName },
                "",
                url.pathname + url.search + url.hash
            );
        }
    }

    /**
     * Refresh tab initialization after dynamically inserting HTML.
     */
    function refresh() {
        document.querySelectorAll(TAB_CONTAINER_SELECTOR).forEach(container => {
            if (container.dataset.tabsInitialized === "true") {
                return;
            }

            initializeTabContainer(container);
        });
    }

    /**
     * Handle browser Back and Forward navigation.
     */
    window.addEventListener("popstate", () => {
        const params = new URLSearchParams(window.location.search);
        const requestedTab = params.get("tab");

        if (!requestedTab) {
            return;
        }

        document.querySelectorAll(TAB_CONTAINER_SELECTOR).forEach(container => {
            const tabs = Array.from(
                container.querySelectorAll(TAB_BUTTON_SELECTOR)
            ).filter(tab =>
                tab.closest(TAB_CONTAINER_SELECTOR) === container
            );

            const matchingTab = tabs.find(
                tab => tab.dataset.tab === requestedTab
            );

            if (matchingTab) {
                activateTab(container, requestedTab, false);
            }
        });
    });

    // Expose the public API.
    window.POSTabs = {
        initialize,
        activate: activateTab,
        refresh
    };

    // Initialize when the DOM is ready.
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize);
    } else {
        initialize();
    }
})();
