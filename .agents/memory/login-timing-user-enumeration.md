---
name: Login timing user enumeration
description: How to avoid leaking whether a username exists via login endpoint response timing.
---

For custom username/password login endpoints, if the handler short-circuits (returns 401) as soon as it fails to find the user — before attempting a bcrypt/scrypt compare — the endpoint runs faster for unknown usernames than for known ones with a wrong password. This measurable timing difference lets an attacker enumerate valid usernames.

**Why:** A code-review pass caught this in a from-scratch custom auth implementation (username/password login replacing an OIDC-based flow). It's an easy miss because the logic reads naturally as two sequential guard clauses.

**How to apply:** Always perform the password hash comparison, even when the user lookup fails — compare against a precomputed dummy hash in that case — and only branch on the combined result at the end. Return the same generic error message either way.
