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

        /*
        Delivery always requires a phone number.
        */

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
                phoneInput.focus();
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


    /*
    Keep phone input behaviour according
    to whether No Phone is selected.
    */

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
        noPhoneCheckbox.checked
    ) {

        /*
        No phone selected.
        */

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

        /*
        Phone number can be entered.
        */

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

    /*
    Keep only digits.

    This is especially useful for Indian
    10-digit mobile numbers.
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
*/

function initializeOrderTypeListener() {

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

}


/*
==================================================
INITIALIZE
==================================================
*/

function initializeCustomerInput() {

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
    Listen for Delivery /
    Dine In / Takeaway changes.
    */

    initializeOrderTypeListener();


    /*
    Apply the current order type
    immediately.

    Usually this will be Takeaway.
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
START
==================================================
*/

```javascript
/* ==========================================
   PAGE INITIALIZER REGISTRATION
   ========================================== */

window.POSPageInitializers =
    window.POSPageInitializers || {};

window.POSPageInitializers[
    "js/billing/customer-input.js"
] = initializeCustomerInput;
```

