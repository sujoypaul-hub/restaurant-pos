/*
==================================================
TABLE SELECTION SYSTEM
==================================================

Table selection is only available when
Dine In is selected.

==================================================
*/


let selectedTableNumber = null;


/*
==================================================
OPEN TABLE POPUP
==================================================
*/

function openTablePopup() {

    const modal =
        document.getElementById(
            "table-modal"
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
CLOSE TABLE POPUP
==================================================
*/

function closeTablePopup() {

    const modal =
        document.getElementById(
            "table-modal"
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
SELECT TABLE
==================================================
*/

function selectTable(
    tableNumber
) {

    selectedTableNumber =
        tableNumber;


    updateTableButton();

    closeTablePopup();


    document.dispatchEvent(
        new CustomEvent(
            "posTableChanged",
            {
                detail: {
                    table:
                        selectedTableNumber
                }
            }
        )
    );
}


/*
==================================================
UPDATE TABLE BUTTON
==================================================
*/

function updateTableButton() {

    const button =
        document.getElementById(
            "table-selection-btn"
        );

    if (!button) {
        return;
    }


    if (selectedTableNumber) {

        button.innerHTML = `
            <span>
                Table ${selectedTableNumber}
            </span>

            <span>
                →
            </span>
        `;

    } else {

        button.innerHTML = `
            <span>
                Select Table
            </span>

            <span>
                →
            </span>
        `;

    }
}


/*
==================================================
SHOW / HIDE TABLE SELECTION
==================================================
*/

function updateTableVisibility(
    orderType
) {

    const tableSelection =
        document.getElementById(
            "table-selection"
        );


    if (!tableSelection) {
        return;
    }


    if (
        orderType === "dine-in"
    ) {

        tableSelection.classList.add(
            "active"
        );

    } else {

        tableSelection.classList.remove(
            "active"
        );


        /*
        Clear table when customer
        changes away from Dine In.
        */

        selectedTableNumber =
            null;

        updateTableButton();

    }
}


/*
==================================================
INITIALIZE TABLE SYSTEM
==================================================
*/

function initializeTable() {

    const tableButton =
        document.getElementById(
            "table-selection-btn"
        );

    const modal =
        document.getElementById(
            "table-modal"
        );


    if (
        !tableButton ||
        !modal
    ) {

        return;

    }


    /*
    Open popup.
    */

    tableButton.addEventListener(
        "click",
        openTablePopup
    );


    /*
    Close popup.
    */

    modal
        .querySelectorAll(
            "[data-table-close]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    closeTablePopup
                );

            }
        );


    /*
    Select table.
    */

    modal
        .querySelectorAll(
            "[data-table-number]"
        )
        .forEach(
            tableButton => {

                tableButton.addEventListener(
                    "click",
                    () => {

                        selectTable(
                            tableButton.dataset
                                .tableNumber
                        );

                    }
                );

            }
        );


    /*
    Listen for order type changes.
    */

    if (
        !window.POSOrderTypeListenerInitialized
    ) {

        document.addEventListener(
            "posOrderTypeChanged",
            event => {

                updateTableVisibility(
                    event.detail.orderType
                );

            }
        );


        window.POSOrderTypeListenerInitialized =
            true;

    }


    /*
    Check current order type.
    */

    if (
        window.POSOrderType &&
        typeof window.POSOrderType.get ===
        "function"
    ) {

        updateTableVisibility(
            window.POSOrderType.get()
        );

    } else {

        updateTableVisibility(
            "takeaway"
        );

    }

}


/*
==================================================
PUBLIC API
==================================================
*/

window.POSTable = {

    get:
        () => selectedTableNumber,

    select:
        selectTable,

    clear:
        () => {

            selectedTableNumber =
                null;

            updateTableButton();

        },

    open:
        openTablePopup,

    close:
        closeTablePopup

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
    "js/billing/table.js"
] = initializeTable;
