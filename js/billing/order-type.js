/*
==================================================
ORDER TYPE MODULE
==================================================

Available order types:

- Delivery
- Dine In
- Takeaway

Rules:

DELIVERY
→ Customer phone is required
→ "No phone" option is disabled

DINE IN
→ Customer phone is optional

TAKEAWAY
→ Customer phone is optional

The module also broadcasts an event whenever
the order type changes.

==================================================
*/


/*
==================================================
CURRENT ORDER TYPE
==================================================
*/

let selectedOrderType = null;


/*
==================================================
SET ORDER TYPE
==================================================
*/

function setOrderType(orderType) {

    const validTypes = [
        "delivery",
        "dine-in",
        "takeaway"
    ];


    /*
    Safety check
    */

    if (
        !validTypes.includes(orderType)
    ) {

        return;

    }


    selectedOrderType =
        orderType;


    /*
    Update button appearance
    */

    const buttons =
        document.querySelectorAll(
            ".order-type-btn"
        );


    buttons.forEach(button => {

        button.classList.toggle(

            "active",

            button.dataset.orderType ===
                selectedOrderType

        );

    });


    /*
    Tell other modules that the order
    type has changed.

    customer-input.js listens to this event.
    */

    document.dispatchEvent(

        new CustomEvent(
            "posOrderTypeChanged",
            {
                detail: {
                    orderType:
                        selectedOrderType
                }
            }
        )

    );

}


/*
==================================================
GET CURRENT ORDER TYPE
==================================================
*/

function getOrderType() {

    return selectedOrderType;

}


/*
==================================================
INITIALIZE ORDER TYPE
==================================================
*/

function initializeOrderType() {

    const buttons =
        document.querySelectorAll(
            ".order-type-btn"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                setOrderType(
                    button.dataset.orderType
                );

            }
        );

    });


    /*
    Start with Takeaway because your current
    UI already uses it as the default selection.
    */

    setOrderType("takeaway");

}


/*
==================================================
PUBLIC API
==================================================
*/

window.POSOrderType = {

    get:
        getOrderType,

    set:
        setOrderType

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
    "js/billing/order-type.js"
] = initializeOrderType;
```

