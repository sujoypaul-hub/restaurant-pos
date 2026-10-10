/*
========================================================
PURCHASE RETURNS
========================================================

Storage:

pos_inventory_stock_v1
pos_inventory_purchase_history_v1
pos_inventory_purchase_returns_v1
pos_inventory_supplier_credits_v1

Rules:

1. A return must reference an existing purchase.
2. The returned item must belong to that purchase.
3. Cumulative returns cannot exceed purchased quantity.
4. Stock cannot become negative through a return.
5. Supplier credit reduces outstanding payable.
6. Excess supplier credit is kept in the credit ledger.
7. A refund already received does not reduce payable again.
8. The original purchase record and total remain intact.

========================================================
*/

(function () {

    "use strict";


    const STOCK_KEY =
        "pos_inventory_stock_v1";

    const PURCHASE_KEY =
        "pos_inventory_purchase_history_v1";

    const RETURNS_KEY =
        "pos_inventory_purchase_returns_v1";

    const CREDITS_KEY =
        "pos_inventory_supplier_credits_v1";


    const DEMO_OPENING_STOCK = {
        chicken: 8,
        cooking_oil: 5,
        mayonnaise: 1.5,
        buns: 80,
        fries: 10
    };


    let purchases = [];
    let returns = [];
    let stock = {};

    let purchaseSelect;
    let supplierInput;
    let itemSelect;
    let returnDate;
    let quantityInput;
    let quantityHelp;
    let rateInput;
    let reasonSelect;
    let settlementSelect;
    let notesInput;
    let form;
    let saveButton;
    let messageElement;
    let errorElement;

    let returnValueElement;
    let stockBeforeElement;
    let stockDeductionElement;
    let stockAfterElement;

    let dueBeforeElement;
    let creditAppliedElement;
    let dueAfterElement;
    let financialNoteElement;

    let returnsTableBody;
    let returnsCountElement;


    /*
    ====================================================
    HELPERS
    ====================================================
    */

    function roundMoney(value) {

        return Math.round(
            (Number(value) + Number.EPSILON) * 100
        ) / 100;

    }


    function roundQty(value) {

        return Math.round(
            (Number(value) + Number.EPSILON) * 1000
        ) / 1000;

    }


    function money(value) {

        return "₹" + Number(value || 0).toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2
            }
        );

    }


    function quantityText(value) {

        return Number(value || 0).toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 3
            }
        );

    }


    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    function today() {

        const now = new Date();

        return `${now.getFullYear()}-${String(
            now.getMonth() + 1
        ).padStart(2, "0")}-${String(
            now.getDate()
        ).padStart(2, "0")}`;

    }


    function formatDate(value) {

        if (!value) {
            return "—";
        }

        const date =
            /^\d{4}-\d{2}-\d{2}$/.test(value)
                ? new Date(`${value}T00:00:00`)
                : new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    }


    function showMessage(message, type = "info") {

        messageElement.textContent = message;

        messageElement.dataset.status = type;

    }


    function showError(message) {

        errorElement.textContent = message;

    }


    /*
    ====================================================
    STORAGE HELPERS
    ====================================================
    */

    function readArray(key) {

        const value =
            localStorage.getItem(key);

        if (!value) {
            return [];
        }

        const parsed =
            JSON.parse(value);

        if (!Array.isArray(parsed)) {
            throw new Error(
                `Stored data at ${key} is invalid.`
            );
        }

        return parsed;

    }


    function readStock() {

        const saved =
            localStorage.getItem(STOCK_KEY);


        const result = {
            ...DEMO_OPENING_STOCK
        };


        if (!saved) {
            return result;
        }


        const parsed =
            JSON.parse(saved);


        if (
            !parsed ||
            typeof parsed !== "object" ||
            Array.isArray(parsed)
        ) {

            throw new Error(
                "Saved inventory stock has an invalid format."
            );

        }


        Object.entries(parsed).forEach(
            ([itemId, value]) => {

                const numeric =
                    Number(value);

                if (
                    Number.isFinite(numeric) &&
                    numeric >= 0
                ) {

                    result[itemId] =
                        numeric;

                }

            }
        );


        return result;

    }


    function purchasesWriteValue(records) {

        return JSON.stringify(records);

    }


    /*
    ====================================================
    PURCHASE HELPERS
    ====================================================
    */

    function purchaseTotal(purchase) {

        const value =
            Number(purchase.total);


        if (
            Number.isFinite(value) &&
            value >= 0
        ) {

            return roundMoney(value);

        }


        return roundMoney(
            (Array.isArray(purchase.items)
                ? purchase.items
                : []
            ).reduce(
                (sum, item) =>
                    sum + (Number(item.total) || 0),
                0
            )
        );

    }


    function paidAmount(purchase) {

        const total =
            purchaseTotal(purchase);


        if (
            purchase.paidAmount !== undefined &&
            purchase.paidAmount !== null &&
            purchase.paidAmount !== "" &&
            Number.isFinite(
                Number(purchase.paidAmount)
            )
        ) {

            return roundMoney(
                Math.max(
                    0,
                    Math.min(
                        total,
                        Number(purchase.paidAmount)
                    )
                )
            );

        }


        if (
            purchase.paymentStatus === "paid"
        ) {

            return total;

        }


        if (
            purchase.dueAmount !== undefined &&
            Number.isFinite(
                Number(purchase.dueAmount)
            )
        ) {

            return roundMoney(
                Math.max(
                    0,
                    total - Number(purchase.dueAmount)
                )
            );

        }


        return 0;

    }


    function invoiceCredit(purchase) {

        return Math.max(
            0,
            Number(
                purchase.supplierCreditAmount
            ) || 0
        );

    }


    function invoiceDue(purchase) {

        return roundMoney(
            Math.max(
                0,
                purchaseTotal(purchase) -
                paidAmount(purchase) -
                invoiceCredit(purchase)
            )
        );

    }


    function getPurchase(purchaseId) {

        return purchases.find(
            purchase =>
                String(purchase.id) ===
                String(purchaseId)
        );

    }


    function getPurchasedItem(purchase, itemId) {

        return (
            Array.isArray(purchase?.items)
                ? purchase.items
                : []
        ).find(
            item =>
                String(item.itemId) ===
                String(itemId)
        );

    }


    /*
    ====================================================
    ALREADY RETURNED QUANTITY
    ====================================================
    */

    function returnedQuantity(purchaseId, itemId) {

        return roundQty(
            returns.reduce(
                (sum, record) => {

                    if (
                        String(record.purchaseId) !==
                            String(purchaseId) ||
                        String(record.itemId) !==
                            String(itemId)
                    ) {

                        return sum;

                    }

                    return sum +
                        (Number(record.quantity) || 0);

                },
                0
            )
        );

    }


    /*
    ====================================================
    POPULATE PURCHASE SELECT
    ====================================================
    */

    function populatePurchases() {

        const previousValue =
            purchaseSelect.value;


        purchaseSelect.innerHTML = `
            <option value="">Select purchase</option>
        `;


        purchases.forEach(
            purchase => {

                const option =
                    document.createElement("option");


                option.value =
                    purchase.id;


                const reference =
                    purchase.invoice ||
                    purchase.id;


                option.textContent =
                    `${formatDate(purchase.date)} · ${
                        purchase.supplier || "Supplier"
                    } · ${reference}`;


                purchaseSelect.appendChild(
                    option
                );

            }
        );


        if (
            purchases.some(
                purchase =>
                    String(purchase.id) ===
                    String(previousValue)
            )
        ) {

            purchaseSelect.value =
                previousValue;

        }

    }


    /*
    ====================================================
    POPULATE ITEM SELECT
    ====================================================
    */

    function populateItems() {

        const purchase =
            getPurchase(
                purchaseSelect.value
            );


        itemSelect.innerHTML = `
            <option value="">Select item</option>
        `;


        supplierInput.value =
            purchase?.supplier || "";


        if (!purchase) {

            itemSelect.disabled = true;

            quantityInput.disabled = true;

            quantityHelp.textContent =
                "Select a purchase first.";

            rateInput.value = "";

            updatePreview();

            return;

        }


        const items =
            Array.isArray(purchase.items)
                ? purchase.items
                : [];


        items.forEach(
            item => {

                if (!item.itemId) {

                    return;

                }


                const purchased =
                    Number(item.quantity) || 0;


                const alreadyReturned =
                    returnedQuantity(
                        purchase.id,
                        item.itemId
                    );


                const remaining =
                    Math.max(
                        0,
                        purchased - alreadyReturned
                    );


                /*
                No quantity remains to return.
                */

                if (remaining <= 0) {

                    return;

                }


                const option =
                    document.createElement("option");


                option.value =
                    item.itemId;


                option.textContent =
                    `${item.itemName} · ${quantityText(remaining)} ${item.unit} available to return`;


                itemSelect.appendChild(
                    option
                );

            }
        );


        itemSelect.disabled =
            itemSelect.options.length <= 1;


        quantityInput.disabled = true;

        quantityInput.value = "";

        rateInput.value = "";


        quantityHelp.textContent =
            itemSelect.disabled
                ? "No purchased quantities remain available for return."
                : "Select the item to see the returnable quantity.";


        updatePreview();

    }


    /*
    ====================================================
    GET SELECTED ITEM DATA
    ====================================================
    */

    function getSelectedReturnData() {

        const purchase =
            getPurchase(
                purchaseSelect.value
            );


        if (!purchase) {
            return null;
        }


        const item =
            getPurchasedItem(
                purchase,
                itemSelect.value
            );


        if (!item) {
            return null;
        }


        const purchasedQuantity =
            Number(item.quantity) || 0;


        const alreadyReturned =
            returnedQuantity(
                purchase.id,
                item.itemId
            );


        const remainingReturnable =
            Math.max(
                0,
                roundQty(
                    purchasedQuantity -
                    alreadyReturned
                )
            );


        const currentStock =
            Number(
                stock[item.itemId] || 0
            );


        return {

            purchase,
            item,

            remainingReturnable:
                roundQty(remainingReturnable),

            currentStock:
                roundQty(currentStock),

            rate:
                Number(item.rate) || 0

        };

    }


    /*
    ====================================================
    SELECTED ITEM CHANGED
    ====================================================
    */

    function handleItemChange() {

        const data =
            getSelectedReturnData();


        if (!data) {

            quantityInput.disabled = true;

            quantityInput.value = "";

            rateInput.value = "";

            quantityHelp.textContent =
                "Select a purchase item first.";

            updatePreview();

            return;

        }


        quantityInput.disabled = false;

        quantityInput.value = "";

        quantityInput.min = "0.001";

        quantityInput.max =
            Math.min(
                data.remainingReturnable,
                data.currentStock
            ).toString();


        rateInput.value =
            data.rate.toFixed(2);


        quantityHelp.textContent =
            `Purchased: ${quantityText(data.item.quantity)} ${data.item.unit}. Already returned: ${quantityText(returnedQuantity(data.purchase.id, data.item.itemId))} ${data.item.unit}. Current stock: ${quantityText(data.currentStock)} ${data.item.unit}.`;


        updatePreview();

    }


    /*
    ====================================================
    LIVE RETURN PREVIEW
    ====================================================
    */

    function updatePreview() {

        const data =
            getSelectedReturnData();


        if (!data) {

            returnValueElement.textContent =
                "₹0";

            stockBeforeElement.textContent =
                "—";

            stockDeductionElement.textContent =
                "0";

            stockAfterElement.textContent =
                "—";

            dueBeforeElement.textContent =
                "—";

            creditAppliedElement.textContent =
                "₹0";

            dueAfterElement.textContent =
                "—";

            financialNoteElement.textContent =
                "Choose a purchase and item to see the impact.";

            return;

        }


        const enteredQuantity =
            Number(quantityInput.value) || 0;


        const safeQuantity =
            Math.max(
                0,
                enteredQuantity
            );


        const returnAmount =
            roundMoney(
                safeQuantity * data.rate
            );


        const stockAfter =
            roundQty(
                data.currentStock -
                safeQuantity
            );


        const dueBefore =
            invoiceDue(data.purchase);


        const settlement =
            settlementSelect.value;


        const appliedCredit =
            settlement === "supplier-credit"
                ? Math.min(
                    dueBefore,
                    returnAmount
                )
                : 0;


        const dueAfter =
            roundMoney(
                Math.max(
                    0,
                    dueBefore -
                    appliedCredit
                )
            );


        const excessCredit =
            roundMoney(
                Math.max(
                    0,
                    returnAmount -
                    appliedCredit
                )
            );


        returnValueElement.textContent =
            money(returnAmount);


        stockBeforeElement.textContent =
            `${quantityText(data.currentStock)} ${data.item.unit}`;


        stockDeductionElement.textContent =
            `−${quantityText(safeQuantity)} ${data.item.unit}`;


        stockAfterElement.textContent =
            `${quantityText(stockAfter)} ${data.item.unit}`;


        dueBeforeElement.textContent =
            money(dueBefore);


        creditAppliedElement.textContent =
            money(appliedCredit);


        dueAfterElement.textContent =
            money(dueAfter);


        if (
            settlement === "refund-received"
        ) {

            financialNoteElement.textContent =
                "The refund is recorded as received. The original invoice balance stays unchanged.";

        } else if (excessCredit > 0) {

            financialNoteElement.textContent =
                `${money(excessCredit)} will remain as available supplier credit for future purchases.`;

        } else {

            financialNoteElement.textContent =
                "Supplier credit reduces the balance of the selected invoice.";

        }

    }


    /*
    ====================================================
    RENDER RETURN HISTORY
    ====================================================
    */

    function renderReturnHistory() {

        if (!returnsTableBody) {
            return;
        }


        const recent =
            [...returns].reverse().slice(0, 10);


        returnsTableBody.innerHTML = "";


        if (recent.length === 0) {

            returnsTableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        No purchase returns recorded yet.
                    </td>
                </tr>
            `;

        } else {

            returnsTableBody.innerHTML =
                recent.map(
                    record => {

                        const settlementLabel =
                            record.settlement ===
                                "supplier-credit"
                                ? "Supplier Credit"
                                : "Refund Received";


                        return `
                            <tr>

                                <td>
                                    ${escapeHTML(
                                        formatDate(record.date)
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        record.supplier || "—"
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        record.itemName || "—"
                                    )}
                                </td>

                                <td>
                                    ${quantityText(
                                        record.quantity
                                    )}
                                    ${escapeHTML(
                                        record.unit || ""
                                    )}
                                </td>

                                <td>
                                    ${money(record.total)}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        settlementLabel
                                    )}
                                </td>

                            </tr>
                        `;

                    }
                ).join("");

        }


        document.getElementById(
            "purchase-returns-count"
        ).textContent =
            `${returns.length} ${
                returns.length === 1
                    ? "return"
                    : "returns"
            }`;

    }


    /*
    ====================================================
    SAVE PURCHASE RETURN
    ====================================================
    */

    function saveReturn(event) {

        event.preventDefault();

        errorElement.textContent = "";


        const purchase =
            getPurchase(
                purchaseSelect.value
            );


        const data =
            getSelectedReturnData();


        if (!purchase) {

            showError(
                "Select the original purchase."
            );

            return;

        }


        if (!data) {

            showError(
                "Select an item from the original purchase."
            );

            return;

        }


        const quantity =
            Number(quantityInput.value);


        if (
            !Number.isFinite(quantity) ||
            quantity <= 0
        ) {

            showError(
                "Enter a return quantity greater than zero."
            );

            return;

        }


        if (
            quantity >
            data.remainingReturnable + 0.0001
        ) {

            showError(
                "The return quantity exceeds the remaining returnable quantity."
            );

            return;

        }


        if (
            quantity >
            data.currentStock + 0.0001
        ) {

            showError(
                "Current stock is insufficient for this return. Check the physical stock before proceeding."
            );

            return;

        }


        const reason =
            reasonSelect.value;


        if (!reason) {

            showError(
                "Select a reason for the return."
            );

            return;

        }


        const date =
            returnDate.value;


        if (!date) {

            showError(
                "Select the return date."
            );

            return;

        }


        const settlement =
            settlementSelect.value;


        const returnAmount =
            roundMoney(
                quantity * data.rate
            );


        if (returnAmount <= 0) {

            showError(
                "The return value must be greater than ₹0."
            );

            return;

        }


        /*
        ================================================
        PREPARE NEW STOCK
        ================================================
        */

        const originalStock =
            { ...stock };


        const updatedStock =
            { ...stock };


        updatedStock[data.item.itemId] =
            roundQty(
                data.currentStock - quantity
            );


        /*
        ================================================
        CALCULATE SUPPLIER CREDIT
        ================================================
        */

        const purchaseRecords =
            [...purchases];


        const purchaseIndex =
            purchaseRecords.findIndex(
                item =>
                    String(item.id) ===
                    String(purchase.id)
            );


        if (purchaseIndex < 0) {

            showError(
                "The original purchase could not be found."
            );

            return;

        }


        const originalPurchase =
            purchaseRecords[purchaseIndex];


        const creditApplied =
            settlement === "supplier-credit"
                ? roundMoney(
                    Math.min(
                        invoiceDue(originalPurchase),
                        returnAmount
                    )
                )
                : 0;


        const excessCredit =
            settlement === "supplier-credit"
                ? roundMoney(
                    Math.max(
                        0,
                        returnAmount - creditApplied
                    )
                )
                : 0;


        const updatedSupplierCredit =
            roundMoney(
                invoiceCredit(originalPurchase) +
                creditApplied
            );


        const newInvoiceDue =
            roundMoney(
                Math.max(
                    0,
                    purchaseTotal(originalPurchase) -
                    paidAmount(originalPurchase) -
                    updatedSupplierCredit
                )
            );


        const updatedPurchase = {

    ...originalPurchase,

    paidAmount:
        paidAmount(originalPurchase),

    supplierCreditAmount:
        updatedSupplierCredit,

    dueAmount:
        newInvoiceDue,

    paymentStatus:
        newInvoiceDue <= 0
            ? "paid"
            : paidAmount(originalPurchase) > 0 ||
                updatedSupplierCredit > 0
                ? "partially-paid"
                : "due"

};


        purchaseRecords[purchaseIndex] =
            updatedPurchase;


        /*
        ================================================
        CREATE RETURN RECORD
        ================================================
        */

        const returnRecord = {

            id:
                `return-${Date.now()}`,

            purchaseId:
                originalPurchase.id,

            supplier:
                originalPurchase.supplier || "",

            invoice:
                originalPurchase.invoice || "",

            itemId:
                data.item.itemId,

            itemName:
                data.item.itemName || data.item.name || "Item",

            quantity:
                roundQty(quantity),

            unit:
                data.item.unit || "",

            rate:
                data.rate,

            total:
                returnAmount,

            date:
                date,

            settlement:
                settlement,

            reason:
                reason,

            notes:
                notesInput.value.trim(),

            creditApplied:
                creditApplied,

            excessCredit:
                excessCredit,

            createdAt:
                new Date().toISOString()

        };


        const updatedReturns =
            [...returns, returnRecord];


        /*
        ================================================
        PREPARE SUPPLIER CREDIT LEDGER
        ================================================
        */

        let existingCredits;


        try {

            existingCredits =
                readArray(CREDITS_KEY);

        } catch (error) {

            showError(
                "Supplier credit records could not be read. Nothing was saved."
            );

            return;

        }


        const updatedCredits =
            [...existingCredits];


        if (excessCredit > 0) {

            updatedCredits.push({

                id:
                    `supplier-credit-${Date.now()}`,

                supplier:
                    originalPurchase.supplier || "",

                purchaseId:
                    originalPurchase.id,

                returnId:
                    returnRecord.id,

                amount:
                    excessCredit,

                remainingAmount:
                    excessCredit,

                date:
                    date,

                note:
                    `Excess supplier credit from return ${returnRecord.id}`,

                createdAt:
                    new Date().toISOString()

            });

        }


        /*
        ================================================
        SAVE AS A GROUP
        ================================================

        localStorage has no transaction support. Keep
        snapshots and restore them if any write fails.

        ================================================
        */

        const keys = [
            STOCK_KEY,
            PURCHASE_KEY,
            RETURNS_KEY,
            CREDITS_KEY
        ];


        const snapshots = {};


        try {

            keys.forEach(
                key => {

                    snapshots[key] =
                        localStorage.getItem(key);

                }
            );


            localStorage.setItem(
                STOCK_KEY,
                JSON.stringify(updatedStock)
            );


            localStorage.setItem(
                PURCHASE_KEY,
                purchasesWriteValue(purchaseRecords)
            );


            localStorage.setItem(
                RETURNS_KEY,
                JSON.stringify(updatedReturns)
            );


            localStorage.setItem(
                CREDITS_KEY,
                JSON.stringify(updatedCredits)
            );


        } catch (error) {

            console.error(
                "Unable to save purchase return:",
                error
            );


            let rollbackFailed = false;


            keys.forEach(
                key => {

                    try {

                        if (snapshots[key] === null) {

                            localStorage.removeItem(key);

                        } else if (
                            snapshots[key] !== undefined
                        ) {

                            localStorage.setItem(
                                key,
                                snapshots[key]
                            );

                        }

                    } catch (rollbackError) {

                        rollbackFailed = true;

                        console.error(
                            "Return rollback failed:",
                            rollbackError
                        );

                    }

                }
            );


            showError(
                rollbackFailed
                    ? "Storage error: saving the return failed and rollback could not be fully confirmed. Inspect inventory records."
                    : "The return could not be saved. No changes were retained."
            );

            return;

        }


        /*
        ================================================
        UPDATE PAGE STATE
        ================================================
        */

        stock =
            updatedStock;

        purchases =
            purchaseRecords;

        returns =
            updatedReturns;


        /*
        ================================================
        NOTIFY APP
        ================================================
        */

        document.dispatchEvent(
            new CustomEvent(
                "posInventoryUpdated",
                {
                    detail: {
                        updatedStock:
                            { ...stock },

                        returnRecord:
                            returnRecord
                    }
                }
            )
        );


        document.dispatchEvent(
            new CustomEvent(
                "posPurchaseReturnSaved",
                {
                    detail: {
                        returnRecord:
                            returnRecord,

                        purchase:
                            updatedPurchase
                    }
                }
            )
        );


        /*
        ================================================
        RESET FORM
        ================================================
        */

        quantityInput.value = "";

        notesInput.value = "";

        populateItems();

        renderReturnHistory();

        updatePreview();


        showMessage(
            settlement === "supplier-credit"
                ? `Return saved. ${money(creditApplied)} applied to the invoice${
                    excessCredit > 0
                        ? `; ${money(excessCredit)} saved as available supplier credit`
                        : ""
                }. Stock has been reduced.`
                : `Return saved. Refund of ${money(returnAmount)} recorded as already received. Stock has been reduced.`,
            "success"
        );

    }


    /*
    ====================================================
    INITIALIZE PAGE
    ====================================================
    */

    function initializePurchaseReturns() {

        purchaseSelect =
            document.getElementById(
                "return-purchase-select"
            );

        supplierInput =
            document.getElementById(
                "return-supplier"
            );

        itemSelect =
            document.getElementById(
                "return-item-select"
            );

        returnDate =
            document.getElementById(
                "return-date"
            );

        quantityInput =
            document.getElementById(
                "return-quantity"
            );

        quantityHelp =
            document.getElementById(
                "return-quantity-help"
            );

        rateInput =
            document.getElementById(
                "return-rate"
            );

        reasonSelect =
            document.getElementById(
                "return-reason"
            );

        settlementSelect =
            document.getElementById(
                "return-settlement"
            );

        notesInput =
            document.getElementById(
                "return-notes"
            );

        form =
            document.getElementById(
                "purchase-return-form"
            );

        saveButton =
            document.getElementById(
                "save-purchase-return"
            );

        messageElement =
            document.getElementById(
                "purchase-return-message"
            );

        errorElement =
            document.getElementById(
                "purchase-return-error"
            );


        returnValueElement =
            document.getElementById(
                "return-value"
            );

        stockBeforeElement =
            document.getElementById(
                "return-stock-before"
            );

        stockDeductionElement =
            document.getElementById(
                "return-stock-deduction"
            );

        stockAfterElement =
            document.getElementById(
                "return-stock-after"
            );

        dueBeforeElement =
            document.getElementById(
                "return-due-before"
            );

        creditAppliedElement =
            document.getElementById(
                "return-credit-applied"
            );

        dueAfterElement =
            document.getElementById(
                "return-due-after"
            );

        financialNoteElement =
            document.getElementById(
                "return-financial-note"
            );

        returnsTableBody =
            document.getElementById(
                "purchase-returns-tbody"
            );

        returnsCountElement =
            document.getElementById(
                "purchase-returns-count"
            );


        if (
            !purchaseSelect ||
            !itemSelect ||
            !form ||
            !returnsTableBody
        ) {

            console.warn(
                "Purchase Returns: required HTML elements were not found."
            );

            return;

        }


        try {

            purchases =
                readArray(PURCHASE_KEY);

            returns =
                readArray(RETURNS_KEY);

            stock =
                readStock();


            populatePurchases();

            populateItems();

            renderReturnHistory();


        } catch (error) {

            console.error(error);

            showMessage(
                "Unable to load purchase, return or stock data.",
                "error"
            );

        }


        returnDate.value =
            today();


        purchaseSelect.addEventListener(
            "change",
            populateItems
        );


        itemSelect.addEventListener(
            "change",
            handleItemChange
        );


        quantityInput.addEventListener(
            "input",
            updatePreview
        );


        settlementSelect.addEventListener(
            "change",
            updatePreview
        );


        form.addEventListener(
            "submit",
            saveReturn
        );


        updatePreview();

    }


    /*
    ====================================================
    PAGE INITIALIZER
    ====================================================
    */

    window.POSPageInitializers =
        window.POSPageInitializers || {};


    window.POSPageInitializers[
        "js/inventory/purchase/returns.js"
    ] = initializePurchaseReturns;


})();
