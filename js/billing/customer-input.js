/*
==================================================
CUSTOMER PHONE INPUT
==================================================

Controls:

- Customer phone number
- No phone checkbox

When "No phone" is selected:

- Phone input is disabled
- Existing number is cleared
- Customer is treated as a walk-in customer

When unchecked:

- Phone input becomes available again

==================================================
*/


function initializeCustomerInput() {

    const phoneInput =
        document.getElementById(
            "customer-phone"
        );


    const noPhoneCheckbox =
        document.getElementById(
            "no-phone-checkbox"
        );


    if (
        !phoneInput ||
        !noPhoneCheckbox
    ) {

        return;

    }


    noPhoneCheckbox.addEventListener(
        "change",
        () => {

            if (
                noPhoneCheckbox.checked
            ) {

                /*
                    No customer phone.
                */

                phoneInput.value = "";

                phoneInput.disabled = true;

                phoneInput.placeholder =
                    "Walk-in customer";


            } else {

                /*
                    Phone number available.
                */

                phoneInput.disabled = false;

                phoneInput.placeholder =
                    "Enter customer phone number";

                phoneInput.focus();

            }

        }
    );

}


/*
==================================================
START
==================================================
*/

initializeCustomerInput();
