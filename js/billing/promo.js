/*
==================================================
PROMOTION SYSTEM
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

    if (
        window.POSPopup
    ) {

        window.POSPopup.open(
            "promo-modal"
        );

    }

}


/*
==================================================
CLOSE PROMO POPUP
==================================================
*/

function closePromoPopup() {

    if (
        window.POSPopup
    ) {

        window.POSPopup.close(
            "promo-modal"
        );

    }

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


    updatePromoDisplay();

    updateDiscountDisplay();

    closePromoPopup();


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


    updatePromoDisplay();

    updateDiscountDisplay();


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
UPDATE PROMO DISPLAY
==================================================
*/

function updatePromoDisplay() {

    const input =
        document.getElementById(
            "selected-promo-code"
        );

    const button =
        document.getElementById(
            "promotion-btn"
        );


    if (!input || !button) {
        return;
    }


    if (selectedPromoCode) {

        /*
        Show selected promo code.
        */

        input.value =
            selectedPromoCode;


        /*
        Button becomes Remove.
        */

        button.textContent =
            "REMOVE";

        button.classList.add(
            "promo-remove-btn"
        );

    } else {

        /*
        Clear promo input.
        */

        input.value =
            "";


        input.placeholder =
            "No promo code selected";


        /*
        Button returns to Add Promo.
        */

        button.textContent =
            "ADD PROMO";

        button.classList.remove(
            "promo-remove-btn"
        );

    }
}


/*
==================================================
UPDATE DISCOUNT
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
    ==============================================
    PROMO BUTTON
    ==============================================
    */

    promotionButton.addEventListener(
        "click",
        () => {

            /*
            If a promo already exists,
            button works as Remove.
            */

            if (selectedPromoCode) {

                removePromo();

                return;

            }


            openPromoPopup();

        }
    );


    /*
    ==============================================
    CLOSE POPUP
    ==============================================
    */

    modal
        .querySelectorAll(
            "[data-popup-close]"
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
    ==============================================
    SELECT PROMO
    ==============================================
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
    ==============================================
    ESCAPE KEY
    ==============================================
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


    /*
    Initial display.
    */

    updatePromoDisplay();

}


/*
==================================================
PUBLIC API
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
