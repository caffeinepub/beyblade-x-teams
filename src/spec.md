# Specification

## Summary
**Goal:** Ensure each signed-in user can only belong to one team at a time by enforcing single-team membership in the backend and reflecting that restriction in the team creation and joining UI.

**Planned changes:**
- Backend: Block create team, request-to-join, and approval flows when the caller (or any approval target) is already a member of a different team, with stable, human-readable English error messages and all-or-nothing approval behavior.
- Backend: Add an authenticated query to return the caller’s current team id (or none) so the frontend can reliably detect membership.
- Frontend: Update Create Team page to detect when the user is already on a team, prevent submission, and provide navigation to the user’s current team page.
- Frontend: Update Team Detail joining controls to be non-actionable when the user is already on a different team, and show clear messaging/toasts while preserving existing join-button states.

**User-visible outcome:** Users who are already on a team cannot create another team or request to join a different team; the app clearly explains why and directs them to their current team. Team leaders can no longer approve join requests for users already on other teams, and disbanding a team clears membership so the leader can create or join a team afterward.
