/*
==================================================
CUSTOMER INPUT MODULE
==================================================

Handles:

- Customer phone number
- No-phone checkbox
- Delivery phone requirement

Rules:

Delivery:
    Phone REQUIRED
    No phone DISABLED

Dine In:
    Phone optional
    No phone enabled

Takeaway:
    Phone optional
    No phone enabled

==================================================
*/


let customerPhone = "";

let noPhoneSelected = false;


/*
==================================================
ELEMENTS
==================================================
*/

let phoneInput = null;

let noPhoneCheckbox = null;


/*
==================================================
UPDATE PHONE RULE BASED ON ORDER TYPE
==================================================
*/

function updatePhoneRules(orderType) {

    if (
        !phoneInput ||
        !noPhoneCheckbox
    ) {
        return;
    }


    /*
    ==============================================
    DELIVERY
    ==============================================
    */

    if (
        orderType === "delivery"
    ) {

        noPhoneCheckbox.checked =
            false;

        noPhoneCheckbox.disabled =
            true;

        noPhoneSelected =
            false;


        phoneInput.disabled =
            false;

        phoneInput.required =
            true;

        phoneInput.placeholder =
            "Enter customer phone number";


        /*
        Put focus into the phone field.
        */

        setTimeout(
            () => {

                if (phoneInput) {
                    phoneInput.focus();
                }

            },
            0
        );


        return;
    }


    /*
    ==============================================
    DINE IN / TAKEAWAY
    ==============================================
    */

    noPhoneCheckbox.disabled =
        false;

    phoneInput.required =
        false;


    if (
        noPhoneCheckbox.checked
    ) {

        phoneInput.disabled =
            true;

        phoneInput.placeholder =
            "Walk-in customer";

    } else {

        phoneInput.disabled =
            false;

        phoneInput.placeholder =
            "Enter customer phone number";

    }
}


/*
==================================================
NO PHONE CHECKBOX
==================================================
*/

function handleNoPhoneChange() {

    if (
        !phoneInput ||
        !noPhoneCheckbox
    ) {
        return;
    }


    if (
        noPhoneCheckbox.checked
    ) {

        noPhoneSelected =
            true;

        customerPhone =
            "";

        phoneInput.value =
            "";

        phoneInput.disabled =
            true;

        phoneInput.required =
            false;

        phoneInput.placeholder =
            "Walk-in customer";


    } else {

        noPhoneSelected =
            false;

        phoneInput.disabled =
            false;

        phoneInput.required =
            false;

        phoneInput.placeholder =
            "Enter customer phone number";

    }
}


/*
==================================================
PHONE INPUT
==================================================
*/

function handlePhoneInput() {

    if (!phoneInput) {
        return;
    }


    /*
    Keep only digits.
    */

    phoneInput.value =
        phoneInput.value.replace(
            /\D/g,
            ""
        );


    customerPhone =
        phoneInput.value;

}


/*
==================================================
ORDER TYPE CHANGE LISTENER
==================================================

IMPORTANT:

This listener belongs to the document and must
only be created once.

The actual phoneInput / noPhoneCheckbox
variables are global and are updated every time
Billing is opened again.

==================================================
*/

function initializeOrderTypeListener() {

    if (
        window.POSCustomerOrderTypeListenerInitialized
    ) {
        return;
    }


    document.addEventListener(
        "posOrderTypeChanged",
        event => {

            const orderType =
                event.detail.orderType;


            updatePhoneRules(
                orderType
            );

        }
    );


    window.POSCustomerOrderTypeListenerInitialized =
        true;
}


/*
==================================================
INITIALIZE CUSTOMER INPUT
==================================================
*/

function initializeCustomerInput() {

    /*
    Get the NEW elements from the newly loaded
    Billing HTML.
    */

    phoneInput =
        document.getElementById(
            "customer-phone"
        );


    noPhoneCheckbox =
        document.getElementById(
            "no-phone-checkbox"
        );


    if (
        !phoneInput ||
        !noPhoneCheckbox
    ) {

        console.warn(
            "Customer input elements not found."
        );

        return;
    }


    /*
    Reset customer state for the new Billing page.
    */

    customerPhone =
        "";

    noPhoneSelected =
        noPhoneCheckbox.checked;


    /*
    Phone input
    */

    phoneInput.addEventListener(
        "input",
        handlePhoneInput
    );


    /*
    No-phone checkbox
    */

    noPhoneCheckbox.addEventListener(
        "change",
        handleNoPhoneChange
    );


    /*
    Create the order-type listener only once.
    */

    initializeOrderTypeListener();


    /*
    Apply the current order type immediately.
    */

    const currentOrderType =
        window.POSOrderType
            ? window.POSOrderType.get()
            : "takeaway";


    updatePhoneRules(
        currentOrderType
    );
}


/*
==================================================
PUBLIC CUSTOMER API
==================================================
*/

window.POSCustomerInput = {

    getPhone: () =>
        customerPhone,

    hasPhone: () =>
        customerPhone.length > 0,

    isNoPhone: () =>
        noPhoneSelected

};


/*
==================================================
PAGE INITIALIZER REGISTRATION
==================================================
*/

window.POSPageInitializers =
    window.POSPageInitializers || {};

window.POSPageInitializers[
    "js/billing/customer-input.js"
] = initializeCustomerInput;
