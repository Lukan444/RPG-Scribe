import { useState, useRef } from 'react';
import {
  Box,
  Text,
  Group,
  Image,
  Button,
  FileInput,
  ActionIcon,
  Stack,
  Center,
  Paper
} from '@mantine/core';
import { IconUpload, IconPhoto, IconX } from '@tabler/icons-react';

/**
 * ImageUpload props
 */
interface ImageUploadProps {
  currentImageUrl?: string;
  onFileSelected: (file: File | null) => void;
  label?: string;
  description?: string;
  maxSize?: number; // in MB
  accept?: string;
  height?: number;
}

/**
 * ImageUpload component - Component for uploading and previewing images
 */
export function ImageUpload({
  currentImageUrl,
  onFileSelected,
  label = 'Upload Image',
  description = 'Drag and drop an image here or click to select a file',
  maxSize = 5, // 5MB default
  accept = 'image/png,image/jpeg,image/gif,image/webp',
  height = 200
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLButtonElement>(null);

  // Handle file selection
  const handleFileChange = (file: File | null) => {
    setError(null);

    if (!file) {
      setPreviewUrl(null);
      onFileSelected(null);
      return;
    }

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds ${maxSize}MB limit`);
      return;
    }

    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    onFileSelected(file);

    // Clean up preview URL when component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  };

  // Handle clear
  const handleClear = () => {
    setPreviewUrl(null);
    setError(null);
    onFileSelected(null);
  };

  // Determine which image to show
  const displayImageUrl = previewUrl || currentImageUrl;

  return (
    <Box>
      {label && <Text fw={500} mb="xs">{label}</Text>}

      {displayImageUrl ? (
        <Box pos="relative">
          <Image
            src={displayImageUrl}
            alt="Preview"
            height={height}
            radius="md"
            fit="cover"
          />
          <ActionIcon
            color="red"
            variant="filled"
            radius="xl"
            size="sm"
            pos="absolute"
            top={8}
            right={8}
            onClick={handleClear}
          >
            <IconX size={14} />
          </ActionIcon>
        </Box>
      ) : (
        <Paper
          p="xl"
          withBorder
          h={height}
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            borderStyle: 'dashed'
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Center>
            <Stack align="center" gap="xs">
              <IconPhoto size={32} stroke={1.5} />
              <Text ta="center" size="sm">
                {description}
              </Text>
              {error && (
                <Text c="red" size="sm">
                  {error}
                </Text>
              )}
            </Stack>
          </Center>
        </Paper>
      )}

      <Group mt="md" justify="flex-end">
        {displayImageUrl ? (
          <Button
            leftSection={<IconUpload size={14} />}
            variant="light"
            onClick={() => fileInputRef.current?.click()}
          >
            Change Image
          </Button>
        ) : (
          <Button
            leftSection={<IconUpload size={14} />}
            variant="light"
            ref={fileInputRef}
          >
            Select Image
          </Button>
        )}

        <FileInput
          style={{ display: 'none' }}
          accept={accept}
          onChange={handleFileChange}
          ref={fileInputRef}
        />
      </Group>
    </Box>
  );
}
