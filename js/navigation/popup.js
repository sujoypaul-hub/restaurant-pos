
/*
==================================================
UNIVERSAL POPUP SYSTEM
==================================================

Triggers:  [data-popup-target="example"]
Targets:   [data-popup="example"]
Close:     [data-popup-close]

Features:
- Multiple stacked popups
- Top popup receives interaction
- Background clicks are blocked
- Only explicit close / Escape closes popups
- Focus restoration
- Dynamic content support
==================================================
*/

const popupStack = [];
const popupSelector = ".pos-modal[data-popup]";
const baseZIndex = 1000;

function getPopup(value) {
    return Array.from(document.querySelectorAll(popupSelector))
        .find(popup => popup.dataset.popup === value) || null;
}

function getStackIndex(value) {
    return popupStack.findIndex(item => item.value === value);
}

function updatePopupLayers() {
    popupStack.forEach((item, index) => {
        item.popup.style.zIndex = baseZIndex + index * 10;
        item.popup.setAttribute("aria-hidden", "false");
        item.popup.inert = false;
    });

    // Lower popups remain visible but cannot be interacted with.
    popupStack.slice(0, -1).forEach(item => {
        item.popup.inert = true;
    });

    document.body.classList.toggle("pos-popup-open", popupStack.length > 0);
}

/*
==================================================
OPEN POPUP
==================================================
*/

function openPopup(value) {
    const popup = getPopup(value);

    if (!popup) {
        console.warn(`Popup not found: ${value}`);
        return;
    }

    const existingIndex = getStackIndex(value);

    // If already open, bring it to the top instead of duplicating it.
    if (existingIndex !== -1) {
        const [existing] = popupStack.splice(existingIndex, 1);
        popupStack.push(existing);
        updatePopupLayers();
        focusPopup(existing.popup);
        return;
    }

    const opener = document.activeElement;

    popupStack.push({
        value,
        popup,
        opener
    });

    popup.classList.add("active");
    popup.setAttribute("aria-hidden", "false");
    popup.inert = false;

    updatePopupLayers();
    focusPopup(popup);
}

function focusPopup(popup) {
    const focusable = popup.querySelector(
        'button:not([disabled]), input:not([disabled]), ' +
        'textarea:not([disabled]), select:not([disabled]), ' +
        'a[href], [tabindex]:not([tabindex="-1"])'
    );

    if (focusable) {
        focusable.focus();
    } else {
        popup.setAttribute("tabindex", "-1");
        popup.focus();
    }
}

/*
==================================================
CLOSE POPUP
==================================================
*/

function closePopup(value) {
    const index = getStackIndex(value);

    if (index === -1) {
        return;
    }

    // Only the top popup may close.
    if (index !== popupStack.length - 1) {
        return;
    }

    const [item] = popupStack.splice(index, 1);
    const { popup, opener } = item;

    popup.classList.remove("active");
    popup.setAttribute("aria-hidden", "true");
    popup.inert = false;
    popup.style.removeProperty("z-index");
    popup.removeAttribute("tabindex");

    updatePopupLayers();

    // Return focus to the control that opened this popup.
    if (opener && document.contains(opener)) {
        opener.focus();
    } else if (popupStack.length) {
        focusPopup(popupStack[popupStack.length - 1].popup);
    }
}

function closeActivePopup() {
    const top = popupStack[popupStack.length - 1];

    if (top) {
        closePopup(top.value);
    }
}

/*
==================================================
UNIVERSAL CLICK HANDLER
==================================================
*/

document.addEventListener("click", event => {
    const top = popupStack[popupStack.length - 1];

    // While a popup is open, ignore clicks outside the top popup.
    if (top && !top.popup.contains(event.target)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
    }

    const closeButton = event.target.closest("[data-popup-close]");

    if (closeButton) {
        const popup = closeButton.closest(popupSelector);

        if (popup) {
            closePopup(popup.dataset.popup);
        }

        return;
    }

    const trigger = event.target.closest("[data-popup-target]");

    if (trigger) {
        openPopup(trigger.dataset.popupTarget);
    }
}, true);

/*
==================================================
ESCAPE KEY
==================================================
*/

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && popupStack.length) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeActivePopup();
    }
}, true);

/*
==================================================
PUBLIC API
==================================================
*/

window.POSPopup = {
    open: openPopup,
    close: closePopup,
    closeActive: closeActivePopup,
    getStack: () => popupStack.map(item => item.value)
};
