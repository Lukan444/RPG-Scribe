import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Group,
  Button,
  Tabs,
  Table,
  Badge,
  ActionIcon,
  Menu,
  TextInput,
  Select,
  Pagination,
  Skeleton,
  Switch,
  Modal,
  useMantineTheme
} from '@mantine/core';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/user.service';
import { User } from '../../types/user';
import {
  IconUsers,
  IconActivity,
  IconSearch,
  IconFilter,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconLock,
  IconMail,
  IconTrash as IconBroom,
  IconDatabase
} from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { useNavigate } from 'react-router-dom';
import { DataIntegrityAuditPanel } from './DataIntegrityAuditPanel';
import { DuplicateCleanupPanel } from './DuplicateCleanupPanel';

/**
 * Admin Page component
 */
const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useMantineTheme();

  const [loading, setLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<User[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalLogs, setTotalLogs] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string | null>('users');
  const [editUserModalOpen, setEditUserModalOpen] = useState<boolean>(false);
  const [currentEditUser, setCurrentEditUser] = useState<User | null>(null);

  // Services
  const userService = new UserService();

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // Load users and activity logs
  useEffect(() => {
    const loadData = async () => {
      if (!user || user.role !== 'admin') return;

      setLoading(true);

      try {
        // Load users
        const usersData = await userService.query([], pageSize);
        setUsers(usersData.data);

        // Get total count
        const allUsers = await userService.query([], 1000);
        setTotalUsers(allUsers.data.length);

        // Load activity logs (mock implementation for now)
        setActivityLogs([
          {
            id: '1',
            userId: user.id,
            action: 'LOGIN',
            timestamp: new Date().toISOString(),
            details: 'User logged in'
          },
          {
            id: '2',
            userId: user.id,
            action: 'PROFILE_UPDATE',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            details: 'User updated profile'
          }
        ]);
        setTotalLogs(2);
      } catch (error) {
        console.error('Error loading admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, pageSize]);

  // Handle search
  const handleSearch = () => {
    // This would be better with a proper search query
    // For now, we'll just filter the loaded users
    if (!searchQuery) {
      return users;
    }

    const query = searchQuery.toLowerCase();
    return users.filter((user: User) =>
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  };

  // Handle role filter
  const handleRoleFilter = (users: User[]) => {
    if (!roleFilter) {
      return users;
    }

    return users.filter((user: User) => user.role === roleFilter);
  };

  // Open edit user modal
  const openEditUserModal = (user: User) => {
    setCurrentEditUser(user);
    setEditUserModalOpen(true);
  };

  // Update user role
  const updateUserRole = async (userId: string, role: string) => {
    try {
      // Convert role string to valid UserRole type
      const validRole = (role === 'admin' || role === 'user' || role === 'gamemaster' || role === 'player')
        ? role
        : 'user';

      await userService.updateUserRole(userId, validRole);

      // Update local state
      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: validRole } : user
      ));
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  // Delete user confirmation
  const openDeleteModal = (user: User) => {
    modals.openConfirmModal({
      title: 'Delete User',
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete the user {user.name || user.email}? This action cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteUser(user.id),
    });
  };

  // Delete user
  const deleteUser = async (userId: string) => {
    try {
      // This would be implemented with a proper delete user API
      console.log(`Deleting user ${userId}`);

      // Update local state
      setUsers(users.filter(user => user.id !== userId));
      setTotalUsers(totalUsers - 1);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // Send verification email
  const sendVerificationEmail = async (userId: string) => {
    try {
      // This would be implemented with a proper send verification email API
      console.log(`Sending verification email to user ${userId}`);

      // Show success message
      modals.openConfirmModal({
        title: 'Email Sent',
        centered: true,
        children: (
          <Text size="sm">
            Verification email has been sent successfully.
          </Text>
        ),
        labels: { confirm: 'OK', cancel: '' },
        withCloseButton: false,
        cancelProps: { display: 'none' }
      });
    } catch (error) {
      console.error('Error sending verification email:', error);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Skeleton height={50} width="50%" mb="xl" />
        <Skeleton height={50} mb="xl" />
        <Skeleton height={400} />
      </Container>
    );
  }

  // Filter users based on search query and role filter
  const filteredUsers = handleRoleFilter(handleSearch());

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xl">Admin Dashboard</Title>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="users" leftSection={<IconUsers size={16} />}>Users</Tabs.Tab>
          <Tabs.Tab value="activity" leftSection={<IconActivity size={16} />}>Activity Logs</Tabs.Tab>
          <Tabs.Tab value="settings" leftSection={<IconDatabase size={16} />}>Settings</Tabs.Tab>
          <Tabs.Tab value="cleanup" leftSection={<IconBroom size={16} />}>Duplicate Cleanup</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="users" pt="xl">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={3}>Users</Title>

              <Group>
                <TextInput
                  placeholder="Search users..."
                  leftSection={<IconSearch size={16} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                />

                <Select
                  placeholder="Filter by role"
                  leftSection={<IconFilter size={16} />}
                  data={[
                    { value: '', label: 'All Roles' },
                    { value: 'admin', label: 'Admins' },
                    { value: 'gamemaster', label: 'Game Masters' },
                    { value: 'player', label: 'Players' },
                    { value: 'user', label: 'Regular Users' }
                  ]}
                  value={roleFilter}
                  onChange={(value) => setRoleFilter(value || '')}
                  clearable
                />
              </Group>
            </Group>

            <Table striped highlightOnHover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Provider</th>
                  <th>Email Verified</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user: User) => (
                    <tr key={user.id}>
                      <td>{user.name || 'N/A'}</td>
                      <td>{user.email}</td>
                      <td>
                        <Badge color={
                          user.role === 'admin' ? 'red' :
                          user.role === 'gamemaster' ? 'blue' :
                          user.role === 'player' ? 'green' : 'gray'
                        }>
                          {user.role}
                        </Badge>
                      </td>
                      <td>{user.providerId}</td>
                      <td>
                        <Switch
                          checked={user.emailVerified}
                          readOnly
                          size="sm"
                        />
                      </td>
                      <td>
                        <Group gap={8}>
                          <ActionIcon
                            color="blue"
                            onClick={() => openEditUserModal(user)}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>

                          {!user.emailVerified && (
                            <ActionIcon
                              color="green"
                              onClick={() => sendVerificationEmail(user.id)}
                              title="Send verification email"
                            >
                              <IconMail size={16} />
                            </ActionIcon>
                          )}

                          <Menu position="bottom-end" shadow="md">
                            <Menu.Target>
                              <ActionIcon>
                                <IconDotsVertical size={16} />
                              </ActionIcon>
                            </Menu.Target>

                            <Menu.Dropdown>
                              <Menu.Label>Role</Menu.Label>
                              <Menu.Item
                                onClick={() => updateUserRole(user.id, 'admin')}
                                disabled={user.role === 'admin'}
                              >
                                Make Admin
                              </Menu.Item>
                              <Menu.Item
                                onClick={() => updateUserRole(user.id, 'gamemaster')}
                                disabled={user.role === 'gamemaster'}
                              >
                                Make Game Master
                              </Menu.Item>
                              <Menu.Item
                                onClick={() => updateUserRole(user.id, 'player')}
                                disabled={user.role === 'player'}
                              >
                                Make Player
                              </Menu.Item>
                              <Menu.Item
                                onClick={() => updateUserRole(user.id, 'user')}
                                disabled={user.role === 'user'}
                              >
                                Make Regular User
                              </Menu.Item>

                              <Menu.Divider />

                              <Menu.Item
                                leftSection={<IconLock size={16} />}
                                disabled={true} // Not implemented yet
                              >
                                Reset Password
                              </Menu.Item>

                              <Menu.Divider />

                              <Menu.Item
                                color="red"
                                leftSection={<IconTrash size={16} />}
                                onClick={() => openDeleteModal(user)}
                              >
                                Delete User
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                      <Text color="dimmed">
                        No users found
                      </Text>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>

            {totalUsers > pageSize && (
              <Group justify="center" mt="xl">
                <Pagination
                  total={Math.ceil(totalUsers / pageSize)}
                  value={page}
                  onChange={setPage}
                />
              </Group>
            )}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="activity" pt="xl">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={3}>Activity Logs</Title>

              <TextInput
                placeholder="Search logs..."
                leftSection={<IconSearch size={16} />}
              />
            </Group>

            <Table striped highlightOnHover>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Action</th>
                  <th>Timestamp</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.length > 0 ? (
                  activityLogs.map((log: any) => (
                    <tr key={log.id}>
                      <td>{log.userId === user?.id ? 'You' : log.userId}</td>
                      <td>
                        <Badge color={
                          log.action === 'LOGIN' ? 'green' :
                          log.action === 'LOGOUT' ? 'red' :
                          log.action === 'PROFILE_UPDATE' ? 'blue' : 'gray'
                        }>
                          {log.action}
                        </Badge>
                      </td>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>{log.details}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                      <Text color="dimmed">
                        No activity logs found
                      </Text>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>

            {totalLogs > pageSize && (
              <Group justify="center" mt="xl">
                <Pagination
                  total={Math.ceil(totalLogs / pageSize)}
                  value={page}
                  onChange={setPage}
                />
              </Group>
            )}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="settings" pt="xl">
          <DataIntegrityAuditPanel />
        </Tabs.Panel>

        <Tabs.Panel value="cleanup" pt="xl">
          <DuplicateCleanupPanel />
        </Tabs.Panel>
      </Tabs>

      {/* Edit User Modal */}
      <Modal
        opened={editUserModalOpen}
        onClose={() => setEditUserModalOpen(false)}
        title="Edit User"
        centered
      >
        {currentEditUser && (
          <div>
            <TextInput
              label="Name"
              placeholder="User name"
              value={currentEditUser.name || ''}
              onChange={(e) => setCurrentEditUser({...currentEditUser, name: e.currentTarget.value})}
              mb="md"
            />

            <TextInput
              label="Email"
              placeholder="User email"
              value={currentEditUser.email}
              disabled
              mb="md"
            />

            <Select
              label="Role"
              placeholder="Select role"
              data={[
                { value: 'admin', label: 'Admin' },
                { value: 'gamemaster', label: 'Game Master' },
                { value: 'player', label: 'Player' },
                { value: 'user', label: 'Regular User' }
              ]}
              value={currentEditUser.role}
              onChange={(value) => {
                const validRole = (value === 'admin' || value === 'user' || value === 'gamemaster' || value === 'player')
                  ? value
                  : 'user';
                setCurrentEditUser({...currentEditUser, role: validRole as 'user' | 'admin' | 'gamemaster' | 'player'});
              }}
              mb="md"
            />

            <Group justify="flex-end" mt="xl">
              <Button variant="outline" onClick={() => setEditUserModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                updateUserRole(currentEditUser.id, currentEditUser.role);
                setEditUserModalOpen(false);
              }}>
                Save
              </Button>
            </Group>
          </div>
        )}
      </Modal>
    </Container>
  );
};

export default AdminPage;
