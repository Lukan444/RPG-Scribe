# UI Components Technical Specification

## Overview

This document provides detailed technical specifications for implementing the UI components outlined in the UI Design Master Plan. It includes component architecture, state management, data flow, and implementation details for each major UI component.

## Technology Stack

- **Frontend Framework**: React with TypeScript
- **UI Component Library**: Material UI (MUI)
- **Tree View Component**: @react-aria/treeview for accessible navigation
- **Styling**: Tailwind CSS with custom theme
- **Animation**: Framer Motion
- **State Management**: React Context API and Redux
- **Visualization**: Cytoscape.js for Mind Map, custom Timeline implementation
- **Testing**: Jest, React Testing Library, Cypress

## Core Architecture

### Component Hierarchy

```
App
├── Layout
│   ├── Sidebar
│   ├── MainContent
│   └── ContextPanel
├── Routes
│   ├── Dashboard
│   ├── DataHub
│   ├── MindMap
│   ├── Timeline
│   ├── AIBrain
│   ├── LivePlay
│   ├── TranscriptsManager
│   ├── ImageLibrary
│   ├── Analytics
│   └── Settings
└── Shared
    ├── Navigation
    ├── EntityContext
    ├── SearchOverlay
    └── NotificationSystem
```

### State Management

1. **Global State**:
   - `EntityContext`: Manages the currently selected entity across all views
   - `AuthContext`: Manages user authentication and permissions
   - `UIContext`: Manages UI state like sidebar visibility, theme, etc.
   - `NotificationContext`: Manages application notifications and alerts

2. **Route-Specific State**:
   - Each route component manages its own local state
   - Complex routes like DataHub and MindMap use their own context providers

3. **Data Flow**:
   - API services fetch data from the backend
   - Data is stored in context or local state
   - Components subscribe to context changes
   - Updates are sent to the backend via API services

## Component Specifications

### Layout Components

#### Responsive Grid Layout

```jsx
// Layout.tsx
const Layout = ({ children }) => {
  const { isMobile, isTablet, isDesktop } = useBreakpoints();

  return (
    <div className={`
      grid
      ${isDesktop ? 'grid-cols-[280px_minmax(0,1fr)_minmax(0,400px)]' : ''}
      ${isTablet ? 'grid-cols-[280px_minmax(0,1fr)]' : ''}
      ${isMobile ? 'grid-cols-1' : ''}
    `}>
      <Sidebar />
      <MainContent>{children}</MainContent>
      {isDesktop && <ContextPanel />}
    </div>
  );
};
```

#### Sidebar / Drawer

```jsx
// Sidebar.tsx
const Sidebar = () => {
  const { isMobile } = useBreakpoints();
  const { sidebarOpen, toggleSidebar } = useUIContext();

  return (
    <div className={`
      bg-surface text-text-primary border-r border-accent/20
      ${isMobile ? 'fixed inset-y-0 left-0 z-50 transform transition-transform' : ''}
      ${isMobile && !sidebarOpen ? '-translate-x-full' : ''}
    `}>
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="p-4 flex justify-center border-b border-accent/20">
          <Logo className="h-10" />
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-4">
          <NavItems />
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-t border-accent/20">
          <UserProfile />
        </div>
      </div>
    </div>
  );
};
```

### Data Hub Components

#### Tree View

```jsx
// DataTree.tsx
import { useTreeState } from '@react-aria/treeview';

const DataTree = ({ items }) => {
  const state = useTreeState({ items });

  return (
    <ul className="tree-view" {...state.treeProps}>
      {Array.from(state.collection).map(item => (
        <TreeItem
          key={item.key}
          item={item}
          state={state}
          icon={getIconForType(item.value.type)}
        />
      ))}
    </ul>
  );
};
```

#### Tree Item

```jsx
// TreeItem.tsx
import { useTreeItem } from '@react-aria/treeview';
import { motion } from 'framer-motion';

const TreeItem = ({ item, state, icon }) => {
  const ref = useRef();
  const { itemProps, expandButtonProps, isExpanded } = useTreeItem({ item, state }, ref);

  return (
    <li {...itemProps} ref={ref} className="relative">
      <div className="flex items-center p-2 hover:bg-surface-light focus-visible:ring-2 ring-accent/70">
        <button {...expandButtonProps} className="mr-2">
          {isExpanded ? '▼' : '►'}
        </button>
        <span className="before:content-[''] before:absolute before:inset-0 before:bg-[url('/feather.svg')] before:opacity-5">
          {icon}
          {item.value.name}
        </span>
      </div>
      {isExpanded && item.children?.length > 0 && (
        <motion.ul
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          exit={{ height: 0 }}
          className="pl-6"
        >
          {Array.from(item.children).map(child => (
            <TreeItem
              key={child.key}
              item={child}
              state={state}
              icon={getIconForType(child.value.type)}
            />
          ))}
        </motion.ul>
      )}
    </li>
  );
};
```

#### Editor Panel

```jsx
// EditorPanel.tsx
const EditorPanel = ({ entity }) => {
  const [activeTab, setActiveTab] = useState('details');

  const tabs = {
    details: <DetailsTab entity={entity} />,
    inventory: entity.type === 'character' ? <InventoryTab entity={entity} /> : null,
    statblock: entity.type === 'character' ? <StatBlockTab entity={entity} /> : null,
    powers: entity.type === 'character' ? <PowersTab entity={entity} /> : null,
    relationships: <RelationshipsTab entity={entity} />,
    notes: <NotesTab entity={entity} />,
    images: <ImagesTab entity={entity} />
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex border-b">
        {Object.entries(tabs).map(([key, component]) => (
          component && (
            <button
              key={key}
              className={`px-4 py-2 ${activeTab === key ? 'border-b-2 border-accent' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          )
        ))}
      </div>
      <div className="flex-1 overflow-auto p-4">
        {tabs[activeTab]}
      </div>
    </div>
  );
};
```

### Mind Map Components

#### Cytoscape Integration

```jsx
// MindMap.tsx
import CytoscapeComponent from 'react-cytoscapejs';

const MindMap = ({ data, selectedId }) => {
  const cyRef = useRef(null);
  const [viewMode, setViewMode] = useState('2d'); // '2d' or '3d'

  const elements = useMemo(() => convertDataToCytoscapeFormat(data), [data]);

  useEffect(() => {
    if (cyRef.current && selectedId) {
      const node = cyRef.current.getElementById(selectedId);
      if (node) {
        cyRef.current.center(node);
        node.select();
      }
    }
  }, [selectedId]);

  // Define entity type colors
  const entityColors = {
    character: '#1A9B9B', // teal
    location: '#9B1A9B', // purple
    item: '#9B9B1A', // gold
    event: '#1A9B1A', // green
    session: '#1A1A9B', // blue
    default: '#1A9B9B' // default teal
  };

  const layout = {
    name: 'cose',
    animate: true,
    nodeDimensionsIncludeLabels: true,
    randomize: false,
    componentSpacing: 100,
    nodeRepulsion: 10000,
    nodeOverlap: 20,
    idealEdgeLength: 100,
    edgeElasticity: 100,
    nestingFactor: 5,
    gravity: 80,
    numIter: 1000,
    initialTemp: 200,
    coolingFactor: 0.95,
    minTemp: 1.0
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center p-4 border-b border-accent/20">
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 rounded ${viewMode === '2d' ? 'bg-accent text-white' : 'bg-surface-light text-text-primary'}`}
            onClick={() => setViewMode('2d')}
          >
            2D
          </button>
          <button
            className={`px-3 py-1 rounded ${viewMode === '3d' ? 'bg-accent text-white' : 'bg-surface-light text-text-primary'}`}
            onClick={() => setViewMode('3d')}
          >
            3D
          </button>
        </div>
        <div className="ml-auto flex space-x-2">
          <button className="p-2 rounded bg-surface-light text-accent hover:bg-accent/10 transition-colors">
            <FilterIcon size={16} />
          </button>
          <button className="p-2 rounded bg-surface-light text-accent hover:bg-accent/10 transition-colors">
            <SearchIcon size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <CytoscapeComponent
          elements={elements}
          layout={layout}
          style={{ width: '100%', height: '100%' }}
          cy={(cy) => { cyRef.current = cy; }}
          stylesheet={[
            {
              selector: 'node',
              style: {
                'background-color': 'data(color)',
                'label': 'data(label)',
                'width': 50,
                'height': 50,
                'shape': 'hexagon',
                'text-valign': 'bottom',
                'text-halign': 'center',
                'text-margin-y': 10,
                'border-width': 2,
                'border-color': 'data(color)',
                'text-outline-width': 2,
                'text-outline-color': '#0D1117',
                'color': '#FFFFFF',
                'font-size': 14,
                'font-weight': 'bold',
                'text-max-width': 100,
                'text-wrap': 'ellipsis',
                'text-overflow-wrap': 'anywhere',
                'shadow-blur': 15,
                'shadow-color': 'data(color)',
                'shadow-opacity': 0.5,
                'shadow-offset-x': 0,
                'shadow-offset-y': 0
              }
            },
            {
              selector: 'edge',
              style: {
                'width': 3,
                'line-color': 'data(color)',
                'target-arrow-color': 'data(color)',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier',
                'opacity': 0.7,
                'line-style': 'solid',
                'arrow-scale': 1.5,
                'line-gradient-stop-colors': ['data(sourceColor)', 'data(targetColor)'],
                'line-gradient-stop-positions': [0, 100]
              }
            },
            {
              selector: ':selected',
              style: {
                'border-width': 4,
                'border-color': '#FFFFFF',
                'shadow-blur': 25,
                'shadow-color': 'data(color)',
                'shadow-opacity': 0.8,
                'shadow-offset-x': 0,
                'shadow-offset-y': 0,
                'z-index': 999
              }
            },
            {
              selector: 'node:active',
              style: {
                'overlay-color': '#FFFFFF',
                'overlay-padding': 10,
                'overlay-opacity': 0.3
              }
            }
          ]}
        />

        {/* Quick action buttons for selected node */}
        {selectedId && (
          <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
            <button className="p-3 rounded-full bg-accent text-white shadow-lg hover:bg-accent-light transition-colors">
              <ViewIcon size={20} />
            </button>
            <button className="p-3 rounded-full bg-accent text-white shadow-lg hover:bg-accent-light transition-colors">
              <ImageIcon size={20} />
            </button>
            <button className="p-3 rounded-full bg-accent text-white shadow-lg hover:bg-accent-light transition-colors">
              <TimelineIcon size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
```

### Timeline Components

#### Timeline View

```jsx
// Timeline.tsx
const Timeline = ({ events, sessions }) => {
  const [timelineType, setTimelineType] = useState('in-game');
  const [zoom, setZoom] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all', 'sessions', 'events', 'characters'

  const timelineData = useMemo(() => {
    let data = timelineType === 'in-game'
      ? sortByInGameDate([...events, ...sessions])
      : sortByRealLifeDate([...events, ...sessions]);

    // Apply filters
    if (filter !== 'all') {
      data = data.filter(item => {
        if (filter === 'sessions') return item.type === 'session';
        if (filter === 'events') return item.type === 'event';
        if (filter === 'characters') return item.involvedCharacters?.length > 0;
        return true;
      });
    }

    return data;
  }, [events, sessions, timelineType, filter]);

  return (
    <div className="h-full flex flex-col bg-surface">
      <div className="flex items-center p-4 border-b border-accent/20">
        <div className="flex items-center space-x-4">
          <div className="text-text-secondary">Toggle ▸</div>
          <div className="flex bg-surface-light rounded overflow-hidden">
            <button
              className={`px-4 py-2 ${timelineType === 'in-game' ? 'bg-accent text-white' : 'text-text-secondary'}`}
              onClick={() => setTimelineType('in-game')}
            >
              In-Game
            </button>
            <button
              className={`px-4 py-2 ${timelineType === 'real-life' ? 'bg-accent text-white' : 'text-text-secondary'}`}
              onClick={() => setTimelineType('real-life')}
            >
              Real-Life
            </button>
          </div>
        </div>

        <div className="ml-auto flex items-center space-x-4">
          <div className="flex bg-surface-light rounded overflow-hidden">
            <button
              className="p-2 text-accent hover:bg-accent/10 transition-colors"
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            >
              <MinusIcon size={16} />
            </button>
            <span className="px-2 flex items-center text-text-secondary">
              {Math.round(zoom * 100)}%
            </span>
            <button
              className="p-2 text-accent hover:bg-accent/10 transition-colors"
              onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            >
              <PlusIcon size={16} />
            </button>
          </div>

          <select
            className="bg-surface-light text-text-primary border border-accent/20 rounded px-3 py-2"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Items</option>
            <option value="sessions">Sessions Only</option>
            <option value="events">Events Only</option>
            <option value="characters">Character Involvement</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="relative" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
          {/* Timeline axis with date markers */}
          <div className="absolute left-0 w-full h-1 bg-accent/30 top-10"></div>

          {/* Timeline items */}
          <div className="pt-16">
            {timelineData.map(item => (
              <TimelineItem
                key={item.id}
                item={item}
                type={timelineType}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// TimelineItem component
const TimelineItem = ({ item, type }) => {
  const isSession = item.type === 'session';

  return (
    <div className={`
      relative mb-8 ml-4
      ${isSession ? 'bg-surface-light rounded-lg p-4 border border-accent/20 shadow-lg' : ''}
    `}>
      {/* Date marker */}
      <div className="absolute -left-4 -top-4 flex flex-col items-center">
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center
          ${isSession ? 'bg-accent' : 'bg-secondary'}
          shadow-lg shadow-${isSession ? 'accent' : 'secondary'}/30
        `}>
          {isSession ? <SessionIcon size={16} /> : <EventIcon size={16} />}
        </div>
        <div className="text-xs text-text-secondary mt-1">
          {type === 'in-game' ? formatInGameDate(item.inGameDate) : formatRealDate(item.date)}
        </div>
      </div>

      {/* Content */}
      <div className={isSession ? '' : 'ml-8'}>
        <h3 className="text-lg font-bold text-text-primary">{item.name}</h3>

        {isSession && (
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-text-secondary">Duration</div>
              <div className="text-sm text-text-primary">{formatDuration(item.duration)}</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary">Participants</div>
              <div className="text-sm text-text-primary">{item.participants.join(', ')}</div>
            </div>
          </div>
        )}

        {!isSession && (
          <p className="text-sm text-text-secondary mt-1">{item.description}</p>
        )}

        {/* Quick actions */}
        <div className="mt-4 flex space-x-2">
          <button className="text-xs px-2 py-1 rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors">
            View Details
          </button>
          {isSession && (
            <button className="text-xs px-2 py-1 rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors">
              Transcript
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
```

### AI Brain Components

#### Review Queue

```jsx
// ReviewQueue.tsx
const ReviewQueue = ({ proposals }) => {
  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-bold p-4 border-b">Review Queue</h2>
      <div className="flex-1 overflow-auto">
        {proposals.map(proposal => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            onApprove={() => handleApprove(proposal.id)}
            onMerge={() => handleMerge(proposal.id)}
            onReject={() => handleReject(proposal.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

#### Story-Telling Mode

```jsx
// StoryTellingMode.tsx
const StoryTellingMode = ({ session }) => {
  const [summary, setSummary] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  useEffect(() => {
    if (session) {
      generateSessionSummary(session.id).then(setSummary);
      generateFollowUpQuestions(session.id).then(setQuestions);
    }
  }, [session]);

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-bold p-4 border-b">Story-Telling Mode</h2>
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-surface-light p-4 rounded mb-4">
          <h3 className="font-bold mb-2">Session Summary</h3>
          <p>{summary}</p>
        </div>
        <div>
          <h3 className="font-bold mb-2">Follow-up Questions</h3>
          {questions.map((question, index) => (
            <div key={index} className="mb-4">
              <p className="mb-2">{question}</p>
              <div className="flex">
                <input
                  type="text"
                  className="flex-1 p-2 rounded-l"
                  value={answers[question] || ''}
                  onChange={(e) => setAnswers({...answers, [question]: e.target.value})}
                />
                <button
                  className="bg-accent text-white p-2 rounded-r"
                  onClick={() => handleAnswer(question, answers[question])}
                >
                  Submit
                </button>
                {isVoiceMode && (
                  <button
                    className="bg-accent text-white p-2 rounded ml-2"
                    onClick={() => startVoiceInput(question)}
                  >
                    🎤
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 border-t">
        <button
          className="bg-accent text-white p-2 rounded"
          onClick={() => setIsVoiceMode(!isVoiceMode)}
        >
          {isVoiceMode ? 'Disable Voice Input' : 'Enable Voice Input'}
        </button>
      </div>
    </div>
  );
};
```

### Live Play Components

#### Recording HUD

```jsx
// RecordingHUD.tsx
const RecordingHUD = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [combatMode, setCombatMode] = useState(false);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center p-4 border-b">
        <button
          className={`p-2 rounded mr-4 ${isRecording ? 'bg-red-500' : 'bg-accent'}`}
          onClick={() => setIsRecording(!isRecording)}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        <button
          className={`p-2 rounded ${combatMode ? 'bg-red-500' : 'bg-gray-500'}`}
          onClick={() => setCombatMode(!combatMode)}
        >
          Combat Mode
        </button>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-4 p-4">
        <div className="bg-surface-light rounded p-4">
          {combatMode ? (
            <CombatTracker />
          ) : (
            <DiceRoller />
          )}
        </div>
        <div className="bg-surface-light rounded p-4 overflow-auto">
          <h3 className="font-bold mb-2">Live Transcript</h3>
          {transcript.map((line, index) => (
            <div
              key={index}
              className={`mb-2 p-2 rounded ${
                highlights.includes(index) ? 'bg-accent/20 border-l-4 border-accent' : ''
              }`}
            >
              <strong>{line.speaker}:</strong> {line.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### Image Library Components

#### Image Grid

```jsx
// ImageGrid.tsx
const ImageGrid = ({ images, onDragStart }) => {
  const [filter, setFilter] = useState('all');

  const filteredImages = useMemo(() => {
    if (filter === 'all') return images;
    return images.filter(img => img.entityType === filter);
  }, [images, filter]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center p-4 border-b">
        <select
          className="p-2 rounded"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Images</option>
          <option value="character">Characters</option>
          <option value="location">Locations</option>
          <option value="item">Items</option>
          <option value="event">Events</option>
          <option value="session">Sessions</option>
        </select>
        <button className="ml-auto bg-accent text-white p-2 rounded">
          Upload Image
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map(image => (
            <div
              key={image.id}
              className="relative aspect-square bg-surface-light rounded overflow-hidden"
              draggable
              onDragStart={(e) => onDragStart(e, image)}
            >
              <img
                src={image.url}
                alt={image.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm truncate">
                {image.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### Analytics Components

#### Relationship Heat Map

```jsx
// RelationshipHeatMap.tsx
const RelationshipHeatMap = ({ relationships }) => {
  const characters = useMemo(() => {
    return [...new Set(relationships.flatMap(r => [r.source, r.target]))];
  }, [relationships]);

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-bold p-4 border-b">Relationship Heat Map</h2>
      <div className="flex-1 overflow-auto p-4">
        <div className="grid" style={{ gridTemplateColumns: `auto ${characters.map(() => '1fr').join(' ')}` }}>
          <div></div>
          {characters.map(char => (
            <div key={char.id} className="p-2 text-center font-bold rotate-45 origin-bottom-left">
              {char.name}
            </div>
          ))}
          {characters.map(source => (
            <React.Fragment key={source.id}>
              <div className="p-2 font-bold">{source.name}</div>
              {characters.map(target => {
                const rel = relationships.find(
                  r => (r.source.id === source.id && r.target.id === target.id) ||
                       (r.source.id === target.id && r.target.id === source.id)
                );
                const strength = rel ? rel.strength : 0;
                return (
                  <div
                    key={target.id}
                    className="aspect-square m-1 rounded"
                    style={{
                      backgroundColor: `rgba(29, 255, 255, ${strength / 100})`,
                      border: source.id === target.id ? 'none' : '1px solid #333'
                    }}
                    title={`${source.name} - ${target.name}: ${strength}%`}
                  ></div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
```

## Navigation and Routing

### Router Configuration

```jsx
// AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="data-hub" element={<DataHub />} />
          <Route path="mind-map" element={<MindMap />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="ai-brain" element={<AIBrain />} />
          <Route path="live-play" element={<LivePlay />} />
          <Route path="transcripts" element={<TranscriptsManager />} />
          <Route path="images" element={<ImageLibrary />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
```

### Navigation Helper

```jsx
// navigation.ts
export const navigateTo = (
  entityId: string,
  view: 'hub' | 'map' | 'timeline' | 'transcript' | 'image',
  navigate: NavigateFunction
) => {
  switch (view) {
    case 'hub':
      navigate(`/data-hub?entity=${entityId}`);
      break;
    case 'map':
      navigate(`/mind-map?entity=${entityId}`);
      break;
    case 'timeline':
      navigate(`/timeline?entity=${entityId}`);
      break;
    case 'transcript':
      navigate(`/transcripts?entity=${entityId}`);
      break;
    case 'image':
      navigate(`/images?entity=${entityId}`);
      break;
  }
};
```

## State Management

### Entity Context

```tsx
// EntityContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface EntityContextType {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  selectedEntity: any | null;
  loading: boolean;
  error: Error | null;
}

const EntityContext = createContext<EntityContextType | undefined>(undefined);

export const EntityProvider = ({ children }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (selectedId) {
      setLoading(true);
      fetchEntity(selectedId)
        .then(entity => {
          setSelectedEntity(entity);
          setLoading(false);
        })
        .catch(err => {
          setError(err);
          setLoading(false);
        });
    } else {
      setSelectedEntity(null);
    }
  }, [selectedId]);

  return (
    <EntityContext.Provider
      value={{ selectedId, setSelectedId, selectedEntity, loading, error }}
    >
      {children}
    </EntityContext.Provider>
  );
};

export const useEntity = () => {
  const context = useContext(EntityContext);
  if (context === undefined) {
    throw new Error('useEntity must be used within an EntityProvider');
  }
  return context;
};
```

## Accessibility Considerations

1. **Keyboard Navigation**:
   - All interactive elements are focusable
   - Tree view supports arrow key navigation
   - Tab order follows a logical flow
   - Keyboard shortcuts for common actions

2. **Screen Reader Support**:
   - ARIA attributes for all interactive elements
   - Descriptive labels for all form controls
   - Announcements for dynamic content changes
   - Alternative text for all images

3. **Color Contrast**:
   - All text meets WCAG AA contrast requirements
   - Color is not the only means of conveying information
   - Focus indicators are visible in all color schemes

4. **TV Remote Support**:
   - D-pad navigation for all interactive elements
   - Focus management for TV interfaces
   - Large touch targets for remote control

## Performance Optimization

1. **Code Splitting**:
   - Route-based code splitting
   - Component-level lazy loading
   - Dynamic imports for heavy components

2. **Memoization**:
   - Use `useMemo` for expensive calculations
   - Use `useCallback` for event handlers
   - Use `React.memo` for pure components

3. **Virtualization**:
   - Virtual scrolling for long lists
   - Pagination for large data sets
   - Lazy loading for images

4. **Caching**:
   - Cache API responses
   - Use local storage for persistent data
   - Implement optimistic updates

## Testing Strategy

1. **Unit Tests**:
   - Test individual components in isolation
   - Mock dependencies and context
   - Test different states and edge cases

2. **Integration Tests**:
   - Test component interactions
   - Test data flow between components
   - Test context providers and consumers

3. **End-to-End Tests**:
   - Test complete user flows
   - Test keyboard navigation
   - Test screen reader compatibility
   - Test TV remote navigation

## Implementation Timeline

1. **Phase 1: Core Layout and Navigation** (2 weeks)
   - Implement responsive grid layout
   - Create sidebar/drawer navigation
   - Set up routing and navigation helpers
   - Implement entity context

2. **Phase 2: Data Hub and Mind Map** (3 weeks)
   - Implement tree view with @react-aria/treeview
   - Create editor panel with tabs
   - Implement Cytoscape.js integration
   - Set up bidirectional sync

3. **Phase 3: AI Brain and Live Play** (3 weeks)
   - Implement proposal review interface
   - Create storytelling interface
   - Implement voice input/output
   - Create recording HUD

4. **Phase 4: Timeline and Transcripts** (2 weeks)
   - Implement timeline visualization
   - Create transcript editor
   - Implement dual-calendar toggle
   - Add session pills and event markers

5. **Phase 5: Image Library and Analytics** (2 weeks)
   - Create image grid with filtering
   - Implement drag-and-drop
   - Create relationship heat map
   - Implement session pacing metrics

6. **Phase 6: Search and Settings** (2 weeks)
   - Implement global search
   - Create settings interface
   - Add user profile management
   - Implement export and import functionality

## Conclusion

This technical specification provides a detailed blueprint for implementing the UI components outlined in the UI Design Master Plan. By following this specification, developers can create a consistent, accessible, and performant user interface that meets the needs of tabletop RPG players and game masters across desktop, tablet, and TV interfaces.

The implementation will be phased over approximately 14 weeks, with each phase building on the previous one. Regular testing and feedback will be incorporated throughout the development process to ensure the final product meets the requirements and expectations of users.
