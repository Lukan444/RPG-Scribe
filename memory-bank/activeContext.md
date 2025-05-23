# Active Context

## Current Work Focus

The immediate focus is to diagnose and resolve an issue where UI components in the "RPG-Archivist-Web2" application are displaying placeholder/mock data instead of live data from the backend (Firebase/Firestore). The investigation is currently centered on [`src/pages/Dashboard.tsx`](src/pages/Dashboard.tsx:1).

## Recent Changes

*   **Memory Bank Initialization:** Core files created.
*   **Initial Analysis of `Dashboard.tsx`:**
    *   Identified explicit import and usage of [`MockDataService`](src/services/mockData.service.ts:57).
    *   Found two conditions under which mock data is intentionally loaded:
        1.  If `currentUser` is not available (lines 122-134).
        2.  If fetching real data results in no worlds (`combinedWorlds.length === 0`) (lines 169-179).
    *   The component attempts to fetch real data via [`RPGWorldService`](src/services/rpgWorld.service.ts:56) and then enhances it with direct Firestore calls.

## Next Steps (Diagnosis Plan)

Based on the analysis of [`Dashboard.tsx`](src/pages/Dashboard.tsx:1):

1.  **Clarify Authentication Status:** Determine if a user is logged in when the issue occurs.
2.  **Inspect Browser Console Logs:** Look for errors or specific log messages from `Dashboard.tsx` related to data fetching (e.g., "No current user", "No real worlds found", Firebase errors).
3.  **If `currentUser` is present and no obvious errors:**
    *   Investigate [`RPGWorldService`](src/services/rpgWorld.service.ts:1) (`getWorldsByUser`, `getPublicWorlds`) to see if it's correctly querying Firestore and returning data.
    *   Examine the direct Firestore queries within `Dashboard.tsx` for fetching creator and campaign details.
4.  **If `currentUser` is `null`:**
    *   Investigate the authentication flow (`src/contexts/AuthContext.tsx`, login process) to understand why `currentUser` is not being set correctly.

## Active Decisions and Considerations

*   **Focus on `Dashboard.tsx` logs:** The existing `console.log` statements in this component are valuable for initial diagnosis.
*   **Authentication is a key checkpoint:** The `currentUser` state directly influences the data source in `Dashboard.tsx`.
*   **Service layer is the next hop:** If auth is fine, the [`RPGWorldService`](src/services/rpgWorld.service.ts:1) becomes the primary suspect.

## Pending Questions for User:

*   When the dashboard shows mock data, are you logged into the application?
*   Can you provide browser console logs when loading/refreshing the dashboard page?