import React from 'react';
import {
  Badge,
  ThemeIcon,
  Group,
  Text,
  Avatar,
  rem,
} from '@mantine/core';
import {
  IconBook,
  IconUser,
  IconCalendarEvent,
} from '@tabler/icons-react';
import RPGWorldPage from '../../components/rpg-world/RPGWorldPage';
import CampaignTable from '../../components/campaign/CampaignTable';

// Mock data for campaigns
const mockCampaigns = [
  {
    id: '1',
    name: 'The Courts of Chaos',
    description: 'A campaign set in the Amber Chronicles universe',
    gameSystem: 'Amber Diceless',
    status: 'active',
    createdAt: '2023-01-15',
    updatedAt: '2023-05-20',
    gamemaster: {
      id: '1',
      name: 'John Doe',
      avatar: null,
    },
    players: 5,
    sessions: 12,
  },
  {
    id: '2',
    name: 'The Guns of Avalon',
    description: 'A campaign set in the Amber Chronicles universe',
    gameSystem: 'Amber Diceless',
    status: 'planning',
    createdAt: '2023-03-10',
    updatedAt: '2023-05-15',
    gamemaster: {
      id: '1',
      name: 'John Doe',
      avatar: null,
    },
    players: 4,
    sessions: 0,
  },
  {
    id: '3',
    name: 'Nine Princes in Amber',
    description: 'A campaign set in the Amber Chronicles universe',
    gameSystem: 'Amber Diceless',
    status: 'completed',
    createdAt: '2022-08-05',
    updatedAt: '2023-02-28',
    gamemaster: {
      id: '1',
      name: 'John Doe',
      avatar: null,
    },
    players: 5,
    sessions: 24,
  },
  {
    id: '4',
    name: 'The Lost City of Barakus',
    description: 'A classic dungeon crawl adventure',
    gameSystem: 'Pathfinder',
    status: 'active',
    createdAt: '2023-04-20',
    updatedAt: '2023-05-22',
    gamemaster: {
      id: '2',
      name: 'Jane Smith',
      avatar: null,
    },
    players: 6,
    sessions: 8,
  },
  {
    id: '5',
    name: 'Curse of Strahd',
    description: 'A gothic horror campaign set in Barovia',
    gameSystem: 'D&D 5e',
    status: 'hiatus',
    createdAt: '2022-10-31',
    updatedAt: '2023-03-15',
    gamemaster: {
      id: '2',
      name: 'Jane Smith',
      avatar: null,
    },
    players: 5,
    sessions: 15,
  },
];

// Column definitions for the campaign list
const campaignColumns = [
  {
    key: 'name',
    label: 'Campaign Name',
    render: (campaign: any) => (
      <Group gap="sm">
        <ThemeIcon color="teal" variant="light" size={30}>
          <IconBook size="1rem" />
        </ThemeIcon>
        <Text fw={500}>{campaign.name}</Text>
      </Group>
    ),
  },
  {
    key: 'gameSystem',
    label: 'Game System',
  },
  {
    key: 'status',
    label: 'Status',
    render: (campaign: any) => {
      const statusColors: Record<string, string> = {
        active: 'green',
        planning: 'blue',
        hiatus: 'yellow',
        completed: 'gray',
      };

      return (
        <Badge color={statusColors[campaign.status] || 'gray'}>
          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
        </Badge>
      );
    },
  },
  {
    key: 'gamemaster',
    label: 'Game Master',
    render: (campaign: any) => (
      <Group gap="sm">
        <Avatar
          size="sm"
          color="blue"
          radius="xl"
        >
          {campaign.gamemaster.name.charAt(0)}
        </Avatar>
        <Text size="sm">{campaign.gamemaster.name}</Text>
      </Group>
    ),
  },
  {
    key: 'players',
    label: 'Players',
    render: (campaign: any) => (
      <Group gap="xs">
        <IconUser size="1rem" />
        <Text>{campaign.players}</Text>
      </Group>
    ),
  },
  {
    key: 'sessions',
    label: 'Sessions',
    render: (campaign: any) => (
      <Group gap="xs">
        <IconCalendarEvent size="1rem" />
        <Text>{campaign.sessions}</Text>
      </Group>
    ),
  },
];

export function CampaignsPage() {
  // Handle delete campaign
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      console.log(`Delete campaign ${id}`);
      // Delete logic here
    }
  };

  return (
    <RPGWorldPage
      title="Campaigns"
      description="Manage your RPG campaigns and adventures"
      icon={<IconBook style={{ width: '24px', height: '24px' }} />}
      breadcrumbs={[
        { title: 'RPG World', path: '/rpg-world' },
      ]}
    >
      <CampaignTable
        items={mockCampaigns}
        columns={campaignColumns}
        basePath="/campaigns"
        onDelete={handleDelete}
      />
    </RPGWorldPage>
  );
}

export default CampaignsPage;