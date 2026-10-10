/*
========================================================
SUPPLIER DUES & PAYMENTS
========================================================

Reads and updates:

    pos_inventory_purchase_history_v1
    pos_inventory_supplier_credits_v1

Recording a payment changes financial records only.
It never changes stock.

========================================================
*/

(function () {

    "use strict";


    const PURCHASE_KEY =
        "pos_inventory_purchase_history_v1";

    const CREDITS_KEY =
        "pos_inventory_supplier_credits_v1";


    let purchases = [];

    let tbody;
    let searchInput;
    let filterInput;
    let emptyState;
    let resultCount;
    let messageElement;

    let totalElement;
    let countElement;
    let overdueElement;
    let creditTotalElement;

    let paymentForm;
    let paymentPurchaseId;
    let paymentDescription;
    let paymentRemaining;
    let paymentAmount;
    let paymentAfter;
    let paymentDate;
    let paymentMethod;
    let paymentNote;
    let paymentError;


    function roundMoney(value) {

        return Math.round(
            (Number(value) + Number.EPSILON) * 100
        ) / 100;

    }


    function currency(value) {

        return "₹" + Number(value || 0).toLocaleString(
            "en-IN",
            {
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


    function localDate() {

        const date = new Date();

        return `${date.getFullYear()}-${String(
            date.getMonth() + 1
        ).padStart(2, "0")}-${String(
            date.getDate()
        ).padStart(2, "0")}`;

    }


    function displayDate(value) {

        if (!value) {
            return "Not set";
        }

        const date =
            /^\d{4}-\d{2}-\d{2}$/.test(value)
                ? new Date(`${value}T00:00:00`)
                : new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "Not set";
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

        messageElement.textContent = message;

        messageElement.dataset.status = type;

    }


    function totalOf(purchase) {

        const total = Number(purchase.total);

        if (Number.isFinite(total) && total >= 0) {
            return roundMoney(total);
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


    function paidOf(purchase) {

        const total = totalOf(purchase);

        if (
            purchase.paidAmount !== undefined &&
            purchase.paidAmount !== null &&
            purchase.paidAmount !== "" &&
            Number.isFinite(Number(purchase.paidAmount))
        ) {

            return roundMoney(
                Math.max(
                    0,
                    Math.min(total, Number(purchase.paidAmount))
                )
            );

        }

        if (purchase.paymentStatus === "paid") {
            return total;
        }

        if (
            purchase.dueAmount !== undefined &&
            Number.isFinite(Number(purchase.dueAmount))
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


    function creditAppliedOf(purchase) {

        return Math.max(
            0,
            Number(purchase.supplierCreditAmount) || 0
        );

    }


    function dueOf(purchase) {

        return roundMoney(
            Math.max(
                0,
                totalOf(purchase) -
                paidOf(purchase) -
                creditAppliedOf(purchase)
            )
        );

    }


    function overdue(purchase) {

        return (
            dueOf(purchase) > 0 &&
            Boolean(purchase.dueDate) &&
            purchase.dueDate < localDate()
        );

    }


    function readPurchases() {

        const saved =
            localStorage.getItem(PURCHASE_KEY);

        if (!saved) {
            return [];
        }

        const parsed = JSON.parse(saved);

        if (!Array.isArray(parsed)) {
            throw new Error("Purchase history has an invalid format.");
        }

        return parsed;

    }


    function readAvailableCredits() {

        const saved =
            localStorage.getItem(CREDITS_KEY);

        if (!saved) {
            return [];
        }

        const parsed = JSON.parse(saved);

        return Array.isArray(parsed)
            ? parsed
            : [];

    }


    function writePurchases(records) {

        localStorage.setItem(
            PURCHASE_KEY,
            JSON.stringify(records)
        );

    }


    function openPaymentPopup(purchaseId) {

        const purchase =
            purchases.find(
                item => String(item.id) === String(purchaseId)
            );


        if (!purchase) {
            setMessage("Purchase not found.", "error");
            return;
        }


        const remaining =
            dueOf(purchase);


        if (remaining <= 0) {
            setMessage("This purchase has no outstanding balance.");
            return;
        }


        paymentPurchaseId.value = purchase.id;

        paymentDescription.textContent =
            `${purchase.supplier || "Supplier"} · ${
                purchase.invoice || purchase.id
            }`;

        paymentRemaining.textContent =
            currency(remaining);

        paymentAmount.value = "";

        paymentAmount.max =
            remaining.toFixed(2);

        paymentDate.value =
            localDate();

        paymentMethod.value = "cash";

        paymentNote.value = "";

        paymentError.textContent = "";

        paymentAfter.textContent =
            currency(remaining);


        window.POSPopup.open(
            "supplier-payment-modal"
        );

    }


    function updatePaymentPreview() {

        const purchase =
            purchases.find(
                item => String(item.id) ===
                    String(paymentPurchaseId.value)
            );


        if (!purchase) {
            return;
        }


        const amount =
            Number(paymentAmount.value);

        const remaining =
            dueOf(purchase);


        if (
            paymentAmount.value.trim() === "" ||
            !Number.isFinite(amount)
        ) {

            paymentAfter.textContent =
                currency(remaining);

            return;

        }


        paymentAfter.textContent =
            currency(
                Math.max(
                    0,
                    roundMoney(remaining - amount)
                )
            );

    }


    function renderTable() {

        const query =
            searchInput.value.trim().toLowerCase();

        const filter =
            filterInput.value;


        const openPurchases =
            purchases.filter(
                purchase => dueOf(purchase) > 0
            );


        const filtered =
            openPurchases.filter(
                purchase => {

                    if (
                        filter === "overdue" &&
                        !overdue(purchase)
                    ) {
                        return false;
                    }

                    if (
                        filter === "due-soon" &&
                        overdue(purchase)
                    ) {
                        return false;
                    }


                    const text = [

                        purchase.supplier,
                        purchase.invoice,
                        purchase.id

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    return text.includes(query);

                }
            );


        tbody.innerHTML = "";


        if (filtered.length === 0) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        No matching outstanding purchases.
                    </td>
                </tr>
            `;

        } else {

            tbody.innerHTML =
                filtered.map(
                    purchase => {

                        const due =
                            dueOf(purchase);

                        const purchaseTotal =
                            totalOf(purchase);

                        const paid =
                            paidOf(purchase);

                        const dateIsOverdue =
                            overdue(purchase);


                        return `
                            <tr>

                                <td>
                                    ${escapeHTML(
                                        purchase.supplier || "—"
                                    )}
                                </td>

                                <td>
                                    <strong>
                                        ${escapeHTML(
                                            purchase.invoice ||
                                            purchase.id ||
                                            "—"
                                        )}
                                    </strong>

                                    <small class="supplier-dues-date">
                                        ${escapeHTML(
                                            displayDate(purchase.date)
                                        )}
                                    </small>
                                </td>

                                <td>
                                    ${currency(purchaseTotal)}
                                </td>

                                <td>
                                    ${currency(paid)}
                                </td>

                                <td>
                                    <strong class="supplier-dues-amount">
                                        ${currency(due)}
                                    </strong>
                                </td>

                                <td>
                                    <span class="${
                                        dateIsOverdue
                                            ? "supplier-dues-date-overdue"
                                            : ""
                                    }">
                                        ${escapeHTML(
                                            displayDate(purchase.dueDate)
                                        )}
                                    </span>
                                    ${
                                        dateIsOverdue
                                            ? `<small class="supplier-dues-overdue-label">Overdue</small>`
                                            : ""
                                    }
                                </td>

                                <td>
                                    <button
                                        type="button"
                                        class="supplier-dues-pay-btn"
                                        data-pay-purchase="${escapeHTML(
                                            purchase.id
                                        )}"
                                    >
                                        Record Payment
                                    </button>
                                </td>

                            </tr>
                        `;

                    }
                ).join("");

        }


        emptyState.hidden =
            filtered.length > 0;


        resultCount.textContent =
            `${filtered.length} outstanding ${
                filtered.length === 1
                    ? "purchase"
                    : "purchases"
            }`;

    }


    function renderSummary() {

        const openPurchases =
            purchases.filter(
                purchase => dueOf(purchase) > 0
            );


        const totalOutstanding =
            openPurchases.reduce(
                (sum, purchase) =>
                    sum + dueOf(purchase),
                0
            );


        const totalOverdue =
            openPurchases.reduce(
                (sum, purchase) =>
                    sum + (
                        overdue(purchase)
                            ? dueOf(purchase)
                            : 0
                    ),
                0
            );


        const credits =
            readAvailableCredits();


        const remainingCredits =
            credits.reduce(
                (sum, credit) =>
                    sum + Math.max(
                        0,
                        Number(credit.remainingAmount) || 0
                    ),
                0
            );


        totalElement.textContent =
            currency(totalOutstanding);

        countElement.textContent =
            openPurchases.length;

        overdueElement.textContent =
            currency(totalOverdue);

        creditTotalElement.textContent =
            currency(remainingCredits);

    }


    function renderEverything() {

        renderTable();

        renderSummary();

    }


    /*
    ====================================================
    RECORD SUPPLIER PAYMENT
    ====================================================
    */

    function recordPayment(event) {

        event.preventDefault();

        paymentError.textContent = "";


        let latest;

        try {

            latest = readPurchases();

        } catch (error) {

            paymentError.textContent =
                "Unable to read purchase records.";

            return;

        }


        const index =
            latest.findIndex(
                purchase =>
                    String(purchase.id) ===
                    String(paymentPurchaseId.value)
            );


        if (index < 0) {

            paymentError.textContent =
                "Purchase record was not found.";

            return;

        }


        const purchase = latest[index];

        const remaining = dueOf(purchase);

        const amount =
            Number(paymentAmount.value);


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            paymentError.textContent =
                "Enter a payment amount greater than ₹0.";

            return;

        }


        if (amount > remaining + 0.001) {

            paymentError.textContent =
                `Payment cannot exceed ${currency(remaining)}.`;

            return;

        }


        if (!paymentDate.value) {

            paymentError.textContent =
                "Choose the payment date.";

            return;

        }


        if (!paymentMethod.value) {

            paymentError.textContent =
                "Choose the payment method.";

            return;

        }


        const total = totalOf(purchase);

        const oldPaid = paidOf(purchase);

        const newPaid =
            roundMoney(
                Math.min(total, oldPaid + amount)
            );


        const payment = {

            id:
                `payment-${Date.now()}`,

            amount:
                roundMoney(amount),

            method:
                paymentMethod.value,

            date:
                paymentDate.value,

            note:
                paymentNote.value.trim(),

            createdAt:
                new Date().toISOString()

        };


        const paymentHistory =
            Array.isArray(purchase.paymentHistory)
                ? [...purchase.paymentHistory]
                : [];


        paymentHistory.push(payment);


        const updatedPurchase = {

            ...purchase,

            paidAmount:
                newPaid,

            dueAmount:
                roundMoney(
                    Math.max(
                        0,
                        total -
                        newPaid -
                        creditAppliedOf(purchase)
                    )
                ),

            paymentStatus:
                Math.max(
                    0,
                    total -
                    newPaid -
                    creditAppliedOf(purchase)
                ) <= 0
                    ? "paid"
                    : "partially-paid",

            paymentHistory:
                paymentHistory

        };


        latest[index] =
            updatedPurchase;


        /*
        Take a snapshot so a failed write can be reported.
        No inventory data is touched here.
        */

        let previousStorage;

        try {

            previousStorage =
                localStorage.getItem(PURCHASE_KEY);

            writePurchases(latest);

        } catch (error) {

            try {

                if (previousStorage === null) {
                    localStorage.removeItem(PURCHASE_KEY);
                } else {
                    localStorage.setItem(
                        PURCHASE_KEY,
                        previousStorage
                    );
                }

            } catch (rollbackError) {

                console.error(
                    "Payment storage rollback failed:",
                    rollbackError
                );

            }


            paymentError.textContent =
                "Payment could not be saved. Please check browser storage.";

            return;

        }


        purchases = latest;


        window.POSPopup.close(
            "supplier-payment-modal"
        );


        renderEverything();


        document.dispatchEvent(
            new CustomEvent(
                "posPurchasePaymentUpdated",
                {
                    detail: {
                        purchase: updatedPurchase,
                        payment: payment
                    }
                }
            )
        );


        setMessage(
            updatedPurchase.dueAmount <= 0
                ? "Payment recorded. This purchase is fully settled."
                : `Payment recorded. ${currency(updatedPurchase.dueAmount)} remains outstanding.`,
            "success"
        );

    }


    /*
    ====================================================
    INITIALIZE PAGE
    ====================================================
    */

    function initializeSupplierDues() {

        tbody =
            document.getElementById(
                "supplier-dues-tbody"
            );

        searchInput =
            document.getElementById(
                "supplier-dues-search"
            );

        filterInput =
            document.getElementById(
                "supplier-dues-filter"
            );

        emptyState =
            document.getElementById(
                "supplier-dues-empty"
            );

        resultCount =
            document.getElementById(
                "supplier-dues-result-count"
            );

        messageElement =
            document.getElementById(
                "supplier-dues-message"
            );

        totalElement =
            document.getElementById(
                "supplier-dues-total"
            );

        countElement =
            document.getElementById(
                "supplier-dues-count"
            );

        overdueElement =
            document.getElementById(
                "supplier-dues-overdue"
            );

        creditTotalElement =
            document.getElementById(
                "supplier-credit-total"
            );

        paymentForm =
            document.getElementById(
                "supplier-payment-form"
            );

        paymentPurchaseId =
            document.getElementById(
                "supplier-payment-purchase-id"
            );

        paymentDescription =
            document.getElementById(
                "supplier-payment-description"
            );

        paymentRemaining =
            document.getElementById(
                "supplier-payment-remaining"
            );

        paymentAmount =
            document.getElementById(
                "supplier-payment-amount"
            );

        paymentAfter =
            document.getElementById(
                "supplier-payment-after-remaining"
            );

        paymentDate =
            document.getElementById(
                "supplier-payment-date"
            );

        paymentMethod =
            document.getElementById(
                "supplier-payment-method"
            );

        paymentNote =
            document.getElementById(
                "supplier-payment-note"
            );

        paymentError =
            document.getElementById(
                "supplier-payment-error"
            );


        if (
            !tbody ||
            !searchInput ||
            !filterInput ||
            !paymentForm
        ) {

            console.warn(
                "Supplier Dues page: required HTML elements were not found."
            );

            return;

        }


        searchInput.addEventListener(
            "input",
            renderTable
        );

        filterInput.addEventListener(
            "change",
            renderTable
        );


        tbody.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-pay-purchase]"
                    );

                if (!button) {
                    return;
                }

                openPaymentPopup(
                    button.dataset.payPurchase
                );

            }
        );


        paymentAmount.addEventListener(
            "input",
            updatePaymentPreview
        );


        paymentForm.addEventListener(
            "submit",
            recordPayment
        );


        try {

            purchases =
                readPurchases();

            renderEverything();

        } catch (error) {

            console.error(error);

            setMessage(
                "Unable to read purchase history from browser storage.",
                "error"
            );

        }

    }


    window.POSPageInitializers =
        window.POSPageInitializers || {};


    window.POSPageInitializers[
        "js/inventory/purchase/dues.js"
    ] = initializeSupplierDues;


})();
