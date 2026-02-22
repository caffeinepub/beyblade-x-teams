# Specification

## Summary
**Goal:** Fix the "Actor not available" error that prevents users from creating new teams.

**Planned changes:**
- Debug and resolve the actor initialization issue in the CreateTeamPage component
- Add proper loading state handling to ensure actor is ready before allowing team creation
- Improve error handling to display meaningful messages if actor initialization fails
- Disable team creation form until backend actor is confirmed available

**User-visible outcome:** Users can successfully create new teams without encountering errors, with clear loading indicators during initialization and helpful error messages if issues occur.
