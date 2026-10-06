/*
==================================================
UNIVERSAL POPUP SYSTEM
==================================================

Provides one reusable popup controller for the app.

Any popup using:

    class="pos-modal"

can be opened with:

    POSPopup.open("popup-id");

and closed with:

    POSPopup.close("popup-id");

Close buttons / overlays can use:

    data-popup-close

Only one popup remains open at a time.

==================================================
*/

let activePopupId = null;


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
        return;
    }


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

                    otherPopup.classList.remove(
                        "active"
                    );

                    otherPopup.setAttribute(
                        "aria-hidden",
                        "true"
                    );

                }

            }
        );


    /*
    Open requested popup.
    */

    popup.classList.add(
        "active"
    );

    popup.setAttribute(
        "aria-hidden",
        "false"
    );


    activePopupId =
        popupId;

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


    popup.classList.remove(
        "active"
    );

    popup.setAttribute(
        "aria-hidden",
        "true"
    );


    if (
        activePopupId ===
        popupId
    ) {

        activePopupId =
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
