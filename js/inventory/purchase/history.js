/*
========================================================
INVENTORY - PURCHASE HISTORY
========================================================

Features:

- Read saved purchase records.
- Search purchases.
- Filter by payment status.
- Show supplier payables.
- View purchase and payment details.
- Record future supplier payments.
- Update remaining balances.
- Preserve inventory stock when recording payments.

Storage key must match new.js:

    pos_inventory_purchase_history_v1

Recording a supplier payment does NOT increase or
decrease inventory stock.

========================================================
*/

(function () {

    "use strict";


    /*
    ====================================================
    STORAGE
    ====================================================
    */

    const PURCHASE_HISTORY_KEY =
        "pos_inventory_purchase_history_v1";


    /*
    ====================================================
    DOM REFERENCES
    ====================================================
    */

    let tableBody;
    let searchInput;
    let statusFilter;
    let emptyState;
    let resultCount;
    let messageElement;

    let outstandingElement;
    let unpaidCountElement;
    let overdueElement;

    let purchaseCountElement;
    let purchaseValueElement;
    let totalPaidElement;

    let detailsContent;

    let paymentForm;
    let paymentPurchaseIdInput;
    let paymentDescription;
    let paymentRemainingElement;
    let paymentAmountInput;
    let paymentAfterRemainingElement;
    let paymentDateInput;
    let paymentMethodInput;
    let paymentNoteInput;
    let paymentErrorElement;

    let purchaseRecords = [];


    /*
    ====================================================
    BASIC HELPERS
    ====================================================
    */

    function roundMoney(value) {

        return Math.round(
            (Number(value) + Number.EPSILON) * 100
        ) / 100;

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


    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    function getLocalDate() {

        const now = new Date();

        const year =
            now.getFullYear();

        const month =
            String(now.getMonth() + 1)
                .padStart(2, "0");

        const day =
            String(now.getDate())
                .padStart(2, "0");

        return `${year}-${month}-${day}`;

    }


    function formatDate(dateValue) {

        if (!dateValue) {
            return "—";
        }

        /*
        Date-only strings are parsed at local midnight
        to avoid displaying the previous calendar day.
        */

        const date =
            /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
                ? new Date(`${dateValue}T00:00:00`)
                : new Date(dateValue);

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


    function setMessage(message, type = "info") {

        if (!messageElement) {
            return;
        }

        messageElement.textContent =
            message;

        messageElement.dataset.status =
            type;

    }


    /*
    ====================================================
    PURCHASE PAYMENT HELPERS
    ====================================================
    */

    function getPurchaseTotal(purchase) {

        const total =
            Number(purchase.total);

        if (
            Number.isFinite(total) &&
            total >= 0
        ) {
            return roundMoney(total);
        }

        const items =
            Array.isArray(purchase.items)
                ? purchase.items
                : [];

        return roundMoney(
            items.reduce(
                (sum, item) =>
                    sum + (
                        Number(item.total) || 0
                    ),
                0
            )
        );

    }


    function getPaidAmount(purchase) {

        const total =
            getPurchaseTotal(purchase);

        /*
        Use the explicit paid amount from newer records.
        */

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


        /*
        Compatibility with older purchase records.
        */

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


    function getDueAmount(purchase) {

        const total =
            getPurchaseTotal(purchase);

        const paid =
            getPaidAmount(purchase);


        /*
        Calculate due from the total and paid amount.
        This avoids stale balances after payments.
        */

        return roundMoney(
            Math.max(
                0,
                total - paid
            )
        );

    }


    function getPaymentStatus(purchase) {

        const paid =
            getPaidAmount(purchase);

        const due =
            getDueAmount(purchase);


        if (due <= 0) {
            return "paid";
        }

        if (paid > 0) {
            return "partially-paid";
        }

        return "due";

    }


    function getPaymentStatusLabel(status) {

        const labels = {
            paid: "Paid",
            "partially-paid": "Partially Paid",
            due: "Due"
        };

        return labels[status] || "Unknown";

    }


    function isOverdue(purchase) {

        const due =
            getDueAmount(purchase);

        const dueDate =
            purchase.dueDate;


        return (
            due > 0 &&
            Boolean(dueDate) &&
            dueDate < getLocalDate()
        );

    }


    /*
    ====================================================
    READ PURCHASE HISTORY
    ====================================================
    */

    function readPurchaseHistory() {

        const stored =
            localStorage.getItem(
                PURCHASE_HISTORY_KEY
            );


        if (!stored) {
            return [];
        }


        const parsed =
            JSON.parse(stored);


        if (!Array.isArray(parsed)) {

            throw new Error(
                "Saved purchase history has an invalid format."
            );

        }


        return parsed;

    }


    /*
    ====================================================
    SAVE PURCHASE HISTORY
    ====================================================
    */

    function persistPurchaseHistory(records) {

        try {

            localStorage.setItem(
                PURCHASE_HISTORY_KEY,
                JSON.stringify(records)
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
    LOAD AND REFRESH
    ====================================================
    */

    function refreshPurchaseHistory() {

        try {

            purchaseRecords =
                readPurchaseHistory();

            renderEverything();

        } catch (error) {

            console.error(
                "Unable to load purchase history:",
                error
            );

            purchaseRecords = [];

            renderEverything();

            setMessage(
                "Purchase history could not be read from browser storage.",
                "error"
            );

        }

    }


    /*
    ====================================================
    FILTER PURCHASES
    ====================================================
    */

    function getFilteredPurchases() {

        const query =
            (searchInput?.value || "")
                .trim()
                .toLowerCase();

        const status =
            statusFilter?.value || "all";


        return purchaseRecords.filter(
            purchase => {

                const paymentStatus =
                    getPaymentStatus(purchase);


                if (
                    status !== "all" &&
                    paymentStatus !== status
                ) {

                    return false;

                }


                const items =
                    Array.isArray(purchase.items)
                        ? purchase.items
                        : [];


                const searchableText = [

                    purchase.id,

                    purchase.supplier,

                    purchase.invoice,

                    purchase.notes,

                    ...items.map(
                        item => item.itemName
                    )

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                return searchableText.includes(
                    query
                );

            }
        );

    }


    /*
    ====================================================
    RENDER PURCHASE TABLE
    ====================================================
    */

    function renderPurchaseTable() {

        if (!tableBody) {
            return;
        }


        const filtered =
            getFilteredPurchases();


        emptyState.hidden =
            filtered.length !== 0;


        tableBody.innerHTML = "";


        if (
            filtered.length === 0
        ) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="8">
                        No matching purchases.
                    </td>
                </tr>
            `;

        } else {

            tableBody.innerHTML =
                filtered.map(
                    purchase => {

                        const items =
                            Array.isArray(purchase.items)
                                ? purchase.items
                                : [];


                        const total =
                            getPurchaseTotal(purchase);


                        const due =
                            getDueAmount(purchase);


                        const status =
                            getPaymentStatus(purchase);


                        const itemCount =
                            items.length;


                        const purchaseId =
                            String(
                                purchase.id || ""
                            );


                        const purchaseReference =
                            purchase.invoice ||
                            purchaseId ||
                            "Purchase";


                        const overdueLabel =
                            isOverdue(purchase)
                                ? `<small class="purchase-overdue-label">Overdue</small>`
                                : "";


                        const paymentAction =
                            due > 0
                                ? `
                                    <button
                                        class="purchase-history-action purchase-history-pay-btn"
                                        type="button"
                                        data-record-payment="${escapeHTML(purchaseId)}"
                                    >
                                        Pay Due
                                    </button>
                                `
                                : "";


                        return `
                            <tr>

                                <td>
                                    ${escapeHTML(
                                        formatDate(purchase.date)
                                    )}
                                </td>


                                <td>
                                    <strong class="purchase-reference">
                                        ${escapeHTML(
                                            purchaseReference
                                        )}
                                    </strong>
                                </td>


                                <td>
                                    ${escapeHTML(
                                        purchase.supplier || "—"
                                    )}
                                </td>


                                <td>
                                    ${itemCount}
                                    ${itemCount === 1 ? "item" : "items"}
                                </td>


                                <td>
                                    <strong>
                                        ${formatCurrency(total)}
                                    </strong>
                                </td>


                                <td>
                                    <span class="purchase-history-status status-${status}">
                                        ${getPaymentStatusLabel(status)}
                                    </span>
                                </td>


                                <td>
                                    <span class="${due > 0 ? "purchase-history-due" : ""}">
                                        ${formatCurrency(due)}
                                    </span>
                                    ${overdueLabel}
                                </td>


                                <td>
                                    <div class="purchase-history-actions">

                                        <button
                                            class="purchase-history-action"
                                            type="button"
                                            data-view-purchase="${escapeHTML(purchaseId)}"
                                        >
                                            View
                                        </button>

                                        ${paymentAction}

                                    </div>
                                </td>

                            </tr>
                        `;

                    }
                ).join("");

        }


        if (resultCount) {

            resultCount.textContent =
                `${filtered.length} ${
                    filtered.length === 1
                        ? "purchase"
                        : "purchases"
                }`;

        }

    }


    /*
    ====================================================
    RENDER SIDEBAR SUMMARY
    ====================================================
    */

    function renderPayablesSummary() {

        const totalPurchaseValue =
            purchaseRecords.reduce(
                (sum, purchase) =>
                    sum + getPurchaseTotal(purchase),
                0
            );


        const totalPaid =
            purchaseRecords.reduce(
                (sum, purchase) =>
                    sum + getPaidAmount(purchase),
                0
            );


        const totalOutstanding =
            purchaseRecords.reduce(
                (sum, purchase) =>
                    sum + getDueAmount(purchase),
                0
            );


        const overdueAmount =
            purchaseRecords.reduce(
                (sum, purchase) => {

                    return isOverdue(purchase)
                        ? sum + getDueAmount(purchase)
                        : sum;

                },
                0
            );


        const unpaidPurchases =
            purchaseRecords.filter(
                purchase =>
                    getDueAmount(purchase) > 0
            ).length;


        outstandingElement.textContent =
            formatCurrency(totalOutstanding);


        unpaidCountElement.textContent =
            unpaidPurchases;


        overdueElement.textContent =
            formatCurrency(overdueAmount);


        purchaseCountElement.textContent =
            purchaseRecords.length;


        purchaseValueElement.textContent =
            formatCurrency(totalPurchaseValue);


        totalPaidElement.textContent =
            formatCurrency(totalPaid);

    }


    /*
    ====================================================
    RENDER EVERYTHING
    ====================================================
    */

    function renderEverything() {

        renderPurchaseTable();

        renderPayablesSummary();

    }


    /*
    ====================================================
    FIND PURCHASE
    ====================================================
    */

    function findPurchase(purchaseId) {

        return purchaseRecords.find(
            purchase =>
                String(purchase.id) ===
                String(purchaseId)
        );

    }


    /*
    ====================================================
    OPEN UNIVERSAL POPUP
    ====================================================
    */

    function openPopup(popupId) {

        if (window.POSPopup) {

            window.POSPopup.open(
                popupId
            );

            return;

        }


        /*
        Fallback if the universal popup controller
        is temporarily unavailable.
        */

        const popup =
            document.getElementById(
                popupId
            );


        if (popup) {

            popup.classList.add("active");

            popup.setAttribute(
                "aria-hidden",
                "false"
            );

        }

    }


    function closePopup(popupId) {

        if (window.POSPopup) {

            window.POSPopup.close(
                popupId
            );

            return;

        }


        const popup =
            document.getElementById(
                popupId
            );


        if (popup) {

            popup.classList.remove("active");

            popup.setAttribute(
                "aria-hidden",
                "true"
            );

        }

    }


    /*
    ====================================================
    VIEW PURCHASE DETAILS
    ====================================================
    */

    function openPurchaseDetails(purchaseId) {

        const purchase =
            findPurchase(purchaseId);


        if (!purchase) {

            setMessage(
                "Purchase record could not be found.",
                "error"
            );

            return;

        }


        const items =
            Array.isArray(purchase.items)
                ? purchase.items
                : [];


        const total =
            getPurchaseTotal(purchase);


        const paid =
            getPaidAmount(purchase);


        const due =
            getDueAmount(purchase);


        const status =
            getPaymentStatus(purchase);


        const payments =
            Array.isArray(purchase.paymentHistory)
                ? purchase.paymentHistory
                : [];


        const itemRows =
            items.map(
                item => {

                    return `
                        <tr>

                            <td>
                                ${escapeHTML(
                                    item.itemName || "Item"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    item.quantity ?? 0
                                )}
                                ${escapeHTML(
                                    item.unit || ""
                                )}
                            </td>

                            <td>
                                ${formatCurrency(
                                    Number(item.rate) || 0
                                )}
                            </td>

                            <td>
                                ${formatCurrency(
                                    Number(item.total) || 0
                                )}
                            </td>

                        </tr>
                    `;

                }
            ).join("");


        const paymentRows =
            payments.length > 0
                ? payments.map(
                    payment => {

                        return `
                            <div class="purchase-payment-history-item">

                                <div>

                                    <strong>
                                        ${formatCurrency(
                                            payment.amount
                                        )}
                                    </strong>

                                    <small>
                                        ${escapeHTML(
                                            formatDate(payment.date)
                                        )}
                                    </small>

                                </div>

                                <span>
                                    ${escapeHTML(
                                        String(
                                            payment.method || "—"
                                        ).replace("-", " ").toUpperCase()
                                    )}
                                </span>

                            </div>
                        `;

                    }
                ).join("")
                : `
                    <p class="purchase-no-payments">
                        No payment transactions recorded.
                    </p>
                `;


        detailsContent.innerHTML = `

            <div class="purchase-detail-meta">

                <div>
                    <span>Purchase Reference</span>
                    <strong>
                        ${escapeHTML(
                            purchase.invoice ||
                            purchase.id ||
                            "—"
                        )}
                    </strong>
                </div>

                <div>
                    <span>Purchase Date</span>
                    <strong>
                        ${escapeHTML(
                            formatDate(purchase.date)
                        )}
                    </strong>
                </div>

                <div>
                    <span>Supplier</span>
                    <strong>
                        ${escapeHTML(
                            purchase.supplier || "—"
                        )}
                    </strong>
                </div>

                <div>
                    <span>Payment Status</span>
                    <strong>
                        ${getPaymentStatusLabel(status)}
                    </strong>
                </div>

            </div>


            <h4 class="purchase-detail-section-title">
                Purchased Items
            </h4>

            <div class="purchase-detail-table-wrap">

                <table class="purchase-detail-table">

                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Rate</th>
                            <th>Total</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${
                            itemRows ||
                            `<tr><td colspan="4">No item details available.</td></tr>`
                        }
                    </tbody>

                </table>

            </div>


            <div class="purchase-detail-money">

                <div>
                    <span>Purchase Total</span>
                    <strong>${formatCurrency(total)}</strong>
                </div>

                <div>
                    <span>Total Paid</span>
                    <strong>${formatCurrency(paid)}</strong>
                </div>

                <div>
                    <span>Remaining Due</span>
                    <strong>${formatCurrency(due)}</strong>
                </div>

                ${
                    due > 0
                        ? `
                            <div>
                                <span>Due Date</span>
                                <strong>
                                    ${escapeHTML(
                                        formatDate(purchase.dueDate)
                                    )}
                                </strong>
                            </div>
                        `
                        : ""
                }

            </div>


            <h4 class="purchase-detail-section-title">
                Payment History
            </h4>

            <div class="purchase-payment-history-list">
                ${paymentRows}
            </div>


            ${
                due > 0
                    ? `
                        <button
                            type="button"
                            class="purchase-detail-record-payment"
                            data-record-payment="${escapeHTML(
                                String(purchase.id || "")
                            )}"
                        >
                            Record Payment — ${formatCurrency(due)}
                        </button>
                    `
                    : ""
            }


            ${
                purchase.notes
                    ? `
                        <div class="purchase-detail-notes">
                            <strong>Notes</strong>
                            <p>
                                ${escapeHTML(
                                    purchase.notes
                                )}
                            </p>
                        </div>
                    `
                    : ""
            }

        `;


        openPopup(
            "purchase-details-modal"
        );

    }


    /*
    ====================================================
    OPEN RECORD PAYMENT POPUP
    ====================================================
    */

    function openRecordPayment(purchaseId) {

        const purchase =
            findPurchase(purchaseId);


        if (!purchase) {

            setMessage(
                "Purchase record could not be found.",
                "error"
            );

            return;

        }


        const due =
            getDueAmount(purchase);


        if (due <= 0) {

            setMessage(
                "This purchase is already fully paid.",
                "info"
            );

            return;

        }


        /*
        Set modal values.
        */

        paymentPurchaseIdInput.value =
            purchase.id;


        paymentDescription.textContent =
            `${purchase.supplier || "Supplier"} · ${
                purchase.invoice || purchase.id
            }`;


        paymentRemainingElement.textContent =
            formatCurrency(due);


        paymentAmountInput.value = "";

        paymentAmountInput.min =
            "0.01";

        paymentAmountInput.max =
            due.toFixed(2);


        paymentDateInput.value =
            getLocalDate();


        paymentMethodInput.value =
            "cash";


        paymentNoteInput.value = "";


        paymentErrorElement.textContent =
            "";


        paymentAfterRemainingElement.textContent =
            formatCurrency(due);


        openPopup(
            "supplier-payment-modal"
        );

    }


    /*
    ====================================================
    UPDATE REMAINING DUE PREVIEW
    ====================================================
    */

    function updatePaymentPreview() {

        const purchase =
            findPurchase(
                paymentPurchaseIdInput.value
            );


        if (!purchase) {
            return;
        }


        const due =
            getDueAmount(purchase);


        const amount =
            Number(
                paymentAmountInput.value
            );


        if (
            paymentAmountInput.value.trim() === "" ||
            !Number.isFinite(amount)
        ) {

            paymentAfterRemainingElement.textContent =
                formatCurrency(due);

            return;

        }


        const remaining =
            Math.max(
                0,
                roundMoney(due - amount)
            );


        paymentAfterRemainingElement.textContent =
            formatCurrency(remaining);

    }


    /*
    ====================================================
    RECORD SUPPLIER PAYMENT
    ====================================================

    Updating a payment changes financial records only.
    It must NEVER update inventory stock.

    ====================================================
    */

    function recordSupplierPayment(event) {

        event.preventDefault();


        paymentErrorElement.textContent =
            "";


        /*
        Reload saved history before modifying it.
        */

        let latestRecords;


        try {

            latestRecords =
                readPurchaseHistory();

        } catch (error) {

            paymentErrorElement.textContent =
                error.message;

            return;

        }


        const purchaseId =
            paymentPurchaseIdInput.value;


        const purchaseIndex =
            latestRecords.findIndex(
                purchase =>
                    String(purchase.id) ===
                    String(purchaseId)
            );


        if (purchaseIndex === -1) {

            paymentErrorElement.textContent =
                "Purchase record could not be found.";

            return;

        }


        const purchase =
            latestRecords[purchaseIndex];


        const existingDue =
            getDueAmount(purchase);


        const amount =
            Number(
                paymentAmountInput.value
            );


        /*
        ================================================
        VALIDATION
        ================================================
        */

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            paymentErrorElement.textContent =
                "Enter a payment amount greater than ₹0.";

            return;

        }


        if (
            amount > existingDue + 0.001
        ) {

            paymentErrorElement.textContent =
                `Payment cannot exceed the remaining due of ${formatCurrency(existingDue)}.`;

            return;

        }


        if (!paymentDateInput.value) {

            paymentErrorElement.textContent =
                "Select the payment date.";

            return;

        }


        if (!paymentMethodInput.value) {

            paymentErrorElement.textContent =
                "Select the payment method.";

            return;

        }


        /*
        ================================================
        CALCULATE NEW BALANCE
        ================================================
        */

        const oldPaid =
            getPaidAmount(purchase);


        const total =
            getPurchaseTotal(purchase);


        const newPaid =
            roundMoney(
                Math.min(
                    total,
                    oldPaid + amount
                )
            );


        const newDue =
            roundMoney(
                Math.max(
                    0,
                    total - newPaid
                )
            );


        /*
        ================================================
        ADD PAYMENT TRANSACTION
        ================================================
        */

        const payment = {

            id:
                `payment-${Date.now()}`,

            amount:
                roundMoney(amount),

            method:
                paymentMethodInput.value,

            date:
                paymentDateInput.value,

            note:
                paymentNoteInput.value.trim(),

            createdAt:
                new Date().toISOString()

        };


        const updatedPurchase = {

            ...purchase,

            total:
                total,

            paidAmount:
                newPaid,

            dueAmount:
                newDue,

            paymentStatus:
                newDue <= 0
                    ? "paid"
                    : "partially-paid",

            paymentHistory: [

                ...(
                    Array.isArray(
                        purchase.paymentHistory
                    )
                        ? purchase.paymentHistory
                        : []
                ),

                payment

            ]

        };


        /*
        Keep the original due date as a record even
        after full settlement.
        */

        latestRecords[purchaseIndex] =
            updatedPurchase;


        /*
        ================================================
        SAVE
        ================================================
        */

        const saved =
            persistPurchaseHistory(
                latestRecords
            );


        if (!saved) {

            paymentErrorElement.textContent =
                "Unable to save the payment. Please check browser storage and try again.";

            return;

        }


        /*
        ================================================
        REFRESH UI
        ================================================
        */

        purchaseRecords =
            latestRecords;


        closePopup(
            "supplier-payment-modal"
        );


        renderEverything();


        /*
        ================================================
        NOTIFY APPLICATION
        ================================================
        */

        document.dispatchEvent(
            new CustomEvent(
                "posPurchasePaymentUpdated",
                {
                    detail: {
                        purchase:
                            updatedPurchase,

                        payment:
                            payment
                    }
                }
            )
        );


        /*
        ================================================
        SUCCESS MESSAGE
        ================================================
        */

        if (newDue <= 0) {

            setMessage(
                `Payment completed. ${updatedPurchase.supplier || "Supplier"} has been fully paid for this purchase.`,
                "success"
            );

        } else {

            setMessage(
                `Payment recorded. ${formatCurrency(newDue)} remains due to ${updatedPurchase.supplier || "supplier"}.`,
                "success"
            );

        }

    }


    /*
    ====================================================
    INITIALIZE THE PAGE
    ====================================================
    */

    function initializePurchaseHistoryPage() {

        /*
        Main page elements.
        */

        tableBody =
            document.getElementById(
                "purchase-history-tbody"
            );

        searchInput =
            document.getElementById(
                "purchase-history-search"
            );

        statusFilter =
            document.getElementById(
                "purchase-history-status-filter"
            );

        emptyState =
            document.getElementById(
                "purchase-history-empty"
            );

        resultCount =
            document.getElementById(
                "purchase-history-result-count"
            );

        messageElement =
            document.getElementById(
                "purchase-history-message"
            );


        /*
        Sidebar elements.
        */

        outstandingElement =
            document.getElementById(
                "purchase-total-outstanding"
            );

        unpaidCountElement =
            document.getElementById(
                "purchase-unpaid-count"
            );

        overdueElement =
            document.getElementById(
                "purchase-overdue-amount"
            );

        purchaseCountElement =
            document.getElementById(
                "purchase-history-count"
            );

        purchaseValueElement =
            document.getElementById(
                "purchase-history-value"
            );

        totalPaidElement =
            document.getElementById(
                "purchase-history-paid"
            );


        /*
        Details popup.
        */

        detailsContent =
            document.getElementById(
                "purchase-detail-content"
            );


        /*
        Payment popup.
        */

        paymentForm =
            document.getElementById(
                "supplier-payment-form"
            );

        paymentPurchaseIdInput =
            document.getElementById(
                "supplier-payment-purchase-id"
            );

        paymentDescription =
            document.getElementById(
                "supplier-payment-description"
            );

        paymentRemainingElement =
            document.getElementById(
                "supplier-payment-remaining"
            );

        paymentAmountInput =
            document.getElementById(
                "supplier-payment-amount"
            );

        paymentAfterRemainingElement =
            document.getElementById(
                "supplier-payment-after-remaining"
            );

        paymentDateInput =
            document.getElementById(
                "supplier-payment-date"
            );

        paymentMethodInput =
            document.getElementById(
                "supplier-payment-method"
            );

        paymentNoteInput =
            document.getElementById(
                "supplier-payment-note"
            );

        paymentErrorElement =
            document.getElementById(
                "supplier-payment-error"
            );


        /*
        Required elements.
        */

        if (
            !tableBody ||
            !searchInput ||
            !statusFilter ||
            !emptyState ||
            !messageElement ||
            !paymentForm
        ) {

            console.warn(
                "Purchase History: required HTML elements were not found."
            );

            return;

        }


        /*
        Search.
        */

        searchInput.addEventListener(
            "input",
            renderPurchaseTable
        );


        /*
        Status filter.
        */

        statusFilter.addEventListener(
            "change",
            renderPurchaseTable
        );


        /*
        Table actions use event delegation so
        re-rendering rows does not lose the handler.
        */

        tableBody.addEventListener(
            "click",
            event => {

                const viewButton =
                    event.target.closest(
                        "[data-view-purchase]"
                    );


                const paymentButton =
                    event.target.closest(
                        "[data-record-payment]"
                    );


                if (viewButton) {

                    openPurchaseDetails(
                        viewButton.dataset.viewPurchase
                    );

                    return;

                }


                if (paymentButton) {

                    openRecordPayment(
                        paymentButton.dataset.recordPayment
                    );

                }

            }
        );


        /*
        Details popup may also contain a Record Payment
        button. This handles that button using delegation.
        */

        detailsContent?.addEventListener(
            "click",
            event => {

                const paymentButton =
                    event.target.closest(
                        "[data-record-payment]"
                    );


                if (!paymentButton) {
                    return;
                }


                const purchaseId =
                    paymentButton.dataset.recordPayment;


                closePopup(
                    "purchase-details-modal"
                );


                openRecordPayment(
                    purchaseId
                );

            }
        );


        /*
        Payment amount live preview.
        */

        paymentAmountInput?.addEventListener(
            "input",
            updatePaymentPreview
        );


        /*
        Record payment form.
        */

        paymentForm.addEventListener(
            "submit",
            recordSupplierPayment
        );


        /*
        Load purchases and populate the UI.
        */

        refreshPurchaseHistory();

    }


    /*
    ====================================================
    PAGE INITIALIZER
    ====================================================
    */

    window.POSPageInitializers =
        window.POSPageInitializers || {};


    window.POSPageInitializers[
        "js/inventory/purchase/history.js"
    ] =
        initializePurchaseHistoryPage;


})();
