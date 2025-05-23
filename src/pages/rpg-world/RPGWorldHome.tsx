import React from 'react';
import {
  Grid,
  Card,
  Text,
  Group,
  ThemeIcon,
  SimpleGrid,
  Title,
  Button,
  rem,
} from '@mantine/core';
import {
  IconWorld,
  IconBook,
  IconUsers,
  IconMap,
  IconSword,
  IconCalendarEvent,
  IconNotes,
  IconPlus,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import RPGWorldPage from '../../components/rpg-world/RPGWorldPage';

// Mock data for RPG World elements
const rpgWorldElements = [
  {
    id: 'campaigns',
    title: 'Campaigns',
    icon: <IconBook style={{ width: '24px', height: '24px' }} />,
    count: 3,
    path: '/campaigns',
    description: 'Manage your RPG campaigns and adventures',
  },
  {
    id: 'characters',
    title: 'Characters',
    icon: <IconUsers style={{ width: '24px', height: '24px' }} />,
    count: 12,
    path: '/characters',
    description: 'Manage player characters and NPCs in your campaigns',
  },
  {
    id: 'locations',
    title: 'Locations',
    icon: <IconMap style={{ width: '24px', height: '24px' }} />,
    count: 8,
    path: '/locations',
    description: 'Create and organize locations, dungeons, and maps',
  },
  {
    id: 'items',
    title: 'Items',
    icon: <IconSword style={{ width: '24px', height: '24px' }} />,
    count: 15,
    path: '/items',
    description: 'Track magical items, weapons, and treasures',
  },
  {
    id: 'events',
    title: 'Events',
    icon: <IconCalendarEvent style={{ width: '24px', height: '24px' }} />,
    count: 6,
    path: '/events',
    description: 'Record important events and plot points',
  },
  {
    id: 'notes',
    title: 'Notes',
    icon: <IconNotes style={{ width: '24px', height: '24px' }} />,
    count: 10,
    path: '/notes',
    description: 'Keep campaign notes and important information',
  },
];

export function RPGWorldHome() {
  return (
    <RPGWorldPage
      title="RPG World"
      description="Manage your entire RPG world and all its elements"
      icon={<IconWorld style={{ width: '24px', height: '24px' }} />}
    >
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {rpgWorldElements.map((element) => (
          <Card key={element.id} withBorder padding="lg" radius="md">
            <Group justify="space-between" mb="md">
              <Group>
                <ThemeIcon size={40} radius={40} color="teal">
                  {element.icon}
                </ThemeIcon>
                <div>
                  <Text fw={500} size="lg">{element.title}</Text>
                  <Text c="dimmed" size="sm">{element.count} items</Text>
                </div>
              </Group>
            </Group>

            <Text size="sm" c="dimmed" mb="md">
              {element.description}
            </Text>

            <Group>
              <Button
                component={Link}
                to={element.path}
                variant="light"
                color="teal"
                fullWidth
              >
                View All
              </Button>
              <Button
                component={Link}
                to={`${element.path}/new`}
                variant="outline"
                color="teal"
                fullWidth
                leftSection={<IconPlus size="1rem" />}
              >
                Add New
              </Button>
            </Group>
          </Card>
        ))}
      </SimpleGrid>
    </RPGWorldPage>
  );
}

export default RPGWorldHome;