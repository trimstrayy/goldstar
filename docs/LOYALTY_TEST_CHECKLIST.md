# Goldstar Loyalty System Test Checklist

Use a connected Supabase Preview with a manager/admin account. Record the customer ID, coupon codes, sale ID, and screenshots for each completed scenario.

## 1. Customer and pair entry

- [ ] Open **Customers**, select an existing customer, and choose **Add pair**.
- [ ] Enter a product name, size, quantity, and price greater than zero.
- [ ] Confirm the review preview shows the entered price rather than Rs. 0.
- [ ] Confirm no payment-method field is required or displayed.
- [ ] Save without a coupon and confirm the button finishes, a success confirmation appears, and the app redirects to **Customers**.
- [ ] Reopen the customer profile and confirm the purchase appears in Purchases, the pair count increased, and the ledger/customer overview refreshed.

## 2. Every 10th pair and cycle notification

- [ ] Prepare a customer at 9 pairs in the active cycle.
- [ ] Add the 10th qualifying pair and complete the loyalty record.
- [ ] Confirm a visible notification states that the customer completed a loyalty cycle.
- [ ] Confirm the customer profile shows one additional completed cycle.
- [ ] Confirm a new 15% loyalty coupon is issued for that completed cycle.
- [ ] Confirm the issued code appears in the customer’s Coupons & redemptions tab.
- [ ] Confirm the coupon is not issued twice if the page is refreshed or the issue operation is retried.
- [ ] Repeat with a customer whose database overview reports multiple completed cycles and confirm one coupon exists for each completed cycle.

## 3. Loyalty coupon selection and discount calculation

- [ ] Select a customer with one or more issued loyalty coupons.
- [ ] Advance to **Discount** and confirm the loyalty option appears only there, not on customer selection.
- [ ] Select exactly one 15% coupon and confirm the review preview calculates `price × 0.85`.
- [ ] For a Rs. 2,200 eligible item, confirm the preview is Rs. 1,870 before saving.
- [ ] Select two issued coupons and confirm the preview sums the rates to 30% rather than compounding them.
- [ ] Confirm the database-owned final sale totals match the selected coupon percentage and eligible item prices.
- [ ] Click **Save loyalty record** and confirm the loader ends with either a success confirmation or an explicit error panel; it must never remain as a silent loader.
- [ ] On success, confirm redirect to **Customers** and verify the sale appears in the customer’s Purchases tab.

## 4. One-time coupon invalidation

- [ ] Record the exact loyalty coupon codes selected for a successful sale.
- [ ] In the customer profile, confirm each applied code status is `redeemed`.
- [ ] Start another loyalty record for the same customer.
- [ ] Confirm the redeemed codes do not appear in the available issued-coupon selection.
- [ ] Attempt to submit a previously redeemed code directly through the redemption RPC or controlled test request.
- [ ] Confirm Supabase rejects the request and does not create a second redemption.
- [ ] Confirm the coupon remains `redeemed` and retains its original sale reference.

## 5. Birthday coupon protection

- [ ] Generate a birthday coupon for a customer with a valid date.
- [ ] Confirm the digital coupon contains the Goldstar branding, coupon information, birthday message, and QR code.
- [ ] Scan or paste the QR code in the loyalty counter.
- [ ] Confirm the code is accepted only on its valid date and only while status is `issued`.
- [ ] Complete the record and confirm the birthday coupon status becomes `redeemed`.
- [ ] Try the same QR code again and confirm the system rejects it as already redeemed.
- [ ] Confirm birthday and loyalty coupons cannot be stacked together when the one-discount rule is active.

## 6. Failure and recovery behavior

- [ ] Temporarily use an invalid/expired coupon and confirm the Review page shows the exact failure in a visible error panel.
- [ ] Confirm the app does not redirect after a failed coupon redemption.
- [ ] Confirm the Save button becomes usable again after the failure.
- [ ] Correct the issue, retry with a valid issued code, and confirm the normal success-and-redirect flow.
- [ ] Confirm a failed client-side readback does not falsely show a success message.

## 7. Required database checks

- [ ] `redeem_loyalty_coupon_stack` is deployed and callable by an authenticated staff user.
- [ ] `issue_loyalty_coupons` is deployed and callable by an authenticated staff user.
- [ ] `loyalty_coupons.coupon_code` is unique.
- [ ] A redeemed loyalty coupon cannot be selected by the redemption RPC again.
- [ ] The redemption RPC updates the sale discount fields, total, coupon status, and loyalty redemption records in one successful operation.
- [ ] The setup/health screen reports the loyalty coupon table and RPC checks as healthy.
