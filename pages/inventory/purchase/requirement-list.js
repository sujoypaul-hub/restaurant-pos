/*
========================================================
INVENTORY - REQUIREMENT LIST
========================================================

Features:
- Create and save requirement lists.
- Mark requirement lists as ordered.
- Track expected delivery dates.
- Cancel lists that have not been received.
- Receive partial or complete deliveries.
- Update inventory only for actual received quantities.
- Create purchase history records for receipts.
- Calculate Paid / Partially Paid / Due.
- Save all changes to localStorage.

STORAGE:
- pos_inventory_requirement_lists_v1
- pos_inventory_stock_v1
- pos_inventory_purchase_history_v1

A receipt creates a purchase record. Subsequent receipts
create separate purchase records for their actual items.

========================================================
*/

(function () {

    "use strict";


    /*
    ====================================================
    STORAGE KEYS
    ====================================================
    */

    const REQUIREMENTS_KEY =
        "pos_inventory_requirement_lists_v1";

    const STOCK_KEY =
        "pos_inventory_stock_v1";

    const PURCHASES_KEY =
        "pos_inventory_purchase_history_v1";


    /*
    ====================================================
    DEMO INVENTORY ITEMS
    ====================================================

    These item IDs and units must match the temporary
    master used by new.js.

    ====================================================
    */

    const ITEM_MASTER = {

        chicken: {
            name: "Chicken",
            unit: "kg",
            openingStock: 8,
            estimatedRate: 250
        },

        cooking_oil: {
            name: "Cooking Oil",
            unit: "L",
            openingStock: 5,
            estimatedRate: 150
        },

        mayonnaise: {
            name: "Mayonnaise",
            unit: "kg",
            openingStock: 1.5,
            estimatedRate: 200
        },

        buns: {
            name: "Burger Buns",
            unit: "pcs",
            openingStock: 80,
            estimatedRate: 10
        },

        fries: {
            name: "French Fries",
            unit: "kg",
            openingStock: 10,
            estimatedRate: 280
        }

    };


    /*
    ====================================================
    PAGE REFERENCES
    ====================================================
    */

    let messageElement;

    let requirementDateInput;
    let supplierInput;
    let expectedDateInput;
    let notesInput;

    let itemsContainer;
    let addItemButton;
    let saveRequirementButton;

    let estimatedTotalElement;
    let itemCountElement;
    let totalQuantityElement;

    let statusFilter;
    let historyTableBody;
    let historyCountElement;

    let receiveForm;
    let receiveRequirementIdInput;
    let receiveDateInput;
    let receiveInvoiceInput;
    let receiveItemsContainer;
    let receiveTotalElement;

    let receivePaymentStatusInput;
    let receivePaymentMethodInput;

    let receivePaymentDetails;
    let receivePaidInput;
    let receiveDueInput;
    let receiveDueDateInput;

    let receiveNotesInput;
    let receiveErrorElement;
    let receiveSaveButton;

    let receiveSupplier = "";

    let requirements = [];


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


    function roundQuantity(value) {

        return Math.round(
            (Number(value) + Number.EPSILON) * 1000
        ) / 1000;

    }


    function formatMoney(value) {

        return "₹" + Number(value || 0).toLocaleString(
            "en-IN",
            {
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


    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    function getLocalDate() {

        const date = new Date();

        return `${date.getFullYear()}-${String(
            date.getMonth() + 1
        ).padStart(2, "0")}-${String(
            date.getDate()
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


    function clearMessage() {

        showMessage("");

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
                `Saved data for ${key} has an invalid format.`
            );

        }

        return parsed;

    }


    function readStock() {

        const stock = {};


        /*
        Demo opening stock is only the first fallback.
        Stored stock becomes the source of truth.
        */

        Object.entries(ITEM_MASTER).forEach(
            ([id, item]) => {

                stock[id] =
                    item.openingStock;

            }
        );


        const saved =
            localStorage.getItem(STOCK_KEY);


        if (!saved) {
            return stock;
        }


        const parsed =
            JSON.parse(saved);


        if (
            !parsed ||
            typeof parsed !== "object" ||
            Array.isArray(parsed)
        ) {

            throw new Error(
                "Saved inventory data has an invalid format."
            );

        }


        Object.entries(parsed).forEach(
            ([id, value]) => {

                const quantity =
                    Number(value);


                if (
                    Number.isFinite(quantity) &&
                    quantity >= 0
                ) {

                    stock[id] =
                        quantity;

                }

            }
        );


        return stock;

    }


    /*
    ====================================================
    MULTI-KEY STORAGE SAVE
    ====================================================

    localStorage does not support database transactions.
    This helper snapshots prior values and attempts to
    restore them if a write fails.

    ====================================================
    */

    function saveStorageGroup(values) {

        const snapshots = {};


        try {

            Object.keys(values).forEach(
                key => {

                    snapshots[key] =
                        localStorage.getItem(key);

                }
            );


            Object.entries(values).forEach(
                ([key, value]) => {

                    localStorage.setItem(
                        key,
                        JSON.stringify(value)
                    );

                }
            );


            return {
                success: true,
                rollbackFailed: false
            };

        } catch (error) {

            console.error(
                "Requirement storage save failed:",
                error
            );


            let rollbackFailed = false;


            Object.keys(values).forEach(
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
                            "Storage rollback failed:",
                            rollbackError
                        );

                    }

                }
            );


            return {
                success: false,
                rollbackFailed: rollbackFailed
            };

        }

    }


    /*
    ====================================================
    REQUIREMENT LOOKUPS
    ====================================================
    */

    function getRequirement(requirementId) {

        return requirements.find(
            item =>
                String(item.id) ===
                String(requirementId)
        );

    }


    function getRequirementItem(
        requirement,
        itemId
    ) {

        return (
            requirement &&
            Array.isArray(requirement.items)
                ? requirement.items
                : []
        ).find(
            item =>
                String(item.itemId) ===
                String(itemId)
        );

    }


    /*
    ====================================================
    READ THE REQUIREMENT FORM
    ====================================================
    */

    function readRequirementFormItems() {

        const rows =
            itemsContainer.querySelectorAll(
                ".requirement-item-row"
            );


        const result = [];


        for (const row of rows) {

            const itemSelect =
                row.querySelector(
                    ".requirement-item-select"
                );

            const quantityInput =
                row.querySelector(
                    ".requirement-quantity-input"
                );

            const rateInput =
                row.querySelector(
                    ".requirement-rate-input"
                );


            const itemId =
                itemSelect.value;

            const rawQuantity =
                quantityInput.value.trim();

            const rawRate =
                rateInput.value.trim();


            /*
            Ignore a fully empty row.
            */

            if (
                !itemId &&
                !rawQuantity &&
                !rawRate
            ) {

                continue;

            }


            if (!itemId) {

                throw new Error(
                    "Select an item or remove the empty row."
                );

            }


            const item =
                ITEM_MASTER[itemId];


            if (!item) {

                throw new Error(
                    "The selected inventory item is invalid."
                );

            }


            const quantity =
                Number(rawQuantity);

            const rate =
                Number(rawRate);


            if (
                rawQuantity === "" ||
                !Number.isFinite(quantity) ||
                quantity <= 0
            ) {

                throw new Error(
                    `Enter a valid required quantity for ${item.name}.`
                );

            }


            if (
                rawRate === "" ||
                !Number.isFinite(rate) ||
                rate < 0
            ) {

                throw new Error(
                    `Enter a valid estimated rate for ${item.name}.`
                );

            }


            result.push({

                itemId:
                    itemId,

                itemName:
                    item.name,

                unit:
                    item.unit,

                requiredQuantity:
                    roundQuantity(quantity),

                estimatedRate:
                    roundMoney(rate),

                receivedQuantity:
                    0,

                estimatedTotal:
                    roundMoney(quantity * rate)

            });

        }


        return result;

    }


    /*
    ====================================================
    CREATE REQUIREMENT ITEM ROW
    ====================================================
    */

    function createRequirementItemRow() {

        const row =
            document.createElement("div");

        row.className =
            "requirement-item-row";


        const itemSelect =
            document.createElement("select");

        itemSelect.className =
            "requirement-item-select";

        itemSelect.setAttribute(
            "aria-label",
            "Required inventory item"
        );

        itemSelect.innerHTML = `
            <option value="">Select item</option>
        `;


        Object.entries(ITEM_MASTER).forEach(
            ([id, item]) => {

                const option =
                    document.createElement("option");

                option.value = id;

                option.textContent =
                    item.name;

                itemSelect.appendChild(option);

            }
        );


        const quantityInput =
            document.createElement("input");

        quantityInput.type = "number";

        quantityInput.className =
            "requirement-quantity-input";

        quantityInput.min = "0.001";

        quantityInput.step = "0.001";

        quantityInput.placeholder = "Qty";

        quantityInput.setAttribute(
            "aria-label",
            "Required quantity"
        );


        const unitElement =
            document.createElement("span");

        unitElement.className =
            "requirement-item-unit";

        unitElement.textContent = "—";


        const rateInput =
            document.createElement("input");

        rateInput.type = "number";

        rateInput.className =
            "requirement-rate-input";

        rateInput.min = "0";

        rateInput.step = "0.01";

        rateInput.placeholder = "Rate";

        rateInput.setAttribute(
            "aria-label",
            "Estimated rate per unit"
        );


        const totalElement =
            document.createElement("strong");

        totalElement.className =
            "requirement-item-total";

        totalElement.textContent = "₹0";


        const removeButton =
            document.createElement("button");

        removeButton.type = "button";

        removeButton.className =
            "requirement-remove-item-btn";

        removeButton.textContent = "×";

        removeButton.setAttribute(
            "aria-label",
            "Remove requirement item"
        );


        row.append(
            itemSelect,
            quantityInput,
            unitElement,
            rateInput,
            totalElement,
            removeButton
        );


        itemsContainer.appendChild(row);


        function updateDefaults() {

            const item =
                ITEM_MASTER[itemSelect.value];


            if (!item) {

                unitElement.textContent = "—";

                rateInput.value = "";

                updateRequirementSummary();

                return;

            }


            unitElement.textContent =
                item.unit;

            rateInput.value =
                item.estimatedRate;

            updateRequirementSummary();

        }


        itemSelect.addEventListener(
            "change",
            updateDefaults
        );


        quantityInput.addEventListener(
            "input",
            updateRequirementSummary
        );


        rateInput.addEventListener(
            "input",
            updateRequirementSummary
        );


        removeButton.addEventListener(
            "click",
            () => {

                row.remove();

                ensureRequirementRow();

                updateRequirementSummary();

            }
        );


        return row;

    }


    function ensureRequirementRow() {

        if (
            itemsContainer.querySelectorAll(
                ".requirement-item-row"
            ).length === 0
        ) {

            createRequirementItemRow();

        }

    }


    /*
    ====================================================
    LIVE REQUIREMENT SUMMARY
    ====================================================
    */

    function updateRequirementSummary() {

        let items = [];


        try {

            items =
                readRequirementFormItems();

        } catch (error) {

            /*
            Incomplete rows are not saved, but valid
            rows still contribute to the preview.
            */

            items = [];

            itemsContainer
                .querySelectorAll(
                    ".requirement-item-row"
                )
                .forEach(
                    row => {

                        const itemId =
                            row.querySelector(
                                ".requirement-item-select"
                            ).value;

                        const quantity =
                            Number(
                                row.querySelector(
                                    ".requirement-quantity-input"
                                ).value
                            );

                        const rate =
                            Number(
                                row.querySelector(
                                    ".requirement-rate-input"
                                ).value
                            );


                        if (
                            ITEM_MASTER[itemId] &&
                            quantity > 0 &&
                            Number.isFinite(quantity) &&
                            rate >= 0 &&
                            Number.isFinite(rate)
                        ) {

                            items.push({

                                itemId:
                                    itemId,

                                quantity:
                                    quantity,

                                unit:
                                    ITEM_MASTER[itemId].unit,

                                estimatedTotal:
                                    quantity * rate

                            });

                        }

                    }
                );

        }


        const total =
            items.reduce(
                (sum, item) =>
                    sum + item.estimatedTotal,
                0
            );


        const totalQuantity =
            items.reduce(
                (sum, item) =>
                    sum + item.quantity,
                0
            );


        estimatedTotalElement.textContent =
            formatMoney(total);


        itemCountElement.textContent =
            items.length;


        /*
        Quantities may have different units, so label
        this as the total number of units/quantities,
        not a physical unit such as kg.
        */

        totalQuantityElement.textContent =
            formatQuantity(totalQuantity);

    }


    /*
    ====================================================
    SAVE REQUIREMENT LIST
    ====================================================
    */

    function saveRequirementList() {

        clearMessage();


        const date =
            requirementDateInput.value;

        const supplier =
            supplierInput.value.trim();

        const expectedDate =
            expectedDateInput.value;


        if (!date) {

            showMessage(
                "Select the requirement date.",
                "error"
            );

            return;

        }


        if (!supplier) {

            showMessage(
                "Select a supplier.",
                "error"
            );

            return;

        }


        let items;


        try {

            items =
                readRequirementFormItems();

        } catch (error) {

            showMessage(
                error.message,
                "error"
            );

            return;

        }


        if (items.length === 0) {

            showMessage(
                "Add at least one item to the requirement list.",
                "error"
            );

            return;

        }


        /*
        Avoid accidental duplicate item rows.
        */

        const itemIds =
            items.map(item => item.itemId);


        if (
            new Set(itemIds).size !== itemIds.length
        ) {

            showMessage(
                "Each inventory item should appear only once in a requirement list. Combine quantities in the same row.",
                "error"
            );

            return;

        }


        const record = {

            id:
                `REQ-${Date.now()}`,

            date:
                date,

            supplier:
                supplier,

            expectedDate:
                expectedDate,

            notes:
                notesInput.value.trim(),

            items:
                items,

            status:
                "draft",

            createdAt:
                new Date().toISOString(),

            orderedAt:
                "",

            completedAt:
                ""

        };


        let latest;


        try {

            latest =
                readArray(REQUIREMENTS_KEY);

        } catch (error) {

            showMessage(
                "Unable to read saved requirement lists.",
                "error"
            );

            return;

        }


        latest.unshift(record);


        const result =
            saveStorageGroup({

                [REQUIREMENTS_KEY]:
                    latest

            });


        if (!result.success) {

            showMessage(
                result.rollbackFailed
                    ? "Storage error: saving failed and rollback could not be confirmed."
                    : "Unable to save the requirement list.",
                "error"
            );

            return;

        }


        requirements = latest;


        /*
        Reset the form.
        */

        supplierInput.value = "";

        expectedDateInput.value = "";

        notesInput.value = "";

        itemsContainer.innerHTML = "";

        createRequirementItemRow();

        updateRequirementSummary();

        renderRequirementHistory();


        showMessage(
            `Requirement ${record.id} saved as Draft.`,
            "success"
        );

    }


    /*
    ====================================================
    UPDATE REQUIREMENT STATUS
    ====================================================
    */

    function updateRequirementStatus(
        requirementId,
        status
    ) {

        const latest =
            [...requirements];


        const index =
            latest.findIndex(
                item =>
                    String(item.id) ===
                    String(requirementId)
            );


        if (index < 0) {

            showMessage(
                "Requirement list not found.",
                "error"
            );

            return;

        }


        const record =
            latest[index];


        if (
            status === "ordered" &&
            record.status === "draft"
        ) {

            record.status =
                "ordered";

            record.orderedAt =
                new Date().toISOString();

        } else if (
            status === "cancelled" &&
            (
                record.status === "draft" ||
                record.status === "ordered"
            )
        ) {

            const receivedAny =
                record.items.some(
                    item =>
                        Number(item.receivedQuantity) > 0
                );


            if (receivedAny) {

                showMessage(
                    "A requirement with received goods cannot be cancelled.",
                    "error"
                );

                return;

            }


            record.status =
                "cancelled";

        } else {

            return;

        }


        const result =
            saveStorageGroup({

                [REQUIREMENTS_KEY]:
                    latest

            });


        if (!result.success) {

            showMessage(
                "Unable to update requirement status.",
                "error"
            );

            return;

        }


        requirements = latest;

        renderRequirementHistory();


        showMessage(
            `${record.id} status changed to ${status.replace("-", " ")}.`,
            "success"
        );

    }


    /*
    ====================================================
    RENDER REQUIREMENT HISTORY
    ====================================================
    */

    function renderRequirementHistory() {

        const filter =
            statusFilter.value;


        const filtered =
            requirements.filter(
                record =>
                    filter === "all" ||
                    record.status === filter
            );


        historyTableBody.innerHTML = "";


        if (filtered.length === 0) {

            historyTableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        No matching requirement lists.
                    </td>
                </tr>
            `;

        } else {

            historyTableBody.innerHTML =
                filtered.map(
                    record => {

                        const itemCount =
                            Array.isArray(record.items)
                                ? record.items.length
                                : 0;


                        let actions = "";


                        if (
                            record.status === "draft"
                        ) {

                            actions = `
                                <button
                                    type="button"
                                    class="requirement-row-action"
                                    data-requirement-action="ordered"
                                    data-requirement-id="${escapeHTML(record.id)}"
                                >
                                    Mark Ordered
                                </button>

                                <button
                                    type="button"
                                    class="requirement-row-action requirement-cancel-action"
                                    data-requirement-action="cancelled"
                                    data-requirement-id="${escapeHTML(record.id)}"
                                >
                                    Cancel
                                </button>
                            `;

                        } else if (
                            record.status === "ordered" ||
                            record.status === "partially-received"
                        ) {

                            actions = `
                                <button
                                    type="button"
                                    class="requirement-row-action"
                                    data-requirement-action="receive"
                                    data-requirement-id="${escapeHTML(record.id)}"
                                >
                                    Receive Goods
                                </button>

                                ${
                                    record.status === "ordered"
                                        ? `
                                            <button
                                                type="button"
                                                class="requirement-row-action requirement-cancel-action"
                                                data-requirement-action="cancelled"
                                                data-requirement-id="${escapeHTML(record.id)}"
                                            >
                                                Cancel
                                            </button>
                                        `
                                        : ""
                                }
                            `;

                        } else if (
                            record.status === "received"
                        ) {

                            actions = `
                                <span class="requirement-complete-label">
                                    Complete
                                </span>
                            `;

                        } else {

                            actions = `
                                <span class="requirement-muted-label">
                                    No actions
                                </span>
                            `;

                        }


                        return `
                            <tr>

                                <td>

                                    <strong>
                                        ${escapeHTML(record.id)}
                                    </strong>

                                    <small class="requirement-row-date">
                                        ${escapeHTML(
                                            formatDate(record.date)
                                        )}
                                    </small>

                                </td>


                                <td>
                                    ${escapeHTML(
                                        record.supplier
                                    )}
                                </td>


                                <td>
                                    ${itemCount}
                                    ${itemCount === 1 ? "item" : "items"}
                                </td>


                                <td>
                                    ${escapeHTML(
                                        formatDate(record.expectedDate)
                                    )}
                                </td>


                                <td>
                                    <span class="requirement-status status-${escapeHTML(record.status)}">
                                        ${escapeHTML(
                                            record.status
                                                .replace(/-/g, " ")
                                                .replace(/\b\w/g, char =>
                                                    char.toUpperCase()
                                                )
                                        )}
                                    </span>
                                </td>


                                <td>

                                    <div class="requirement-row-actions">

                                        ${actions}

                                    </div>

                                </td>

                            </tr>
                        `;

                    }
                ).join("");

        }


        historyCountElement.textContent =
            `${filtered.length} ${
                filtered.length === 1
                    ? "list"
                    : "lists"
            }`;

    }


    /*
    ====================================================
    OPEN UNIVERSAL POPUP
    ====================================================
    */

    function openPopup(id) {

        if (!window.POSPopup) {

            showMessage(
                "The universal popup controller is unavailable.",
                "error"
            );

            return;

        }


        window.POSPopup.open(id);

    }


    /*
    ====================================================
    OPEN RECEIVE DELIVERY POPUP
    ====================================================
    */

    function openReceivePopup(requirementId) {

        const record =
            getRequirement(requirementId);


        if (!record) {

            showMessage(
                "Requirement list not found.",
                "error"
            );

            return;

        }


        if (
            record.status !== "ordered" &&
            record.status !== "partially-received"
        ) {

            showMessage(
                "Only ordered or partially received lists can receive deliveries.",
                "error"
            );

            return;

        }


        const outstandingItems =
            record.items.filter(
                item => {

                    const required =
                        Number(item.requiredQuantity) || 0;

                    const received =
                        Number(item.receivedQuantity) || 0;


                    return (
                        required - received > 0.0001
                    );

                }
            );


        if (outstandingItems.length === 0) {

            showMessage(
                "All requested quantities have already been received.",
                "info"
            );

            return;

        }


        receiveRequirementIdInput.value =
            record.id;

        receiveSupplier =
            record.supplier;


        receiveDateInput.value =
            getLocalDate();

        receiveInvoiceInput.value = "";

        receiveNotesInput.value = "";

        receiveErrorElement.textContent = "";


        receiveItemsContainer.innerHTML = "";


        outstandingItems.forEach(
            item => {

                const master =
                    ITEM_MASTER[item.itemId];


                const received =
                    Number(item.receivedQuantity) || 0;


                const remaining =
                    roundQuantity(
                        item.requiredQuantity - received
                    );


                const row =
                    document.createElement("tr");

                row.className =
                    "requirement-receive-row";

                row.dataset.itemId =
                    item.itemId;


                const nameCell =
                    document.createElement("td");

                nameCell.innerHTML = `
                    <strong>
                        ${escapeHTML(item.itemName)}
                    </strong>

                    <small class="requirement-receive-item-subtitle">
                        ${formatQuantity(item.requiredQuantity)}
                        ${escapeHTML(item.unit)} requested
                    </small>
                `;


                const remainingCell =
                    document.createElement("td");

                remainingCell.textContent =
                    `${formatQuantity(remaining)} ${item.unit}`;


                const quantityCell =
                    document.createElement("td");


                const quantityInput =
                    document.createElement("input");

                quantityInput.type =
                    "number";

                quantityInput.className =
                    "requirement-actual-quantity";

                quantityInput.min =
                    "0";

                quantityInput.max =
                    String(remaining);

                quantityInput.step =
                    "0.001";

                quantityInput.value =
                    "0";

                quantityInput.setAttribute(
                    "aria-label",
                    `Quantity received for ${item.itemName}`
                );


                quantityCell.appendChild(
                    quantityInput
                );


                const rateCell =
                    document.createElement("td");


                const rateInput =
                    document.createElement("input");

                rateInput.type =
                    "number";

                rateInput.className =
                    "requirement-actual-rate";

                rateInput.min =
                    "0";

                rateInput.step =
                    "0.01";

                rateInput.value =
                    String(
                        master?.estimatedRate ??
                        item.estimatedRate ??
                        0
                    );

                rateInput.setAttribute(
                    "aria-label",
                    `Actual rate for ${item.itemName}`
                );


                rateCell.appendChild(
                    rateInput
                );


                const totalCell =
                    document.createElement("td");

                totalCell.className =
                    "requirement-receipt-line-total";

                totalCell.textContent =
                    "₹0";


                row.append(
                    nameCell,
                    remainingCell,
                    quantityCell,
                    rateCell,
                    totalCell
                );


                receiveItemsContainer.appendChild(row);

            }
        );


        /*
        Reset payment defaults.
        */

        receivePaymentStatusInput.value =
            "paid";

        receivePaymentMethodInput.value =
            "cash";

        receivePaidInput.value =
            "0";

        receiveDueInput.value =
            "0";

        receiveDueDateInput.value = "";


        updateReceiptCalculations();


        openPopup(
            "requirement-receive-modal"
        );

    }


    /*
    ====================================================
    READ RECEIVED ITEMS
    ====================================================
    */

    function readReceiptRows(validate = false) {

        const rows =
            receiveItemsContainer.querySelectorAll(
                ".requirement-receive-row"
            );


        const result = [];


        for (const row of rows) {

            const itemId =
                row.dataset.itemId;


            const requirement =
                getRequirement(
                    receiveRequirementIdInput.value
                );


            const requirementItem =
                getRequirementItem(
                    requirement,
                    itemId
                );


            if (!requirementItem) {
                continue;
            }


            const quantityInput =
                row.querySelector(
                    ".requirement-actual-quantity"
                );


            const rateInput =
                row.querySelector(
                    ".requirement-actual-rate"
                );


            const quantity =
                Number(quantityInput.value);


            const rate =
                Number(rateInput.value);


            if (
                !Number.isFinite(quantity) ||
                quantity < 0
            ) {

                if (validate) {

                    throw new Error(
                        `Enter a valid received quantity for ${requirementItem.itemName}.`
                    );

                }

                continue;

            }


            if (
                !Number.isFinite(rate) ||
                rate < 0
            ) {

                if (validate) {

                    throw new Error(
                        `Enter a valid actual rate for ${requirementItem.itemName}.`
                    );

                }

                continue;

            }


            const remaining =
                roundQuantity(
                    requirementItem.requiredQuantity -
                    (Number(requirementItem.receivedQuantity) || 0)
                );


            if (
                validate &&
                quantity > remaining + 0.0001
            ) {

                throw new Error(
                    `Received quantity for ${requirementItem.itemName} cannot exceed ${formatQuantity(remaining)} ${requirementItem.unit}.`
                );

            }


            result.push({

                itemId:
                    itemId,

                itemName:
                    requirementItem.itemName,

                unit:
                    requirementItem.unit,

                requiredQuantity:
                    requirementItem.requiredQuantity,

                quantity:
                    roundQuantity(quantity),

                remainingQuantity:
                    remaining,

                rate:
                    roundMoney(rate),

                total:
                    roundMoney(
                        quantity * rate
                    )

            });

        }


        return result;

    }


    /*
    ====================================================
    RECEIPT TOTAL
    ====================================================
    */

    function updateReceiptCalculations() {

        let items = [];


        try {

            items =
                readReceiptRows(false);

        } catch (error) {

            console.error(error);

        }


        let total = 0;


        receiveItemsContainer
            .querySelectorAll(
                ".requirement-receive-row"
            )
            .forEach(
                row => {

                    const quantity =
                        Number(
                            row.querySelector(
                                ".requirement-actual-quantity"
                            ).value
                        ) || 0;


                    const rate =
                        Number(
                            row.querySelector(
                                ".requirement-actual-rate"
                            ).value
                        ) || 0;


                    const lineTotal =
                        roundMoney(
                            quantity * rate
                        );


                    total += lineTotal;


                    row.querySelector(
                        ".requirement-receipt-line-total"
                    ).textContent =
                        formatMoney(lineTotal);

                }
            );


        total =
            roundMoney(total);


        receiveTotalElement.textContent =
            formatMoney(total);


        updateReceiptPaymentFields();

    }


    /*
    ====================================================
    RECEIPT PAYMENT BREAKDOWN
    ====================================================
    */

    function updateReceiptPaymentFields() {

        const total =
            Number(
                receiveTotalElement.textContent
                    .replace(/[₹,]/g, "")
            ) || 0;


        const status =
            receivePaymentStatusInput.value;


        if (status === "paid") {

            receivePaymentDetails.hidden = true;

            receivePaidInput.value =
                total.toFixed(2);

            receivePaidInput.disabled = true;

            receiveDueInput.value =
                "0.00";

            receiveDueDateInput.required = false;

            receiveDueDateInput.value = "";

            receivePaymentMethodInput.disabled = false;

            return;

        }


        receivePaymentDetails.hidden = false;


        if (status === "due") {

            receivePaidInput.value =
                "0.00";

            receivePaidInput.disabled = true;

            receiveDueInput.value =
                total.toFixed(2);

            receiveDueDateInput.required = true;

            receivePaymentMethodInput.disabled = true;

            return;

        }


        receivePaidInput.disabled = false;

        const paid =
            Number(receivePaidInput.value) || 0;


        receiveDueInput.value =
            Math.max(
                0,
                roundMoney(total - paid)
            ).toFixed(2);


        receiveDueDateInput.required = true;

        receivePaymentMethodInput.disabled = false;

    }


    /*
    ====================================================
    VALIDATE RECEIPT
    ====================================================
    */

    function validateReceipt() {

        if (!receiveDateInput.value) {

            return "Select the actual receipt date.";

        }


        const receivedItems =
            readReceiptRows(true);


        const items =
            receivedItems.filter(
                item =>
                    item.quantity > 0
            );


        if (items.length === 0) {

            return "Enter at least one received quantity greater than zero.";

        }


        for (const item of items) {

            if (
                !Number.isFinite(item.rate) ||
                item.rate < 0
            ) {

                return `Enter a valid rate for ${item.itemName}.`;

            }

        }


        const total =
            roundMoney(
                items.reduce(
                    (sum, item) =>
                        sum + item.total,
                    0
                )
            );


        if (total <= 0) {

            return "The receipt total must be greater than ₹0.";

        }


        const status =
            receivePaymentStatusInput.value;


        if (status === "partially-paid") {

            const raw =
                receivePaidInput.value.trim();

            const paid =
                Number(raw);


            if (
                raw === "" ||
                !Number.isFinite(paid) ||
                paid <= 0 ||
                paid >= total
            ) {

                return "For Partially Paid, enter an amount greater than ₹0 and less than the receipt total.";

            }

        }


        if (
            status === "due" ||
            status === "partially-paid"
        ) {

            if (!receiveDueDateInput.value) {

                return "Select the payment due date.";

            }

        }


        if (
            status !== "due" &&
            !receivePaymentMethodInput.value
        ) {

            return "Select the payment method.";

        }


        return "";

    }


    /*
    ====================================================
    RECORD DELIVERY RECEIPT
    ====================================================

    This creates one actual purchase record for the
    goods received during this delivery.

    Only received quantities increase stock.

    ====================================================
    */

    function saveReceipt(event) {

        event.preventDefault();

        receiveErrorElement.textContent = "";


        const validationError =
            validateReceipt();


        if (validationError) {

            receiveErrorElement.textContent =
                validationError;

            return;

        }


        const requirementId =
            receiveRequirementIdInput.value;


        /*
        Reload all persisted records before saving,
        rather than relying only on the page snapshot.
        */

        let latestRequirements;
        let latestPurchases;
        let previousStock;


        try {

            latestRequirements =
                readArray(REQUIREMENTS_KEY);

            latestPurchases =
                readArray(PURCHASES_KEY);

            previousStock =
                readStock();

        } catch (error) {

            console.error(error);

            receiveErrorElement.textContent =
                "Unable to read saved requirement, purchase or stock records.";

            return;

        }


        const requirementIndex =
            latestRequirements.findIndex(
                item =>
                    String(item.id) ===
                    String(requirementId)
            );


        if (requirementIndex < 0) {

            receiveErrorElement.textContent =
                "Requirement list could not be found.";

            return;

        }


        const requirement =
            latestRequirements[requirementIndex];


        if (
            requirement.status !== "ordered" &&
            requirement.status !== "partially-received"
        ) {

            receiveErrorElement.textContent =
                "This requirement is no longer available for receiving.";

            return;

        }


        let receiptItems;


        try {

            receiptItems =
                readReceiptRows(true)
                    .filter(
                        item =>
                            item.quantity > 0
                    );

        } catch (error) {

            receiveErrorElement.textContent =
                error.message;

            return;

        }


        if (receiptItems.length === 0) {

            receiveErrorElement.textContent =
                "Enter received quantities.";

            return;

        }


        /*
        ================================================
        CONFIRM NOTHING HAS BEEN RECEIVED TWICE
        ================================================
        */

        for (const item of receiptItems) {

            const savedItem =
                getRequirementItem(
                    requirement,
                    item.itemId
                );


            if (!savedItem) {

                receiveErrorElement.textContent =
                    "An item was removed from the requirement. Refresh the page and try again.";

                return;

            }


            const outstanding =
                Number(savedItem.requiredQuantity) -
                Number(savedItem.receivedQuantity || 0);


            if (
                item.quantity >
                outstanding + 0.0001
            ) {

                receiveErrorElement.textContent =
                    `Only ${formatQuantity(outstanding)} ${item.unit} of ${item.itemName} remains outstanding.`;

                return;

            }

        }


        /*
        ================================================
        CALCULATE ACTUAL RECEIPT VALUE
        ================================================
        */

        const receiptTotal =
            roundMoney(
                receiptItems.reduce(
                    (sum, item) =>
                        sum + item.total,
                    0
                )
            );


        const paymentStatus =
            receivePaymentStatusInput.value;


        const paid =
            paymentStatus === "paid"
                ? receiptTotal
                : paymentStatus === "due"
                    ? 0
                    : roundMoney(
                        Number(receivePaidInput.value)
                    );


        const due =
            roundMoney(
                Math.max(
                    0,
                    receiptTotal - paid
                )
            );


        /*
        ================================================
        UPDATED STOCK
        ================================================
        */

        const updatedStock =
            { ...previousStock };


        receiptItems.forEach(
            item => {

                updatedStock[item.itemId] =
                    roundQuantity(
                        Number(
                            updatedStock[item.itemId] || 0
                        ) + item.quantity
                    );

            }
        );


        /*
        ================================================
        BUILD PURCHASE HISTORY RECORD
        ================================================
        */

        const receiptDate =
            receiveDateInput.value;


        const createdAt =
            new Date().toISOString();


        const purchaseId =
            `purchase-${Date.now()}`;


        const receiptPurchase = {

            id:
                purchaseId,

            requirementId:
                requirement.id,

            date:
                receiptDate,

            supplier:
                requirement.supplier,

            invoice:
                receiveInvoiceInput.value.trim(),

            items:
                receiptItems.map(
                    item => ({

                        itemId:
                            item.itemId,

                        itemName:
                            item.itemName,

                        quantity:
                            item.quantity,

                        unit:
                            item.unit,

                        rate:
                            item.rate,

                        total:
                            item.total

                    })
                ),

            total:
                receiptTotal,

            paymentStatus:
                paymentStatus,

            paymentMethod:
                paymentStatus === "due"
                    ? ""
                    : receivePaymentMethodInput.value,

            paidAmount:
                paid,

            dueAmount:
                due,

            dueDate:
                due > 0
                    ? receiveDueDateInput.value
                    : "",

            paymentHistory:
                paid > 0
                    ? [
                        {
                            id:
                                `payment-${Date.now()}`,

                            amount:
                                paid,

                            method:
                                receivePaymentMethodInput.value,

                            date:
                                receiptDate,

                            note:
                                "Payment recorded during goods receipt",

                            createdAt:
                                createdAt
                        }
                    ]
                    : [],

            notes:
                receiveNotesInput.value.trim(),

            source:
                "requirement-list",

            createdAt:
                createdAt

        };


        /*
        ================================================
        UPDATE CUMULATIVE RECEIVED QUANTITIES
        ================================================
        */

        const updatedRequirement = {

            ...requirement,

            items:
                requirement.items.map(
                    originalItem => {

                        const currentReceiptItem =
                            receiptItems.find(
                                item =>
                                    item.itemId ===
                                    originalItem.itemId
                            );


                        if (!currentReceiptItem) {

                            return {
                                ...originalItem
                            };

                        }


                        return {

                            ...originalItem,

                            receivedQuantity:
                                roundQuantity(
                                    Number(
                                        originalItem.receivedQuantity || 0
                                    ) +
                                    currentReceiptItem.quantity
                                )

                        };

                    }
                )

        };


        /*
        A requirement is fully received only if every
        requested item quantity has arrived.
        */

        const allReceived =
            updatedRequirement.items.every(
                item =>
                    Number(item.receivedQuantity || 0) >=
                    Number(item.requiredQuantity) - 0.0001
            );


        updatedRequirement.status =
            allReceived
                ? "received"
                : "partially-received";


        if (allReceived) {

            updatedRequirement.completedAt =
                new Date().toISOString();

        }


        latestRequirements[requirementIndex] =
            updatedRequirement;


        /*
        ================================================
        APPEND PURCHASE RECORD
        ================================================
        */

        latestPurchases.unshift(
            receiptPurchase
        );


        /*
        ================================================
        SAVE STOCK, PURCHASE AND REQUIREMENT TOGETHER
        ================================================
        */

        const result =
            saveStorageGroup({

                [STOCK_KEY]:
                    updatedStock,

                [PURCHASES_KEY]:
                    latestPurchases,

                [REQUIREMENTS_KEY]:
                    latestRequirements

            });


        if (!result.success) {

            receiveErrorElement.textContent =
                result.rollbackFailed
                    ? "Storage error: saving failed and rollback could not be confirmed. Check your inventory and purchase records."
                    : "The receipt could not be saved. No changes were retained.";

            return;

        }


        /*
        ================================================
        UPDATE PAGE STATE
        ================================================
        */

        requirements =
            latestRequirements;


        window.POSPopup.close(
            "requirement-receive-modal"
        );


        renderRequirementHistory();


        /*
        ================================================
        NOTIFY OTHER INVENTORY MODULES
        ================================================
        */

        document.dispatchEvent(
            new CustomEvent(
                "posInventoryUpdated",
                {
                    detail: {

                        purchase:
                            receiptPurchase,

                        updatedStock:
                            updatedStock,

                        requirement:
                            updatedRequirement

                    }
                }
            )
        );


        document.dispatchEvent(
            new CustomEvent(
                "posRequirementReceiptSaved",
                {
                    detail: {

                        requirement:
                            updatedRequirement,

                        purchase:
                            receiptPurchase

                    }
                }
            )
        );


        showMessage(
            allReceived
                ? `${requirement.id} fully received. Inventory has been updated and the receipt added to Purchase History.`
                : `Partial delivery saved. Received items have been added to inventory; the remaining quantities are still outstanding.`,
            "success"
        );

    }


    /*
    ====================================================
    INITIALIZE PAGE
    ====================================================
    */

    function initializeRequirementList() {

        messageElement =
            document.getElementById(
                "requirement-message"
            );

        requirementDateInput =
            document.getElementById(
                "requirement-date"
            );

        supplierInput =
            document.getElementById(
                "requirement-supplier"
            );

        expectedDateInput =
            document.getElementById(
                "requirement-expected-date"
            );

        notesInput =
            document.getElementById(
                "requirement-notes"
            );

        itemsContainer =
            document.getElementById(
                "requirement-items"
            );

        addItemButton =
            document.getElementById(
                "requirement-add-item"
            );

        saveRequirementButton =
            document.getElementById(
                "save-requirement"
            );

        estimatedTotalElement =
            document.getElementById(
                "requirement-estimated-total"
            );

        itemCountElement =
            document.getElementById(
                "requirement-item-count"
            );

        totalQuantityElement =
            document.getElementById(
                "requirement-total-quantity"
            );

        statusFilter =
            document.getElementById(
                "requirement-status-filter"
            );

        historyTableBody =
            document.getElementById(
                "requirement-history-tbody"
            );

        historyCountElement =
            document.getElementById(
                "requirement-history-count"
            );


        /*
        Receive popup elements.
        */

        receiveForm =
            document.getElementById(
                "requirement-receive-form"
            );

        receiveRequirementIdInput =
            document.getElementById(
                "requirement-receive-id"
            );

        receiveDateInput =
            document.getElementById(
                "requirement-received-date"
            );

        receiveInvoiceInput =
            document.getElementById(
                "requirement-receive-invoice"
            );

        receiveItemsContainer =
            document.getElementById(
                "requirement-receive-items"
            );

        receiveTotalElement =
            document.getElementById(
                "requirement-receive-total"
            );

        receivePaymentStatusInput =
            document.getElementById(
                "requirement-receive-payment-status"
            );

        receivePaymentMethodInput =
            document.getElementById(
                "requirement-receive-payment-method"
            );

        receivePaymentDetails =
            document.getElementById(
                "requirement-receive-payment-details"
            );

        receivePaidInput =
            document.getElementById(
                "requirement-receive-paid"
            );

        receiveDueInput =
            document.getElementById(
                "requirement-receive-due"
            );

        receiveDueDateInput =
            document.getElementById(
                "requirement-receive-due-date"
            );

        receiveNotesInput =
            document.getElementById(
                "requirement-receive-notes"
            );

        receiveErrorElement =
            document.getElementById(
                "requirement-receive-error"
            );

        receiveSaveButton =
            document.getElementById(
                "requirement-receive-save"
            );


        /*
        Required page elements.
        */

        if (
            !messageElement ||
            !requirementDateInput ||
            !supplierInput ||
            !itemsContainer ||
            !historyTableBody ||
            !receiveForm
        ) {

            console.warn(
                "Requirement List: required HTML elements were not found."
            );

            return;

        }


        /*
        ================================================
        LOAD SAVED REQUIREMENTS
        ================================================
        */

        try {

            requirements =
                readArray(REQUIREMENTS_KEY);

        } catch (error) {

            console.error(error);

            showMessage(
                "Saved requirement lists could not be loaded.",
                "error"
            );

            requirements = [];

        }


        /*
        ================================================
        DEFAULT DATES
        ================================================
        */

        requirementDateInput.value =
            getLocalDate();

        receiveDateInput.value =
            getLocalDate();


        /*
        ================================================
        CREATE INITIAL ROW
        ================================================
        */

        itemsContainer.innerHTML = "";

        createRequirementItemRow();


        /*
        ================================================
        EVENT LISTENERS
        ================================================
        */

        addItemButton.addEventListener(
            "click",
            createRequirementItemRow
        );


        saveRequirementButton.addEventListener(
            "click",
            saveRequirementList
        );


        statusFilter.addEventListener(
            "change",
            renderRequirementHistory
        );


        /*
        Actions for saved requirement rows.
        */

        historyTableBody.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-requirement-action]"
                    );


                if (!button) {
                    return;
                }


                const action =
                    button.dataset.requirementAction;


                const requirementId =
                    button.dataset.requirementId;


                if (action === "receive") {

                    openReceivePopup(
                        requirementId
                    );

                    return;

                }


                if (action === "ordered") {

                    updateRequirementStatus(
                        requirementId,
                        "ordered"
                    );

                    return;

                }


                if (action === "cancelled") {

                    updateRequirementStatus(
                        requirementId,
                        "cancelled"
                    );

                }

            }
        );


        /*
        Receive form inputs recalculate the preview.
        */

        receiveItemsContainer.addEventListener(
            "input",
            event => {

                if (
                    event.target.matches(
                        ".requirement-actual-quantity, .requirement-actual-rate"
                    )
                ) {

                    updateReceiptCalculations();

                }

            }
        );


        receivePaymentStatusInput.addEventListener(
            "change",
            () => {

                if (
                    receivePaymentStatusInput.value ===
                    "partially-paid"
                ) {

                    receivePaidInput.value = "";

                } else if (
                    receivePaymentStatusInput.value ===
                    "due"
                ) {

                    receivePaidInput.value = "0";

                }


                updateReceiptCalculations();

            }
        );


        receivePaidInput.addEventListener(
            "input",
            updateReceiptCalculations
        );


        receiveForm.addEventListener(
            "submit",
            saveReceipt
        );


        /*
        ================================================
        FIRST RENDER
        ================================================
        */

        updateRequirementSummary();

        renderRequirementHistory();

    }


    /*
    ====================================================
    PUBLIC API
    ====================================================
    */

    window.POSRequirementList = {

        refresh: function () {

            try {

                requirements =
                    readArray(REQUIREMENTS_KEY);

                renderRequirementHistory();

            } catch (error) {

                console.error(error);

            }

        }

    };


    /*
    ====================================================
    PAGE INITIALIZER
    ====================================================
    */

    window.POSPageInitializers =
        window.POSPageInitializers || {};


    window.POSPageInitializers[
        "js/inventory/purchase/requirement-list.js"
    ] = initializeRequirementList;


})();
