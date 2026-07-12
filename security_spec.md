# Firestore Security Specification

This document defines the security boundaries, invariant rules, and validation checks for the Firebase Firestore collections in our clinic application.

## 1. Data Invariants

- **Authentication Invariant**: No reads or writes are allowed to any database resource unless the user is securely authenticated with Google Login (`request.auth.uid != null`).
- **Owner Identity Invariant**: Users can create records (such as appointments and patients), but can only modify or delete documents if they are authenticated.
- **Strict Size/Format Constraints**:
  - All IDs must be valid alphanumeric sequences.
  - Document field lengths (such as notes or reasons) are strictly capped.

## 2. The Dirty Dozen Payloads (Security Attack Vectors)

Here are 12 specific payloads representing attempts to violate safety rules, all of which must return `PERMISSION_DENIED`:

1. **Anonymous Write**: Create an appointment without any auth credentials.
2. **Identity Spoofing (Owner Field)**: Write an appointment claiming a different user is the creator.
3. **Privilege Escalation**: Attempt to insert an `isAdmin` flag inside a user profile.
4. **Invalid ID Injection**: Use a 1.5KB string containing junk characters as a patient ID.
5. **Timestamp Hijacking**: Submit a client-side timestamp in `createdAt` that doesn't match `request.time`.
6. **Immutable Field Tampering**: Try to update the `createdAt` timestamp on an existing appointment document.
7. **Junk Field Pollution**: Insert unknown fields into a patient's document.
8. **Malicious Query Scrape**: List appointments without specifying filtering constraints.
9. **String Overflow**: Inject 10MB of text in the `reason` field of an appointment.
10. **Array Overflow**: Add 10,000 tags to a patient's list.
11. **Cross-Tenant Leak**: Attempt to read patient data from another clinic location without belonging to that clinic's authorized members list.
12. **Status Shortcutting**: Directly modify appointment status to 'Completed' bypassing required clinic verification states.

## 3. Test Runner Design

Our security rules test suite ensures every single vector listed in the "Dirty Dozen" returns a rejection, guaranteeing a robust, zero-trust perimeter.
