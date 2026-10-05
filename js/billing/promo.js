/*
==================================================
PROMOTION SYSTEM
==================================================

Handles:

- Promotion popup
- Promotion selection
- Promotion removal
- Selected promotion state
- Discount value
- Promotion button display

Future database integration can replace the
temporary promo list without changing the
Billing HTML structure.

==================================================
*/


let selectedPromoCode = null;
let selectedPromoDiscount = 0;


/*
==================================================
OPEN PROMO POPUP
==================================================
*/

function openPromoPopup() {

    const modal =
        document.getElementById(
            "promo-modal"
        );


    if (!modal) {

        return;

    }


    modal.classList.add("active");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


/*
==================================================
CLOSE PROMO POPUP
==================================================
*/

function closePromoPopup() {

    const modal =
        document.getElementById(
            "promo-modal"
        );


    if (!modal) {

        return;

    }


    modal.classList.remove("active");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}


/*
==================================================
SELECT PROMO
==================================================
*/

function selectPromo(
    code,
    discount
) {

    selectedPromoCode =
        code;

    selectedPromoDiscount =
        Number(discount) || 0;


    updatePromoButton();

    updateDiscountDisplay();

    closePromoPopup();


    /*
    Notify the rest of the Billing system.
    */

    document.dispatchEvent(
        new CustomEvent(
            "posPromoChanged",
            {
                detail: {
                    code:
                        selectedPromoCode,

                    discount:
                        selectedPromoDiscount
                }
            }
        )
    );

}


/*
==================================================
REMOVE PROMO
==================================================
*/

function removePromo() {

    selectedPromoCode =
        null;

    selectedPromoDiscount =
        0;


    updatePromoButton();

    updateDiscountDisplay();

    closePromoPopup();


    document.dispatchEvent(
        new CustomEvent(
            "posPromoChanged",
            {
                detail: {
                    code: null,
                    discount: 0
                }
            }
        )
    );

}


/*
==================================================
UPDATE PROMO BUTTON
==================================================
*/

function updatePromoButton() {

    const button =
        document.getElementById(
            "promotion-btn"
        );


    if (!button) {

        return;

    }


    if (selectedPromoCode) {

        button.textContent =
            selectedPromoCode;

        button.classList.add(
            "promo-applied"
        );

    } else {

        button.textContent =
            "ADD CODE";

        button.classList.remove(
            "promo-applied"
        );

    }

}


/*
==================================================
UPDATE DISCOUNT DISPLAY
==================================================
*/

function updateDiscountDisplay() {

    const discountElement =
        document.getElementById(
            "discount"
        );


    if (!discountElement) {

        return;

    }


    discountElement.textContent =
        `₹${selectedPromoDiscount}`;

}


/*
==================================================
INITIALIZE PROMOTION SYSTEM
==================================================
*/

function initializePromo() {

    const promotionButton =
        document.getElementById(
            "promotion-btn"
        );


    const modal =
        document.getElementById(
            "promo-modal"
        );


    if (
        !promotionButton ||
        !modal
    ) {

        return;

    }


    /*
    Open popup.
    */

    promotionButton.addEventListener(
        "click",
        openPromoPopup
    );


    /*
    Close popup buttons/overlay.
    */

    modal
        .querySelectorAll(
            "[data-promo-close]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    closePromoPopup
                );

            }
        );


    /*
    Promo selection.
    */

    modal
        .querySelectorAll(
            ".promo-option[data-promo-code]"
        )
        .forEach(
            promoButton => {

                promoButton.addEventListener(
                    "click",
                    () => {

                        selectPromo(
                            promoButton.dataset
                                .promoCode,

                            promoButton.dataset
                                .promoDiscount
                        );

                    }
                );

            }
        );


    /*
    Remove promotion.
    */

    const removeButton =
        modal.querySelector(
            "[data-promo-remove]"
        );


    if (removeButton) {

        removeButton.addEventListener(
            "click",
            removePromo
        );

    }


    /*
    Escape key closes popup.
    */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closePromoPopup();

            }

        }
    );

}


/*
==================================================
PUBLIC PROMOTION API
==================================================
*/

window.POSPromo = {

    getCode:
        () => selectedPromoCode,

    getDiscount:
        () => selectedPromoDiscount,

    select:
        selectPromo,

    remove:
        removePromo,

    open:
        openPromoPopup,

    close:
        closePromoPopup

};


/*
==================================================
PAGE INITIALIZER
==================================================
*/

if (
    !window.POSPageInitializers
) {

    window.POSPageInitializers = {};

}


window.POSPageInitializers[
    "js/billing/promo.js"
] = initializePromo;
