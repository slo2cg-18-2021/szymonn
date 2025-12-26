# Planning Guide

A comprehensive inventory management system for a hair salon that enables product tracking through barcode scanning, CSV import/export functionality, and status management for products (sold, in-use).

**Experience Qualities**:
1. **Efficient** - Fast barcode scanning and immediate product registration minimize time spent on inventory management
2. **Professional** - Clean, organized interface that reflects the quality standards of a modern hair salon business
3. **Practical** - Straightforward workflows for common tasks like adding products, changing status, and exporting data

**Complexity Level**: Light Application (multiple features with basic state)
This is a focused inventory tool with several interconnected features (barcode scanning, CSV operations, status management) but maintains a relatively simple data model and user flow appropriate for daily salon operations.

## Essential Features

### Offline Mode with Synchronization
- **Functionality**: Detects network connectivity and queues changes for automatic sync when connection is restored
- **Purpose**: Ensures uninterrupted workflow even without internet, preventing data loss
- **Trigger**: Network disconnection/reconnection detected automatically
- **Progression**: User makes changes offline → Changes queued locally → Connection restored → Auto-sync initiated → User notified of sync status
- **Success criteria**: All changes made offline are preserved and synced when online; user sees clear status indicator; sync happens automatically and reliably

### Barcode Scanner Input
- **Functionality**: Accepts barcode input from mobile scanner apps or physical scanners (keyboard wedge mode)
- **Purpose**: Enables quick product registration without manual typing
- **Trigger**: Focus on barcode input field or automatic capture
- **Progression**: Scanner activates → Barcode scanned → Product details form appears → User adds metadata → Product saved to inventory
- **Success criteria**: Barcode values are captured correctly and immediately trigger the add product workflow

### Product Database Management
- **Functionality**: Store and display all salon products with details (barcode, name, category, price, purchase date, status)
- **Purpose**: Centralized view of all inventory items for tracking and management
- **Trigger**: App loads, product is added/edited, or filter is applied
- **Progression**: User views product list → Applies filters/search → Selects product → Views/edits details → Saves changes
- **Success criteria**: All products persist between sessions and can be filtered by status, category, or search term

### Status Management
- **Functionality**: Set and update product status between "Available", "In Use", and "Sold"
- **Purpose**: Track product lifecycle from purchase through usage to sale
- **Trigger**: User selects status from dropdown or quick-action button
- **Progression**: Product displayed → User clicks status dropdown → Selects new status → Product updates with timestamp → List refreshes
- **Success criteria**: Status changes are immediate, visible, and persist; products can be filtered by status

### CSV Export
- **Functionality**: Export entire inventory or filtered subset to CSV file
- **Purpose**: Enable backup, reporting, and integration with other business tools
- **Trigger**: User clicks export button
- **Progression**: User applies optional filters → Clicks export → CSV file generated → Browser downloads file
- **Success criteria**: CSV contains all relevant product fields, is properly formatted, and opens in spreadsheet software

### CSV Import
- **Functionality**: Bulk import products from CSV file
- **Purpose**: Initial database setup, restore from backup, or migrate from other systems
- **Trigger**: User clicks import button and selects file
- **Progression**: User clicks import → File picker opens → User selects CSV → System validates format → Products added → Confirmation shown
- **Success criteria**: Valid CSV rows are imported without errors; invalid rows show clear error messages; existing products are handled appropriately

## Edge Case Handling
- **Duplicate Barcodes**: Warn user when scanning existing barcode and offer to edit existing product or create new entry
- **Empty Database**: Show helpful empty state with quick-start guide for first-time users
- **Invalid CSV Format**: Display clear validation errors with row numbers and expected format
- **Missing Required Fields**: Prevent submission and highlight required fields with helpful messages
- **Long Product Lists**: Implement pagination or virtual scrolling for performance with large inventories
- **Barcode Scanner Not Recognized**: Provide manual barcode entry option and help text
- **Network Interruption**: Queue changes locally and auto-sync when connection restored
- **Sync Conflicts**: Apply last-write-wins strategy with operation merging to prevent data loss
- **Queue Overflow**: Merge redundant operations (e.g., multiple updates to same product)
- **Manual Sync Trigger**: Allow users to manually trigger sync via settings dialog

## Design Direction
The design should evoke efficiency, organization, and professional trustworthiness. The interface should feel like a modern business tool - clean and systematic without being cold, with subtle warmth that reflects the personal service nature of a salon business.

## Color Selection
A professional yet warm color scheme built around sophisticated neutrals with vibrant accent colors for actions and status indicators.

- **Primary Color**: Deep plum (oklch(0.35 0.12 320)) - Professional and distinctive, evokes sophistication associated with beauty/salon industry
- **Secondary Colors**: Soft cream (oklch(0.96 0.01 85)) for cards and surfaces, warm gray (oklch(0.45 0.01 320)) for subtle elements
- **Accent Color**: Vibrant coral (oklch(0.68 0.19 25)) - Energetic and attention-grabbing for CTAs and important actions
- **Status Colors**: Emerald green for "Available" (oklch(0.65 0.18 155)), Golden amber for "In Use" (oklch(0.75 0.15 75)), Cool blue for "Sold" (oklch(0.60 0.15 240))
- **Foreground/Background Pairings**: 
  - Primary (Deep Plum oklch(0.35 0.12 320)): White text (oklch(0.98 0 0)) - Ratio 7.2:1 ✓
  - Accent (Vibrant Coral oklch(0.68 0.19 25)): White text (oklch(0.98 0 0)) - Ratio 4.8:1 ✓
  - Background (Warm Cream oklch(0.96 0.01 85)): Dark text (oklch(0.25 0.02 320)) - Ratio 12.5:1 ✓

## Font Selection
Typography should convey modern professionalism with excellent readability for scanning long product lists and data tables.

- **Primary Font**: Space Grotesk - Geometric and contemporary, provides excellent readability in UI elements while maintaining visual interest
- **Typographic Hierarchy**: 
  - H1 (Page Title): Space Grotesk Bold / 32px / tight letter spacing (-0.02em)
  - H2 (Section Headers): Space Grotesk Semibold / 24px / normal spacing
  - H3 (Card Titles): Space Grotesk Medium / 18px / normal spacing
  - Body (Product Details): Space Grotesk Regular / 15px / relaxed line height (1.6)
  - Small (Meta Info): Space Grotesk Regular / 13px / muted color

## Animations
Animations should feel purposeful and snappy - confirming actions without slowing workflow. Quick micro-interactions (100-200ms) on button presses and status changes. Smooth but fast list filtering (200ms). Celebratory but brief animation when product is successfully scanned (300ms scale+fade). Drawer/dialog transitions should be swift (250ms) to maintain workflow momentum.

## Component Selection
- **Components**: 
  - `Table` for product list with sortable columns
  - `Dialog` for add/edit product forms
  - `Card` for statistics dashboard and grouped information
  - `Select` for status dropdown and category selection
  - `Input` with focus trap for barcode scanning
  - `Button` with variants (default for actions, outline for secondary, destructive for delete)
  - `Badge` for status indicators with color coding
  - `Tabs` for switching between "All Products", "Available", "In Use", "Sold" views
  - `Alert` for import/export confirmation messages
  - `Separator` for visual grouping in forms
  
- **Customizations**: 
  - Custom barcode input component with scan animation and auto-submit
  - Status badge component with custom colors for each status type
  - CSV file upload dropzone with drag-and-drop support
  - Empty state illustration for first-time users
  
- **States**: 
  - Buttons: Subtle shadow on rest, lift+brighten on hover, press down on active, coral accent for primary actions
  - Inputs: Light border on rest, accent border + subtle glow on focus, success green border when validated
  - Status badges: Pill shape with status-specific background color, slightly bolder on hover
  - Table rows: Subtle hover background, selected row gets accent border-left
  
- **Icon Selection**: 
  - `Barcode` for scan input
  - `Plus` for add product
  - `Download` / `Upload` for CSV operations
  - `Pencil` for edit
  - `Trash` for delete
  - `FunnelSimple` for filters
  - `MagnifyingGlass` for search
  - `CheckCircle` / `Clock` / `ShoppingCart` for status indicators
  
- **Spacing**: 
  - Tight spacing (gap-2, p-2) for compact table cells and badges
  - Medium spacing (gap-4, p-4) for form fields and card content
  - Generous spacing (gap-6, p-6) for main layout sections
  - Extra space (gap-8, p-8) for visual separation between major UI sections
  
- **Mobile**: 
  - Table transforms to stacked card list on mobile
  - Form inputs stack vertically with full width
  - Action buttons become fixed bottom bar on mobile
  - Filters collapse into slide-out drawer
  - Stats dashboard cards stack single column
  - Touch-friendly sizing (min-h-12) for all interactive elements
