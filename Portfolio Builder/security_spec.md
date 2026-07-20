# Security Specification: Portfolio Website Builder

This document outlines the security architecture, data invariants, and access control policies for the Portfolio Website Builder.

## 1. Data Invariants

1. **Portfolio Ownership**: A portfolio document at `/portfolios/{userId}` must only be editable (create, update, delete) by the user whose authenticated UID matches `{userId}`.
2. **Project Belonging**: A project document at `/portfolios/{userId}/projects/{projectId}` must only be editable by the authenticated user whose UID matches `{userId}`.
3. **Temporal Integrity**: All write operations must enforce that timestamps (`updatedAt`, `createdAt`) are correctly assigned using `request.time`.
4. **Data Size Bounds**: User-supplied input strings must have strict maximum lengths (e.g., name <= 100 characters, bio <= 1000 characters) to prevent database resource exhaustion.
5. **No Unauthorized Schema Mutation**: Updates must be structured such that users cannot modify unapproved fields (e.g., escalating access or injecting arbitrary properties).
6. **Public Readability**: Portfolios and projects can be read by anyone (public/unauthenticated) if `isPublished` is true, or by the owner.

---

## 2. The "Dirty Dozen" Malicious Payloads

Here are 12 malicious payloads designed to violate system rules, and why they must be rejected:

### Payload 1: Identity Spoofing on Portfolio Create
An attacker attempts to create a portfolio for another user (`user_B`) while authenticated as `user_A`.
- **Payload**: `userId: "user_B"`, name: `Attacker`
- **Path**: `/portfolios/user_B`
- **Expected Outcome**: `PERMISSION_DENIED`

### Payload 2: Privilege Escalation / Shadow Field Injection
An attacker attempts to inject a system field like `isAdmin: true` into their portfolio document.
- **Payload**: `userId: "user_A"`, `isAdmin: true`
- **Path**: `/portfolios/user_A`
- **Expected Outcome**: `PERMISSION_DENIED` (due to key restriction schema validation).

### Payload 3: Denial-of-Wallet String Poisoning
An attacker attempts to write a 1MB junk string into the `name` field of their portfolio.
- **Payload**: `name: "A...[1MB of text]..."`
- **Path**: `/portfolios/user_A`
- **Expected Outcome**: `PERMISSION_DENIED` (string size <= 100 validation).

### Payload 4: Invalid Project Orphan Creation
An attacker attempts to write a project document under `/portfolios/user_A/projects/proj_1` with a `userId` pointing to `user_B` to bypass project querying.
- **Payload**: `projectId: "proj_1"`, `userId: "user_B"`
- **Path**: `/portfolios/user_A/projects/proj_1`
- **Expected Outcome**: `PERMISSION_DENIED` (userId in payload must match user_A).

### Payload 5: Future Timestamp Hijacking
An attacker attempts to save a fake `updatedAt` in the future to keep their portfolio listed at the top.
- **Payload**: `updatedAt: Timestamp(2050-01-01)`
- **Path**: `/portfolios/user_A`
- **Expected Outcome**: `PERMISSION_DENIED` (updatedAt must match `request.time`).

### Payload 6: Cross-User Project Mutation
`user_B` attempts to edit/delete a project inside `/portfolios/user_A/projects/proj_1`.
- **Payload**: `title: "Hacked project"`
- **Path**: `/portfolios/user_A/projects/proj_1`
- **Expected Outcome**: `PERMISSION_DENIED` (UID in auth must match parent userId).

### Payload 7: Project Tag Array Flooding
An attacker tries to upload 100 tags for a project to waste storage and cause client lag.
- **Payload**: `tags: ["t1", "t2", ..., "t100"]`
- **Path**: `/portfolios/user_A/projects/proj_1`
- **Expected Outcome**: `PERMISSION_DENIED` (tags array size <= 10).

### Payload 8: Custom ID Path Poisoning
An attacker tries to create a portfolio with a malicious document ID containing escape sequences or junk.
- **Payload**: `name: "Hacker"`
- **Path**: `/portfolios/some%2Fmalicious%2Fid`
- **Expected Outcome**: `PERMISSION_DENIED` (isValidId regex guard).

### Payload 9: Unverified User Write Attempt
A user tries to write data without an email-verified status when `email_verified` is mandatory.
- **Auth Token**: `email_verified: false`
- **Payload**: `name: "Alice"`
- **Path**: `/portfolios/user_A`
- **Expected Outcome**: `PERMISSION_DENIED` (if email_verified is enforced for writes).

### Payload 10: Under-sized Field Boundary Bypass
An attacker tries to save an empty string `""` for a required non-empty field.
- **Payload**: `name: ""`
- **Path**: `/portfolios/user_A`
- **Expected Outcome**: `PERMISSION_DENIED` (name.size() >= 2).

### Payload 11: Project Image Size Poisoning
An attacker tries to upload a huge, un-optimized 5MB base64 string directly to their portfolio photo.
- **Payload**: `profilePhoto: "data:image/png;base64,...[5MB of text]..."`
- **Path**: `/portfolios/user_A`
- **Expected Outcome**: `PERMISSION_DENIED` (profilePhoto length <= 150000).

### Payload 12: Published Status Toggle Override
An attacker attempts to write an unauthorized update to change another user's public portfolio's publish status.
- **Path**: `/portfolios/user_A`
- **Auth**: None (or user_B)
- **Expected Outcome**: `PERMISSION_DENIED`

---

## 3. Test Cases (Summary of Expected Policy Controls)

All rules are verified statically and relational:
1. `request.auth != null` checked on all writes.
2. `request.auth.uid == userId` checked on write access.
3. Strict schema validation on properties using custom `isValidPortfolio` and `isValidProject` helper functions.
4. Immortality of `userId` during updates.
5. Strict time checks on timestamps.
