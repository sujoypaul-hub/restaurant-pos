/*
==================================================
APPLICATION ROUTES
==================================================

This file is the CENTRAL CONFIGURATION for the
entire application.

The router reads this file to determine:

- URL
- HTML page
- Page title
- Page description
- Page JavaScript
- Nested pages

The router itself should not contain individual
page names or page-specific logic.

==================================================
*/


const appRoutes = {

    /*
    ==============================================
    BILLING
    ==============================================
    */

    billing: {

        page: "billing",

        title: "Billing",

        description: "Create a new order",

        scripts: [

            "js/billing/cart.js",
            "js/billing/order-type.js",
            "js/billing/customer-input.js",
            "js/billing/billing.js"

        ]

    },


    /*
    ==============================================
    ORDERS
    ==============================================
    */

    orders: {

        page: "orders",

        title: "Orders",

        description:
            "View and manage restaurant orders"

    },


    /*
    ==============================================
    CUSTOMERS
    ==============================================
    */

    customers: {

        page: "customers",

        title: "Customers",

        description:
            "Manage customers and order history"

    },


    /*
    ==============================================
    PRODUCTS
    ==============================================
    */

    products: {

        page: "products",

        title: "Products",

        description:
            "Manage restaurant products"

    },


    /*
    ==============================================
    REPORTS
    ==============================================
    */

    reports: {

        page: "reports",

        title: "Reports",

        description:
            "View sales and business reports"

    },


    /*
    ==============================================
    MARKETING
    ==============================================
    */

    marketing: {

        page: "marketing",

        title: "Marketing",

        description:
            "Manage customer marketing and campaigns"

    },


    /*
    ==============================================
    COMING SOON
    ==============================================
    */

    "coming-soon": {

        page: "coming-soon",

        title: "Coming Soon",

        description:
            "New features are coming soon"

    },


    /*
    ==============================================
    SETTINGS
    ==============================================
    */

    settings: {

        page: "settings",

        title: "Settings",

        description:
            "Manage application settings",

        children: {

            /*
            ======================================
            THEME
            ======================================
            */

            theme: {

                page: "theme",

                title: "Appearance",

                description:
                    "Choose your application theme",

                scripts: [

                    "js/settings/theme.js"

                ]

            }

        }

    }

};
