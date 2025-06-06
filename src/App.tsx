import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
// Import ResizeObserver polyfill FIRST to prevent errors at source
import './utils/resizeObserverPolyfill';
// Import error handler as backup
import './utils/resizeObserverErrorHandler';
import { setupResizeObserverErrorHandler } from './utils/resizeObserverErrorHandler';
import { AuthProvider } from './contexts/AuthContext';
import { ActivityLogProvider } from './contexts/ActivityLogContext';
import { LanguageProvider } from './contexts/language/LanguageContext';
import { RPGWorldProvider } from './contexts/RPGWorldContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleBasedRoute from './components/auth/RoleBasedRoute';
import { UserRole } from './models/User';
import AppLayout from './components/layout/AppLayout';
import { Loader, Center } from '@mantine/core';
import PlaceholderPage from './components/common/PlaceholderPage';
import ErrorBoundary from './components/common/ErrorBoundary';
import I18nProvider from './components/i18n/I18nProvider';
import './utils/translationTest'; // Import translation test for development
import {
  IconBook,
  IconUsers,
  IconMap,
  IconSword,
  IconCalendarEvent,
  IconNotes,
  IconNetwork,
  IconTimeline,
  IconBrain,
  IconDeviceGamepad2,
  IconFileText,
  IconPhoto,
  IconChartBar,
  IconSettings,
  IconShieldLock,
  IconList,
  IconAdjustments
} from '@tabler/icons-react';

// Preload critical components
const preloadDashboard = () => {
  import('./pages/Dashboard').catch(() => {
    console.log('Preloading fallback Dashboard');
    import('./pages/SimpleDashboard');
  });
};

// Import RPGWorldContextWrapper
import RPGWorldContextWrapper from './components/common/RPGWorldContextWrapper';

// Lazy-loaded components with error handling
const Dashboard = lazy(() =>
  import('./pages/Dashboard')
    .catch(err => {
      console.error('Error loading Dashboard component:', err);
      return import('./pages/SimpleDashboard');
    })
);
const Profile = lazy(() => import('./pages/Profile'));
const Admin = lazy(() => import('./pages/Admin'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const NotFound = lazy(() => import('./pages/NotFound'));

// RPG World components
const RPGWorldHome = lazy(() => import('./pages/rpg-world/RPGWorldHome'));
const CampaignsPage = lazy(() => import('./pages/rpg-world/CampaignsPage'));
const CampaignDetailPage = lazy(() => import('./pages/rpg-world/CampaignDetailPage'));

// Character components
const CharacterListPage = lazy(() => import('./pages/characters/CharacterListPage'));
const CharacterDetailPage = lazy(() => import('./pages/characters/CharacterDetailPage'));
const CharacterFormPage = lazy(() => import('./pages/characters/CharacterFormPage'));

// Location components
const LocationListPage = lazy(() => import('./pages/locations/LocationListPage'));
const LocationDetailPage = lazy(() => import('./pages/locations/LocationDetailPage'));
const LocationFormPage = lazy(() => import('./pages/locations/LocationFormPage'));

// Item components
const ItemListPage = lazy(() => import('./pages/items/UnifiedItemListPage'));
const ItemDetailPage = lazy(() => import('./pages/items/ItemDetailPage'));
const ItemFormPage = lazy(() => import('./pages/items/ItemFormPage'));

// Event components
const EventListPage = lazy(() => import('./pages/events/EventListPage'));
const EventDetailPage = lazy(() => import('./pages/events/EventDetailPage'));
const EventFormPage = lazy(() => import('./pages/events/EventFormPage'));

// Session components
const SessionListPage = lazy(() => import('./pages/sessions/UnifiedSessionListPage'));
const SessionFormPage = lazy(() => import('./pages/sessions/SessionFormPage'));
const SessionDetailPage = lazy(() => import('./pages/sessions/SessionDetailPage'));

// Faction components
const FactionListPage = lazy(() => import('./pages/factions/UnifiedFactionListPage'));
const FactionFormPage = lazy(() => import('./pages/factions/FactionFormPage'));
const FactionDetailPage = lazy(() => import('./pages/factions/FactionDetailPage'));

// StoryArc components
const StoryArcListPage = lazy(() => import('./pages/story-arcs/UnifiedStoryArcListPage'));
const StoryArcFormPage = lazy(() => import('./pages/story-arcs/StoryArcFormPage'));
const StoryArcDetailPage = lazy(() => import('./pages/story-arcs/StoryArcDetailPage'));

// Note components
const NoteListPage = lazy(() => import('./pages/notes/UnifiedNoteListPage'));
const NoteFormPage = lazy(() => import('./pages/notes/NoteFormPage'));
const NoteDetailPage = lazy(() => import('./pages/notes/NoteDetailPage'));

// Visualization components
const MindMapPage = lazy(() => import('./pages/visualizations/MindMapPage'));
const RelationshipWebPage = lazy(() => import('./pages/visualizations/RelationshipWebPage'));
const TimelinePage = lazy(() => import('./pages/visualizations/TimelinePage'));

// Example components have been removed and their patterns documented in memory-bank/example-component-patterns.md

// RPG Worlds components (plural)
const RPGWorldListPage = lazy(() => import('./pages/rpg-worlds/RPGWorldListPage'));
const RPGWorldDetailPage = lazy(() => import('./pages/rpg-worlds/RPGWorldDetailPage'));
const RPGWorldFormPage = lazy(() => import('./pages/rpg-worlds/RPGWorldFormPage'));
const RPGWorldsCampaignDetailPage = lazy(() => import('./pages/rpg-worlds/CampaignDetailPage'));
const RPGWorldCharactersPage = lazy(() => import('./pages/rpg-worlds/RPGWorldCharactersPage'));
const RPGWorldLocationsPage = lazy(() => import('./pages/rpg-worlds/RPGWorldLocationsPage'));
const RPGWorldItemsPage = lazy(() => import('./pages/rpg-worlds/RPGWorldItemsPage'));
const RPGWorldEventsPage = lazy(() => import('./pages/rpg-worlds/RPGWorldEventsPage'));
const RPGWorldSessionsPage = lazy(() => import('./pages/rpg-worlds/RPGWorldSessionsPage'));
const RPGWorldFactionsPage = lazy(() => import('./pages/rpg-worlds/RPGWorldFactionsPage'));
const RPGWorldStoryArcsPage = lazy(() => import('./pages/rpg-worlds/RPGWorldStoryArcsPage'));
const RPGWorldNotesPage = lazy(() => import('./pages/rpg-worlds/RPGWorldNotesPage'));

// Entity Manager components
const EntityManagerPage = lazy(() => import('./pages/entity-manager/EntityManagerPage'));

// Campaign components
const CampaignsListPage = lazy(() => import('./pages/campaigns/CampaignsListPage'));
const CampaignCreatePage = lazy(() => import('./pages/campaigns/CampaignCreatePage'));
const CampaignEditPage = lazy(() => import('./pages/campaigns/CampaignEditPage'));
const CampaignDetailPage2 = lazy(() => import('./pages/campaigns/CampaignDetailPage'));
const CampaignCharactersPage = lazy(() => import('./pages/campaigns/CampaignCharactersPage'));
const CampaignLocationsPage = lazy(() => import('./pages/campaigns/CampaignLocationsPage'));


// Loading fallback component
const LoadingFallback = () => (
  <Center style={{ width: '100%', height: '100%', minHeight: '300px' }}>
    <Loader size="lg" />
  </Center>
);

// We now use the PlaceholderPage component from ./components/common/PlaceholderPage



function App() {
  // Preload critical components
  useEffect(() => {
    preloadDashboard();
  }, []);

  // Setup ResizeObserver error handler
  useEffect(() => {
    // Enable logging in development mode for debugging
    const enableLogging = process.env.NODE_ENV === 'development';

    // Setup the enhanced error handler and get the cleanup function
    const cleanupErrorHandler = setupResizeObserverErrorHandler(enableLogging);

    // Log initialization in development
    if (enableLogging) {
      console.log('[ResizeObserver Error Handler] Initialized with logging enabled');
    }

    // Clean up when component unmounts
    return () => {
      cleanupErrorHandler();
      if (enableLogging) {
        console.log('[ResizeObserver Error Handler] Cleaned up');
      }
    };
  }, []);

  return (
    <I18nProvider>
      <AuthProvider>
        <ActivityLogProvider>
          <LanguageProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
            {/* Main routes */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <RPGWorldProvider>
                    <Dashboard />
                  </RPGWorldProvider>
                </Suspense>
              </ErrorBoundary>
            } />

            {/* Entity Manager route */}
            <Route path="entity-manager" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <EntityManagerPage />
                </Suspense>
              </ErrorBoundary>
            } />

            {/* RPG World routes */}
            <Route path="rpg-world" element={
              <Suspense fallback={<LoadingFallback />}>
                <RPGWorldHome />
              </Suspense>
            } />

            {/* Campaign routes */}
            <Route path="campaigns" element={
              <Suspense fallback={<LoadingFallback />}>
                <CampaignsListPage />
              </Suspense>
            } />
            <Route path="campaigns/new" element={
              <Suspense fallback={<LoadingFallback />}>
                <CampaignCreatePage />
              </Suspense>
            } />
            <Route path="campaigns/:campaignId" element={
              <Suspense fallback={<LoadingFallback />}>
                <CampaignDetailPage2 />
              </Suspense>
            } />
            <Route path="campaigns/:campaignId/edit" element={
              <Suspense fallback={<LoadingFallback />}>
                <CampaignEditPage />
              </Suspense>
            } />
            <Route path="campaigns/:campaignId/characters" element={
              <Suspense fallback={<LoadingFallback />}>
                <CampaignCharactersPage />
              </Suspense>
            } />
            <Route path="campaigns/:campaignId/locations" element={
              <Suspense fallback={<LoadingFallback />}>
                <CampaignLocationsPage />
              </Suspense>
            } />

            {/* Character routes */}
            <Route path="characters" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <RPGWorldContextWrapper>
                    <CharacterListPage />
                  </RPGWorldContextWrapper>
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="characters/new" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <RPGWorldContextWrapper>
                    <CharacterFormPage />
                  </RPGWorldContextWrapper>
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="characters/:id" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <RPGWorldContextWrapper>
                    <CharacterDetailPage />
                  </RPGWorldContextWrapper>
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="characters/:id/edit" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <RPGWorldContextWrapper>
                    <CharacterFormPage />
                  </RPGWorldContextWrapper>
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="locations" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <LocationListPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="locations/new" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <LocationFormPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="locations/:id" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <LocationDetailPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="locations/:id/edit" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <LocationFormPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="items" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <ItemListPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="items/new" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <ItemFormPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="items/:id" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <ItemDetailPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="items/:id/edit" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <ItemFormPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="events" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <EventListPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="events/new" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <EventFormPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="events/:id" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <RPGWorldContextWrapper>
                    <EventDetailPage />
                  </RPGWorldContextWrapper>
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="events/:id/edit" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <EventFormPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="factions" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <FactionListPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="factions/new" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <FactionFormPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="factions/:id" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <FactionDetailPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="factions/:id/edit" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <FactionFormPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="story-arcs" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <StoryArcListPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="story-arcs/new" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <StoryArcFormPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="story-arcs/:id" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <StoryArcDetailPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="story-arcs/:id/edit" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <StoryArcFormPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="sessions" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <SessionListPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="sessions/new" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <SessionFormPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="sessions/:id" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <SessionDetailPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="sessions/:id/edit" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <SessionFormPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="notes" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <NoteListPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="notes/new" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <NoteFormPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="notes/:id" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <NoteDetailPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="notes/:id/edit" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <NoteFormPage />
                </Suspense>
              </ErrorBoundary>
            } />

            {/* Visualization routes */}
            <Route path="visualizations">
              <Route index element={<Navigate to="/visualizations/mindmap" replace />} />
              <Route path="mindmap" element={
                <Suspense fallback={<LoadingFallback />}>
                  <MindMapPage />
                </Suspense>
              } />
              <Route path="mindmap/:campaignId" element={
                <Suspense fallback={<LoadingFallback />}>
                  <MindMapPage />
                </Suspense>
              } />
              <Route path="timeline" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <RPGWorldContextWrapper>
                      <TimelinePage />
                    </RPGWorldContextWrapper>
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path="timeline/:campaignId" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <RPGWorldContextWrapper>
                      <TimelinePage />
                    </RPGWorldContextWrapper>
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path="relationshipweb" element={
                <Suspense fallback={<LoadingFallback />}>
                  <RelationshipWebPage />
                </Suspense>
              } />
              <Route path="relationshipweb/:entityType/:entityId" element={
                <Suspense fallback={<LoadingFallback />}>
                  <RelationshipWebPage />
                </Suspense>
              } />
            </Route>

            {/* Legacy routes for backward compatibility */}
            <Route path="mind-map" element={<Navigate to="/visualizations/mindmap" replace />} />
            <Route path="timeline" element={<Navigate to="/visualizations/timeline" replace />} />
            <Route path="relationships" element={<Navigate to="/visualizations/relationshipweb" replace />} />

            {/* AI Tools routes */}
            <Route path="ai-brain" element={
              <PlaceholderPage
                title="AI Brain"
                description="Access the AI assistant for campaign help"
                icon={<IconBrain size="2rem" />}
              />
            } />
            <Route path="npc-generator" element={
              <PlaceholderPage
                title="NPC Generator"
                description="Generate detailed NPCs with personalities and backgrounds"
                icon={<IconUsers size="2rem" />}
              />
            } />
            <Route path="plot-ideas" element={
              <PlaceholderPage
                title="Plot Ideas"
                description="Get AI-generated plot hooks and adventure ideas"
                icon={<IconBrain size="2rem" />}
              />
            } />

            {/* Game Sessions routes */}
            <Route path="live-play" element={
              <PlaceholderPage
                title="Live Play"
                description="Tools for running live game sessions"
                icon={<IconDeviceGamepad2 size="2rem" />}
              />
            } />
            <Route path="session-planner" element={
              <PlaceholderPage
                title="Session Planner"
                description="Plan upcoming game sessions and encounters"
                icon={<IconCalendarEvent size="2rem" />}
              />
            } />
            <Route path="transcripts" element={
              <PlaceholderPage
                title="Transcripts"
                description="View and search through session transcripts"
                icon={<IconFileText size="2rem" />}
              />
            } />

            {/* Media routes */}
            <Route path="images" element={
              <PlaceholderPage
                title="Images"
                description="Store and organize character portraits and scene images"
                icon={<IconPhoto size="2rem" />}
              />
            } />
            <Route path="maps" element={
              <PlaceholderPage
                title="Maps"
                description="Create and manage campaign maps and battle grids"
                icon={<IconMap size="2rem" />}
              />
            } />
            <Route path="audio" element={
              <PlaceholderPage
                title="Audio"
                description="Store music, ambient sounds, and voice recordings"
                icon={<IconFileText size="2rem" />}
              />
            } />

            {/* Analytics route */}
            <Route path="analytics" element={
              <PlaceholderPage
                title="Analytics"
                description="View statistics and insights about your campaigns"
                icon={<IconChartBar size="2rem" />}
              />
            } />

            {/* RPG Worlds routes */}
            <Route path="rpg-worlds">
              <Route index element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <RPGWorldListPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path="new" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <RPGWorldFormPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <RPGWorldDetailPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/edit" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <RPGWorldFormPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/campaigns/new" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <CampaignCreatePage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/campaigns/:campaignId" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <RPGWorldsCampaignDetailPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/campaigns/:campaignId/edit" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <CampaignEditPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/campaigns/:campaignId/characters" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <CampaignCharactersPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/campaigns/:campaignId/locations" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <CampaignLocationsPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/characters" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <RPGWorldCharactersPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/characters/new" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <RPGWorldContextWrapper>
                      <CharacterFormPage />
                    </RPGWorldContextWrapper>
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/characters/:id" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <RPGWorldContextWrapper>
                      <CharacterDetailPage />
                    </RPGWorldContextWrapper>
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/characters/:id/edit" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <RPGWorldContextWrapper>
                      <CharacterFormPage />
                    </RPGWorldContextWrapper>
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/locations" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <RPGWorldLocationsPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/locations/new" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <LocationFormPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/locations/:id" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <LocationDetailPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/locations/:id/edit" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <LocationFormPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/items" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <RPGWorldItemsPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/items/new" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <ItemFormPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/items/:id" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <ItemDetailPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/items/:id/edit" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <ItemFormPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/events" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <RPGWorldEventsPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/events/new" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <EventFormPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/events/:id" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <RPGWorldContextWrapper>
                      <EventDetailPage />
                    </RPGWorldContextWrapper>
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/events/:id/edit" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <EventFormPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/sessions" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <RPGWorldSessionsPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/sessions/new" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <SessionFormPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/sessions/:id" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <SessionDetailPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/sessions/:id/edit" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <SessionFormPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/factions" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <RPGWorldFactionsPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/factions/new" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <FactionFormPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/factions/:id" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <FactionDetailPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/factions/:id/edit" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <FactionFormPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/story-arcs" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <RPGWorldStoryArcsPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/story-arcs/new" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <StoryArcFormPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/story-arcs/:id" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <StoryArcDetailPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/story-arcs/:id/edit" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <StoryArcFormPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/notes" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <RPGWorldNotesPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/notes/new" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <NoteFormPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/notes/:id" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <NoteDetailPage />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/notes/:id/edit" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <NoteFormPage />
                  </Suspense>
                </ErrorBoundary>
              } />

              {/* World-specific visualization routes */}
              <Route path=":worldId/visualizations/timeline" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <RPGWorldContextWrapper>
                      <TimelinePage />
                    </RPGWorldContextWrapper>
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path=":worldId/campaigns/:campaignId/visualizations/timeline" element={
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <RPGWorldContextWrapper>
                      <TimelinePage />
                    </RPGWorldContextWrapper>
                  </Suspense>
                </ErrorBoundary>
              } />
            </Route>

            {/* Example routes have been removed and their patterns documented in memory-bank/example-component-patterns.md */}

            {/* User routes */}
            <Route path="profile" element={
              <Suspense fallback={<LoadingFallback />}>
                <Profile />
              </Suspense>
            } />
            <Route path="settings" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <SettingsPage />
                </Suspense>
              </ErrorBoundary>
            } />

            {/* Admin routes */}
            <Route
              path="admin"
              element={
                <RoleBasedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<LoadingFallback />}>
                    <Admin />
                  </Suspense>
                </RoleBasedRoute>
              }
            />
            <Route
              path="admin/logs"
              element={
                <RoleBasedRoute allowedRoles={['admin']}>
                  <PlaceholderPage
                    title="Activity Logs"
                    description="View user activity and system logs"
                    icon={<IconList size="2rem" />}
                  />
                </RoleBasedRoute>
              }
            />
            <Route
              path="admin/settings"
              element={
                <RoleBasedRoute allowedRoles={['admin']}>
                  <PlaceholderPage
                    title="System Settings"
                    description="Configure system-wide settings and defaults"
                    icon={<IconAdjustments size="2rem" />}
                  />
                </RoleBasedRoute>
              }
            />
          </Route>

          {/* Auth routes */}
          <Route path="/login" element={
            <Suspense fallback={<LoadingFallback />}>
              <Login />
            </Suspense>
          } />
          <Route path="/register" element={
            <Suspense fallback={<LoadingFallback />}>
              <Register />
            </Suspense>
          } />
          <Route path="/forgot-password" element={
            <Suspense fallback={<LoadingFallback />}>
              <ForgotPassword />
            </Suspense>
          } />
          <Route path="/reset-password/:token" element={
            <Suspense fallback={<LoadingFallback />}>
              <ResetPassword />
            </Suspense>
          } />

          {/* Not found route */}
          <Route path="*" element={
            <Suspense fallback={<LoadingFallback />}>
              <NotFound />
            </Suspense>
          } />
        </Routes>
      </BrowserRouter>
        </LanguageProvider>
      </ActivityLogProvider>
    </AuthProvider>
    </I18nProvider>
  );
}

export default App;
