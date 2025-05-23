import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Title,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Stack,
  Paper,
  Divider,
  FileInput,
  SimpleGrid,
  LoadingOverlay,
  Text,
  Alert
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconCalendar,
  IconUpload,
  IconAlertCircle,
  IconDeviceGamepad2,
  IconMap,
  IconCheck
} from '@tabler/icons-react';
import { Campaign, CampaignCreationParams, CampaignUpdateParams, CampaignStatus } from '../../models/Campaign';
import { campaignService } from '../../services/api/campaign.service';
import { useAuth } from '../../contexts/AuthContext';
import { ImageUpload } from '../common/ImageUpload';

/**
 * CampaignForm component - Form for creating and editing campaigns
 */
export function CampaignForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = !!id;

  // State
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Form
  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      setting: '',
      system: '',
      status: CampaignStatus.PLANNING,
      startDate: null as Date | null,
      endDate: null as Date | null,
      imageURL: '',
      isPublic: false,
    },
    validate: {
      name: (value: string) => (value.trim().length < 1 ? 'Campaign name is required' : null),
      description: (value: string) => (value.trim().length < 1 ? 'Description is required' : null),
      system: (value: string) => (value.trim().length < 1 ? 'Game system is required' : null),
    },
  });

  // Load campaign data if in edit mode
  useEffect(() => {
    const loadCampaign = async () => {
      if (!isEditMode || !id) return;

      try {
        setLoading(true);
        setError(null);

        const campaignData = await campaignService.getCampaignById(id);

        if (!campaignData) {
          setError('Campaign not found');
          return;
        }

        // Format dates
        const formattedData = {
          ...campaignData,
          startDate: campaignData.startDate ? new Date(campaignData.startDate) : null,
          endDate: campaignData.endDate ? new Date(campaignData.endDate) : null,
        };

        form.setValues(formattedData);
      } catch (err) {
        console.error('Error loading campaign:', err);
        setError('Failed to load campaign data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadCampaign();
  }, [id, isEditMode, form]);

  // Handle form submission
  const handleSubmit = async (values: typeof form.values) => {
    if (!user) {
      setError('You must be logged in to create or edit a campaign');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      let imageURL = values.imageURL;

      // Upload image if provided
      if (imageFile) {
        // For now, use a placeholder URL
        imageURL = 'https://via.placeholder.com/800x400?text=Campaign+Image';
        // TODO: Implement proper image upload
        // imageURL = await campaignService.uploadCampaignImage(imageFile);
      }

      if (isEditMode && id) {
        // Update existing campaign
        const updateData: CampaignUpdateParams = {
          name: values.name,
          description: values.description,
          setting: values.setting,
          system: values.system,
          startDate: values.startDate,
          endDate: values.endDate,
          status: values.status as CampaignStatus,
          imageURL,
          isPublic: values.isPublic
        };

        await campaignService.updateCampaign(id, updateData);
        notifications.show({
          title: 'Campaign Updated',
          message: 'Your campaign has been updated successfully',
          color: 'green',
          icon: <IconCheck size={16} />,
        });
      } else {
        // Create new campaign
        const newCampaignData: CampaignCreationParams = {
          worldId: 'default', // Add a default worldId since it's required
          name: values.name,
          description: values.description,
          setting: values.setting,
          system: values.system,
          startDate: values.startDate,
          endDate: values.endDate,
          status: values.status as CampaignStatus,
          imageURL,
          createdBy: user.id,
          isPublic: values.isPublic || false,
        };

        const newCampaign = await campaignService.createCampaign(newCampaignData);
        notifications.show({
          title: 'Campaign Created',
          message: 'Your new campaign has been created successfully',
          color: 'green',
          icon: <IconCheck size={16} />,
        });

        // Navigate to the new campaign
        if (newCampaign && newCampaign.id) {
          navigate(`/campaigns/${newCampaign.id}`);
          return;
        }
      }

      // Navigate back to campaigns list
      navigate('/campaigns');
    } catch (err) {
      console.error('Error saving campaign:', err);
      setError('Failed to save campaign. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  // Status options
  const statusOptions = [
    { value: CampaignStatus.PLANNING, label: 'Planning' },
    { value: CampaignStatus.ACTIVE, label: 'Active' },
    { value: CampaignStatus.PAUSED, label: 'Paused' },
    { value: CampaignStatus.COMPLETED, label: 'Completed' },
    { value: CampaignStatus.ABANDONED, label: 'Abandoned' },
    { value: CampaignStatus.ARCHIVED, label: 'Archived' },
  ];

  // Game system options
  const systemOptions = [
    { value: 'D&D 5e', label: 'Dungeons & Dragons 5e' },
    { value: 'Pathfinder', label: 'Pathfinder' },
    { value: 'Call of Cthulhu', label: 'Call of Cthulhu' },
    { value: 'Vampire: The Masquerade', label: 'Vampire: The Masquerade' },
    { value: 'Shadowrun', label: 'Shadowrun' },
    { value: 'GURPS', label: 'GURPS' },
    { value: 'Fate', label: 'Fate' },
    { value: 'Savage Worlds', label: 'Savage Worlds' },
    { value: 'Other', label: 'Other' },
  ];

  return (
    <Box pos="relative">
      <LoadingOverlay visible={loading || submitting} />

      <Title order={2} mb="md">
        {isEditMode ? 'Edit Campaign' : 'Create New Campaign'}
      </Title>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">
          {error}
        </Alert>
      )}

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Paper p="md" withBorder mb="md">
          <Title order={4} mb="md">Basic Information</Title>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <TextInput
              label="Campaign Name"
              placeholder="Enter campaign name"
              required
              {...form.getInputProps('name')}
            />

            <Select
              label="Game System"
              placeholder="Select game system"
              data={systemOptions}
              searchable
              allowDeselect={false}
              leftSection={<IconDeviceGamepad2 size={16} />}
              required
              {...form.getInputProps('system')}
              onChange={(value) => {
                form.setFieldValue('system', value || '');
                // If value is not in options, add it
                if (value && !systemOptions.some(option => option.value === value)) {
                  systemOptions.push({ value, label: value });
                }
              }}
            />
          </SimpleGrid>

          <Textarea
            label="Description"
            placeholder="Enter campaign description"
            minRows={3}
            mt="md"
            required
            {...form.getInputProps('description')}
          />

          <TextInput
            label="Setting"
            placeholder="Enter campaign setting"
            mt="md"
            leftSection={<IconMap size={16} />}
            {...form.getInputProps('setting')}
          />
        </Paper>

        <Paper p="md" withBorder mb="md">
          <Title order={4} mb="md">Campaign Details</Title>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <Select
              label="Status"
              placeholder="Select status"
              data={statusOptions}
              required
              {...form.getInputProps('status')}
            />

            <DatePickerInput
              label="Start Date"
              placeholder="Select start date"
              leftSection={<IconCalendar size={16} />}
              clearable
              {...form.getInputProps('startDate')}
            />

            <DatePickerInput
              label="End Date"
              placeholder="Select end date"
              leftSection={<IconCalendar size={16} />}
              clearable
              minDate={form.values.startDate || undefined}
              {...form.getInputProps('endDate')}
            />
          </SimpleGrid>
        </Paper>

        <Paper p="md" withBorder mb="md">
          <Title order={4} mb="md">Campaign Image</Title>

          <ImageUpload
            currentImageUrl={form.values.imageURL}
            onFileSelected={setImageFile}
          />
        </Paper>

        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={() => navigate('/campaigns')}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {isEditMode ? 'Update Campaign' : 'Create Campaign'}
          </Button>
        </Group>
      </form>
    </Box>
  );
}
