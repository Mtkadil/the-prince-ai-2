# Firebase Security Specification

## Data Invariants
- `users/{userId}`: Only the user with `uid == userId` can read or write their own profile.
- `analyses/{analysisId}`: Only the `userId` specified in the document can read or write the analysis. `userId` must match `request.auth.uid`.

## The Dirty Dozen Payloads (Rejection Targets)
1. Creating a user profile with a different `uid` than the authenticated user.
2. Updating a user profile's `email` or `uid` after creation.
3. Reading another user's profile.
4. Creating an analysis for another `userId`.
5. Updating an analysis after creation (analyses are immutable in this version).
6. Injecting a `report` string larger than 10,000 characters.
7. Setting `createdAt` to a client-side timestamp instead of `request.time`.
8. Deleting an analysis belonging to someone else.
9. Listing all analyses without a `userId` filter.
10. Creating an analysis without being authenticated.
11. Spoofing `email_verified` as true in the payload.
12. Injecting shadow fields into the `Analysis` document.

## Test Runner Plan
I will implement `firestore.rules.test.ts` to verify these rejections.
