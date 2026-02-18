# Specification

## Summary
**Goal:** Stop forcing navigation and metadata to point to https://beyhubx.com so the app works correctly on the platform’s default/working deployment URL.

**Planned changes:**
- Remove the hard-coded redirect-to-domain behavior that forces users to https://beyhubx.com.
- Update HTML head metadata to no longer hard-code https://beyhubx.com in canonical link, og:url, and twitter:url values.

**User-visible outcome:** Users can open and use the app from the platform’s default/working URL without being redirected, and shared/preview metadata no longer points to an unreachable domain.
