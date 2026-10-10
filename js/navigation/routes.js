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
            "js/billing/promo.js",
            "js/billing/table.js",
            "js/billing/address.js",
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
    History
    ==============================================
    */
    
    history: {
    page: "history",
    title: "History",
    description: "View complete order history"
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
    INVENTORY
    ==============================================
    */
    
    inventory: {

    page: "inventory",

    title: "Inventory",

    description:
        "Monitor stock, purchases and inventory",

    children: {

        purchase: {

            page: "inventory/purchase",

            title: "Purchase",

            description:
                "Manage inventory purchases",

            children: {

                new: {

                    page: "inventory/purchase/new",

                    title: "New Purchase",

                    description:
                        "Record a new inventory purchase",
                    scripts: [ "js/inventory/purchase/new.js"] 
                },

                history: {

                    page: "inventory/purchase-history",

                    title: "Purchase History",

                    description:
                        "View previous inventory purchases",
                    scripts: [ "js/inventory/purchase/history.js" ]

                }

            }

        },


        stock: {

            page: "inventory/stock",

            title: "Stock",

            description:
                "Monitor and reconcile current stock",

            children: {

                current: {

                    page: "inventory/stock/current",

                    title: "Current Stock",

                    description:
                        "View current inventory levels"

                },

                reconcile: {

                    page: "inventory/stock/reconcile",

                    title: "Stock Count",

                    description:
                        "Count and reconcile physical stock"

                },

                movements: {

                    page: "inventory/stock/movements",

                    title: "Stock Movement",

                    description:
                        "View inventory stock movements"

                }

            }

        },


        recipes: {

            page: "inventory/recipes",

            title: "Recipes",

            description:
                "Manage ingredient usage for menu items"

        },


        wastage: {

            page: "inventory/wastage",

            title: "Wastage",

            description:
                "Record and review inventory wastage",

            children: {

                record: {

                    page: "inventory/wastage/record",

                    title: "Record Wastage",

                    description:
                        "Record damaged, spoiled or wasted stock"

                },

                history: {

                    page: "inventory/wastage-history",

                    title: "Wastage History",

                    description:
                        "View previous inventory wastage"

                }

            }

        },


        suppliers: {

            page: "inventory/suppliers",

            title: "Suppliers",

            description:
                "Manage inventory suppliers"

        }

    }

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
                
                scripts: [ "js/settings/theme.js" ]


            }

        }

    }

};
