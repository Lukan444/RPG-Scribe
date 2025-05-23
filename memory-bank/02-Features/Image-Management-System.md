# Image Management System in RPG Archivist

## Overview
This document provides a comprehensive overview of the image management system in the RPG Archivist application, consolidating information from various image-focused files.

## Image Storage and Organization

### Directory Structure
- **Root Directory**: `/uploads`
- **Entity Type Directories**: `/uploads/{entityType}`
- **Entity ID Directories**: `/uploads/{entityType}/{entityId}`
- **Thumbnail Directory**: `/uploads/{entityType}/{entityId}/thumbnails`
- **Original Images**: `/uploads/{entityType}/{entityId}/{filename}`
- **Thumbnails**: `/uploads/{entityType}/{entityId}/thumbnails/{filename}`

### Naming Conventions
- **Original Images**: `{timestamp}_{originalFilename}`
- **Thumbnails**: `thumb_{timestamp}_{originalFilename}`
- **Placeholder Images**: `placeholder_{entityType}_{index}.{extension}`

## Backend Implementation

### Image Service
- **uploadImage**: Uploads an image for an entity
- **getImage**: Retrieves an image by filename
- **getThumbnail**: Retrieves a thumbnail by filename
- **deleteImage**: Deletes an image and its thumbnail
- **getImagesByEntityType**: Retrieves images by entity type
- **getImagesByEntityId**: Retrieves images by entity ID
- **getRandomImage**: Retrieves a random image by entity type
- **generateThumbnail**: Generates a thumbnail for an image

### Image Controller
- **uploadImage**: Handles image upload requests
- **getImage**: Handles image retrieval requests
- **getThumbnail**: Handles thumbnail retrieval requests
- **deleteImage**: Handles image deletion requests
- **getImagesByEntityType**: Handles requests for images by entity type
- **getImagesByEntityId**: Handles requests for images by entity ID
- **getRandomImage**: Handles requests for random images by entity type

### Image Processing
- **Sharp**: Used for image processing and thumbnail generation
- **Multer**: Used for handling multipart/form-data
- **File System**: Used for file operations

## Frontend Implementation

### Image Components
- **ImageUploader**: Provides image upload with preview and cropping
- **ImageCropper**: Provides image cropping functionality
- **ImageGallery**: Displays images with thumbnail support
- **ImageSelector**: Selects images based on entity type
- **ImageViewer**: Displays full-size images
- **ImageCard**: Displays an image with metadata
- **ImageList**: Displays a list of images
- **ImageGrid**: Displays a grid of images

### Image Service
- **uploadImage**: Uploads an image for an entity
- **getImageUrl**: Gets the URL for an image
- **getThumbnailUrl**: Gets the URL for a thumbnail
- **deleteImage**: Deletes an image
- **getImagesByEntityType**: Gets images by entity type
- **getImagesByEntityId**: Gets images by entity ID
- **getRandomImage**: Gets a random image by entity type

## Image Access Control

### Role-Based Access Control
- **Admin**: Full access to all images
- **Game Master**: Access to images in their worlds and campaigns
- **Player**: Access to images in campaigns they participate in

### Entity-Based Access Control
- **World Images**: Accessible to the world creator and campaign participants
- **Campaign Images**: Accessible to the campaign creator and participants
- **Character Images**: Accessible to the character creator and campaign participants
- **Location Images**: Accessible to the location creator and campaign participants
- **Item Images**: Accessible to the item creator and campaign participants
- **Session Images**: Accessible to the session creator and campaign participants
- **Event Images**: Accessible to the event creator and campaign participants

### Context-Based Filtering
- **User Context**: Shows images based on user role and ownership
- **World Context**: Shows images from the current world
- **Campaign Context**: Shows images from the current campaign
- **Entity Type Context**: Shows images of the current entity type

## Placeholder Images

### Placeholder Categories
- **User Avatars**: Fantasy character silhouettes in various styles
- **Campaign Images**: Fantasy adventuring scenes
- **Character Portraits**: Fantasy character templates in different styles
- **Location Images**: Fantasy location archetypes
- **World Maps**: Fantasy map templates with different terrain types
- **Item Images**: Fantasy item archetypes
- **Event Images**: Fantasy event scenes
- **Background Images**: Hero section, authentication page, and dashboard backgrounds

### Placeholder Implementation
- **PlaceholderService**: Provides access to placeholder images
- **getPlaceholderImage**: Gets a placeholder image by entity type
- **getRandomPlaceholderImage**: Gets a random placeholder image by entity type
- **getAllPlaceholderImages**: Gets all placeholder images by entity type

## Image Generation

### AI Image Generation
- **DALL·E Integration**: Generates images based on text prompts
- **Stable Diffusion Integration**: Provides open-source image generation
- **ImageGenerationService**: Provides a unified interface for image generation
- **generateImage**: Generates an image based on a text prompt
- **editImage**: Edits an image based on a text prompt and mask
- **createVariation**: Creates variations of an existing image

## Future Enhancements

### Image Tagging
- **Tag System**: Add tags to images for better organization
- **TagService**: Manage image tags
- **TagFilter**: Filter images by tags

### Image Search
- **Search Functionality**: Search images by name, description, or tags
- **SearchService**: Provide image search functionality
- **SearchUI**: Provide a user interface for image search

### Bulk Image Upload
- **Bulk Upload**: Upload multiple images at once
- **BulkUploadService**: Handle bulk image uploads
- **BulkUploadUI**: Provide a user interface for bulk uploads

### Image Collections
- **Collection System**: Group images into collections
- **CollectionService**: Manage image collections
- **CollectionUI**: Provide a user interface for collections

### Image Sharing
- **Sharing System**: Share images between campaigns or worlds
- **SharingService**: Manage image sharing
- **SharingUI**: Provide a user interface for image sharing

## Conclusion
The image management system in RPG Archivist provides a comprehensive solution for handling images in a tabletop RPG campaign management application. The system includes robust backend services for image storage and processing, intuitive frontend components for image display and interaction, and comprehensive access control to ensure users only see images relevant to their context. The placeholder images and AI image generation capabilities enhance the user experience by providing high-quality visuals even when user-uploaded content is not available.
