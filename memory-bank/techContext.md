# Tech Context

## Technologies Used

*   **Frontend Framework/Library:** React (likely version 17+ or 18+)
*   **Language:** TypeScript
*   **Backend Database:** Firebase Firestore (NoSQL, cloud-hosted)
*   **Authentication:** Firebase Authentication (implied by Firebase usage and `src/contexts/AuthContext.tsx`)
*   **Styling:**
    *   CSS (plain CSS files like [`NestedNavbar.css`](src/components/layout/NestedNavbar.css))
    *   CSS Modules (e.g., [`NestedNavbar.module.css`](src/components/layout/NestedNavbar.module.css))
    *   Potentially a UI component library (e.g., Material-UI, Ant Design, Chakra UI - though no direct evidence yet, `src/components/ui/AppButton.tsx` might be part of a custom UI set or a wrapper). The presence of `theme/theme.ts` suggests a theming system, common with UI libraries or custom styling frameworks.
*   **Package Manager:** npm (inferred from `package.json` and `package-lock.json`)
*   **Build Tool:** Likely Create React App or a custom Webpack/Vite setup (common for React projects). `postcss.config.js` suggests PostCSS is used for CSS processing.
*   **Testing:**
    *   Jest (inferred from `jest.config.js`)
    *   React Testing Library (common with Jest for React, implied by `src/setupTests.ts` and test file names like `AppButton.test.tsx`).
*   **Version Control:** Git (assumed, standard practice).

## Development Setup

*   **Node.js and npm:** Required to install dependencies and run development scripts (e.g., `npm start`, `npm test`, `npm run build`).
*   **Code Editor:** VS Code is being used.
*   **Firebase Project:** A Firebase project must be set up and configured. The configuration is likely in `src/firebase/config.ts`.
*   **Environment Variables:** Potentially for Firebase configuration keys or other sensitive data (though not explicitly visible yet).

## Technical Constraints

*   **Reliance on Firebase:** The application is tightly coupled with Firebase services. Any issues with Firebase configuration, rules, or service availability will impact the app.
*   **Async Operations:** Data fetching from Firestore is asynchronous. Proper handling of promises, async/await, and loading/error states in components is crucial. This is a common area for bugs related to data display.
*   **NoSQL Data Modeling:** Firestore's NoSQL nature means data modeling and querying differ from relational databases. This can influence how data is fetched and structured.
*   **Client-Side Data Fetching:** If the frontend fetches directly from Firestore, client-side logic handles a lot of the data retrieval, which can be complex to manage.

## Dependencies (Key Ones from File Structure)

*   `firebase`: For interacting with Firebase services.
*   `react`, `react-dom`: Core React libraries.
*   `typescript`: For TypeScript language support.
*   Testing libraries: `jest`, `@testing-library/react`, etc.
*   Routing library: (e.g., `react-router-dom`) - not explicitly seen but highly probable.
*   State management: Potentially libraries like Redux or Zustand, though Context API seems to be the primary method from `src/contexts/`.
*   The `hello-pangea__dnd.d.ts` file in `src/types/` suggests the use of a drag-and-drop library, possibly `hello-pangea/dnd`.

The presence of [`mockData.service.ts`](src/services/mockData.service.ts) is a significant technical detail in the context of the current problem. The system might be configured to use this service in certain environments or due to an incomplete switch-over to live data services.