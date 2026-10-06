/*
==================================================
DELIVERY ADDRESS SYSTEM
==================================================

Handles:

- Delivery address selection
- Previously used addresses
- New address creation
- Address persistence using localStorage
- Customer-phone based address history
- Delivery-only visibility
- Universal popup integration

IMPORTANT:

This system does NOT create or declare its own
customer phone input.

It always reads the existing Billing field:

    #customer-phone

Later, localStorage can be replaced by the
customer database without changing the Billing UI.

==================================================
*/


let selectedDeliveryAddress = null;

let addressButton = null;
let addressSelection = null;
let addressList = null;

let addressSelectorView = null;
let newAddressView = null;

let addNewAddressButton = null;
let addressBackButton = null;
let newAddressForm = null;

let addressLabelInput = null;
let addressFullInput = null;
let addressLandmarkInput = null;
let addressCityInput = null;
let addressStateInput = null;
let addressPincodeInput = null;
let addressFormError = null;


/*
==================================================
STORAGE KEY
==================================================
*/

function getAddressStorageKey(phone) {

    return `pos_customer_addresses_${phone}`;

}


/*
==================================================
GET CURRENT CUSTOMER PHONE
==================================================

Reads the existing Billing phone field.

No separate phone input or global phone
variable is used here.

==================================================
*/

function getCurrentPhone() {

    const customerPhoneField =
        document.getElementById(
            "customer-phone"
        );


    if (!customerPhoneField) {

        return "";

    }


    return customerPhoneField.value
        .replace(/\D/g, "")
        .trim();

}


/*
==================================================
GET SAVED ADDRESSES
==================================================
*/

function getSavedAddresses() {

    const phone =
        getCurrentPhone();


    if (
        phone.length !== 10
    ) {

        return [];

    }


    try {

        const saved =
            localStorage.getItem(
                getAddressStorageKey(
                    phone
                )
            );


        if (!saved) {

            return [];

        }


        const addresses =
            JSON.parse(
                saved
            );


        if (
            !Array.isArray(addresses)
        ) {

            return [];

        }


        return addresses;

    } catch (error) {

        console.error(
            "Unable to read saved addresses:",
            error
        );

        return [];

    }

}


/*
==================================================
SAVE ADDRESSES
==================================================
*/

function saveAddresses(
    addresses
) {

    const phone =
        getCurrentPhone();


    if (
        phone.length !== 10
    ) {

        return false;

    }


    try {

        localStorage.setItem(
            getAddressStorageKey(
                phone
            ),
            JSON.stringify(
                addresses
            )
        );


        return true;

    } catch (error) {

        console.error(
            "Unable to save addresses:",
            error
        );

        return false;

    }

}


/*
==================================================
ESCAPE HTML
==================================================
*/

function escapeHTML(
    value
) {

    return String(
        value || ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/*
==================================================
FORMAT ADDRESS
==================================================
*/

function formatAddress(
    address
) {

    const parts = [

        address.addressLine,

        address.landmark
            ? `Landmark: ${address.landmark}`
            : "",

        address.city,

        address.state,

        address.pincode

    ];


    return parts
        .filter(Boolean)
        .join(", ");

}


/*
==================================================
SHORT ADDRESS
==================================================
*/

function getShortAddress(
    address
) {

    const fullAddress =
        formatAddress(
            address
        );


    if (
        fullAddress.length <= 55
    ) {

        return fullAddress;

    }


    return (
        fullAddress.substring(
            0,
            55
        ) + "..."
    );

}


/*
==================================================
RENDER SAVED ADDRESSES
==================================================
*/

function renderAddressList() {

    if (!addressList) {

        return;

    }


    const addresses =
        getSavedAddresses();


    if (
        addresses.length === 0
    ) {

        addressList.innerHTML = `
            <div class="address-empty-state">

                <div class="address-empty-icon">
                    📍
                </div>

                <strong>
                    No saved addresses
                </strong>

                <p>
                    Add a new delivery address
                    for this customer.
                </p>

            </div>
        `;

        return;

    }


    addressList.innerHTML =
        addresses
            .map(
                (
                    address,
                    index
                ) => {

                    return `
                        <button
                            class="address-option"
                            type="button"
                            data-address-index="${index}"
                        >

                            <span
                                class="address-option-icon"
                            >
                                📍
                            </span>


                            <span
                                class="address-option-content"
                            >

                                <strong>
                                    ${escapeHTML(
                                        address.label
                                    )}
                                </strong>

                                <small>
                                    ${escapeHTML(
                                        getShortAddress(
                                            address
                                        )
                                    )}
                                </small>

                            </span>


                            <span
                                class="address-option-arrow"
                            >
                                →
                            </span>

                        </button>
                    `;

                }
            )
            .join("");


    addressList
        .querySelectorAll(
            "[data-address-index]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                button
                                    .dataset
                                    .addressIndex
                            );


                        const addresses =
                            getSavedAddresses();


                        if (
                            addresses[index]
                        ) {

                            selectDeliveryAddress(
                                addresses[index]
                            );

                        }

                    }
                );

            }
        );

}


/*
==================================================
SELECT ADDRESS
==================================================
*/

function selectDeliveryAddress(
    address
) {

    selectedDeliveryAddress = {
        ...address
    };


    updateDeliveryAddressButton();


    document.dispatchEvent(
        new CustomEvent(
            "posDeliveryAddressChanged",
            {
                detail: {
                    address:
                        selectedDeliveryAddress
                }
            }
        )
    );


    if (
        window.POSPopup
    ) {

        window.POSPopup.close(
            "address-modal"
        );

    }

}


/*
==================================================
UPDATE CART BUTTON
==================================================
*/

function updateDeliveryAddressButton() {

    if (!addressButton) {

        return;

    }


    const phone =
        getCurrentPhone();


    /*
    Delivery address requires
    a valid 10-digit phone number.
    */

    addressButton.disabled =
        phone.length !== 10;


    /*
    Selected address exists.
    */

    if (
        selectedDeliveryAddress
    ) {

        addressButton.innerHTML = `

            <span
                class="delivery-address-button-text"
            >

                <strong>
                    ${escapeHTML(
                        selectedDeliveryAddress.label
                    )}
                </strong>

                <small>
                    ${escapeHTML(
                        getShortAddress(
                            selectedDeliveryAddress
                        )
                    )}
                </small>

            </span>

            <span>
                →
            </span>

        `;

        return;

    }


    /*
    No address selected yet.
    */

    addressButton.innerHTML = `

        <span
            class="delivery-address-button-text"
        >

            <strong>
                Select Delivery Address
            </strong>

            <small>
                ${
                    phone.length === 10
                        ? "Choose a saved address or add a new one"
                        : "Enter customer phone number first"
                }
            </small>

        </span>

        <span>
            →
        </span>

    `;

}


/*
==================================================
OPEN ADDRESS POPUP
==================================================
*/

function openDeliveryAddressPopup() {

    const phone =
        getCurrentPhone();


    /*
    Delivery requires a valid
    10-digit customer phone.
    */

    if (
        phone.length !== 10
    ) {

        return;

    }


    showAddressSelectorView();

    renderAddressList();


    if (
        window.POSPopup
    ) {

        window.POSPopup.open(
            "address-modal"
        );

    }

}


/*
==================================================
SHOW SAVED ADDRESS VIEW
==================================================
*/

function showAddressSelectorView() {

    if (
        !addressSelectorView ||
        !newAddressView
    ) {

        return;

    }


    addressSelectorView.hidden =
        false;

    newAddressView.hidden =
        true;

}


/*
==================================================
SHOW NEW ADDRESS VIEW
==================================================
*/

function showNewAddressView() {

    if (
        !addressSelectorView ||
        !newAddressView
    ) {

        return;

    }


    addressSelectorView.hidden =
        true;

    newAddressView.hidden =
        false;


    clearAddressFormError();


    if (addressLabelInput) {

        addressLabelInput.focus();

    }

}


/*
==================================================
CLEAR FORM
==================================================
*/

function clearAddressForm() {

    if (!newAddressForm) {

        return;

    }


    newAddressForm.reset();

    clearAddressFormError();

}


/*
==================================================
FORM ERROR
==================================================
*/

function showAddressFormError(
    message
) {

    if (!addressFormError) {

        return;

    }


    addressFormError.textContent =
        message;

}


function clearAddressFormError() {

    if (!addressFormError) {

        return;

    }


    addressFormError.textContent =
        "";

}


/*
==================================================
SAVE NEW ADDRESS
==================================================
*/

function handleAddressFormSubmit(
    event
) {

    event.preventDefault();


    clearAddressFormError();


    const phone =
        getCurrentPhone();


    /*
    Phone is taken from the existing
    Billing field.
    */

    if (
        phone.length !== 10
    ) {

        showAddressFormError(
            "A valid 10-digit customer phone number is required."
        );

        return;

    }


    const label =
        addressLabelInput
            .value
            .trim();


    const addressLine =
        addressFullInput
            .value
            .trim();


    const landmark =
        addressLandmarkInput
            .value
            .trim();


    const city =
        addressCityInput
            .value
            .trim();


    const state =
        addressStateInput
            .value
            .trim();


    const pincode =
        addressPincodeInput
            .value
            .replace(
                /\D/g,
                ""
            );


    /*
    ==============================================
    VALIDATION
    ==============================================
    */

    if (!label) {

        showAddressFormError(
            "Please enter an address label."
        );

        addressLabelInput.focus();

        return;

    }


    if (!addressLine) {

        showAddressFormError(
            "Please enter the full address."
        );

        addressFullInput.focus();

        return;

    }


    if (!city) {

        showAddressFormError(
            "Please enter the city."
        );

        addressCityInput.focus();

        return;

    }


    if (!state) {

        showAddressFormError(
            "Please enter the state."
        );

        addressStateInput.focus();

        return;

    }


    if (
        pincode.length !== 6
    ) {

        showAddressFormError(
            "Pincode must contain exactly 6 digits."
        );

        addressPincodeInput.focus();

        return;

    }


    /*
    ==============================================
    CREATE ADDRESS OBJECT
    ==============================================
    */

    const newAddress = {

        id:
            `address-${Date.now()}`,

        label:
            label,

        addressLine:
            addressLine,

        landmark:
            landmark,

        city:
            city,

        state:
            state,

        pincode:
            pincode,

        createdAt:
            new Date().toISOString()

    };


    /*
    ==============================================
    GET EXISTING ADDRESSES
    ==============================================
    */

    const addresses =
        getSavedAddresses();


    /*
    Put newest address first.
    */

    addresses.unshift(
        newAddress
    );


    /*
    Keep maximum 20 saved addresses.
    */

    const limitedAddresses =
        addresses.slice(
            0,
            20
        );


    /*
    Save addresses for this
    customer's phone number.
    */

    const saved =
        saveAddresses(
            limitedAddresses
        );


    if (!saved) {

        showAddressFormError(
            "Unable to save the address on this device."
        );

        return;

    }


    /*
    ==============================================
    IMMEDIATELY SELECT NEW ADDRESS
    ==============================================
    */

    selectDeliveryAddress(
        newAddress
    );


    clearAddressForm();

}


/*
==================================================
CUSTOMER PHONE CHANGED
==================================================

Uses the existing Billing phone input.

When the phone number changes:

- Previous selected address is cleared.
- Address button is refreshed.
- The next popup opening reads addresses
  for the new phone number.

==================================================
*/

function handleCustomerPhoneChange() {

    selectedDeliveryAddress =
        null;


    updateDeliveryAddressButton();

}


/*
==================================================
ORDER TYPE CHANGE
==================================================
*/

function updateDeliveryAddressVisibility(
    orderType
) {

    if (!addressSelection) {

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

        addressSelection.classList.add(
            "active"
        );


        updateDeliveryAddressButton();


        return;

    }


    /*
    ==============================================
    NOT DELIVERY
    ==============================================
    */

    addressSelection.classList.remove(
        "active"
    );


    selectedDeliveryAddress =
        null;


    updateDeliveryAddressButton();

}


/*
==================================================
ORDER TYPE LISTENER
==================================================
*/

function initializeAddressOrderTypeListener() {

    if (
        window.POSDeliveryAddressOrderTypeListenerInitialized
    ) {

        return;

    }


    document.addEventListener(
        "posOrderTypeChanged",
        event => {

            if (
                !event.detail ||
                !event.detail.orderType
            ) {

                return;

            }


            updateDeliveryAddressVisibility(
                event.detail.orderType
            );

        }
    );


    window.POSDeliveryAddressOrderTypeListenerInitialized =
        true;

}


/*
==================================================
INITIALIZE ADDRESS SYSTEM
==================================================
*/

function initializeDeliveryAddress() {

    /*
    ==============================================
    GET BILLING ELEMENTS
    ==============================================
    */

    addressButton =
        document.getElementById(
            "delivery-address-btn"
        );


    addressSelection =
        document.getElementById(
            "delivery-address-selection"
        );


    addressList =
        document.getElementById(
            "address-list"
        );


    addressSelectorView =
        document.getElementById(
            "address-selector-view"
        );


    newAddressView =
        document.getElementById(
            "new-address-view"
        );


    addNewAddressButton =
        document.getElementById(
            "add-new-address-btn"
        );


    addressBackButton =
        document.getElementById(
            "address-back-btn"
        );


    newAddressForm =
        document.getElementById(
            "new-address-form"
        );


    addressLabelInput =
        document.getElementById(
            "address-label"
        );


    addressFullInput =
        document.getElementById(
            "address-full"
        );


    addressLandmarkInput =
        document.getElementById(
            "address-landmark"
        );


    addressCityInput =
        document.getElementById(
            "address-city"
        );


    addressStateInput =
        document.getElementById(
            "address-state"
        );


    addressPincodeInput =
        document.getElementById(
            "address-pincode"
        );


    addressFormError =
        document.getElementById(
            "address-form-error"
        );


    /*
    ==============================================
    EXISTING BILLING PHONE FIELD
    ==============================================

    IMPORTANT:

    This is only a local reference.

    It does NOT create another phone field
    and does NOT create a global variable.

    ==============================================
    */

    const customerPhoneField =
        document.getElementById(
            "customer-phone"
        );


    /*
    ==============================================
    REQUIRED ELEMENT CHECK
    ==============================================
    */

    if (
        !addressButton ||
        !addressSelection ||
        !addressList ||
        !newAddressForm ||
        !customerPhoneField
    ) {

        console.warn(
            "Delivery address elements not found."
        );

        return;

    }


    /*
    ==============================================
    FRESH BILLING PAGE STATE
    ==============================================
    */

    selectedDeliveryAddress =
        null;


    /*
    ==============================================
    OPEN ADDRESS POPUP
    ==============================================
    */

    addressButton.addEventListener(
        "click",
        openDeliveryAddressPopup
    );


    /*
    ==============================================
    ADD NEW ADDRESS
    ==============================================
    */

    if (
        addNewAddressButton
    ) {

        addNewAddressButton.addEventListener(
            "click",
            () => {

                clearAddressForm();

                showNewAddressView();

            }
        );

    }


    /*
    ==============================================
    BACK TO SAVED ADDRESSES
    ==============================================
    */

    if (
        addressBackButton
    ) {

        addressBackButton.addEventListener(
            "click",
            () => {

                showAddressSelectorView();

                renderAddressList();

            }
        );

    }


    /*
    ==============================================
    SAVE ADDRESS
    ==============================================
    */

    newAddressForm.addEventListener(
        "submit",
        handleAddressFormSubmit
    );


    /*
    ==============================================
    EXISTING CUSTOMER PHONE CHANGED
    ==============================================
    */

    customerPhoneField.addEventListener(
        "input",
        handleCustomerPhoneChange
    );


    /*
    ==============================================
    PINCODE DIGITS ONLY
    ==============================================
    */

    if (
        addressPincodeInput
    ) {

        addressPincodeInput.addEventListener(
            "input",
            () => {

                addressPincodeInput.value =
                    addressPincodeInput
                        .value
                        .replace(
                            /\D/g,
                            ""
                        );

            }
        );

    }


    /*
    ==============================================
    ORDER TYPE LISTENER
    ==============================================
    */

    initializeAddressOrderTypeListener();


    /*
    ==============================================
    APPLY CURRENT ORDER TYPE
    ==============================================
    */

    const currentOrderType =
        window.POSOrderType
            ? window.POSOrderType.get()
            : "takeaway";


    updateDeliveryAddressVisibility(
        currentOrderType
    );

}


/*
==================================================
PUBLIC API
==================================================
*/

window.POSDeliveryAddress = {

    get:
        () =>
            selectedDeliveryAddress,


    clear:
        () => {

            selectedDeliveryAddress =
                null;


            updateDeliveryAddressButton();

        },


    open:
        openDeliveryAddressPopup

};


/*
==================================================
PAGE INITIALIZER
==================================================
*/

window.POSPageInitializers =
    window.POSPageInitializers || {};


window.POSPageInitializers[
    "js/billing/address.js"
] =
    initializeDeliveryAddress;
