import React from 'react';
import { Container, Title, Text, SimpleGrid, Paper, Group, ThemeIcon } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  IconUsers,
  IconMap,
  IconCalendarEvent,
  IconBook,
  IconSword
} from '@tabler/icons-react';

function StatCard({
  title,
  value,
  icon,
  color,
  onClick
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}) {
  const handleClick = (e: React.MouseEvent) => {
    console.log(`SimpleDashboard StatCard clicked: ${title}`);
    if (onClick) {
      e.stopPropagation();
      onClick();
    }
  };

  return (
    <Paper
      withBorder
      p="md"
      radius="md"
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        ':hover': {
          transform: onClick ? 'translateY(-5px)' : 'none',
          boxShadow: onClick ? '0 5px 15px rgba(0,0,0,0.1)' : 'none'
        }
      }}
      onClick={handleClick}
    >
      <Group>
        <ThemeIcon size="lg" color={color} variant="light" radius="md">
          {icon}
        </ThemeIcon>
        <div>
          <Text size="xs" c="dimmed">{title}</Text>
          <Text fw={700} size="xl">{value}</Text>
        </div>
      </Group>
    </Paper>
  );
}

function SimpleDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Container size="xl" py="xl">
      <Title order={2} mb="xl">Dashboard</Title>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 5 }} mb="xl">
        <StatCard
          title="Characters"
          value="24"
          icon={<IconUsers size="1.5rem" />}
          color="teal"
          onClick={() => {
            console.log('SimpleDashboard Characters card clicked, navigating to /characters');
            navigate('/characters', { state: { from: location.pathname } });
          }}
        />
        <StatCard
          title="Locations"
          value="18"
          icon={<IconMap size="1.5rem" />}
          color="blue"
          onClick={() => navigate('/locations', { state: { from: location.pathname } })}
        />
        <StatCard
          title="Events"
          value="32"
          icon={<IconCalendarEvent size="1.5rem" />}
          color="violet"
          onClick={() => navigate('/events', { state: { from: location.pathname } })}
        />
        <StatCard
          title="Sessions"
          value="12"
          icon={<IconBook size="1.5rem" />}
          color="orange"
          onClick={() => navigate('/sessions', { state: { from: location.pathname } })}
        />
        <StatCard
          title="Items"
          value="45"
          icon={<IconSword size="1.5rem" />}
          color="yellow"
          onClick={() => navigate('/items', { state: { from: location.pathname } })}
        />
      </SimpleGrid>

      <Text>Welcome to RPG Scribe! This dashboard provides an overview of your RPG content.</Text>
    </Container>
  );
}

export default SimpleDashboard;