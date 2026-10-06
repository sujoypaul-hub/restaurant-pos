
/* Billing */

.billing-layout {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 20px;
}

/* Categories */

.categories {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.category {
    padding: 10px 18px;
    border: none;
    border-radius: 20px;
    background: white;
    cursor: pointer;
}

.category.active {
    background: #222;
    color: white;
}

/* Products */

.products-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
}

.product-card {

    background:
        var(--surface);

    color:
        var(--text);

    border:
        1px solid var(--border);

}

.product-image {
    font-size: 45px;
    text-align: center;
    padding: 15px;
}

.product-card h3 {
    font-size: 15px;
    margin-bottom: 8px;
}

.product-card p {
    font-weight: bold;
    margin-bottom: 12px;
}

.add-btn {
    width: 100%;
    padding: 9px;
    border: none;
    border-radius: 6px;
    background: #222;
    color: white;
    cursor: pointer;
}

/* Cart */


.cart-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
}

.cart-header span {
    color: #777;
}

/* Customer */

.customer-section {
    margin-bottom: 20px;
}

.customer-section label {
    display: block;
    margin-bottom: 7px;
    font-size: 14px;
}

.customer-section input {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    margin-bottom: 8px;
}

.no-phone-btn {
    width: 100%;
    padding: 10px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 6px;
    cursor: pointer;
}

/* Cart */

.cart-items {
    min-height: 180px;
    border-top: 1px solid #eee;
    border-bottom: 1px solid #eee;
    padding: 20px 0;
}

.empty-cart {
    text-align: center;
    color: #999;
    padding-top: 60px;
}

.cart-summary {
    padding: 20px 0;
}

.cart-summary div {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
}

.cart-summary .total {
    font-size: 20px;
    padding-top: 10px;
    border-top: 1px solid #eee;
}

.payment-btn {
    width: 100%;
    padding: 15px;
    border: none;
    border-radius: 8px;
    background: #222;
    color: white;
    font-size: 16px;
    cursor: pointer;
}
