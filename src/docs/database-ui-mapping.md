# Database-UI Relationship Mapping

This document provides a detailed mapping between the original Neo4j database schema from the desktop RPG Scribe application and the current Firebase Firestore implementation in the web version.

## Entity Types and Attributes

### RPG World

| Original Neo4j Attribute | Firebase Firestore Attribute | Description | Data Type |
|--------------------------|------------------------------|-------------|-----------|
| rpg_world_id | id | Unique identifier | string |
| name | name | Name of the RPG world | string |
| description | description | Description of the RPG world | string |
| system_version | system | Game system and version | string |
| created_at | createdAt | Creation timestamp | timestamp |
| - | updatedAt | Last update timestamp | timestamp |
| - | createdBy | User ID of creator | string |
| - | imageURL | URL to world image | string |
| - | isPublic | Whether the world is public | boolean |
| - | campaignCount | Number of campaigns | number |
| - | tags | Array of tags | string[] |
| - | setting | World setting | string |

### Campaign

| Original Neo4j Attribute | Firebase Firestore Attribute | Description | Data Type |
|--------------------------|------------------------------|-------------|-----------|
| campaign_id | id | Unique identifier | string |
| name | name | Name of the campaign | string |
| description | description | Description of the campaign | string |
| start_date | startDate | Campaign start date | timestamp |
| created_at | createdAt | Creation timestamp | timestamp |
| - | endDate | Campaign end date | timestamp |
| - | updatedAt | Last update timestamp | timestamp |
| - | createdBy | User ID of creator | string |
| - | imageURL | URL to campaign image | string |
| - | isPublic | Whether the campaign is public | boolean |
| - | status | Campaign status (active, completed, etc.) | string |
| - | system | Game system used | string |
| - | setting | Campaign setting | string |
| - | characterCount | Number of characters | number |
| - | locationCount | Number of locations | number |
| - | itemCount | Number of items | number |
| - | eventCount | Number of events | number |
| - | sessionCount | Number of sessions | number |

### Character

| Original Neo4j Attribute | Firebase Firestore Attribute | Description | Data Type |
|--------------------------|------------------------------|-------------|-----------|
| character_id | id | Unique identifier | string |
| campaign_id | campaignId | ID of the parent campaign | string |
| name | name | Character name | string |
| description | description | Character description | string |
| character_type | characterType | Type of character (PC, NPC, etc.) | string |
| is_player_character | isPlayerCharacter | Whether it's a player character | boolean |
| primary_controller_id | primaryControllerId | User ID of primary controller | string |
| created_at | createdAt | Creation timestamp | timestamp |
| updated_at | updatedAt | Last update timestamp | timestamp |
| created_by | createdBy | User ID of creator | string |
| - | race | Character race | string |
| - | class | Character class | string |
| - | level | Character level | number |
| - | background | Character background | string |
| - | alignment | Character alignment | string |
| - | currentLocationId | Current location ID | string |
| - | inventory | Array of owned items | object[] |
| - | imageURL | URL to character image | string |
| - | appearance | Physical appearance details | object |
| - | personality | Personality traits | object |
| - | backstory | Character backstory | string |
| - | goals | Character goals | string[] |
| - | notes | Character-specific notes | string |

### Location

| Original Neo4j Attribute | Firebase Firestore Attribute | Description | Data Type |
|--------------------------|------------------------------|-------------|-----------|
| location_id | id | Unique identifier | string |
| campaign_id | campaignId | ID of the parent campaign | string |
| name | name | Location name | string |
| description | description | Location description | string |
| location_type | locationType | Type of location | string |
| created_at | createdAt | Creation timestamp | timestamp |
| updated_at | updatedAt | Last update timestamp | timestamp |
| created_by | createdBy | User ID of creator | string |
| - | parentLocationId | ID of parent location | string |
| - | geography | Geographic features | string |
| - | climate | Climate description | string |
| - | population | Population information | string |
| - | government | Government information | string |
| - | economy | Economic information | string |
| - | culture | Cultural information | string |
| - | history | Historical information | string |
| - | points_of_interest | Notable locations | string[] |
| - | dangers | Potential dangers | string[] |
| - | secrets | Hidden information | string[] |
| - | imageURL | URL to location image | string |

### Item

| Original Neo4j Attribute | Firebase Firestore Attribute | Description | Data Type |
|--------------------------|------------------------------|-------------|-----------|
| item_id | id | Unique identifier | string |
| campaign_id | campaignId | ID of the parent campaign | string |
| name | name | Item name | string |
| description | description | Item description | string |
| item_type | type | Type of item | string |
| created_at | createdAt | Creation timestamp | timestamp |
| updated_at | updatedAt | Last update timestamp | timestamp |
| created_by | createdBy | User ID of creator | string |
| - | rarity | Item rarity | string |
| - | attunement | Requires attunement | boolean |
| - | currentOwnerId | Current owner ID | string |
| - | ownerType | Type of owner (character/location) | string |
| - | currentOwner | Denormalized owner data | object |
| - | properties | Magical properties, damage, etc. | object |
| - | imageURL | URL to item image | string |
| - | value | Monetary value | number |
| - | weight | Item weight | number |

### Event

| Original Neo4j Attribute | Firebase Firestore Attribute | Description | Data Type |
|--------------------------|------------------------------|-------------|-----------|
| event_id | id | Unique identifier | string |
| campaign_id | campaignId | ID of the parent campaign | string |
| title | name | Event name | string |
| description | description | Event description | string |
| event_type | eventType | Type of event | string |
| timestamp | eventDate | In-game date of event | timestamp |
| created_at | createdAt | Creation timestamp | timestamp |
| updated_at | updatedAt | Last update timestamp | timestamp |
| created_by | createdBy | User ID of creator | string |
| - | sessionId | Associated session ID | string |
| - | date | Alias for eventDate | timestamp |
| - | timelinePosition | Position on timeline | number |
| - | locationId | Associated location ID | string |
| - | importance | Importance (1-10) | number |
| - | participants | Character IDs involved | string[] |
| - | imageURL | URL to event image | string |

### Session

| Original Neo4j Attribute | Firebase Firestore Attribute | Description | Data Type |
|--------------------------|------------------------------|-------------|-----------|
| session_id | id | Unique identifier | string |
| campaign_id | campaignId | ID of the parent campaign | string |
| name | name | Session name | string |
| number | number | Session number | number |
| date | date | Session date | timestamp |
| summary | summary | Session summary | string |
| created_at | createdAt | Creation timestamp | timestamp |
| updated_at | updatedAt | Last update timestamp | timestamp |
| created_by | createdBy | User ID of creator | string |
| - | duration | Session duration | number |
| - | status | Session status | string |
| - | participants | Participant IDs | string[] |
| - | imageURL | URL to session image | string |
| - | notes | Session notes | string |
| - | highlights | Important moments | object[] |

### Note

| Original Neo4j Attribute | Firebase Firestore Attribute | Description | Data Type |
|--------------------------|------------------------------|-------------|-----------|
| note_id | id | Unique identifier | string |
| campaign_id | campaignId | ID of the parent campaign | string |
| title | title | Note title | string |
| content | content | Note content | string |
| tags | tags | Array of tags | string[] |
| created_at | createdAt | Creation timestamp | timestamp |
| updated_at | updatedAt | Last update timestamp | timestamp |
| created_by | createdBy | User ID of creator | string |
| - | entityId | Related entity ID | string |
| - | entityType | Related entity type | string |
| - | isPrivate | Whether note is private | boolean |
| - | imageURL | URL to note image | string |

## Relationships

| Relationship Type | Source Entity | Target Entity | Description |
|-------------------|---------------|---------------|-------------|
| PART_OF | Campaign | RPGWorld | Campaign belongs to an RPG world |
| PART_OF | Session | Campaign | Session belongs to a campaign |
| PART_OF | Character | Campaign | Character belongs to a campaign |
| PART_OF | Location | Campaign | Location belongs to a campaign |
| PART_OF | Item | Campaign | Item belongs to a campaign |
| PART_OF | Event | Campaign | Event belongs to a campaign |
| PART_OF | Note | Campaign | Note belongs to a campaign |
| APPEARS_IN | Character | Session | Character appears in a session |
| OCCURRED_IN | Event | Session | Event occurred in a session |
| CONTAINS | Location | Location | Location contains another location |
| CONTAINED_IN | Location | Location | Location is contained in another location |
| LOCATED_AT | Character | Location | Character is located at a location |
| LOCATED_AT | Item | Location | Item is located at a location |
| HAPPENED_AT | Event | Location | Event happened at a location |
| OWNS | Character | Item | Character owns an item |
| CREATED_BY | Item | Character | Item was created by a character |
| RELATES_TO | Note | Various | Note relates to various entities |
| INVOLVES | Event | Character | Event involves a character |

## Firebase Firestore Data Model

```
/users/{userId}
/rpgworlds/{worldId}
/rpgworlds/{worldId}/campaigns/{campaignId}
/rpgworlds/{worldId}/campaigns/{campaignId}/characters/{characterId}
/rpgworlds/{worldId}/campaigns/{campaignId}/locations/{locationId}
/rpgworlds/{worldId}/campaigns/{campaignId}/items/{itemId}
/rpgworlds/{worldId}/campaigns/{campaignId}/events/{eventId}
/rpgworlds/{worldId}/campaigns/{campaignId}/sessions/{sessionId}
/rpgworlds/{worldId}/campaigns/{campaignId}/notes/{noteId}
/relationships/{relationshipId}
```

## Missing Fields and Relationships

1. **RPG World**:
   - Missing system_version field
   - Need to implement world-campaign relationship

2. **Campaign**:
   - Need to implement campaign-session relationship
   - Need to implement campaign-character relationship
   - Need to implement campaign-location relationship

3. **Character**:
   - Missing appearance details
   - Missing personality traits
   - Need to implement character-session relationship
   - Need to implement character-location relationship
   - Need to implement character-item relationship

4. **Location**:
   - Need to implement hierarchical structure
   - Need to implement location-character relationship
   - Need to implement location-item relationship

5. **Item**:
   - Need to implement item-character relationship
   - Need to implement item-location relationship

6. **Event**:
   - Need to implement event-session relationship
   - Need to implement event-character relationship
   - Need to implement event-location relationship

7. **Session**:
   - Need to implement session-character relationship
   - Need to implement session-event relationship

8. **Note**:
   - Need to implement note-entity relationships
   - Need to implement rich text formatting

## Implementation Priority

1. RPG World and Campaign
2. Character Management
3. Location Management
4. Item, Event, and Session Management
5. Relationship Management