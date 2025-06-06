/**
 * AI Global Search Bar Component
 * 
 * A prominent AI-powered search bar for the main application header.
 * Provides semantic search capabilities with visual enhancements.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextInput,
  Paper,
  Stack,
  Group,
  Text,
  Badge,
  ActionIcon,
  Loader,
  ThemeIcon,
  Kbd,
  Tooltip,
  Box,
  Progress,
  Divider,
  SegmentedControl
} from '@mantine/core';

import { useDisclosure, useHotkeys, useDebouncedValue } from '@mantine/hooks';
import {
  IconBrain,
  IconSearch,
  IconUsers,
  IconMapPin,
  IconSword,
  IconCalendar,
  IconDatabase,
  IconNetwork,
  IconExternalLink,
  IconSparkles,
  IconSettings
} from '@tabler/icons-react';
import { aiSearchService, AISearchResult, SearchSuggestion } from '../../services/search/AISearchService';
import { EntityType } from '../../models/EntityType';
import { getEntityColor, ENTITY_ICONS } from '../../constants/iconConfig';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import { SearchResultItem } from './SearchResultItem';
import { HierarchicalSearchResults } from './HierarchicalSearchResults';
import { useTranslation } from 'react-i18next';
import './SearchAnimations.css';

/**
 * Props for AIGlobalSearchBar component
 */
interface AIGlobalSearchBarProps {
  /** Whether to show in compact mode */
  compact?: boolean;
  /** Custom placeholder text */
  placeholder?: string;
  /** Callback when search is performed */
  onSearch?: (query: string, results: AISearchResult[]) => void;
}

/**
 * Get icon for entity type
 */
const getEntityIcon = (entityType: EntityType) => {
  const IconComponent = ENTITY_ICONS[entityType];
  return IconComponent ? <IconComponent size={16} /> : <IconDatabase size={16} />;
};

/**
 * Get icon for search suggestion
 */
const getSuggestionIcon = (iconName: string) => {
  const icons: Record<string, React.ReactNode> = {
    IconUsers: <IconUsers size={16} />,
    IconMapPin: <IconMapPin size={16} />,
    IconSword: <IconSword size={16} />,
    IconCalendar: <IconCalendar size={16} />,
    IconDatabase: <IconDatabase size={16} />,
    IconNetwork: <IconNetwork size={16} />
  };
  return icons[iconName] || <IconSearch size={16} />;
};

/**
 * AI Global Search Bar Component
 */
export function AIGlobalSearchBar({
  compact = false,
  placeholder,
  onSearch
}: AIGlobalSearchBarProps) {
  const { t } = useTranslation(['ui', 'common']);
  const navigate = useNavigate();

  // Use global search hook
  const {
    query,
    results,
    suggestions,
    loading,
    isOpen,
    setQuery,
    openSearch,
    closeSearch,
    selectResult,
    selectSuggestion,
    searchInputRef
  } = useGlobalSearch({
    searchMode: 'hybrid',
    maxResults: 8,
    enableKeyboardShortcuts: true
  });

  // Local state for search mode
  const [searchMode, setSearchMode] = useState<'semantic' | 'keyword' | 'hybrid'>('hybrid');

  // Handle search callback
  useEffect(() => {
    if (onSearch && query && results.length > 0) {
      onSearch(query, results);
    }
  }, [query, results, onSearch]);

  /**
   * Handle search mode change
   */
  const handleSearchModeChange = useCallback((mode: string) => {
    setSearchMode(mode as 'semantic' | 'keyword' | 'hybrid');
  }, []);





  const defaultPlaceholder = placeholder ||
    t('ui:lists.search.aiSearch.placeholder');

  if (compact) {
    return (
      <Tooltip label={t('ui:lists.search.aiSearch.tooltips.openSearch')} position="bottom">
        <ActionIcon
          variant="subtle"
          size="lg"
          onClick={openSearch}
          aria-label={t('ui:lists.search.aiSearch.accessibility.searchInput')}
        >
          <IconBrain size={20} />
        </ActionIcon>
      </Tooltip>
    );
  }

  return (
    <>
      {/* Main Search Input */}
      <Box style={{ position: 'relative', flex: 1, maxWidth: 600 }}>
        <TextInput
          ref={searchInputRef}
          placeholder={defaultPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          onFocus={openSearch}
          leftSection={
            <Group gap={4}>
              <IconBrain
                size={18}
                style={{
                  color: 'var(--mantine-color-violet-6)',
                  filter: 'drop-shadow(0 1px 2px rgba(124, 58, 237, 0.3))',
                  transition: 'all 0.2s ease'
                }}
              />
              {loading && <Loader size="xs" />}
            </Group>
          }
          rightSection={
            <Group gap="xs">
              <Badge
                size="xs"
                variant="gradient"
                gradient={{ from: 'violet', to: 'blue' }}
                style={{
                  cursor: 'pointer',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setSearchMode(
                  searchMode === 'hybrid' ? 'semantic' :
                  searchMode === 'semantic' ? 'keyword' : 'hybrid'
                )}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
                }}
              >
                AI
              </Badge>
              <Kbd size="xs">⌘K</Kbd>
            </Group>
          }
          styles={{
            input: {
              background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.15) 0%, rgba(124, 58, 237, 0.08) 50%, rgba(0, 0, 0, 0.05) 100%)',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              borderRadius: '12px',
              fontSize: '14px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              transition: 'all 0.2s ease',
              '&:focus': {
                borderColor: 'rgba(124, 58, 237, 0.6)',
                boxShadow: '0 0 0 3px rgba(124, 58, 237, 0.2), 0 4px 16px rgba(0, 0, 0, 0.15)',
                background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.2) 0%, rgba(124, 58, 237, 0.12) 50%, rgba(0, 0, 0, 0.08) 100%)'
              },
              '&:hover': {
                borderColor: 'rgba(124, 58, 237, 0.4)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
              }
            }
          }}
        />
      </Box>

      {/* Search Results Modal */}
      {isOpen && (
        <Paper
          shadow="xl"
          radius="md"
          p="md"
          style={{
            position: 'fixed',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '60vh',
            overflow: 'auto',
            zIndex: 1000,
            background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.08) 0%, rgba(0, 0, 0, 0.95) 100%)',
            border: '1px solid rgba(124, 58, 237, 0.2)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          <Stack gap="md">
            {/* Search Input */}
            <TextInput
              ref={searchInputRef}
              placeholder={defaultPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              leftSection={<IconBrain size={18} />}
              rightSection={loading ? <Loader size="xs" /> : null}
              autoFocus
            />

            {/* Search Results */}
            {results.length > 0 && (
              <HierarchicalSearchResults
                results={results}
                onResultClick={(result) => {
                  selectResult(result);
                  closeSearch();
                }}
              />
            )}

            {/* Suggestions */}
            {results.length === 0 && suggestions.length > 0 && (
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">{t('ui:lists.search.aiSearch.suggestions')}</Text>
                {suggestions.map((suggestion, index) => (
                  <Group
                    key={index}
                    p="sm"
                    style={{
                      cursor: 'pointer',
                      borderRadius: '8px',
                      border: '1px solid var(--mantine-color-gray-3)'
                    }}
                    onClick={() => {
                      selectSuggestion(suggestion);
                    }}
                  >
                    {getSuggestionIcon(suggestion.icon)}
                    <div>
                      <Text size="sm">{suggestion.query}</Text>
                      <Text size="xs" c="dimmed">{suggestion.description}</Text>
                    </div>
                  </Group>
                ))}
              </Stack>
            )}

            {/* No Results */}
            {query && results.length === 0 && suggestions.length === 0 && !loading && (
              <Stack align="center" p="xl">
                <IconSearch size={48} style={{ opacity: 0.3 }} />
                <Text size="lg" fw={500}>{t('ui:lists.search.aiSearch.noResults')}</Text>
                <Text size="sm" c="dimmed" ta="center">
                  {t('ui:lists.search.aiSearch.noResultsDescription')}
                </Text>
              </Stack>
            )}
          </Stack>
        </Paper>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            zIndex: 999,
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={closeSearch}
        />
      )}
    </>
  );
}

export default AIGlobalSearchBar;
