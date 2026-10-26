# 1. Restaurant POS — PAGE LAYOUT

## Page Layout with header and right sidebar

<!-- MAIN PAGE LAYOUT -->

    <main class="orders-layout page-layout">
    
        <!-- MAIN CONTENT -->         
        <div class="page-content" > </div>    
    </main>


<!-- RIGHT SIDEBAR: Outside page layout -->
            
        <aside class="page-sidebar page-sidebar-2 right-sidebar">
                <!-- Right sidebar content -->
        </aside>




# 2. Restaurant POS — List Type Components

## List Type Layout 

.list-type-layout
│
└── .list-items
    │
    ├── .list-item
    │   ├── .list-item-icon
    │   ├── .list-item-content
    │   │   ├── .list-item-title
    │   │   └── .list-item-description
    │   └── .list-item-right
    │
    ├── .list-item
    │   └── ...
    │
    └── .list-item
        └── ...

################ HTML ####################################################

<div class="list-type-layout">

    <div class="list-items">

        <button class="list-item" type="button">

            <span class="list-item-icon">  🎨 </span>

            <span class="list-item-content">

                <span class="list-item-title">  Item Title </span>

                <span class="list-item-description">  Item description  </span>

            </span>

            <span class="list-item-right"> </span>

        </button>

    </div>

</div>

__________________________________________________________________________________________________________________________________________

# 3. Restaurant POS — POP-UP Layout

## 1.  Pop up Trigger button
    
    <button type="button" data-popup-target="edit-order">
        Edit Order
    </button>
    
    <button type="button" data-popup-target="promotion">
        Add Promotion
    </button>
    
    <button type="button" data-popup-target="payment">
        Payment
    </button>
    
## 2. Pop up Container 
    
    <!-- POPUP CONTAINERS -->
    
    <div class="pos-modal" data-popup="edit-order" aria-hidden="true">
        <div class="popup-backdrop"></div>
    
        <div class="popup-container" role="dialog" aria-modal="true" aria-label="Edit Order">
            <div class="popup-header">
                <h2>Edit Order</h2>
                <button type="button" data-popup-close aria-label="Close">×</button>
            </div>
    
            <div class="popup-content">
                <!-- Edit order content -->
            </div>
    
            <div class="popup-footer">
                <!-- Edit order actions -->
            </div>
        </div>
    </div>
    
    
    <!-- PROMOTION POPUP -->
    <div class="pos-modal" data-popup="promotion" aria-hidden="true">
        <div class="popup-backdrop"></div>
    
        <div class="popup-container" role="dialog" aria-modal="true" aria-label="Promotion">
            <div class="popup-header">
                <h2>Promotion</h2>
                <button type="button" data-popup-close aria-label="Close">×</button>
            </div>
    
            <div class="popup-content">
                <!-- Promotion content -->
            </div>
    
            <div class="popup-footer">
                <!-- Promotion actions -->
            </div>
        </div>
    </div>
    
    
    <!-- PAYMENT POPUP -->
    <div class="pos-modal" data-popup="payment" aria-hidden="true">
        <div class="popup-backdrop"></div>
    
        <div class="popup-container" role="dialog" aria-modal="true" aria-label="Payment">
            <div class="popup-header">
                <h2>Payment</h2>
                <button type="button" data-popup-close aria-label="Close">×</button>
            </div>
    
            <div class="popup-content">
                <!-- Payment content -->
            </div>
    
            <div class="popup-footer">
                <!-- Payment actions -->
            </div>
        </div>
    </div>
    <!-- END POPUP CONTAINERS -->

__________________________________________________________________________________________________________________________________________

# 4. Restaurant POS — Tab Layout

<section class="tabs-layout page-content" data-tabs="orders" data-default-tab="all">

     <!-- STICKY TAB HEADER -->
     <header class="tabs-header">        
        <nav class="tabs" role="tablist" aria-label="Order status">

            <button type="button" class="tab-header-button active"  data-tab="all" role="tab" aria-selected="true"> All 
                <span class="tab-count">20</span> 
            </button>

            <button type="button" class="tab-header-button active"  data-tab="ongoing" role="tab" aria-selected="false"> Ongoing 
                <span class="tab-count">6</span> 
            </button>

            <button type="button" class="tab-header-button" data-tab="ready" role="tab" aria-selected="false"> Ready 
                <span class="tab-count">4</span>
            </button>

            <button type="button" class="tab-header-button" data-tab="dispatched" role="tab" aria-selected="false"> Dispatched 
                <span class="tab-count">3</span>
            </button>

            <button type="button" class="tab-header-button" data-tab="completed" role="tab" aria-selected="false"> Completed 
                <span class="tab-count">12</span>
            </button>
            
        </nav>
     </header>

     <!-- ONLY THIS AREA SCROLLS -->
     <div class="tab-content">

        <section class="tab-content-section" data-tab-panel="all" role="tabpanel" >
            <div class="orders-list" data-load="html/pages/orders/all-orders.html">
                 All order cards go here
            </div>
        </section>
         
        <section class="tab-content-section" data-tab-panel="ongoing" role="tabpanel" hidden>
            <div class="orders-list">
                Ongoing order cards go here
            </div>
        </section>

        <section class="tab-content-section" data-tab-panel="ready" role="tabpanel" hidden>
            <div class="orders-list">
                 Ready order cards go here
            </div>
        </section>

         <section class="tab-content-section" data-tab-panel="dispatched" role="tabpanel" hidden>
            <div class="orders-list">
                 Dispatched order cards go here
            </div>
        </section>

        <section class="tab-content-section" data-tab-panel="completed" role="tabpanel" hidden>
            <div class="orders-list">
                Completed order cards go here
            </div>
        </section>

      </div>
      
  </section>  
