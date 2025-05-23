import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  TextInput,
  Select,
  Box,
  Alert,
  Breadcrumbs,
  Anchor,
  Stack,
  rem
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconAlertCircle,
  IconWorld
} from '@tabler/icons-react';
import { RPGWorldList } from '../../components/rpg-world/RPGWorldList';
import { RPGWorld } from '../../models/RPGWorld';
import { RPGWorldService } from '../../services/rpgWorld.service';
import { useAuth } from '../../contexts/AuthContext';

/**
 * RPG Worlds List Page
 */
export function RPGWorldsListPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const rpgWorldService = new RPGWorldService();

  // State for RPG Worlds
  const [worlds, setWorlds] = useState<RPGWorld[]>([]);
  const [filteredWorlds, setFilteredWorlds] = useState<RPGWorld[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSystem, setFilterSystem] = useState<string | null>(null);
  const [filterGenre, setFilterGenre] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch RPG Worlds
  useEffect(() => {
    const fetchWorlds = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        setError(null);

        // Get worlds created by the current user
        // Handle both Firebase user (uid) and mock user (id)
        const userId = currentUser.uid || currentUser.id;
        console.log('Using user ID for fetching worlds:', userId);
        const userWorlds = await rpgWorldService.getWorldsByUser(userId);

        // Get public worlds
        const publicWorlds = await rpgWorldService.getPublicWorlds();

        // Combine and deduplicate
        const combinedWorlds = [...userWorlds];
        publicWorlds.forEach(world => {
          if (!combinedWorlds.some(w => w.id === world.id)) {
            combinedWorlds.push(world);
          }
        });

        setWorlds(combinedWorlds);
        setFilteredWorlds(combinedWorlds);
      } catch (error) {
        console.error('Error fetching RPG Worlds:', error);
        setError('Failed to load RPG Worlds. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchWorlds();
  }, [currentUser]);

  // Filter and sort worlds when search or filter changes
  useEffect(() => {
    let result = [...worlds];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        world =>
          world.name.toLowerCase().includes(query) ||
          world.description.toLowerCase().includes(query) ||
          world.setting.toLowerCase().includes(query)
      );
    }

    // Apply system filter
    if (filterSystem) {
      result = result.filter(world => world.system === filterSystem);
    }

    // Apply genre filter
    if (filterGenre) {
      result = result.filter(world => world.genre === filterGenre);
    }

    // Apply sorting
    result.sort((a, b) => {
      let valueA: any = a[sortBy as keyof RPGWorld];
      let valueB: any = b[sortBy as keyof RPGWorld];

      // Handle dates
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        valueA = valueA ? new Date(valueA).getTime() : 0;
        valueB = valueB ? new Date(valueB).getTime() : 0;
      }

      // Handle strings
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortOrder === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      // Handle numbers and other types
      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    setFilteredWorlds(result);
  }, [worlds, searchQuery, filterSystem, filterGenre, sortBy, sortOrder]);

  // Get unique systems for filter
  const systems = [...new Set(worlds.map(world => world.system))].map(system => ({
    value: system,
    label: system
  }));

  // Get unique genres for filter
  const genres = [...new Set(worlds.filter(world => world.genre).map(world => world.genre as string))].map(genre => ({
    value: genre,
    label: genre
  }));

  // Handle create world
  const handleCreateWorld = () => {
    navigate('/rpg-worlds/new');
  };

  // Handle delete world
  const handleDeleteWorld = async (worldId: string) => {
    try {
      await rpgWorldService.delete(worldId);
      setWorlds(worlds.filter(world => world.id !== worldId));
    } catch (error) {
      console.error('Error deleting RPG World:', error);
      setError('Failed to delete RPG World. Please try again.');
    }
  };

  // Breadcrumb items
  const breadcrumbItems = [
    { title: 'Home', href: '/' },
    { title: 'RPG Worlds', href: '/rpg-worlds' }
  ];

  return (
    <Container size="xl">
      <Stack gap="md">
        {/* Breadcrumbs */}
        <Breadcrumbs>
          {breadcrumbItems.map((item, index) => (
            <Anchor
              key={index}
              href={item.href}
              onClick={(event) => {
                event.preventDefault();
                navigate(item.href);
              }}
            >
              {item.title}
            </Anchor>
          ))}
        </Breadcrumbs>

        {/* Page Header */}
        <Group justify="space-between">
          <Box>
            <Title>RPG Worlds</Title>
            <Text c="dimmed">Manage your RPG worlds and campaigns</Text>
          </Box>
          <Button
            leftSection={<IconPlus style={{ width: '16px', height: '16px' }} />}
            onClick={handleCreateWorld}
          >
            Create World
          </Button>
        </Group>

        {/* Search and Filters */}
        <Group grow>
          <TextInput
            placeholder="Search worlds..."
            leftSection={<IconSearch style={{ width: '14px', height: '14px' }} />}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
          />
          <Select
            placeholder="Filter by system"
            clearable
            data={systems}
            value={filterSystem}
            onChange={setFilterSystem}
          />
          <Select
            placeholder="Filter by genre"
            clearable
            data={genres}
            value={filterGenre}
            onChange={setFilterGenre}
          />
          <Select
            placeholder="Sort by"
            data={[
              { value: 'name', label: 'Name' },
              { value: 'updatedAt', label: 'Last Updated' },
              { value: 'createdAt', label: 'Created Date' }
            ]}
            value={sortBy}
            onChange={(value) => setSortBy(value || 'updatedAt')}
          />
          <Select
            placeholder="Order"
            data={[
              { value: 'asc', label: 'Ascending' },
              { value: 'desc', label: 'Descending' }
            ]}
            value={sortOrder}
            onChange={(value) => setSortOrder((value as 'asc' | 'desc') || 'desc')}
          />
        </Group>

        {/* Error Alert */}
        {error && (
          <Alert icon={<IconAlertCircle style={{ width: '16px', height: '16px' }} />} title="Error" color="red">
            {error}
          </Alert>
        )}

        {/* RPG World List */}
        <RPGWorldList
          worlds={filteredWorlds}
          isLoading={loading}
          error={error}
          onCreateWorld={handleCreateWorld}
          onDeleteWorld={handleDeleteWorld}
        />
      </Stack>
    </Container>
  );
}

export default RPGWorldsListPage;