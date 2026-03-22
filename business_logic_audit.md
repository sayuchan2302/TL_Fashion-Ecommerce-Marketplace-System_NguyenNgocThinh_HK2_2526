# 🔍 Business Logic Audit — Admin vs Client

## Summary
Scanned **23 client pages** + **8 admin pages** + **11 service files**. Found **4 critical disconnects**, **3 missing admin sections**, and **3 broken client features**.

---

## ✅ What's Working Well (Admin ↔ Client Connected)

| Domain | Admin | Client | Data Bridge |
|--------|-------|--------|-------------|
| **Reviews** | AdminReviews | ProductDetail (display only) | `reviewService` → `adminReviewService` ✅ |
| **Promotions** | AdminPromotions | Checkout (coupon input) | ⚠️ Disconnected (see below) |
| **Products** | AdminProducts | ProductDetail, ProductListing, Search | `productService` ← `adminProductService` ✅ |
| **Orders** | AdminOrders | Account/OrdersPage | ❌ Disconnected (see below) |

---

## 🔴 Critical Gaps — Logic Broken

### 1. Orders: Two Separate Data Stores
**Problem:** Client `orderService` (localStorage `coolmate_orders_v1`) is **completely separate** from Admin `adminOrderService` (in-memory mock data). An order placed by a customer never appears in the admin panel.

- Client statuses: `pending | processing | shipping | delivered | cancelled | refunded`  
- Admin statuses: `pending | packing | shipping | done | canceled`  
- **"delivered"** and **"refunded"** don't exist in admin; **"packing"** and **"done"** don't exist in client.

> [!CAUTION]
> Biggest architectural gap. Orders placed at checkout go to localStorage; admin sees only hardcoded mock orders. They are never the same dataset.

**Fix needed:** Unify to a single order store (shared in-memory or localStorage), and reconcile status enums.

---

### 2. Promotions: Coupon Codes Not Synced with Admin
**Problem:** [couponService.ts](file:///d:/Project/frontend/src/services/couponService.ts) has **5 hardcoded coupons** (`WELCOMEJ7BMF6`, `NHNS153`, `FREESHIP`, etc.). [AdminPromotions](file:///d:/Project/frontend/src/pages/Admin/AdminPromotions.tsx#197-742) manages its own separate list of vouchers (`SUMMER20`, `HELLO100K`, `WKND50`). The two lists **do not share data**.

- A voucher created/paused in Admin has **zero effect** on checkout.
- Client `couponService.validate()` reads from a hardcoded array, not from `adminPromotionsService`.

> [!CAUTION]
> Creating a voucher in Admin doesn't make it usable at checkout. Pausing a running voucher in Admin doesn't block client from using it.

**Fix needed:** `couponService` should read from the same source as [AdminPromotions](file:///d:/Project/frontend/src/pages/Admin/AdminPromotions.tsx#197-742).

---

### 3. Review Submission: Broken in Client
**Problem:** [ProductDetail.tsx](file:///d:/Project/frontend/src/pages/ProductDetail/ProductDetail.tsx) line 62: `const handleSubmitReview = undefined;`  
The review form is present in the UI but **submit is hardcoded to undefined** — customers cannot submit reviews.

`reviewService.submitReview()` exists and correctly pushes to `adminReviewService` (which would create a [pending](file:///d:/Project/frontend/src/pages/Admin/AdminCustomers.tsx#242-250) review for admin to approve). The plumbing works, but the UI never calls it.

> [!WARNING]
> Review flow: Customer submits → Admin sees pending → Admin approves → Client shows. The admin side is correct, but the trigger (client submit) is disabled.

**Fix needed:** Wire `handleSubmitReview` to `reviewService.submitReview()` with a form (rating + content).

---

### 4. Returns: No Admin Management
**Problem:** Client has a `/returns` page where customers submit return requests (reason, product, resolution type). **There is no admin page to view/manage these return requests.** The submission only shows a success toast — no data is stored anywhere.

> [!WARNING]
> Return requests disappear into void. Admin cannot see, approve, or process them.

**Fix needed:** Create `adminReturnService` + returns management store, and an `AdminReturns` admin page, OR at minimum persist client submissions somewhere shared.

---

## 🟡 Missing Admin Management Areas

### 5. Wishlist: No Admin Visibility
Client has `/wishlist` (localStorage-based). Admin has no analytics on:
- Top wishlisted products
- Conversion from wishlist to purchase
- Products with high wishlist but low sales (restock signals)

**Priority:** Low (analytics only, not blocking)

---

### 6. Shipping / Delivery Tracking: Client-Only
Client has `/order-tracking` page. Admin `AdminOrderDetail` manages fulfillment but there is no:
- Shipping carrier integration field
- Tracking number entry in admin
- Client `ADMIN_ACTION_TITLES.copyTracking` exists in labels but the field is never populated from admin

**Priority:** Medium — customers click "Track" but no tracking number ever comes from admin.

---

### 7. Content / CMS: Admin "Nội dung" Tab
Admin sidebar has a "Nội dung" link. There's no `AdminContent.tsx` — it links to `/admin` (homepage). Banners, homepage hero, announcements are hardcoded in [Home.tsx](file:///d:/Project/frontend/src/pages/Home/Home.tsx).

**Priority:** Medium for a real product.

---

## 🟢 Client Features Missing Business Logic

| Client Feature | Current State | What's Missing |
|----------------|---------------|----------------|
| **Order cancellation** | `orderService.cancel()` exists, [canCancel()](file:///d:/Project/frontend/src/services/orderService.ts#122-125) checks status | ✅ Works, but status enum mismatch with admin |
| **Review "Helpful"** | `helpful: 0` hardcoded | No increment logic, no persistency |
| **Review image upload** | `images?: string[]` in model | UI upload not implemented |
| **Payment methods** | COD, ZaloPay, MoMo, VNPay shown | Only navigation, no real payment gateway |
| **Address book** | [addressService.ts](file:///d:/Project/frontend/src/services/addressService.ts) exists | Not synced with Profile addresses |
| **Notifications** | [notificationService.ts](file:///d:/Project/frontend/src/services/notificationService.ts) exists | No UI component in account page |

---

## 📊 Priority Fix Roadmap

| # | Fix | Impact | Effort |
|---|-----|--------|--------|
| 1 | **Unify Order data store** (client checkout → shared store → admin) | 🔴 Critical | High |
| 2 | **Sync Coupon/Promotion** (AdminPromotions → couponService) | 🔴 Critical | Medium |
| 3 | **Enable Review submission** (wire form in ProductDetail) | 🟠 High | Low |
| 4 | **AdminReturns page + returnService** | 🟠 High | Medium |
| 5 | **Tracking number field** in admin → shown in client order tracking | 🟡 Medium | Low |
| 6 | **Notification UI** in Account | 🟡 Medium | Low |
| 7 | **AdminContent page** for banners/CMS | 🟡 Medium | High |
| 8 | **Wishlist analytics** in admin dashboard | 🟢 Low | Low |
