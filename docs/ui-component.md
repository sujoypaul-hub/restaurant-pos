# Restaurant POS — PAGE LAYOUT

## 1. Page Layout with header and right sidebar

<!-- MAIN PAGE LAYOUT -->

    <main class="orders-layout page-layout">
    
        <!-- MAIN CONTENT -->         
        <div class="page-content" > </div>    
    </main>


<!-- RIGHT SIDEBAR: Outside page layout -->
            
        <aside class="page-sidebar page-sidebar-2 right-sidebar">
                <!-- Right sidebar content -->
        </aside>




# Restaurant POS — UI Components

## 2. List Type Layout 

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

