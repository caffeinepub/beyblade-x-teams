# Specification

## Summary
**Goal:** Fix the maximum call stack size exceeded error preventing the application from loading.

**Planned changes:**
- Identify and resolve infinite recursion or circular dependencies causing stack overflow
- Fix React Query hook invalidation patterns to prevent cascading refetch loops
- Correct useMemo dependencies in TeamDetailPage component to prevent infinite re-renders

**User-visible outcome:** The application loads successfully without crashing, and all team-related pages render correctly.
