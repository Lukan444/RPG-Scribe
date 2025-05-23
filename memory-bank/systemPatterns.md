# System Patterns

## System Architecture

The application "RPG-Archivist-Web2" appears to follow a **client-server architecture**.

*   **Frontend (Client-Side):**
    *   Built with **React** (indicated by `.tsx` files, `src/components/`, `src/pages/`, `src/hooks/`).
    *   Uses **TypeScript** for static typing.
    *   Likely employs a **component-based architecture**, a standard React pattern.
    *   State management might be handled by a combination of React Context API (`src/contexts/`) and component-local state.
    *   Routing is likely handled by a library like React Router, given the `src/pages/` directory structure.

*   **Backend (Server-Side):**
    *   **Firebase Firestore** is used as the primary database (inferred from `firestore.indexes.json`, `src/firebase/config.ts`, and the admin SDK JSON file).
    *   Backend logic directly interacting with Firestore is likely encapsulated within services. It's unclear if there's an intermediary backend server (e.g., Node.js with Firebase Admin SDK) or if the frontend interacts directly with Firestore using the Firebase client SDK (more likely for web apps).

## Key Technical Decisions

*   **React for UI:** A popular choice for building dynamic and interactive user interfaces.
*   **TypeScript:** Adds type safety, improving code quality and maintainability.
*   **Firebase/Firestore:** Provides a NoSQL cloud database, authentication, and other backend services, simplifying backend development.
*   **Service Layer (`src/services/`):** Encapsulation of data access logic. This is a crucial area for investigating the current data integration problem. Files like [`firestore.service.ts`](src/services/firestore.service.ts), [`campaign.service.ts`](src/services/campaign.service.ts), etc., are central.
*   **Mock Data Service (`src/services/mockData.service.ts`):** The existence of this service is highly relevant. It's possible this is being inadvertently used or that the switch to live data services is incomplete or faulty.

## Design Patterns in Use

*   **Component-Based Design:** Standard in React.
*   **Service Layer / Repository Pattern (Variant):** The `src/services/` directory suggests an attempt to separate data access logic from UI components.
*   **Provider Pattern (via React Context):** Used for managing global state or providing dependencies (e.g., [`AuthContext.tsx`](src/contexts/AuthContext.tsx), [`EntityContext.tsx`](src/contexts/EntityContext.tsx)).
*   **Custom Hooks (`src/hooks/`):** For encapsulating reusable component logic, potentially including data fetching hooks.

## Component Relationships (High-Level)

1.  **Pages (`src/pages/`)**: Top-level components, likely corresponding to routes. They compose various UI components.
2.  **UI Components (`src/components/`)**: Reusable UI elements. These are the components currently displaying mock data.
    *   They likely receive data via props or consume it from React Context.
    *   Some components might use custom hooks to fetch their own data.
3.  **Services (`src/services/`)**:
    *   Called by components (directly or indirectly via hooks/contexts) to fetch or manipulate data.
    *   Interact with Firebase/Firestore.
    *   The [`mockData.service.ts`](src/services/mockData.service.ts) is a key point of interest.
4.  **Contexts (`src/contexts/`)**: Provide state and data down the component tree, potentially holding fetched data or references to data-fetching functions.
5.  **Models (`src/models/`)**: Define the structure of data entities used throughout the application.

The flow is generally: User interaction/Page Load -> Page/Component -> Hook/Context -> Service -> Firebase. The current breakdown seems to be between the Service/Firebase step and the Component display, or an incorrect service (mock) is being used.