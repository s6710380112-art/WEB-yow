# Security Specification for Educational Knowledge Hub (คลังปัญญา)

## 1. Data Invariants

1. **Identity & Ownership Invariant**: A user can never create or modify resources, favorites, or reports claiming to be another user (`authorId == request.auth.uid`, `reporterId == request.auth.uid`, `userId == request.auth.uid`).
2. **Role Privilege Escalation Prevention**: A regular user creating their own profile cannot assign themselves `role: 'admin'` or `role: 'moderator'`, nor can they toggle `status: 'suspended'`. Only administrators can mutate role/status fields.
3. **Immutability of Provenance**: Critical provenance fields (`createdAt`, `authorId`, `reporterId`, `userId`) can never be modified post-creation.
4. **Content Visibility Boundary**: Suspended users or hidden content cannot be published without moderator/admin review. Public users cannot query deleted or hidden resources unless they are the owner or admin.
5. **Auditing Integrity**: Moderation logs can only be created by authenticated administrators and cannot be altered or erased by standard members.
6. **Bounds & String Size Guard**: All string fields are constrained with length limits to prevent Denial of Wallet and payload inflation attacks.

---

## 2. The "Dirty Dozen" Payloads (Adversarial Test Vectors)

1. **Payload 1 (Self-Assigned Admin)**: User attempts to register or set `role: "admin"` on `/users/{uid}`.
   - Result: `PERMISSION_DENIED`.
2. **Payload 2 (Ghost Field Attack)**: User attempts to write `/resources/{id}` with an unauthorized field `__superAdminBypass: true`.
   - Result: `PERMISSION_DENIED` via `hasOnly()` validation.
3. **Payload 3 (Impersonate Author)**: User A creates a resource setting `authorId: "user_B"`.
   - Result: `PERMISSION_DENIED` (must equal `request.auth.uid`).
4. **Payload 4 (Tamper CreatedAt)**: User edits a resource attempting to rewrite `createdAt: 1970-01-01`.
   - Result: `PERMISSION_DENIED` (immutable field check).
5. **Payload 5 (Unauthenticated Resource Post)**: Unauthenticated visitor attempts to `create` in `/resources/{id}`.
   - Result: `PERMISSION_DENIED`.
6. **Payload 6 (Snoop Private Reports)**: Member A attempts to `get` or `list` reports submitted by Member B.
   - Result: `PERMISSION_DENIED`.
7. **Payload 7 (Arbitrary Settings Mutation)**: Non-admin member attempts to overwrite `/settings/general`.
   - Result: `PERMISSION_DENIED`.
8. **Payload 8 (Foreign Favorite Deletion)**: User A attempts to `delete` a favorite document belonging to User B.
   - Result: `PERMISSION_DENIED`.
9. **Payload 9 (Oversized Payload / Denial of Wallet)**: User attempts to post a resource with title length > 2000 chars.
   - Result: `PERMISSION_DENIED`.
10. **Payload 10 (Delete Another User's Resource)**: User A attempts to delete User B's published resource without admin role.
    - Result: `PERMISSION_DENIED`.
11. **Payload 11 (Fabricate Moderation Log)**: Non-admin member attempts to insert a record into `/moderationLogs/{id}`.
    - Result: `PERMISSION_DENIED`.
12. **Payload 12 (Re-activate Suspended Account)**: Suspended member sends update to `/users/{uid}` setting `status: "active"`.
    - Result: `PERMISSION_DENIED`.
