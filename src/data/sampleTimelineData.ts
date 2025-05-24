/**
 * Sample Timeline Data for RPG Scribe Testing
 *
 * This file contains realistic timeline entries for the "Forgotten Realms 1" test RPG world
 * demonstrating dual-time tracking capabilities and various timeline entry types.
 */

import { TimelineEntry } from '../models/Timeline';
import { TimelineEntryType, TimeUnit } from '../constants/timelineConstants';

export const sampleTimelineEntries: Omit<TimelineEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Campaign Start
  {
    title: "Campaign Begins: The Sunless Citadel",
    description: "Our heroes meet at the Yawning Portal tavern in Waterdeep. Durnan tells them about the mysterious Sunless Citadel and the missing adventurers.",
    entryType: TimelineEntryType.SESSION_START,
    sequence: 1,
    importance: 10,

    // Real-world time: Session 1 on January 15, 2024
    realWorldTime: new Date('2024-01-15T19:00:00Z'),

    // In-game time: 1st day of Hammer (January), 1372 DR
    inGameTime: new Date('1372-01-01T08:00:00Z'),

    timeGapBefore: {
      duration: 0,
      unit: TimeUnit.HOURS,
      description: "Campaign beginning"
    },

    associatedEntityId: "campaign-forgotten-realms-1",
    associatedEntityType: "campaign",

    validationStatus: "valid",
    hasConflicts: false,

    tags: ["campaign-start", "sunless-citadel", "waterdeep"],

    position: {
      realWorldPosition: 1,
      inGamePosition: 1,
      isAnchored: true
    }
  },

  // Character Introduction
  {
    title: "Party Formation",
    description: "Thorin Ironforge (dwarf fighter), Elara Moonwhisper (elf wizard), Gareth Lightbringer (human paladin), and Zara Shadowstep (halfling rogue) form an adventuring party.",
    entryType: TimelineEntryType.CHARACTER_EVENT,
    sequence: 2,
    importance: 8,

    realWorldTime: new Date('2024-01-15T19:30:00Z'),
    inGameTime: new Date('1372-01-01T09:00:00Z'),

    timeGapBefore: {
      duration: 1,
      unit: TimeUnit.HOURS,
      description: "Introductions and planning"
    },

    associatedEntityId: "party-main",
    associatedEntityType: "party",

    validationStatus: "valid",
    hasConflicts: false,

    tags: ["character-introduction", "party-formation"],

    position: {
      realWorldPosition: 2,
      inGamePosition: 2,
      isAnchored: false
    }
  },

  // Travel to Oakhurst
  {
    title: "Journey to Oakhurst",
    description: "The party travels south from Waterdeep to the village of Oakhurst, a three-day journey through the countryside.",
    entryType: TimelineEntryType.TRAVEL,
    sequence: 3,
    importance: 5,

    realWorldTime: new Date('2024-01-15T20:00:00Z'),
    inGameTime: new Date('1372-01-04T18:00:00Z'),

    timeGapBefore: {
      duration: 3,
      unit: TimeUnit.DAYS,
      description: "Travel time to Oakhurst"
    },

    associatedEntityId: "location-oakhurst",
    associatedEntityType: "location",

    validationStatus: "valid",
    hasConflicts: false,

    tags: ["travel", "oakhurst", "countryside"],

    position: {
      realWorldPosition: 3,
      inGamePosition: 3,
      isAnchored: false
    }
  },

  // First Combat Encounter
  {
    title: "Goblin Ambush on the Road",
    description: "Six goblins ambush the party on the road to the Sunless Citadel. Thorin takes a critical hit but the party emerges victorious.",
    entryType: TimelineEntryType.COMBAT,
    sequence: 4,
    importance: 7,

    realWorldTime: new Date('2024-01-15T20:45:00Z'),
    inGameTime: new Date('1372-01-05T14:00:00Z'),

    timeGapBefore: {
      duration: 20,
      unit: TimeUnit.HOURS,
      description: "Continued travel, encounter occurs midday"
    },

    associatedEntityId: "encounter-goblin-ambush-1",
    associatedEntityType: "encounter",

    validationStatus: "valid",
    hasConflicts: false,

    tags: ["combat", "goblins", "ambush", "road-encounter"],

    position: {
      realWorldPosition: 4,
      inGamePosition: 4,
      isAnchored: false
    }
  },

  // Session End
  {
    title: "Session 1 Ends",
    description: "The party makes camp for the night after the goblin encounter. They are now only half a day's travel from the Sunless Citadel.",
    entryType: TimelineEntryType.SESSION_END,
    sequence: 5,
    importance: 6,

    realWorldTime: new Date('2024-01-15T22:00:00Z'),
    inGameTime: new Date('1372-01-05T20:00:00Z'),

    timeGapBefore: {
      duration: 6,
      unit: TimeUnit.HOURS,
      description: "Rest and recovery after combat"
    },

    associatedEntityId: "session-1",
    associatedEntityType: "session",

    validationStatus: "valid",
    hasConflicts: false,

    tags: ["session-end", "rest", "camping"],

    position: {
      realWorldPosition: 5,
      inGamePosition: 5,
      isAnchored: true
    }
  },

  // Session 2 Start (One week later in real time)
  {
    title: "Session 2 Begins",
    description: "The party wakes up and continues their journey to the Sunless Citadel. They can see the ancient fortress in the distance.",
    entryType: TimelineEntryType.SESSION_START,
    sequence: 6,
    importance: 8,

    realWorldTime: new Date('2024-01-22T19:00:00Z'),
    inGameTime: new Date('1372-01-06T08:00:00Z'),

    timeGapBefore: {
      duration: 12,
      unit: TimeUnit.HOURS,
      description: "Long rest overnight"
    },

    associatedEntityId: "session-2",
    associatedEntityType: "session",

    validationStatus: "valid",
    hasConflicts: false,

    tags: ["session-start", "sunless-citadel", "approach"],

    position: {
      realWorldPosition: 6,
      inGamePosition: 6,
      isAnchored: true
    }
  },

  // Discovery of the Sunless Citadel
  {
    title: "Discovery of the Sunless Citadel",
    description: "The party discovers the ancient fortress built into a ravine. They meet Talgen Hucrele who tells them about his missing siblings.",
    entryType: TimelineEntryType.DISCOVERY,
    sequence: 7,
    importance: 9,

    realWorldTime: new Date('2024-01-22T19:30:00Z'),
    inGameTime: new Date('1372-01-06T12:00:00Z'),

    timeGapBefore: {
      duration: 4,
      unit: TimeUnit.HOURS,
      description: "Travel to the citadel"
    },

    associatedEntityId: "location-sunless-citadel",
    associatedEntityType: "location",

    validationStatus: "valid",
    hasConflicts: false,

    tags: ["discovery", "sunless-citadel", "talgen-hucrele", "quest"],

    position: {
      realWorldPosition: 7,
      inGamePosition: 7,
      isAnchored: false
    }
  },

  // Major Story Event
  {
    title: "The Gulthias Tree Revealed",
    description: "Deep in the citadel, the party discovers the evil Gulthias Tree and learns it's the source of the cursed fruit that has been affecting the region.",
    entryType: TimelineEntryType.STORY_EVENT,
    sequence: 8,
    importance: 10,

    realWorldTime: new Date('2024-01-22T21:30:00Z'),
    inGameTime: new Date('1372-01-06T18:00:00Z'),

    timeGapBefore: {
      duration: 6,
      unit: TimeUnit.HOURS,
      description: "Exploration of the citadel"
    },

    associatedEntityId: "artifact-gulthias-tree",
    associatedEntityType: "artifact",

    validationStatus: "valid",
    hasConflicts: false,

    tags: ["story-event", "gulthias-tree", "curse", "revelation"],

    position: {
      realWorldPosition: 8,
      inGamePosition: 8,
      isAnchored: false
    }
  },

  // Character Development
  {
    title: "Elara Learns Fireball",
    description: "After studying ancient magical texts found in the citadel, Elara successfully learns the fireball spell, reaching 5th level.",
    entryType: TimelineEntryType.CHARACTER_EVENT,
    sequence: 9,
    importance: 6,

    realWorldTime: new Date('2024-01-29T20:00:00Z'),
    inGameTime: new Date('1372-01-07T10:00:00Z'),

    timeGapBefore: {
      duration: 16,
      unit: TimeUnit.HOURS,
      description: "Study and rest"
    },

    associatedEntityId: "character-elara-moonwhisper",
    associatedEntityType: "character",

    validationStatus: "valid",
    hasConflicts: false,

    tags: ["character-development", "spell-learning", "level-up", "elara"],

    position: {
      realWorldPosition: 9,
      inGamePosition: 9,
      isAnchored: false
    }
  },

  // Final Boss Battle
  {
    title: "Battle with Belak the Outcast",
    description: "Epic final battle against Belak the Outcast, the druid who corrupted the Gulthias Tree. The party barely survives but emerges victorious.",
    entryType: TimelineEntryType.COMBAT,
    sequence: 10,
    importance: 10,

    realWorldTime: new Date('2024-01-29T21:45:00Z'),
    inGameTime: new Date('1372-01-07T16:00:00Z'),

    timeGapBefore: {
      duration: 6,
      unit: TimeUnit.HOURS,
      description: "Final preparations and approach"
    },

    associatedEntityId: "npc-belak-outcast",
    associatedEntityType: "npc",

    validationStatus: "valid",
    hasConflicts: false,

    tags: ["boss-battle", "belak", "final-encounter", "victory"],

    position: {
      realWorldPosition: 10,
      inGamePosition: 10,
      isAnchored: false
    }
  }
];

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
