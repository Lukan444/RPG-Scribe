import React from 'react';
import { Container, Paper, Title, Text, Group, ThemeIcon, Stack, Button } from '@mantine/core';
import { IconTools } from '@tabler/icons-react';

interface PlaceholderPageProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

/**
 * A generic placeholder page component for routes that are not yet implemented
 */
export function PlaceholderPage({ 
  title, 
  description = 'This page is under construction and will be available soon.',
  icon = <IconTools size="2rem" />
}: PlaceholderPageProps) {
  return (
    <Container size="lg" py="xl">
      <Paper p="xl" radius="md" withBorder>
        <Stack align="center" gap="lg" py="xl">
          <ThemeIcon size={80} radius={40} color="blue">
            {icon}
          </ThemeIcon>
          
          <Title order={1} ta="center">{title}</Title>
          
          <Text c="dimmed" size="lg" ta="center" maw={600}>
            {description}
          </Text>
          
          <Group mt="md">
            <Button variant="outline" component="a" href="/dashboard">
              Return to Dashboard
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}

export default PlaceholderPage;