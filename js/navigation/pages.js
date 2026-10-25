/*
==================================================
APPLICATION ROUTES
==================================================

This file is the CENTRAL CONFIGURATION for the
entire application.

The router reads this file to determine:

- URL
- Optional pageName (CSS class name without the `page-` prefix)
- Optional fullwidth: true adds `.fullwidth` to `.app`
- Restaurant/page document title and metadata
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
    billing: {
        page: "billing",
        title: "Billing",
        description: "Create a new order",
        className: "billing-page",
        scripts: []
    },

    orders: {
        page: "orders",
        title: "Orders",
        description: "View and manage restaurant orders",
        className: "orders-page",
        scripts: [],
        children: {
            "order-history": {
                page: "orders/order-history",
                title: "Order History",
                description: "Your order history appears here",
                className: "order-history-page",
                scripts: []
            }
        }
    },

    inventory: {
        page: "inventory",
        title: "Inventory",
        description: "Manage restaurant inventory",
        className: "inventory-page",
        scripts: [],
        children: {
            purchase: {
                page: "inventory/purchase",
                title: "Purchase",
                description: "Manage purchases",
                className: "inventory-purchase-page",
                scripts: [],
                children: {
                    new: {
                        page: "inventory/purchase/new",
                        title: "New Purchase",
                        description: "Create a purchase",
                        className: "inventory-purchase-new-page",
                        scripts: ["js/inventory/purchase/new.js"]
                    },
                    history: {
                        page: "inventory/purchase/history",
                        title: "Purchase History",
                        description: "View purchase history",
                        className: "inventory-purchase-history-page",
                        scripts: ["js/inventory/purchase/history.js"]
                    },
                    dues: {
                        page: "inventory/purchase/dues",
                        title: "Purchase Dues",
                        description: "Manage outstanding dues",
                        className: "inventory-purchase-dues-page",
                        scripts: ["js/inventory/purchase/dues.js"]
                    },
                    returns: {
                        page: "inventory/purchase/returns",
                        title: "Purchase Returns",
                        description: "Manage purchase returns",
                        className: "inventory-purchase-returns-page",
                        scripts: ["js/inventory/purchase/returns.js"]
                    },
                    "requirement-list": {
                        page: "inventory/purchase/requirement-list",
                        title: "Requirement List",
                        description: "View purchase requirements",
                        className: "inventory-purchase-requirement-list-page",
                        scripts: []
                    }
                }
            },

            stock: {
                page: "inventory/stock",
                title: "Stock",
                description: "Manage stock",
                className: "inventory-stock-page",
                scripts: [],
                children: {
                    current: {
                        page: "inventory/stock/current",
                        title: "Current Stock",
                        description: "View current stock",
                        className: "inventory-stock-current-page",
                        scripts: []
                    },
                    reconcile: {
                        page: "inventory/stock/reconcile",
                        title: "Stock Reconciliation",
                        description: "Reconcile inventory",
                        className: "inventory-stock-reconcile-page",
                        scripts: []
                    },
                    movements: {
                        page: "inventory/stock/movements",
                        title: "Stock Movements",
                        description: "View stock movements",
                        className: "inventory-stock-movements-page",
                        scripts: []
                    }
                }
            },

            recipes: {
                page: "inventory/recipes",
                title: "Recipes",
                description: "Manage recipes",
                className: "inventory-recipes-page",
                scripts: []
            },

            wastage: {
                page: "inventory/wastage",
                title: "Wastage",
                description: "Manage inventory wastage",
                className: "inventory-wastage-page",
                scripts: [],
                children: {
                    record: {
                        page: "inventory/wastage/record",
                        title: "Record Wastage",
                        description: "Record inventory wastage",
                        className: "inventory-wastage-record-page",
                        scripts: []
                    },
                    history: {
                        page: "inventory/wastage-history",
                        title: "Wastage History",
                        description: "View wastage history",
                        className: "inventory-wastage-history-page",
                        scripts: []
                    }
                }
            },

            suppliers: {
                page: "inventory/suppliers",
                title: "Suppliers",
                description: "Manage suppliers",
                className: "inventory-suppliers-page",
                scripts: []
            }
        }
    },

    reports: {
        page: "reports",
        title: "Reports",
        description: "View business reports",
        className: "reports-page",
        scripts: []
    },

    marketing: {
        page: "marketing",
        title: "Marketing",
        description: "Manage marketing campaigns",
        className: "marketing-page",
        scripts: []
    },

    products: {
        page: "products",
        title: "Products",
        description: "Manage products and menu items",
        className: "products-page",
        scripts: []
    },

    customers: {
        page: "customers",
        title: "Customers",
        description: "Manage customers",
        className: "customers-page",
        scripts: []
    },

    "coming-soon": {
        page: "coming-soon",
        title: "Coming Soon",
        description: "This feature is coming soon",
        className: "coming-soon-page",
        scripts: []
    },

    settings: {
    page: "settings",
    title: "Settings",
    description: "Manage application settings",
    className: "settings-page",
    fullwidth: true,
    scripts: [],
    children: {
        appearance: {
            page: "settings/appearance",
            title: "Appearance",
            description: "Customize application appearance",
            className: "settings-appearance-page",
            fullwidth: true,
            scripts: []
        },
        "billing-and-Payment": {
            page: "settings/billing-and-payment",
            title: "Billing & Payments",
            description: "Configure billing and payments",
            className: "settings-billing-and-payment-page",
            fullwidth: true,
            scripts: []
        },
        "order-and-restaurant-operations": {
            page: "settings/order-and-restaurant-operations",
            title: "Order & Restaurant Operations",
            description: "Configure order workflows",
            className: "settings-order-and-restaurant-operations-page",
            fullwidth: true,
            scripts: []
        },
        "table-management": {
            page: "settings/table-management",
            title: "Table Management",
            description: "Configure tables and dine-in sessions",
            className: "settings-table-management-page",
            fullwidth: true,
            scripts: []
        },
        "kitchen-configuration": {
            page: "settings/kitchen-configuration",
            title: "Kitchen",
            description: "Configure kitchen operations",
            className: "settings-kitchen-configuration-page",
            fullwidth: true,
            scripts: []
        }
      }
    }
};
