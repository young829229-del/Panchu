# Security Specification — Panchu E-Commerce

## 1. Data Invariants
- Products can be read by public guests if `active == true`, or by authenticated admins.
- Customers can place orders without creating an account (Guest checkout).
- When a guest creates an order, the status must strictly be `'Pending'`.
- Normal customers/guests cannot alter product prices, MRP, or descriptions.
- Stock reductions during ordering are atomic and strictly cannot produce negative inventory.
- Orders can be read or updated in real-time only by administrators.
- Admin privileges are verified against the `/admins/{uid}` collection or primary authorized admin email.

## 2. The Dirty Dozen Test Cases
1. Guest attempts to update a Product's price directly -> REJECTED.
2. Guest attempts to delete a Product document -> REJECTED.
3. Guest attempts to create an order with status 'Delivered' -> REJECTED.
4. Guest attempts to read all orders in `/orders` -> REJECTED.
5. Non-admin authenticated user attempts to modify an order -> REJECTED.
6. Attacker attempts to inject 10MB string as product ID -> REJECTED by `isValidId`.
7. Attacker attempts to modify an admin document -> REJECTED.
8. Attacker attempts to read `/admins` without being an admin -> REJECTED.
9. Guest attempts to update another customer's order -> REJECTED.
10. Unverified spoofed email claims admin access -> REJECTED.
11. Attacker attempts shadow fields update in order creation -> REJECTED.
12. Attacker attempts to delete an order -> REJECTED (only admin).
