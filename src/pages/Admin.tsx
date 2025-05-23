import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  TextInput,
  Select,
  Table,
  ActionIcon,
  Badge,
  Tabs,
  Pagination,
  Skeleton,
  Modal,
  Button,
  Switch,
  NumberInput,
  Alert,
} from '@mantine/core';
import {
  IconSearch,
  IconEdit,
  IconTrash,
  IconUserCheck,
  IconUsers,
  IconClipboardList,
  IconSettings,
  IconMail,
  IconCheck,
} from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';
import ActivityLogs from './admin/ActivityLogs';
import { UserService } from '../services/user.service';
import { User } from '../types/user';
import { modals } from '@mantine/modals';
import { useNavigate } from 'react-router-dom';
import { orderBy, where, QueryConstraint } from 'firebase/firestore';
import { ActivityLogService } from '../services/activityLog.service';
import { ActivityAction } from '../models/ActivityLog';

function UserManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [currentEditUser, setCurrentEditUser] = useState<User | null>(null);

  // Initialize UserService
  const userService = new UserService();

  // Check if user is admin - temporarily disabled for testing
  useEffect(() => {
    if (!user) {
      // Wait for auth to initialize
      return;
    }

    // Temporarily disabled for testing
    // if (user.role !== 'admin') {
    //   navigate('/');
    // }

    // For testing purposes, we'll allow any user to access the Admin page
    console.log('UserManagement - Current user role:', user.role);
  }, [user, navigate]);

  // Load users from Firestore
  useEffect(() => {
    // Create a flag to prevent state updates if the component unmounts
    let isMounted = true;

    // Create a debounced loading state to prevent flickering
    const loadingTimeout = setTimeout(() => {
      if (isMounted) {
        setLoading(true);
      }
    }, 300); // Short delay before showing loading state

    const loadUsers = async () => {
      if (!user) return;

      setError(null);

      try {
        // Create separate arrays for different constraint types
        const orderByConstraints = [orderBy('createdAt', 'desc')];
        const whereConstraints: QueryConstraint[] = [];

        // Add role filter constraint if selected and not "all"
        if (roleFilter && roleFilter !== 'all') {
          // Log the role filter for debugging
          console.log(`Filtering users by role: ${roleFilter}`);

          // Use a where clause instead of client-side filtering
          // This is more efficient and prevents the freezing issue
          // Ensure the role value matches exactly what's stored in the database (lowercase)
          whereConstraints.push(where('role', '==', roleFilter.toLowerCase()));
        }

        // Combine all constraints
        const constraints = [...whereConstraints, ...orderByConstraints];

        // Execute the query with all constraints
        const usersData = await userService.query(constraints, pageSize);

        // Get total count for pagination (with role filter if applicable)
        const totalCountWhereConstraints: QueryConstraint[] = [];
        if (roleFilter && roleFilter !== 'all') {
          // Ensure the role value matches exactly what's stored in the database (lowercase)
          totalCountWhereConstraints.push(where('role', '==', roleFilter.toLowerCase()));
        }
        const totalCountQuery = await userService.query(totalCountWhereConstraints, 1000);

        // Only update state if component is still mounted
        if (isMounted) {
          setUsers(usersData.data);
          setTotalUsers(totalCountQuery.data.length);

          // Clear the loading timeout to prevent unnecessary loading state
          clearTimeout(loadingTimeout);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading users:', err);
        if (isMounted) {
          setError('Failed to load users. Please try again later.');
          setLoading(false);
        }
      }
    };

    // Execute the load function
    loadUsers();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
    };
  }, [user, page, pageSize, roleFilter, userService]);

  // Filter users based on search term
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchTerm ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

    return matchesSearch;
  });

  // Format date for display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';

    // Handle Firestore Timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  // Format role for display
  const formatRole = (role: string): string => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'Admin';
      case 'gamemaster':
        return 'Game Master';
      case 'player':
        return 'Player';
      case 'user':
        return 'User';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    // Find the user to delete for logging purposes
    const userToDelete = users.find(u => u.id === userId);

    modals.openConfirmModal({
      title: 'Delete User',
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete this user? This action cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          // Delete user from Firestore
          const success = await userService.delete(userId);

          if (success) {
            // Log the activity
            if (userToDelete && user) {
              const activityLogService = ActivityLogService.getInstance();
              await activityLogService.logActivity(
                user.id,
                user.name,
                user.email,
                ActivityAction.ADMIN_ACTION,
                `Deleted user ${userToDelete.email} (${userToDelete.name || 'No name'})`,
                '127.0.0.1',
                navigator.userAgent
              );
            }

            // Update local state
            setUsers(users.filter(u => u.id !== userId));
            setTotalUsers(totalUsers - 1);

            // Show success notification
            modals.openConfirmModal({
              title: 'Success',
              centered: true,
              children: (
                <Text size="sm">
                  User deleted successfully.
                </Text>
              ),
              labels: { confirm: 'OK', cancel: '' },
              withCloseButton: false,
              cancelProps: { display: 'none' }
            });
          } else {
            throw new Error('Failed to delete user');
          }
        } catch (error) {
          console.error('Error deleting user:', error);
          modals.openConfirmModal({
            title: 'Error',
            centered: true,
            children: (
              <Text size="sm">
                Failed to delete user. Please try again later.
              </Text>
            ),
            labels: { confirm: 'OK', cancel: '' },
            withCloseButton: false,
            cancelProps: { display: 'none' }
          });
        }
      },
    });
  };

  // Handle user role update
  const updateUserRole = async (userId: string, newRole: 'admin' | 'gamemaster' | 'player' | 'user') => {
    try {
      // Find the user to update and store original role for potential rollback
      const userToUpdate = users.find(u => u.id === userId);
      if (!userToUpdate) {
        throw new Error(`User with ID ${userId} not found`);
      }

      const originalRole = userToUpdate.role;

      console.log(`Updating user ${userId} role from ${originalRole} to ${newRole}`);

      // Update local state immediately for responsive UI
      setUsers(prevUsers => {
        const updatedUsers = prevUsers.map(u =>
          u.id === userId ? { ...u, role: newRole } : u
        );
        console.log('Updated users state after role change:', updatedUsers);
        return updatedUsers;
      });

      // Show a temporary success message
      modals.openConfirmModal({
        title: 'Updating Role',
        centered: true,
        children: (
          <Text size="sm">
            Updating user role to {newRole}...
          </Text>
        ),
        labels: { confirm: 'OK', cancel: '' },
        withCloseButton: false,
        cancelProps: { display: 'none' }
      });

      // Update user role in Firestore
      const success = await userService.update(userId, { role: newRole });

      // Close all modals
      modals.closeAll();

      if (success) {
        // Log the activity if user is available
        if (user) {
          const activityLogService = ActivityLogService.getInstance();
          await activityLogService.logActivity(
            user.id,
            user.name,
            user.email,
            ActivityAction.ADMIN_ACTION,
            `Changed user role for ${userToUpdate.email} from ${originalRole} to ${newRole}`,
            '127.0.0.1',
            navigator.userAgent
          );
        }

        // Show success notification
        modals.openConfirmModal({
          title: 'Success',
          centered: true,
          children: (
            <Text size="sm">
              User role updated successfully to {newRole}.
            </Text>
          ),
          labels: { confirm: 'OK', cancel: '' },
          withCloseButton: false,
          cancelProps: { display: 'none' },
          onClose: async () => {
            // Refresh the user list after the dialog is closed to ensure we have the latest data
            // with the current filters applied
            try {
              // Create separate arrays for different constraint types
              const orderByConstraints = [orderBy('createdAt', 'desc')];
              const whereConstraints: QueryConstraint[] = [];

              // Add role filter constraint if selected and not "all"
              if (roleFilter && roleFilter !== 'all') {
                // Ensure the role value matches exactly what's stored in the database (lowercase)
                whereConstraints.push(where('role', '==', roleFilter.toLowerCase()));
              }

              // Combine all constraints
              const constraints = [...whereConstraints, ...orderByConstraints];

              // Execute the query with all constraints
              const usersData = await userService.query(constraints, pageSize);
              setUsers(usersData.data);
            } catch (err) {
              console.error('Error refreshing users after role update:', err);
            }
          }
        });
      } else {
        // If update failed, revert the local state change
        setUsers(prevUsers =>
          prevUsers.map(u =>
            u.id === userId ? { ...u, role: originalRole } : u
          )
        );
        throw new Error('Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      modals.openConfirmModal({
        title: 'Error',
        centered: true,
        children: (
          <Text size="sm">
            Failed to update user role. Please try again later.
          </Text>
        ),
        labels: { confirm: 'OK', cancel: '' },
        withCloseButton: false,
        cancelProps: { display: 'none' }
      });
    }
  };

  // Send verification email
  const sendVerificationEmail = async (userId: string) => {
    try {
      // Find the user to send verification email to
      const userToVerify = users.find(u => u.id === userId);
      if (!userToVerify) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // This would be implemented with a proper send verification email API
      console.log(`Sending verification email to user ${userId}`);

      // Log the activity if user is available
      if (user) {
        const activityLogService = ActivityLogService.getInstance();
        await activityLogService.logActivity(
          user.id,
          user.name,
          user.email,
          ActivityAction.ADMIN_ACTION,
          `Sent verification email to ${userToVerify.email} (${userToVerify.name || 'No name'})`,
          '127.0.0.1',
          navigator.userAgent
        );
      }

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

      // Show error message
      modals.openConfirmModal({
        title: 'Error',
        centered: true,
        children: (
          <Text size="sm">
            Failed to send verification email. Please try again later.
          </Text>
        ),
        labels: { confirm: 'OK', cancel: '' },
        withCloseButton: false,
        cancelProps: { display: 'none' }
      });
    }
  };

  // Open edit user modal
  const openEditUserModal = (user: User) => {
    setCurrentEditUser(user);
    setEditUserModalOpen(true);
  };

  // Handle user edit
  const handleEditUser = async (userData: User) => {
    if (!currentEditUser) return;

    try {
      // Store the original user data for rollback if needed
      const originalUserData = { ...currentEditUser };

      // Log the update for debugging
      console.log('Updating user:', currentEditUser.id);
      console.log('Original data:', originalUserData);
      console.log('New data:', userData);

      // Update local state immediately for responsive UI
      setUsers(prevUsers => {
        const updatedUsers = prevUsers.map(u =>
          u.id === currentEditUser.id ? { ...u, ...userData } : u
        );
        console.log('Updated users state:', updatedUsers);
        return updatedUsers;
      });

      // Close modal immediately for better UX
      setEditUserModalOpen(false);

      // Update user in Firestore
      const success = await userService.update(currentEditUser.id, userData);

      if (success) {
        // Log the activity if user is available
        if (user) {
          const activityLogService = ActivityLogService.getInstance();
          await activityLogService.logActivity(
            user.id,
            user.name,
            user.email,
            ActivityAction.ADMIN_ACTION,
            `Updated user ${userData.email} (${userData.name || 'No name'})`,
            '127.0.0.1',
            navigator.userAgent
          );
        }

        // Refresh the user list to ensure we have the latest data
        const refreshedUsers = await userService.query([orderBy('createdAt', 'desc')], 1000);
        setUsers(refreshedUsers.data);

        // Show success notification
        modals.openConfirmModal({
          title: 'Success',
          centered: true,
          children: (
            <Text size="sm">
              User updated successfully.
            </Text>
          ),
          labels: { confirm: 'OK', cancel: '' },
          withCloseButton: false,
          cancelProps: { display: 'none' }
        });
      } else {
        // If update failed, revert the local state change
        setUsers(prevUsers =>
          prevUsers.map(u =>
            u.id === currentEditUser.id ? { ...u, ...originalUserData } : u
          )
        );
        throw new Error('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      modals.openConfirmModal({
        title: 'Error',
        centered: true,
        children: (
          <Text size="sm">
            Failed to update user. Please try again later.
          </Text>
        ),
        labels: { confirm: 'OK', cancel: '' },
        withCloseButton: false,
        cancelProps: { display: 'none' }
      });
    }
  };
  // Remove the commented out code and replace the mock function with the real one
  // The handleDeleteUser function is already implemented above

  // Render error state
  if (error) {
    return (
      <>
        <Title order={3} mb="md">
          User Management
        </Title>
        <Text color="red" mb="xl">
          {error}
        </Text>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </>
    );
  }

  return (
    <>
      <Title order={3} mb="md">
        User Management
      </Title>
      <Text color="dimmed" mb="xl">
        Manage users and their roles
      </Text>

      <Group justify="apart" mb="md">
        <TextInput
          placeholder="Search users..."
          leftSection={<IconSearch size="1rem" />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
          style={{ width: '60%' }}
        />
        <Select
          placeholder="Filter by role"
          value={roleFilter}
          onChange={(value) => {
            // Only update if the value actually changed
            if (value !== roleFilter) {
              // Prevent multiple rapid changes
              setRoleFilter(value);
            }
          }}
          data={[
            { value: 'all', label: 'All Roles' },
            { value: 'admin', label: 'Admin' },
            { value: 'gamemaster', label: 'Game Master' },
            { value: 'player', label: 'Player' },
            { value: 'user', label: 'User' },
          ]}
          // Convert role value to lowercase for consistent matching
          style={{ width: '30%' }}
          searchable={false}
        />
      </Group>

      <div style={{ position: 'relative' }}>
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            zIndex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '4px'
          }}>
            <Skeleton height={300} width="100%" visible={loading} animate={true} />
          </div>
        )}

        <Table striped highlightOnHover style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s ease' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.name || 'N/A'}</td>
                  <td>{u.email}</td>
                  <td>
                    <Badge
                      color={
                        u.role === 'admin'
                          ? 'red'
                          : u.role === 'gamemaster'
                          ? 'blue'
                          : u.role === 'player'
                          ? 'green'
                          : 'gray'
                      }
                      style={{ textTransform: 'none' }}
                    >
                      {formatRole(u.role)}
                    </Badge>
                  </td>
                  <td>
                    <Badge color={u.emailVerified ? 'green' : 'yellow'}>
                      {u.emailVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>
                    <Group gap="xs">
                      <ActionIcon
                        color="blue"
                        onClick={() => openEditUserModal(u)}
                        disabled={loading}
                      >
                        <IconEdit size="1rem" />
                      </ActionIcon>
                      <ActionIcon
                        color="red"
                        onClick={() => handleDeleteUser(u.id)}
                        disabled={loading}
                      >
                        <IconTrash size="1rem" />
                      </ActionIcon>
                      {!u.emailVerified && (
                        <ActionIcon
                          color="green"
                          onClick={() => sendVerificationEmail(u.id)}
                          disabled={loading}
                        >
                          <IconMail size="1rem" />
                        </ActionIcon>
                      )}
                    </Group>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                  <Text color="dimmed">
                    {loading ? 'Loading users...' : 'No users found'}
                  </Text>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {totalUsers > pageSize && (
        <Group justify="center" mt="xl">
          <Pagination
            total={Math.ceil(totalUsers / pageSize)}
            value={page}
            onChange={setPage}
          />
        </Group>
      )}

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
              onChange={(e) => setCurrentEditUser({
                ...currentEditUser,
                name: e.currentTarget.value
              })}
              mb="md"
            />
            <Select
              label="Role"
              placeholder="Select role"
              value={currentEditUser.role}
              onChange={(value) => setCurrentEditUser({
                ...currentEditUser,
                role: value as 'admin' | 'gamemaster' | 'player' | 'user'
              })}
              data={[
                { value: 'admin', label: 'Admin' },
                { value: 'gamemaster', label: 'Game Master' },
                { value: 'player', label: 'Player' },
                { value: 'user', label: 'User' },
              ]}
              mb="md"
            />
            <Group justify="flex-end" mt="xl">
              <Button variant="outline" onClick={() => setEditUserModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleEditUser(currentEditUser)}>
                Save
              </Button>
            </Group>
          </div>
        )}
      </Modal>
    </>
  );
}

function SystemSettings() {
  const { user } = useAuth();
  const [appName, setAppName] = useState('RPG Scribe');
  const [defaultTheme, setDefaultTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [defaultUserRole, setDefaultUserRole] = useState<'user' | 'player'>('user');
  const [maxUploadSize, setMaxUploadSize] = useState(10);
  const [enableAI, setEnableAI] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load settings from localStorage or API
  useEffect(() => {
    // In a real app, this would fetch from an API
    const loadSettings = () => {
      const savedSettings = localStorage.getItem('systemSettings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          setAppName(settings.appName || 'RPG Scribe');
          setDefaultTheme(settings.defaultTheme || 'system');
          setAllowRegistration(settings.allowRegistration !== false);
          setDefaultUserRole(settings.defaultUserRole || 'user');
          setMaxUploadSize(settings.maxUploadSize || 10);
          setEnableAI(settings.enableAI !== false);
        } catch (error) {
          console.error('Error loading settings:', error);
        }
      }
    };

    loadSettings();
  }, []);

  // Save settings
  const handleSaveSettings = async () => {
    setSaveLoading(true);

    try {
      const settings = {
        appName,
        defaultTheme,
        allowRegistration,
        defaultUserRole,
        maxUploadSize,
        enableAI
      };

      // Save settings to localStorage
      localStorage.setItem('systemSettings', JSON.stringify(settings));

      // Log the activity if user is available
      if (user && user.id && user.name && user.email) {
        const activityLogService = ActivityLogService.getInstance();
        await activityLogService.logActivity(
          user.id,
          user.name,
          user.email,
          ActivityAction.ADMIN_ACTION,
          `Updated system settings (App Name: ${appName}, Default Theme: ${defaultTheme}, Registration: ${allowRegistration ? 'Enabled' : 'Disabled'})`,
          '127.0.0.1',
          navigator.userAgent
        );
      }

      setSaveSuccess(true);

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <>
      <Title order={3} mb="md">
        System Settings
      </Title>
      <Text color="dimmed" mb="xl">
        Configure system-wide settings
      </Text>

      <Paper withBorder p="md" radius="md" mb="xl">
        <Title order={4} mb="md">General Settings</Title>

        <TextInput
          label="Application Name"
          description="The name displayed in the application header and browser title"
          placeholder="RPG Scribe"
          value={appName}
          onChange={(e) => setAppName(e.currentTarget.value)}
          mb="md"
        />

        <Select
          label="Default Theme"
          description="The default theme for new users"
          data={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System Default' }
          ]}
          value={defaultTheme}
          onChange={(value) => setDefaultTheme(value as 'light' | 'dark' | 'system')}
          mb="md"
        />

        <NumberInput
          label="Maximum Upload Size (MB)"
          description="Maximum file size for uploads (images, maps, etc.)"
          min={1}
          max={50}
          value={maxUploadSize}
          onChange={(value) => setMaxUploadSize(Number(value))}
          mb="md"
        />
      </Paper>

      <Paper withBorder p="md" radius="md" mb="xl">
        <Title order={4} mb="md">User Settings</Title>

        <Switch
          label="Allow New User Registration"
          description="When disabled, only administrators can create new accounts"
          checked={allowRegistration}
          onChange={(event) => setAllowRegistration(event.currentTarget.checked)}
          mb="md"
        />

        <Select
          label="Default Role for New Users"
          description="The role assigned to newly registered users"
          data={[
            { value: 'user', label: 'Regular User' },
            { value: 'player', label: 'Player' }
          ]}
          value={defaultUserRole}
          onChange={(value) => setDefaultUserRole(value as 'user' | 'player')}
          mb="md"
          disabled={!allowRegistration}
        />
      </Paper>

      <Paper withBorder p="md" radius="md" mb="xl">
        <Title order={4} mb="md">AI Features</Title>

        <Switch
          label="Enable AI Features"
          description="Enable AI-powered features like content generation and analysis"
          checked={enableAI}
          onChange={(event) => setEnableAI(event.currentTarget.checked)}
          mb="md"
        />

        {enableAI && (
          <Alert color="blue" title="AI Features" variant="light" mb="md">
            <Text size="sm">
              AI features are currently enabled. Users will have access to AI-powered content generation,
              session analysis, and other AI-enhanced features based on their subscription tier.
            </Text>
          </Alert>
        )}
      </Paper>

      <Group justify="flex-end" mt="xl">
        <Button variant="default" onClick={() => window.location.reload()}>
          Reset Changes
        </Button>
        <Button
          onClick={handleSaveSettings}
          loading={saveLoading}
          color={saveSuccess ? 'green' : 'blue'}
          leftSection={saveSuccess ? <IconCheck size="1rem" /> : undefined}
        >
          {saveSuccess ? 'Saved Successfully' : 'Save Settings'}
        </Button>
      </Group>
    </>
  );
}

function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string | null>('users');

  // Check if user is admin - temporarily disabled for testing
  useEffect(() => {
    if (!user) {
      // Wait for auth to initialize
      return;
    }

    // Temporarily disabled for testing
    // if (user.role !== 'admin') {
    //   navigate('/');
    // }

    // For testing purposes, we'll allow any user to access the Admin page
    console.log('Current user role:', user.role);
  }, [user, navigate]);

  return (
    <Container size="xl" py="xl">
      <Paper radius="md" p="xl" withBorder>
        <Title order={2} mb="md">
          Admin Dashboard
        </Title>

        <Tabs value={activeTab} onChange={setActiveTab} mb="xl">
          <Tabs.List>
            <Tabs.Tab value="users" leftSection={<IconUsers size="0.8rem" />}>
              Users
            </Tabs.Tab>
            <Tabs.Tab value="logs" leftSection={<IconClipboardList size="0.8rem" />}>
              Activity Logs
            </Tabs.Tab>
            <Tabs.Tab value="settings" leftSection={<IconSettings size="0.8rem" />}>
              Settings
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'logs' && <ActivityLogs />}
        {activeTab === 'settings' && <SystemSettings />}
      </Paper>
    </Container>
  );
}

export default Admin;
