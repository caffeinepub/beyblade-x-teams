# Specification

## Summary
**Goal:** Set the deployed site’s primary URL to the custom domain https://beyhubx.com and ensure site metadata reflects the new canonical domain.

**Planned changes:**
- Configure deployment to serve the app at https://beyhubx.com/.
- Set up redirects from any previous default/temporary domain to https://beyhubx.com/ while preserving path and hash fragments.
- Update frontend HTML head metadata (e.g., canonical link and Open Graph URL) to reference https://beyhubx.com and remove old-domain references.

**User-visible outcome:** Users can access the app at https://beyhubx.com/, and any older domain redirects to it; shared links/previews resolve to the new domain.
