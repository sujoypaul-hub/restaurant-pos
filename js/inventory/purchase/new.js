/*
========================================================
INVENTORY - NEW PURCHASE
========================================================

Responsibilities:

1. Add and remove purchase item rows.
2. Calculate item totals automatically.
3. Calculate purchase total.
4. Preview stock changes in real time.
5. Manage Paid / Partially Paid / Due.
6. Validate purchase details.
7. Save purchase records.
8. Update inventory immediately after saving.
9. Dispatch posInventoryUpdated for other pages.

TEMPORARY STORAGE:

    pos_inventory_stock_v1
    pos_inventory_purchase_history_v1

IMPORTANT:

This version uses localStorage because the app is
currently frontend-only.

Later, the persistence layer can be replaced with
the SQL database without redesigning this page.

========================================================
*/

(function () {

    "use strict";


    /*
    ====================================================
    INVENTORY ITEM MASTER
    ====================================================

    Temporary demo items.

    stock = opening stock used only when inventory has
    never been initialized in localStorage.

    Once stock is saved, localStorage becomes the
    source of truth.

    Later, these items will come from the Inventory
    database and selected items will use their actual
    inventory units and current stock.

    ====================================================
    */

    const inventoryItemMaster = {

        chicken: {
            name: "Chicken",
            unit: "kg",
            stock: 8,
            rate: 250
        },

        cooking_oil: {
            name: "Cooking Oil",
            unit: "L",
            stock: 5,
            rate: 150
        },

        mayonnaise: {
            name: "Mayonnaise",
            unit: "kg",
            stock: 1.5,
            rate: 200
        },

        buns: {
            name: "Burger Buns",
            unit: "pcs",
            stock: 80,
            rate: 10
        },

        fries: {
            name: "French Fries",
            unit: "kg",
            stock: 10,
            rate: 280
        }

    };


    /*
    ====================================================
    STORAGE KEYS
    ====================================================
    */

    const STOCK_STORAGE_KEY =
        "pos_inventory_stock_v1";

    const PURCHASE_HISTORY_STORAGE_KEY =
        "pos_inventory_purchase_history_v1";


    /*
    ====================================================
    DOM REFERENCES
    ====================================================
    */

    let itemsContainer = null;

    let purchaseDateInput = null;
    let supplierInput = null;
    let invoiceInput = null;

    let paymentStatusInput = null;
    let paymentMethodInput = null;

    let paymentDetailsContainer = null;
    let paidAmountInput = null;
    let dueAmountInput = null;
    let dueDateInput = null;

    let notesInput = null;

    let stockPreviewContainer = null;

    let itemCountElement = null;
    let grandTotalElement = null;

    let formMessageElement = null;

    let addItemButton = null;
    let savePurchaseButton = null;


    /*
    ====================================================
    NUMBER HELPERS
    ====================================================
    */

    function roundMoney(value) {

        return Math.round(
            (Number(value) + Number.EPSILON) * 100
        ) / 100;

    }


    function roundQuantity(value) {

        return Math.round(
            (Number(value) + Number.EPSILON) * 1000
        ) / 1000;

    }


    function formatCurrency(value) {

        return "₹" + Number(value || 0).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        );

    }


    function formatQuantity(value) {

        return Number(value || 0).toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 3
            }
        );

    }


    /*
    ====================================================
    HTML ESCAPING
    ====================================================

    Used when rendering text inside HTML.
    ====================================================
    */

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /*
    ====================================================
    GET LOCAL DATE
    ====================================================

    Uses the local calendar date instead of UTC, avoiding
    a date shift around midnight.

    ====================================================
    */

    function getLocalDate() {

        const now = new Date();

        const year = now.getFullYear();

        const month = String(
            now.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            now.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;

    }


    /*
    ====================================================
    GET DEFAULT STOCK
    ====================================================
    */

    function getDefaultStock() {

        const stock = {};

        Object.entries(
            inventoryItemMaster
        ).forEach(
            ([itemId, item]) => {

                stock[itemId] =
                    Number(item.stock);

            }
        );

        return stock;

    }


    /*
    ====================================================
    GET CURRENT INVENTORY STOCK
    ====================================================

    Returns persisted stock if available.

    If inventory has never been initialized, returns
    demo opening stock.

    Missing item entries are filled with defaults.

    ====================================================
    */

    function getInventoryStock() {

        const stock =
            getDefaultStock();


        try {

            const stored =
                localStorage.getItem(
                    STOCK_STORAGE_KEY
                );


            if (!stored) {

                return stock;

            }


            const parsed =
                JSON.parse(stored);


            if (
                !parsed ||
                typeof parsed !== "object" ||
                Array.isArray(parsed)
            ) {

                return stock;

            }


            Object.entries(parsed).forEach(
                ([itemId, quantity]) => {

                    if (
                        Object.prototype.hasOwnProperty.call(
                            inventoryItemMaster,
                            itemId
                        ) &&
                        Number.isFinite(
                            Number(quantity)
                        )
                    ) {

                        stock[itemId] =
                            Number(quantity);

                    }

                }
            );


            return stock;

        } catch (error) {

            console.error(
                "Unable to read inventory stock:",
                error
            );

            throw new Error(
                "Inventory could not be read. Please check browser storage before saving."
            );

        }

    }


    /*
    ====================================================
    SAVE INVENTORY STOCK
    ====================================================
    */

    function saveInventoryStock(stock) {

        try {

            localStorage.setItem(
                STOCK_STORAGE_KEY,
                JSON.stringify(stock)
            );

            return true;

        } catch (error) {

            console.error(
                "Unable to save inventory stock:",
                error
            );

            return false;

        }

    }


    /*
    ====================================================
    GET PURCHASE HISTORY
    ====================================================
    */

    function getPurchaseHistory() {

        try {

            const stored =
                localStorage.getItem(
                    PURCHASE_HISTORY_STORAGE_KEY
                );


            if (!stored) {

                return [];

            }


            const parsed =
                JSON.parse(stored);


            if (!Array.isArray(parsed)) {

                throw new Error(
                    "Purchase history is not an array."
                );

            }


            return parsed;

        } catch (error) {

            console.error(
                "Unable to read purchase history:",
                error
            );

            throw new Error(
                "Purchase history could not be read. No changes have been saved."
            );

        }

    }


    /*
    ====================================================
    SAVE PURCHASE HISTORY
    ====================================================

    Returns false if localStorage cannot save the record.

    ====================================================
    */

    function savePurchaseHistory(purchase) {

        try {

            const history =
                getPurchaseHistory();


            history.unshift(
                purchase
            );


            localStorage.setItem(
                PURCHASE_HISTORY_STORAGE_KEY,
                JSON.stringify(history)
            );


            return true;

        } catch (error) {

            console.error(
                "Unable to save purchase history:",
                error
            );

            return false;

        }

    }


    /*
    ====================================================
    GET PURCHASE TOTAL
    ====================================================
    */

    function getPurchaseTotal(items) {

        const total = items.reduce(
            (sum, item) => {

                return sum + item.total;

            },
            0
        );

        return roundMoney(total);

    }


    /*
    ====================================================
    CREATE PURCHASE ITEM ROW
    ====================================================
    */

    function createPurchaseRow() {

        if (!itemsContainer) {

            return null;

        }


        /*
        Create row container.
        */

        const row =
            document.createElement("div");

        row.className =
            "purchase-item-row";


        /*
        ================================================
        ITEM SELECT
        ================================================
        */

        const itemSelect =
            document.createElement("select");

        itemSelect.className =
            "purchase-item-select";

        itemSelect.setAttribute(
            "aria-label",
            "Inventory item"
        );


        itemSelect.innerHTML = `
            <option value="">Select item</option>
        `;


        Object.entries(
            inventoryItemMaster
        ).forEach(
            ([itemId, item]) => {

                const option =
                    document.createElement("option");

                option.value =
                    itemId;

                option.textContent =
                    item.name;

                itemSelect.appendChild(
                    option
                );

            }
        );


        /*
        ================================================
        QUANTITY INPUT
        ================================================
        */

        const quantityInput =
            document.createElement("input");

        quantityInput.type =
            "number";

        quantityInput.className =
            "purchase-quantity-input";

        quantityInput.min =
            "0";

        quantityInput.step =
            "0.001";

        quantityInput.placeholder =
            "Qty";

        quantityInput.setAttribute(
            "aria-label",
            "Purchase quantity"
        );


        /*
        ================================================
        UNIT SELECT
        ================================================
        */

        const unitSelect =
            document.createElement("select");

        unitSelect.className =
            "purchase-unit-select";

        unitSelect.setAttribute(
            "aria-label",
            "Quantity unit"
        );

        unitSelect.innerHTML = `
            <option value="">-</option>
        `;


        /*
        ================================================
        RATE INPUT
        ================================================
        */

        const rateInput =
            document.createElement("input");

        rateInput.type =
            "number";

        rateInput.className =
            "purchase-rate-input";

        rateInput.min =
            "0";

        rateInput.step =
            "0.01";

        rateInput.placeholder =
            "Rate";

        rateInput.setAttribute(
            "aria-label",
            "Purchase rate per unit"
        );


        /*
        ================================================
        ITEM TOTAL
        ================================================
        */

        const totalElement =
            document.createElement("strong");

        totalElement.className =
            "purchase-item-total";

        totalElement.textContent =
            "₹0";


        /*
        ================================================
        REMOVE BUTTON
        ================================================
        */

        const removeButton =
            document.createElement("button");

        removeButton.type =
            "button";

        removeButton.className =
            "purchase-remove-btn";

        removeButton.textContent =
            "×";

        removeButton.setAttribute(
            "aria-label",
            "Remove purchase item"
        );


        /*
        ================================================
        ADD ELEMENTS TO ROW
        ================================================
        */

        row.appendChild(itemSelect);

        row.appendChild(quantityInput);

        row.appendChild(unitSelect);

        row.appendChild(rateInput);

        row.appendChild(totalElement);

        row.appendChild(removeButton);


        itemsContainer.appendChild(
            row
        );


        /*
        ================================================
        UPDATE ITEM DEFAULTS
        ================================================
        */

        function updateItemDefaults() {

            const selectedItem =
                inventoryItemMaster[
                    itemSelect.value
                ];


            /*
            No item selected.
            */

            if (!selectedItem) {

                unitSelect.innerHTML = `
                    <option value="">-</option>
                `;

                rateInput.value = "";

                updatePurchaseCalculations();

                return;

            }


            /*
            Set item unit.
            */

            unitSelect.innerHTML = "";


            const unitOption =
                document.createElement("option");

            unitOption.value =
                selectedItem.unit;

            unitOption.textContent =
                selectedItem.unit;

            unitSelect.appendChild(
                unitOption
            );


            /*
            Set default purchase rate.

            The user may edit the rate afterwards.
            */

            rateInput.value =
                selectedItem.rate;


            updatePurchaseCalculations();

        }


        /*
        ================================================
        EVENT LISTENERS
        ================================================
        */

        itemSelect.addEventListener(
            "change",
            updateItemDefaults
        );


        quantityInput.addEventListener(
            "input",
            updatePurchaseCalculations
        );


        rateInput.addEventListener(
            "input",
            updatePurchaseCalculations
        );


        removeButton.addEventListener(
            "click",
            () => {

                row.remove();

                /*
                Leave at least one blank row.
                */

                ensurePurchaseRow();

                updatePurchaseCalculations();

            }
        );


        /*
        Keyboard navigation.
        */

        row.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" &&
                    event.target.tagName === "INPUT"
                ) {

                    event.preventDefault();

                }

            }
        );


        return row;

    }


    /*
    ====================================================
    ENSURE A PURCHASE ROW EXISTS
    ====================================================
    */

    function ensurePurchaseRow() {

        if (!itemsContainer) {

            return;

        }


        const rows =
            itemsContainer.querySelectorAll(
                ".purchase-item-row"
            );


        if (rows.length === 0) {

            createPurchaseRow();

        }

    }


    /*
    ====================================================
    READ PURCHASE ITEMS
    ====================================================

    Only completed rows are included.

    Incomplete rows are caught separately by validation.

    ====================================================
    */

    function readPurchaseItems() {

        if (!itemsContainer) {

            return [];

        }


        const rows =
            itemsContainer.querySelectorAll(
                ".purchase-item-row"
            );


        const items = [];


        rows.forEach(
            row => {

                const itemSelect =
                    row.querySelector(
                        ".purchase-item-select"
                    );


                const quantityInput =
                    row.querySelector(
                        ".purchase-quantity-input"
                    );


                const unitSelect =
                    row.querySelector(
                        ".purchase-unit-select"
                    );


                const rateInput =
                    row.querySelector(
                        ".purchase-rate-input"
                    );


                if (
                    !itemSelect ||
                    !quantityInput ||
                    !unitSelect ||
                    !rateInput
                ) {

                    return;

                }


                const itemId =
                    itemSelect.value;


                const quantity =
                    Number(
                        quantityInput.value
                    );


                const rate =
                    Number(
                        rateInput.value
                    );


                /*
                Ignore a completely empty row.
                */

                if (!itemId) {

                    return;

                }


                /*
                Ignore incomplete rows here.
                Validation reports the exact problem.
                */

                if (
                    quantityInput.value === "" ||
                    !Number.isFinite(quantity) ||
                    quantity <= 0
                ) {

                    return;

                }


                if (
                    rateInput.value === "" ||
                    !Number.isFinite(rate) ||
                    rate < 0
                ) {

                    return;

                }


                const masterItem =
                    inventoryItemMaster[itemId];


                if (!masterItem) {

                    return;

                }


                items.push({

                    itemId:
                        itemId,

                    itemName:
                        masterItem.name,

                    quantity:
                        roundQuantity(quantity),

                    unit:
                        unitSelect.value ||
                        masterItem.unit,

                    rate:
                        roundMoney(rate),

                    total:
                        roundMoney(
                            quantity * rate
                        )

                });

            }
        );


        return items;

    }


    /*
    ====================================================
    UPDATE ITEM ROW TOTALS
    ====================================================
    */

    function updateItemRowTotals() {

        if (!itemsContainer) {

            return;

        }


        const rows =
            itemsContainer.querySelectorAll(
                ".purchase-item-row"
            );


        rows.forEach(
            row => {

                const quantityInput =
                    row.querySelector(
                        ".purchase-quantity-input"
                    );


                const rateInput =
                    row.querySelector(
                        ".purchase-rate-input"
                    );


                const totalElement =
                    row.querySelector(
                        ".purchase-item-total"
                    );


                if (
                    !quantityInput ||
                    !rateInput ||
                    !totalElement
                ) {

                    return;

                }


                const quantity =
                    Number(quantityInput.value) || 0;


                const rate =
                    Number(rateInput.value) || 0;


                totalElement.textContent =
                    formatCurrency(
                        roundMoney(
                            quantity * rate
                        )
                    );

            }
        );

    }


    /*
    ====================================================
    LIVE STOCK PREVIEW
    ====================================================
    */

    function updateStockPreview(items) {

        if (!stockPreviewContainer) {

            return;

        }


        if (items.length === 0) {

            stockPreviewContainer.innerHTML = `
                <div class="purchase-preview-empty">
                    Add purchase items to see how your
                    inventory will change.
                </div>
            `;

            return;

        }


        let stock;

        try {

            stock =
                getInventoryStock();

        } catch (error) {

            stockPreviewContainer.innerHTML = `
                <div class="purchase-preview-empty">
                    Unable to read current inventory.
                </div>
            `;

            return;

        }


        /*
        Combine duplicate item rows for preview.
        */

        const groupedItems = {};


        items.forEach(
            item => {

                if (
                    !groupedItems[item.itemId]
                ) {

                    groupedItems[item.itemId] = {

                        itemId:
                            item.itemId,

                        itemName:
                            item.itemName,

                        unit:
                            item.unit,

                        totalQuantity:
                            item.quantity

                    };

                } else {

                    groupedItems[
                        item.itemId
                    ].totalQuantity +=
                        item.quantity;

                }

            }
        );


        /*
        Render each affected inventory item.
        */

        stockPreviewContainer.innerHTML =
            Object.values(groupedItems)
                .map(
                    item => {

                        const currentStock =
                            Number(
                                stock[item.itemId] || 0
                            );


                        const incomingQuantity =
                            roundQuantity(
                                item.totalQuantity
                            );


                        const resultingStock =
                            roundQuantity(
                                currentStock +
                                incomingQuantity
                            );


                        return `
                            <div
                                class="purchase-stock-preview-item"
                            >

                                <div
                                    class="purchase-stock-preview-header"
                                >

                                    <strong>
                                        ${escapeHTML(
                                            item.itemName
                                        )}
                                    </strong>

                                    <small>
                                        ${escapeHTML(
                                            item.unit
                                        )}
                                    </small>

                                </div>


                                <div
                                    class="purchase-stock-preview-values"
                                >

                                    <span>
                                        ${formatQuantity(
                                            currentStock
                                        )}
                                    </span>

                                    <span class="purchase-stock-arrow">
                                        →
                                    </span>

                                    <span>
                                        +${formatQuantity(
                                            incomingQuantity
                                        )}
                                    </span>

                                    <span class="purchase-stock-arrow">
                                        →
                                    </span>

                                    <span class="new-stock">
                                        ${formatQuantity(
                                            resultingStock
                                        )}
                                    </span>

                                </div>

                            </div>
                        `;

                    }
                )
                .join("");

    }


    /*
    ====================================================
    PURCHASE PAYMENT FIELDS
    ====================================================

    Paid:
        Paid Amount = Purchase Total
        Remaining Due = 0

    Partially Paid:
        Paid Amount = User-entered amount
        Remaining Due = Purchase Total - Paid Amount

    Due:
        Paid Amount = 0
        Remaining Due = Purchase Total

    ====================================================
    */

    function updatePurchasePaymentFields() {

        if (
            !paymentStatusInput ||
            !paymentDetailsContainer ||
            !paidAmountInput ||
            !dueAmountInput ||
            !dueDateInput
        ) {

            return;

        }


        const items =
            readPurchaseItems();


        const purchaseTotal =
            getPurchaseTotal(items);


        const status =
            paymentStatusInput.value;


        /*
        ================================================
        FULLY PAID
        ================================================
        */

        if (status === "paid") {

            paymentDetailsContainer.hidden =
                true;

            paidAmountInput.value =
                purchaseTotal.toFixed(2);

            paidAmountInput.disabled =
                true;

            dueAmountInput.value =
                "0.00";

            dueDateInput.required =
                false;

            dueDateInput.value =
                "";

            if (paymentMethodInput) {

                paymentMethodInput.disabled =
                    false;

            }

            return;

        }


        /*
        Display payment breakdown for credit purchases.
        */

        paymentDetailsContainer.hidden =
            false;


        dueDateInput.required =
            true;


        /*
        ================================================
        FULLY DUE
        ================================================
        */

        if (status === "due") {

            paidAmountInput.value =
                "0.00";

            paidAmountInput.disabled =
                true;

            dueAmountInput.value =
                purchaseTotal.toFixed(2);


            /*
            No payment method until a payment occurs.
            */

            if (paymentMethodInput) {

                paymentMethodInput.disabled =
                    true;

            }

            return;

        }


        /*
        ================================================
        PARTIALLY PAID
        ================================================
        */

        paidAmountInput.disabled =
            false;


        const paidAmount =
            Number(
                paidAmountInput.value
            ) || 0;


        const remainingDue =
            Math.max(
                0,
                roundMoney(
                    purchaseTotal - paidAmount
                )
            );


        dueAmountInput.value =
            remainingDue.toFixed(2);


        if (paymentMethodInput) {

            paymentMethodInput.disabled =
                false;

        }

    }


    /*
    ====================================================
    UPDATE PURCHASE CALCULATIONS
    ====================================================
    */

    function updatePurchaseCalculations() {

        const items =
            readPurchaseItems();


        const purchaseTotal =
            getPurchaseTotal(items);


        /*
        Update individual row totals.
        */

        updateItemRowTotals();


        /*
        Update item count.
        */

        if (itemCountElement) {

            itemCountElement.textContent =
                items.length;

        }


        /*
        Update purchase total.
        */

        if (grandTotalElement) {

            grandTotalElement.textContent =
                formatCurrency(
                    purchaseTotal
                );

        }


        /*
        Refresh live inventory preview.
        */

        updateStockPreview(items);


        /*
        Refresh payment calculation.
        */

        updatePurchasePaymentFields();

    }


    /*
    ====================================================
    VALIDATE PURCHASE
    ====================================================
    */

    function validatePurchase() {

        /*
        Purchase date.
        */

        if (
            !purchaseDateInput ||
            !purchaseDateInput.value
        ) {

            return "Please select the purchase date.";

        }


        /*
        Supplier.
        */

        const supplier =
            supplierInput?.value.trim();


        if (!supplier) {

            return "Please select a supplier.";

        }


        /*
        Inspect every row, including incomplete rows.
        */

        const rows =
            itemsContainer.querySelectorAll(
                ".purchase-item-row"
            );


        for (const row of rows) {

            const itemSelect =
                row.querySelector(
                    ".purchase-item-select"
                );


            const quantityInput =
                row.querySelector(
                    ".purchase-quantity-input"
                );


            const rateInput =
                row.querySelector(
                    ".purchase-rate-input"
                );


            if (
                !itemSelect ||
                !quantityInput ||
                !rateInput
            ) {

                continue;

            }


            const itemId =
                itemSelect.value;


            const rawQuantity =
                quantityInput.value.trim();


            const rawRate =
                rateInput.value.trim();


            /*
            Allow a completely empty extra row.
            */

            if (
                !itemId &&
                !rawQuantity &&
                !rawRate
            ) {

                continue;

            }


            /*
            If data was entered, an item must be selected.
            */

            if (!itemId) {

                return "Please select an inventory item or remove the empty row.";

            }


            const quantity =
                Number(rawQuantity);


            if (
                rawQuantity === "" ||
                !Number.isFinite(quantity) ||
                quantity <= 0
            ) {

                return `Enter a valid quantity for ${inventoryItemMaster[itemId].name}.`;

            }


            const rate =
                Number(rawRate);


            if (
                rawRate === "" ||
                !Number.isFinite(rate) ||
                rate < 0
            ) {

                return `Enter a valid purchase rate for ${inventoryItemMaster[itemId].name}.`;

            }

        }


        const items =
            readPurchaseItems();


        if (items.length === 0) {

            return "Please add at least one valid purchase item.";

        }


        const purchaseTotal =
            getPurchaseTotal(items);


        /*
        Payment status.
        */

        const status =
            paymentStatusInput.value;


        /*
        Partially Paid needs a positive payment that
        is strictly smaller than the total.
        */

        if (status === "partially-paid") {

            const rawPaidAmount =
                paidAmountInput.value.trim();


            const paidAmount =
                Number(rawPaidAmount);


            if (
                rawPaidAmount === "" ||
                !Number.isFinite(paidAmount) ||
                paidAmount <= 0 ||
                paidAmount >= purchaseTotal
            ) {

                return (
                    "For Partially Paid, enter an amount " +
                    "greater than ₹0 and less than the purchase total."
                );

            }

        }


        /*
        Due / Partially Paid require a due date.
        */

        if (
            status === "due" ||
            status === "partially-paid"
        ) {

            if (!dueDateInput.value) {

                return "Please select the supplier payment due date.";

            }

        }


        /*
        The method is required when a payment is made.
        */

        if (
            status !== "due" &&
            !paymentMethodInput.value
        ) {

            return "Please select the payment method.";

        }


        return "";

    }


    /*
    ====================================================
    SHOW MESSAGE
    ====================================================
    */

    function showPurchaseMessage(
        message,
        type = "error"
    ) {

        if (!formMessageElement) {

            return;

        }


        formMessageElement.textContent =
            message;


        formMessageElement.dataset.status =
            type;

    }


    /*
    ====================================================
    CREATE PURCHASE RECORD
    ====================================================
    */

    function buildPurchaseRecord(
        items,
        stock
    ) {

        const total =
            getPurchaseTotal(items);


        const paymentStatus =
            paymentStatusInput.value;


        const paidAmount =
            paymentStatus === "paid"
                ? total
                : paymentStatus === "due"
                    ? 0
                    : roundMoney(
                        Number(
                            paidAmountInput.value
                        )
                    );


        const dueAmount =
            roundMoney(
                Math.max(
                    0,
                    total - paidAmount
                )
            );


        const purchaseId =
            `purchase-${Date.now()}`;


        const createdAt =
            new Date().toISOString();


        /*
        Keep an initial payment record for any amount
        already paid during the purchase.

        This will be useful when we later add supplier
        payment history and partial settlements.
        */

        const paymentHistory =
            paidAmount > 0
                ? [
                    {
                        id:
                            `payment-${Date.now()}`,

                        amount:
                            paidAmount,

                        method:
                            paymentMethodInput.value,

                        date:
                            purchaseDateInput.value,

                        note:
                            "Payment recorded with purchase",

                        createdAt:
                            createdAt
                    }
                ]
                : [];


        return {

            id:
                purchaseId,

            date:
                purchaseDateInput.value,

            supplier:
                supplierInput.value,

            invoice:
                invoiceInput.value.trim(),

            items:
                items.map(
                    item => ({
                        ...item
                    })
                ),

            total:
                total,

            paymentStatus:
                paymentStatus,

            paymentMethod:
                paymentStatus === "due"
                    ? ""
                    : paymentMethodInput.value,

            paidAmount:
                paidAmount,

            dueAmount:
                dueAmount,

            dueDate:
                dueAmount > 0
                    ? dueDateInput.value
                    : "",

            paymentHistory:
                paymentHistory,

            notes:
                notesInput.value.trim(),

            createdAt:
                createdAt

        };

    }


    /*
    ====================================================
    RESET PURCHASE FORM
    ====================================================
    */

    function resetPurchaseForm() {

        /*
        Keep the current purchase date.
        */

        if (supplierInput) {

            supplierInput.value = "";

        }


        if (invoiceInput) {

            invoiceInput.value = "";

        }


        if (paymentStatusInput) {

            paymentStatusInput.value =
                "paid";

        }


        if (paymentMethodInput) {

            paymentMethodInput.value =
                "cash";

        }


        if (paidAmountInput) {

            paidAmountInput.value =
                "0";

        }


        if (dueAmountInput) {

            dueAmountInput.value =
                "0";

        }


        if (dueDateInput) {

            dueDateInput.value = "";

        }


        if (notesInput) {

            notesInput.value = "";

        }


        /*
        Clear purchase items and create one fresh row.
        */

        itemsContainer.innerHTML = "";

        createPurchaseRow();


        updatePurchaseCalculations();

    }


    /*
    ====================================================
    SAVE PURCHASE
    ====================================================

    Save sequence:

    1. Validate form.
    2. Read current inventory.
    3. Calculate updated stock.
    4. Save updated stock.
    5. Save purchase history.
    6. Roll stock back if purchase history fails.
    7. Dispatch inventory update event.
    8. Reset the form.

    ====================================================
    */

    function savePurchase() {

        if (
            savePurchaseButton &&
            savePurchaseButton.disabled
        ) {

            return;

        }


        showPurchaseMessage("");


        /*
        ================================================
        VALIDATION
        ================================================
        */

        const validationError =
            validatePurchase();


        if (validationError) {

            showPurchaseMessage(
                validationError,
                "error"
            );

            return;

        }


        const items =
            readPurchaseItems();


        const purchaseTotal =
            getPurchaseTotal(items);


        /*
        ================================================
        READ CURRENT INVENTORY
        ================================================
        */

        let previousStock;


        try {

            previousStock =
                getInventoryStock();

        } catch (error) {

            showPurchaseMessage(
                error.message,
                "error"
            );

            return;

        }


        /*
        ================================================
        BUILD UPDATED STOCK
        ================================================
        */

        const updatedStock = {
            ...previousStock
        };


        items.forEach(
            item => {

                const currentQuantity =
                    Number(
                        updatedStock[item.itemId] || 0
                    );


                updatedStock[item.itemId] =
                    roundQuantity(
                        currentQuantity +
                        item.quantity
                    );

            }
        );


        /*
        ================================================
        BUILD PURCHASE RECORD
        ================================================
        */

        let purchase;


        try {

            purchase =
                buildPurchaseRecord(
                    items,
                    updatedStock
                );

        } catch (error) {

            console.error(
                "Unable to build purchase:",
                error
            );

            showPurchaseMessage(
                "Unable to prepare the purchase record.",
                "error"
            );

            return;

        }


        /*
        ================================================
        DISABLE SAVE WHILE PROCESSING
        ================================================
        */

        if (savePurchaseButton) {

            savePurchaseButton.disabled =
                true;

        }


        try {

            /*
            --------------------------------------------
            STEP 1: SAVE UPDATED STOCK
            --------------------------------------------
            */

            const stockSaved =
                saveInventoryStock(
                    updatedStock
                );


            if (!stockSaved) {

                showPurchaseMessage(
                    "Unable to save inventory. The purchase was not completed.",
                    "error"
                );

                return;

            }


            /*
            --------------------------------------------
            STEP 2: SAVE PURCHASE HISTORY
            --------------------------------------------
            */

            const historySaved =
                savePurchaseHistory(
                    purchase
                );


            if (!historySaved) {

                /*
                Roll inventory back to the previous state
                if the purchase record cannot be saved.
                */

                const rollbackSucceeded =
                    saveInventoryStock(
                        previousStock
                    );


                if (!rollbackSucceeded) {

                    console.error(
                        "Inventory rollback failed. Check localStorage immediately."
                    );

                    showPurchaseMessage(
                        "Critical storage error: purchase history failed and inventory rollback failed. Check inventory records.",
                        "error"
                    );

                } else {

                    showPurchaseMessage(
                        "Purchase history could not be saved. Inventory changes were rolled back.",
                        "error"
                    );

                }

                return;

            }


            /*
            --------------------------------------------
            STEP 3: NOTIFY APPLICATION
            --------------------------------------------
            */

            document.dispatchEvent(
                new CustomEvent(
                    "posInventoryUpdated",
                    {
                        detail: {

                            purchase:
                                purchase,

                            updatedStock:
                                {
                                    ...updatedStock
                                }

                        }
                    }
                )
            );


            /*
            --------------------------------------------
            STEP 4: RESET FORM
            --------------------------------------------
            */

            resetPurchaseForm();


            /*
            --------------------------------------------
            STEP 5: SUCCESS MESSAGE
            --------------------------------------------
            */

            if (purchase.dueAmount > 0) {

                showPurchaseMessage(
                    `Purchase saved. Inventory updated. ${formatCurrency(purchase.dueAmount)} remains due to ${purchase.supplier}.`,
                    "success"
                );

            } else {

                showPurchaseMessage(
                    "Purchase saved successfully. Inventory has been updated.",
                    "success"
                );

            }


        } catch (error) {

            console.error(
                "Purchase save failed:",
                error
            );


            showPurchaseMessage(
                "An unexpected error occurred while saving the purchase.",
                "error"
            );

        } finally {

            if (savePurchaseButton) {

                savePurchaseButton.disabled =
                    false;

            }

        }

    }


    /*
    ====================================================
    INITIALIZE PAGE
    ====================================================
    */

    function initializeInventoryNewPurchase() {

        /*
        ================================================
        GET HTML ELEMENTS
        ================================================
        */

        itemsContainer =
            document.getElementById(
                "purchase-items"
            );


        purchaseDateInput =
            document.getElementById(
                "purchase-date"
            );


        supplierInput =
            document.getElementById(
                "purchase-supplier"
            );


        invoiceInput =
            document.getElementById(
                "purchase-invoice"
            );


        paymentStatusInput =
            document.getElementById(
                "purchase-payment-status"
            );


        paymentMethodInput =
            document.getElementById(
                "purchase-payment-method"
            );


        paymentDetailsContainer =
            document.getElementById(
                "purchase-payment-details"
            );


        paidAmountInput =
            document.getElementById(
                "purchase-paid-amount"
            );


        dueAmountInput =
            document.getElementById(
                "purchase-due-amount"
            );


        dueDateInput =
            document.getElementById(
                "purchase-due-date"
            );


        notesInput =
            document.getElementById(
                "purchase-notes"
            );


        stockPreviewContainer =
            document.getElementById(
                "purchase-stock-preview"
            );


        itemCountElement =
            document.getElementById(
                "purchase-item-count"
            );


        grandTotalElement =
            document.getElementById(
                "purchase-grand-total"
            );


        formMessageElement =
            document.getElementById(
                "purchase-form-message"
            );


        addItemButton =
            document.getElementById(
                "add-purchase-item"
            );


        savePurchaseButton =
            document.getElementById(
                "save-purchase"
            );


        /*
        ================================================
        REQUIRED ELEMENT CHECK
        ================================================
        */

        if (
            !itemsContainer ||
            !purchaseDateInput ||
            !supplierInput ||
            !paymentStatusInput ||
            !paymentMethodInput ||
            !stockPreviewContainer ||
            !itemCountElement ||
            !grandTotalElement ||
            !formMessageElement ||
            !addItemButton ||
            !savePurchaseButton
        ) {

            console.warn(
                "New Purchase: required HTML elements were not found."
            );

            return;

        }


        /*
        ================================================
        SET DEFAULT DATE
        ================================================
        */

        purchaseDateInput.value =
            getLocalDate();


        /*
        ================================================
        INITIALIZE ITEM ROWS
        ================================================
        */

        itemsContainer.innerHTML = "";

        createPurchaseRow();


        /*
        ================================================
        ADD ITEM BUTTON
        ================================================
        */

        addItemButton.addEventListener(
            "click",
            () => {

                createPurchaseRow();

            }
        );


        /*
        ================================================
        SAVE PURCHASE BUTTON
        ================================================
        */

        savePurchaseButton.addEventListener(
            "click",
            savePurchase
        );


        /*
        ================================================
        PAYMENT STATUS CHANGE
        ================================================
        */

        paymentStatusInput.addEventListener(
            "change",
            () => {

                const status =
                    paymentStatusInput.value;


                /*
                Clear previous partial payment input
                when switching to Partially Paid.
                */

                if (status === "partially-paid") {

                    paidAmountInput.value = "";

                }


                if (status === "due") {

                    paidAmountInput.value =
                        "0";

                }


                updatePurchasePaymentFields();

            }
        );


        /*
        ================================================
        PAID AMOUNT CHANGE
        ================================================
        */

        paidAmountInput?.addEventListener(
            "input",
            updatePurchasePaymentFields
        );


        /*
        ================================================
        INITIAL CALCULATIONS
        ================================================
        */

        updatePurchaseCalculations();

    }


    /*
    ====================================================
    PUBLIC API
    ====================================================

    Provides a small interface that future Inventory
    pages can use without accessing private functions.

    ====================================================
    */

    window.POSInventoryPurchase = {

        getStock:
            getInventoryStock,

        getPurchaseHistory:
            getPurchaseHistory

    };


    /*
    ====================================================
    PAGE INITIALIZER REGISTRATION
    ====================================================
    */

    window.POSPageInitializers =
        window.POSPageInitializers || {};


    window.POSPageInitializers[
        "js/inventory/purchase/new.js"
    ] =
        initializeInventoryNewPurchase;


})();
