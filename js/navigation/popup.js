/*
==================================================
UNIVERSAL POPUP SYSTEM
==================================================

Handles:

- Opening popups
- Closing popups
- One popup at a time
- Escape key
- Overlay / close buttons
- Focus management

Used by:

- Table selection
- Promotions
- Delivery address
- Payment
- Future popups

==================================================
*/


let activePopupId = null;

let popupPreviousFocus = null;


/*
==================================================
OPEN POPUP
==================================================
*/

function openPopup(popupId) {

    const popup =
        document.getElementById(
            popupId
        );


    if (!popup) {

        console.warn(
            `Popup not found: ${popupId}`
        );

        return;

    }


    /*
    Remember what currently has focus.

    We will return focus here when
    the popup closes.
    */

    popupPreviousFocus =
        document.activeElement;


    /*
    Close any other open popup.
    */

    document
        .querySelectorAll(
            ".pos-modal.active"
        )
        .forEach(
            otherPopup => {

                if (
                    otherPopup !== popup
                ) {

                    closePopup(
                        otherPopup.id
                    );

                }

            }
        );


    /*
    Show popup.
    */

    popup.classList.add(
        "active"
    );


    /*
    Set accessibility state.
    */

    popup.setAttribute(
        "aria-hidden",
        "false"
    );


    activePopupId =
        popupId;


    /*
    Move focus into popup.

    This makes keyboard navigation
    behave correctly.
    */

    const firstFocusable =
        popup.querySelector(
            "button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])"
        );


    if (firstFocusable) {

        setTimeout(
            () => {

                firstFocusable.focus();

            },
            0
        );

    }

}


/*
==================================================
CLOSE POPUP
==================================================
*/

function closePopup(popupId) {

    const popup =
        document.getElementById(
            popupId
        );


    if (!popup) {
        return;
    }


    /*
    IMPORTANT:

    If focus is currently inside the popup,
    move it OUT before applying aria-hidden.

    This prevents the browser accessibility
    warning we just encountered.
    */

    const focusedElement =
        document.activeElement;


    if (
        focusedElement &&
        popup.contains(
            focusedElement
        )
    ) {

        if (
            popupPreviousFocus &&
            document.contains(
                popupPreviousFocus
            )
        ) {

            popupPreviousFocus.focus();

        } else {

            focusedElement.blur();

        }

    }


    /*
    Now hide the popup.
    */

    popup.classList.remove(
        "active"
    );


    popup.setAttribute(
        "aria-hidden",
        "true"
    );


    /*
    Clear active popup state.
    */

    if (
        activePopupId ===
        popupId
    ) {

        activePopupId =
            null;

        popupPreviousFocus =
            null;

    }

}


/*
==================================================
CLOSE ACTIVE POPUP
==================================================
*/

function closeActivePopup() {

    if (!activePopupId) {
        return;
    }


    closePopup(
        activePopupId
    );

}


/*
==================================================
GENERIC CLOSE BUTTONS
==================================================
*/

document.addEventListener(
    "click",
    event => {

        const closeButton =
            event.target.closest(
                "[data-popup-close]"
            );


        if (!closeButton) {
            return;
        }


        const popup =
            closeButton.closest(
                ".pos-modal"
            );


        if (!popup) {
            return;
        }


        closePopup(
            popup.id
        );

    }
);


/*
==================================================
ESCAPE KEY
==================================================
*/

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !== "Escape"
        ) {

            return;

        }


        closeActivePopup();

    }
);


/*
==================================================
PUBLIC API
==================================================
*/

window.POSPopup = {

    open:
        openPopup,

    close:
        closePopup,

    closeActive:
        closeActivePopup

};
