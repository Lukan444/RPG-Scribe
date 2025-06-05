/**
 * Sample Timeline Data for RPG Scribe Testing
 *
 * This file contains realistic timeline entries for the "Forgotten Realms 1" test RPG world
 * demonstrating dual-time tracking capabilities and various timeline entry types.
 */

import { TimelineEntry } from '../models/Timeline';
import { TimelineEntryType, TimeUnit } from '../constants/timelineConstants';

export const sampleTimelineEntries = [
  {
    title: "Campaign Start: The Yawning Portal",
    description: "The adventurers meet at the Yawning Portal in Waterdeep, responding to a call for aid regarding the missing adventurers from Oakhurst.",
    tags: ["campaign-start", "sunless-citadel", "waterdeep"],
    entryType: TimelineEntryType.SESSION_START,
    importance: 10,
    dualTimestamp: {
      realWorldTime: new Date('2024-01-15T19:00:00Z'),
      inGameTime: new Date('1372-01-01T08:00:00Z')
    },
    associatedEntityId: "campaign-forgotten-realms-1",
    associatedEntityType: "campaign",
    validationStatus: "valid",
    hasConflicts: false,
    position: {
      sequence: 1,
      realWorldTimestamp: new Date('2024-01-15T19:00:00Z'),
      inGameTimestamp: new Date('1372-01-01T08:00:00Z'),
      timeGapBefore: {
        duration: 0,
        unit: TimeUnit.HOURS,
        description: "Campaign beginning"
      }
    }
  },
  {
    title: "Character Introductions & Party Formation",
    description: "The party members introduce themselves and agree to travel together to Oakhurst.",
    tags: ["character-introduction", "party-formation"],
    entryType: TimelineEntryType.CHARACTER_EVENT,
    importance: 8,
    dualTimestamp: {
      realWorldTime: new Date('2024-01-15T19:30:00Z'),
      inGameTime: new Date('1372-01-01T09:00:00Z')
    },
    associatedEntityId: "party-main",
    associatedEntityType: "party",
    validationStatus: "valid",
    hasConflicts: false,
    position: {
      sequence: 2,
      realWorldTimestamp: new Date('2024-01-15T19:30:00Z'),
      inGameTimestamp: new Date('1372-01-01T09:00:00Z'),
      timeGapBefore: {
        duration: 1,
        unit: TimeUnit.HOURS,
        description: "Introductions and planning"
      }
    }
  },
  {
    title: "Travel to Oakhurst",
    description: "The party embarks on the journey to the village of Oakhurst, a small settlement known for its apple orchards.",
    tags: ["travel", "oakhurst", "countryside"],
    entryType: TimelineEntryType.TRAVEL,
    importance: 5,
    dualTimestamp: {
      realWorldTime: new Date('2024-01-15T20:00:00Z'),
      inGameTime: new Date('1372-01-04T18:00:00Z')
    },
    associatedEntityId: "location-oakhurst",
    associatedEntityType: "location",
    validationStatus: "valid",
    hasConflicts: false,
    position: {
      sequence: 3,
      realWorldTimestamp: new Date('2024-01-15T20:00:00Z'),
      inGameTimestamp: new Date('1372-01-04T18:00:00Z'),
      timeGapBefore: {
        duration: 3,
        unit: TimeUnit.DAYS,
        description: "Travel time to Oakhurst"
      }
    }
  },
  {
    title: "Road Encounter: Goblin Ambush",
    description: "While traveling, the party is ambushed by a small group of goblins. They successfully fend off the attack.",
    tags: ["combat", "goblins", "ambush", "road-encounter"],
    entryType: TimelineEntryType.COMBAT,
    importance: 7,
    dualTimestamp: {
      realWorldTime: new Date('2024-01-15T20:45:00Z'),
      inGameTime: new Date('1372-01-05T14:00:00Z')
    },
    associatedEntityId: "encounter-goblin-ambush-1",
    associatedEntityType: "encounter",
    validationStatus: "valid",
    hasConflicts: false,
    position: {
      sequence: 4,
      realWorldTimestamp: new Date('2024-01-15T20:45:00Z'),
      inGameTimestamp: new Date('1372-01-05T14:00:00Z'),
      timeGapBefore: {
        duration: 20,
        unit: TimeUnit.HOURS,
        description: "Continued travel, encounter occurs midday"
      }
    }
  },
  {
    title: "Session End: Camping for the Night",
    description: "The party decides to make camp for the night, resting before continuing their journey to Oakhurst.",
    tags: ["session-end", "rest", "camping"],
    entryType: TimelineEntryType.SESSION_END,
    importance: 6,
    dualTimestamp: {
      realWorldTime: new Date('2024-01-15T22:00:00Z'),
      inGameTime: new Date('1372-01-05T20:00:00Z')
    },
    associatedEntityId: "session-1",
    associatedEntityType: "session",
    validationStatus: "valid",
    hasConflicts: false,
    position: {
      sequence: 5,
      realWorldTimestamp: new Date('2024-01-15T22:00:00Z'),
      inGameTimestamp: new Date('1372-01-05T20:00:00Z'),
      timeGapBefore: {
        duration: 6,
        unit: TimeUnit.HOURS,
        description: "Rest and recovery after combat"
      }
    }
  },
  {
    title: "Session Start: Arrival at Sunless Citadel",
    description: "The party arrives at the Sunless Citadel, a sunken fortress rumored to hold ancient secrets and dangers.",
    tags: ["session-start", "sunless-citadel", "approach"],
    entryType: TimelineEntryType.SESSION_START,
    importance: 8,
    dualTimestamp: {
      realWorldTime: new Date('2024-01-22T19:00:00Z'),
      inGameTime: new Date('1372-01-06T08:00:00Z')
    },
    associatedEntityId: "session-2",
    associatedEntityType: "session",
    validationStatus: "valid",
    hasConflicts: false,
    position: {
      sequence: 6,
      realWorldTimestamp: new Date('2024-01-22T19:00:00Z'),
      inGameTimestamp: new Date('1372-01-06T08:00:00Z'),
      timeGapBefore: {
        duration: 12,
        unit: TimeUnit.HOURS,
        description: "Long rest overnight"
      }
    }
  },
  {
    title: "Discovery: Talgen Hucrele's Remains",
    description: "Inside the Citadel, the party discovers the remains of Talgen Hucrele, one of the missing adventurers, and learns of the plight of his sister, Sharwyn.",
    tags: ["discovery", "sunless-citadel", "talgen-hucrele", "quest"],
    entryType: TimelineEntryType.DISCOVERY,
    importance: 9,
    dualTimestamp: {
      realWorldTime: new Date('2024-01-22T19:30:00Z'),
      inGameTime: new Date('1372-01-06T12:00:00Z')
    },
    associatedEntityId: "location-sunless-citadel",
    associatedEntityType: "location",
    validationStatus: "valid",
    hasConflicts: false,
    position: {
      sequence: 7,
      realWorldTimestamp: new Date('2024-01-22T19:30:00Z'),
      inGameTimestamp: new Date('1372-01-06T12:00:00Z'),
      timeGapBefore: {
        duration: 4,
        unit: TimeUnit.HOURS,
        description: "Travel to the citadel"
      }
    }
  },
  {
    title: "Story Event: The Gulthias Tree",
    description: "The party encounters the malevolent Gulthias Tree, the source of the blight affecting the Citadel's creatures.",
    tags: ["story-event", "gulthias-tree", "curse", "revelation"],
    entryType: TimelineEntryType.STORY_EVENT,
    importance: 10,
    dualTimestamp: {
      realWorldTime: new Date('2024-01-22T21:30:00Z'),
      inGameTime: new Date('1372-01-06T18:00:00Z')
    },
    associatedEntityId: "artifact-gulthias-tree",
    associatedEntityType: "artifact",
    validationStatus: "valid",
    hasConflicts: false,
    position: {
      sequence: 8,
      realWorldTimestamp: new Date('2024-01-22T21:30:00Z'),
      inGameTimestamp: new Date('1372-01-06T18:00:00Z'),
      timeGapBefore: {
        duration: 6,
        unit: TimeUnit.HOURS,
        description: "Exploration of the citadel"
      }
    }
  },
  {
    title: "Character Development: Elara Learns New Spell",
    description: "Elara, the party's wizard, studies a newly found scroll and learns a powerful new spell, marking her growth.",
    tags: ["character-development", "spell-learning", "level-up", "elara"],
    entryType: TimelineEntryType.CHARACTER_EVENT,
    importance: 6,
    dualTimestamp: {
      realWorldTime: new Date('2024-01-29T20:00:00Z'),
      inGameTime: new Date('1372-01-07T10:00:00Z')
    },
    associatedEntityId: "character-elara-moonwhisper",
    associatedEntityType: "character",
    validationStatus: "valid",
    hasConflicts: false,
    position: {
      sequence: 9,
      realWorldTimestamp: new Date('2024-01-29T20:00:00Z'),
      inGameTimestamp: new Date('1372-01-07T10:00:00Z'),
      timeGapBefore: {
        duration: 16,
        unit: TimeUnit.HOURS,
        description: "Study and rest"
      }
    }
  },
  {
    title: "Boss Battle: Confrontation with Belak the Outcast",
    description: "The party confronts Belak the Outcast, the druid responsible for cultivating the Gulthias Tree, in a climactic battle.",
    tags: ["boss-battle", "belak", "final-encounter", "victory"],
    entryType: TimelineEntryType.COMBAT,
    importance: 10,
    dualTimestamp: {
      realWorldTime: new Date('2024-01-29T21:45:00Z'),
      inGameTime: new Date('1372-01-07T16:00:00Z')
    },
    associatedEntityId: "npc-belak-outcast",
    associatedEntityType: "npc",
    validationStatus: "valid",
    hasConflicts: false,
    position: {
      sequence: 10,
      realWorldTimestamp: new Date('2024-01-29T21:45:00Z'),
      inGameTimestamp: new Date('1372-01-07T16:00:00Z'),
      timeGapBefore: {
        duration: 6,
        unit: TimeUnit.HOURS,
        description: "Final preparations and approach"
      }
    }
  }
] as Omit<TimelineEntry, 'id' | 'createdAt' | 'updatedAt'>[]; // Added type assertion as a workaround for persistent TS2353 error

export const sampleCampaignInfo = {
  id: "campaign-forgotten-realms-1",
  name: "Forgotten Realms Campaign",
  description: "A classic D&D 5e campaign set in the Forgotten Realms",
  worldId: "world-forgotten-realms",
  startDate: new Date('2024-01-15T19:00:00Z'),
  inGameStartDate: new Date('1372-01-01T08:00:00Z'),
  timelineEntryCount: sampleTimelineEntries.length
};

export const sampleWorldInfo = {
  id: "world-forgotten-realms",
  name: "Forgotten Realms",
  description: "The classic D&D fantasy setting",
  timelineEntryCount: sampleTimelineEntries.length
};
