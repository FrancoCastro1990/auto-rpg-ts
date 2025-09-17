// Domain Service: ExperienceService - Handles experience calculation and leveling logic

import { IPlayer } from '../entities/interfaces';
import { Player } from '../entities/Player';
import { Experience } from '../entities/valueObjects';

export interface ExperienceCalculationParams {
  victory: boolean;
  dungeonDifficulty: number;
  battleDuration: number;
  playerLevel: number;
  partySize: number;
}

export interface ContentUnlockRequirements {
  level: number;
  description: string;
  type: 'character_limit' | 'rule_limit' | 'job_unlock' | 'skill_unlock';
  value?: any;
}

export class ExperienceService {
  private static readonly BASE_EXPERIENCE_PER_VICTORY = 100;
  private static readonly BASE_EXPERIENCE_PER_DEFEAT = 25;
  private static readonly DIFFICULTY_MULTIPLIER = 1.5;
  private static readonly DURATION_PENALTY_THRESHOLD = 50; // turns
  private static readonly DURATION_PENALTY_MULTIPLIER = 0.8;

  // Level thresholds - experience required for each level
  private static readonly LEVEL_THRESHOLDS: Record<number, number> = {
    1: 0,
    2: 200,
    3: 500,
    4: 900,
    5: 1400,
    6: 2000,
    7: 2750,
    8: 3600,
    9: 4550,
    10: 5600,
    // Add more levels as needed
  };

  // Content unlock requirements by level
  private static readonly CONTENT_UNLOCKS: ContentUnlockRequirements[] = [
    {
      level: 1,
      description: 'Maximum 2 characters per party',
      type: 'character_limit',
      value: 2
    },
    {
      level: 1,
      description: 'Maximum 1 rule per character',
      type: 'rule_limit',
      value: 1
    },
    {
      level: 2,
      description: 'Maximum 3 characters per party',
      type: 'character_limit',
      value: 3
    },
    {
      level: 2,
      description: 'Maximum 2 rules per character',
      type: 'rule_limit',
      value: 2
    },
    {
      level: 4,
      description: 'Maximum 4 characters per party',
      type: 'character_limit',
      value: 4
    },
    {
      level: 4,
      description: 'Maximum 3 rules per character',
      type: 'rule_limit',
      value: 3
    },
    // Add more unlocks as needed
  ];

  /**
   * Calculate experience gained from a combat result
   */
  public static calculateCombatExperience(params: ExperienceCalculationParams): number {
    const { victory, dungeonDifficulty, battleDuration, playerLevel, partySize } = params;

    // Base experience based on victory/defeat
    let experience = victory
      ? this.BASE_EXPERIENCE_PER_VICTORY
      : this.BASE_EXPERIENCE_PER_DEFEAT;

    // Difficulty multiplier
    experience *= Math.pow(this.DIFFICULTY_MULTIPLIER, dungeonDifficulty - 1);

    // Party size bonus (smaller parties get more experience per member)
    const partyMultiplier = 1 + (4 - partySize) * 0.1;
    experience *= partyMultiplier;

    // Level scaling (higher level players get less experience from low-level content)
    const levelDifference = playerLevel - dungeonDifficulty;
    if (levelDifference > 2) {
      experience *= Math.max(0.5, 1 - (levelDifference - 2) * 0.1);
    }

    // Duration penalty for very long battles
    if (battleDuration > this.DURATION_PENALTY_THRESHOLD) {
      const penaltyTurns = battleDuration - this.DURATION_PENALTY_THRESHOLD;
      experience *= Math.pow(this.DURATION_PENALTY_MULTIPLIER, penaltyTurns / 10);
    }

    return Math.floor(Math.max(1, experience));
  }

  /**
   * Get experience required for a specific level
   */
  public static getExperienceForLevel(level: number): number {
    return this.LEVEL_THRESHOLDS[level] || this.calculateExperienceForLevel(level);
  }

  /**
   * Calculate experience required for levels not in the predefined table
   */
  private static calculateExperienceForLevel(level: number): number {
    // Formula: base + (level * growth_factor) + (level^2 * quadratic_factor)
    const base = 5600; // Level 10 base
    const growthFactor = 150;
    const quadraticFactor = 25;

    return base + (level * growthFactor) + (level * level * quadraticFactor);
  }

  /**
   * Get the level for a given total experience
   */
  public static getLevelForExperience(totalExperience: number): number {
    let level = 1;
    while (level < 100) { // Prevent infinite loop
      const expForNextLevel = this.getExperienceForLevel(level + 1);
      if (totalExperience < expForNextLevel) {
        break;
      }
      level++;
    }
    return level;
  }

  /**
   * Create a new Experience value object for a player
   */
  public static createExperienceForPlayer(player: IPlayer): Experience {
    const currentLevelExp = this.getExperienceForLevel(player.level);
    const nextLevelExp = this.getExperienceForLevel(player.level + 1);
    const currentInLevel = player.experience.total - currentLevelExp;

    return new Experience(
      Math.min(currentInLevel, nextLevelExp - currentLevelExp),
      nextLevelExp - currentLevelExp,
      player.experience.total
    );
  }

  /**
   * Award experience to a player and handle level ups
   */
  public static awardExperience(player: IPlayer, experienceGained: number): IPlayer {
    const newTotalExperience = player.experience.total + experienceGained;
    const newLevel = this.getLevelForExperience(newTotalExperience);

    const currentLevelExp = this.getExperienceForLevel(newLevel);
    const nextLevelExp = this.getExperienceForLevel(newLevel + 1);
    const currentInLevel = newTotalExperience - currentLevelExp;

    const newExperience = new Experience(
      Math.min(currentInLevel, nextLevelExp - currentLevelExp),
      nextLevelExp - currentLevelExp,
      newTotalExperience
    );

    return new Player(
      player.id,
      player.username,
      newLevel,
      newExperience,
      player.createdAt,
      new Date()
    );
  }

  /**
   * Get all content unlocks available for a player level
   */
  public static getAvailableContentUnlocks(playerLevel: number): ContentUnlockRequirements[] {
    return this.CONTENT_UNLOCKS.filter(unlock => unlock.level <= playerLevel);
  }

  /**
   * Get content unlocks for a specific level
   */
  public static getContentUnlocksForLevel(level: number): ContentUnlockRequirements[] {
    return this.CONTENT_UNLOCKS.filter(unlock => unlock.level === level);
  }

  /**
   * Check if a player can access specific content
   */
  public static canAccessContent(playerLevel: number, contentType: string, value?: any): boolean {
    const unlocks = this.getAvailableContentUnlocks(playerLevel);

    switch (contentType) {
      case 'character_limit':
        const maxCharacters = Math.max(...unlocks
          .filter(u => u.type === 'character_limit')
          .map(u => u.value));
        return value <= maxCharacters;

      case 'rule_limit':
        const maxRules = Math.max(...unlocks
          .filter(u => u.type === 'rule_limit')
          .map(u => u.value));
        return value <= maxRules;

      default:
        return true;
    }
  }

  /**
   * Get the maximum allowed value for a content type at a player level
   */
  public static getMaxAllowedValue(playerLevel: number, contentType: string): number {
    const unlocks = this.getAvailableContentUnlocks(playerLevel);

    switch (contentType) {
      case 'character_limit':
        return Math.max(...unlocks
          .filter(u => u.type === 'character_limit')
          .map(u => u.value), 2); // Default to 2

      case 'rule_limit':
        return Math.max(...unlocks
          .filter(u => u.type === 'rule_limit')
          .map(u => u.value), 1); // Default to 1

      default:
        return Infinity;
    }
  }

  /**
   * Get experience progress information for a player
   */
  public static getExperienceProgress(player: IPlayer): {
    currentLevel: number;
    currentInLevel: number;
    nextLevelAt: number;
    progressPercentage: number;
    experienceToNext: number;
  } {
    const currentLevelExp = this.getExperienceForLevel(player.level);
    const nextLevelExp = this.getExperienceForLevel(player.level + 1);
    const currentInLevel = player.experience.total - currentLevelExp;
    const experienceToNext = nextLevelExp - player.experience.total;

    return {
      currentLevel: player.level,
      currentInLevel,
      nextLevelAt: nextLevelExp,
      progressPercentage: Math.floor((currentInLevel / (nextLevelExp - currentLevelExp)) * 100),
      experienceToNext
    };
  }
}