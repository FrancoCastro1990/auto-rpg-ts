// Domain Service: LevelRestrictionsService - Handles level-based restrictions and validations

import { IPlayer } from '../entities/interfaces';
import { IParty } from '../entities/interfaces';
import { ICharacter } from '../entities/interfaces';
import { ExperienceService } from './ExperienceService';

export interface RestrictionValidation {
  isValid: boolean;
  message: string;
  maxAllowed?: number;
  currentCount?: number;
}

export interface PartyRestrictionValidation extends RestrictionValidation {
  characterLimit: RestrictionValidation;
  ruleLimit: RestrictionValidation;
}

export class LevelRestrictionsService {
  /**
   * Validate party creation/modification restrictions
   */
  public static validatePartyRestrictions(player: IPlayer, party: IParty): PartyRestrictionValidation {
    const characterValidation = this.validateCharacterLimit(player, party.characters.length);
    const ruleValidations = party.characters.map(character =>
      this.validateCharacterRules(player, character)
    );

    // Check if any character exceeds rule limits
    const ruleLimitExceeded = ruleValidations.some(validation => !validation.isValid);

    const overallValid = characterValidation.isValid && !ruleLimitExceeded;

    let message = '';
    if (!characterValidation.isValid) {
      message = characterValidation.message;
    } else if (ruleLimitExceeded) {
      const invalidIndex = ruleValidations.findIndex(v => !v.isValid);
      if (invalidIndex !== -1 && invalidIndex < party.characters.length) {
        const invalidCharacter = party.characters[invalidIndex];
        const invalidValidation = ruleValidations[invalidIndex];
        if (invalidCharacter && invalidValidation) {
          message = `Character "${invalidCharacter.name}" exceeds rule limit: ${invalidValidation.message}`;
        }
      }
    } else {
      message = 'Party meets all level requirements';
    }

    return {
      isValid: overallValid,
      message,
      characterLimit: characterValidation,
      ruleLimit: {
        isValid: !ruleLimitExceeded,
        message: ruleLimitExceeded ? 'One or more characters exceed rule limits' : 'All characters meet rule limits',
        maxAllowed: ExperienceService.getMaxAllowedValue(player.level, 'rule_limit'),
        currentCount: Math.max(...party.characters.map(c => c.rules.length))
      }
    };
  }

  /**
   * Validate character limit for player's level
   */
  public static validateCharacterLimit(player: IPlayer, characterCount: number): RestrictionValidation {
    const maxAllowed = ExperienceService.getMaxAllowedValue(player.level, 'character_limit');

    const isValid = characterCount <= maxAllowed;

    return {
      isValid,
      message: isValid
        ? `Character count (${characterCount}) is within limit (${maxAllowed})`
        : `Level ${player.level} allows maximum ${maxAllowed} characters, but party has ${characterCount}`,
      maxAllowed,
      currentCount: characterCount
    };
  }

  /**
   * Validate rules per character for player's level
   */
  public static validateCharacterRules(player: IPlayer, character: ICharacter): RestrictionValidation {
    const maxAllowed = ExperienceService.getMaxAllowedValue(player.level, 'rule_limit');
    const currentRules = character.rules.length;

    const isValid = currentRules <= maxAllowed;

    return {
      isValid,
      message: isValid
        ? `Character "${character.name}" has ${currentRules} rules (max: ${maxAllowed})`
        : `Character "${character.name}" has ${currentRules} rules, but level ${player.level} allows maximum ${maxAllowed}`,
      maxAllowed,
      currentCount: currentRules
    };
  }

  /**
   * Get all restrictions for a player level
   */
  public static getLevelRestrictions(playerLevel: number): {
    characterLimit: number;
    ruleLimit: number;
    availableContent: string[];
  } {
    const unlocks = ExperienceService.getAvailableContentUnlocks(playerLevel);

    return {
      characterLimit: ExperienceService.getMaxAllowedValue(playerLevel, 'character_limit'),
      ruleLimit: ExperienceService.getMaxAllowedValue(playerLevel, 'rule_limit'),
      availableContent: unlocks.map(unlock => unlock.description)
    };
  }

  /**
   * Check if player can add a character to a party
   */
  public static canAddCharacterToParty(player: IPlayer, currentCharacterCount: number): RestrictionValidation {
    const maxAllowed = ExperienceService.getMaxAllowedValue(player.level, 'character_limit');

    return {
      isValid: currentCharacterCount < maxAllowed,
      message: currentCharacterCount >= maxAllowed
        ? `Cannot add character: Level ${player.level} allows maximum ${maxAllowed} characters`
        : `Can add character: ${currentCharacterCount}/${maxAllowed} characters used`,
      maxAllowed,
      currentCount: currentCharacterCount
    };
  }

  /**
   * Check if player can add a rule to a character
   */
  public static canAddRuleToCharacter(player: IPlayer, currentRuleCount: number): RestrictionValidation {
    const maxAllowed = ExperienceService.getMaxAllowedValue(player.level, 'rule_limit');

    return {
      isValid: currentRuleCount < maxAllowed,
      message: currentRuleCount >= maxAllowed
        ? `Cannot add rule: Level ${player.level} allows maximum ${maxAllowed} rules per character`
        : `Can add rule: ${currentRuleCount}/${maxAllowed} rules used`,
      maxAllowed,
      currentCount: currentRuleCount
    };
  }

  /**
   * Get upgrade requirements for next level restrictions
   */
  public static getNextLevelUpgradeInfo(currentLevel: number): {
    nextLevel: number;
    experienceNeeded: number;
    newRestrictions: string[];
  } | null {
    const nextLevel = currentLevel + 1;
    const experienceNeeded = ExperienceService.getExperienceForLevel(nextLevel);
    const newUnlocks = ExperienceService.getContentUnlocksForLevel(nextLevel);

    if (newUnlocks.length === 0) {
      return null; // No new restrictions at this level
    }

    return {
      nextLevel,
      experienceNeeded,
      newRestrictions: newUnlocks.map(unlock => unlock.description)
    };
  }

  /**
   * Validate party modification (add character)
   */
  public static validatePartyModification(
    player: IPlayer,
    currentParty: IParty,
    modification: 'add_character' | 'add_rule',
    targetCharacterIndex?: number
  ): RestrictionValidation {
    switch (modification) {
      case 'add_character':
        return this.canAddCharacterToParty(player, currentParty.characters.length);

      case 'add_rule':
        if (targetCharacterIndex === undefined || targetCharacterIndex >= currentParty.characters.length) {
          return {
            isValid: false,
            message: 'Invalid character index for rule addition'
          };
        }
        const targetCharacter = currentParty.characters[targetCharacterIndex];
        if (!targetCharacter) {
          return {
            isValid: false,
            message: 'Character not found at specified index'
          };
        }
        return this.canAddRuleToCharacter(player, targetCharacter.rules.length);

      default:
        return {
          isValid: false,
          message: 'Unknown modification type'
        };
    }
  }

  /**
   * Get detailed restriction status for a player and their party
   */
  public static getRestrictionStatus(player: IPlayer, party?: IParty): {
    level: number;
    restrictions: {
      characterLimit: RestrictionValidation;
      ruleLimits: RestrictionValidation[];
    };
    overallValid: boolean;
    upgradeInfo?: {
      nextLevel: number;
      experienceNeeded: number;
      newRestrictions: string[];
    };
  } {
    const characterLimit = party
      ? this.validateCharacterLimit(player, party.characters.length)
      : { isValid: true, message: 'No party to validate', maxAllowed: ExperienceService.getMaxAllowedValue(player.level, 'character_limit') };

    const ruleLimits = party
      ? party.characters.map(character => this.validateCharacterRules(player, character))
      : [];

    const overallValid = characterLimit.isValid && ruleLimits.every(validation => validation.isValid);

    const upgradeInfo = this.getNextLevelUpgradeInfo(player.level);

    return {
      level: player.level,
      restrictions: {
        characterLimit,
        ruleLimits
      },
      overallValid,
      ...(upgradeInfo && { upgradeInfo })
    };
  }
}