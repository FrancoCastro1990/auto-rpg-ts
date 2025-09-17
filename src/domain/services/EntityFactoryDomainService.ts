import { EntityFactory } from '../../loaders/EntityFactory';
import {
  Character,
  EnemyInstance,
  Job,
  Enemy,
  PartyMember,
  Ability,
  Stats
} from '../../models/types';
import { ValidationError, ConfigurationError } from '../../utils/errors';
import { BattleLogger } from '../../utils/BattleLogger';

export interface CharacterCreationRequest {
  member: PartyMember;
}

export interface CharacterCreationResponse {
  character: Character;
  creationTime: number;
}

export interface EnemyCreationRequest {
  enemyType: string;
  name?: string;
  level?: number;
}

export interface EnemyCreationResponse {
  enemy: EnemyInstance;
  creationTime: number;
}

export interface MultipleEnemiesCreationRequest {
  battleEnemies: Array<{ type: string; name?: string }>;
  level?: number;
}

export interface MultipleEnemiesCreationResponse {
  enemies: EnemyInstance[];
  creationTime: number;
}

export interface SkillLookupRequest {
  skillName?: string;
  skillId?: string;
}

export interface SkillLookupResponse {
  skill: Ability | undefined;
  found: boolean;
}

export interface JobLookupRequest {
  jobName: string;
}

export interface JobLookupResponse {
  job: Job | undefined;
  found: boolean;
}

export interface EnemyLookupRequest {
  enemyType: string;
}

export interface EnemyLookupResponse {
  enemy: Enemy | undefined;
  found: boolean;
}

export interface EntityValidationRequest {
  skillIds: string[];
}

export interface EntityValidationResponse {
  valid: string[];
  invalid: string[];
}

export interface EntityListRequest {
  type: 'jobs' | 'enemies' | 'skills';
}

export interface EntityListResponse {
  items: string[];
  count: number;
}

export class EntityFactoryDomainService {
  private entityFactory: EntityFactory;
  private logger: BattleLogger;

  constructor(
    skills: Ability[],
    jobs: Job[],
    enemies: Enemy[],
    logger?: BattleLogger
  ) {
    this.entityFactory = new EntityFactory(skills, jobs, enemies);
    this.logger = logger || new BattleLogger();
  }

  /**
   * Create a character from party member data
   */
  createCharacter(request: CharacterCreationRequest): CharacterCreationResponse {
    const startTime = Date.now();

    try {
      this.logger.logDebug('EntityFactoryDomainService', 'Creating character', {
        memberName: request.member.name,
        job: request.member.job,
        level: request.member.level,
        ruleCount: request.member.rules.length
      });

      const character = this.entityFactory.createCharacter(request.member);
      const creationTime = Date.now() - startTime;

      this.logger.logDebug('EntityFactoryDomainService', 'Character created successfully', {
        characterId: character.id,
        characterName: character.name,
        abilitiesCount: character.abilities.length,
        creationTimeMs: creationTime
      });

      return {
        character,
        creationTime
      };

    } catch (error) {
      const creationTime = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.logError('EntityFactoryDomainService', 'Character creation failed', {
        memberName: request.member.name,
        error: err.message,
        creationTimeMs: creationTime
      });

      throw new ValidationError(`Character creation failed: ${err.message}`);
    }
  }

  /**
   * Create an enemy instance
   */
  createEnemy(request: EnemyCreationRequest): EnemyCreationResponse {
    const startTime = Date.now();

    try {
      this.logger.logDebug('EntityFactoryDomainService', 'Creating enemy', {
        enemyType: request.enemyType,
        name: request.name,
        level: request.level || 1
      });

      const enemy = this.entityFactory.createEnemy(
        request.enemyType,
        request.name,
        request.level
      );
      const creationTime = Date.now() - startTime;

      this.logger.logDebug('EntityFactoryDomainService', 'Enemy created successfully', {
        enemyId: enemy.id,
        enemyName: enemy.name,
        enemyType: enemy.type,
        isBoss: enemy.isBoss,
        creationTimeMs: creationTime
      });

      return {
        enemy,
        creationTime
      };

    } catch (error) {
      const creationTime = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.logError('EntityFactoryDomainService', 'Enemy creation failed', {
        enemyType: request.enemyType,
        error: err.message,
        creationTimeMs: creationTime
      });

      throw new ValidationError(`Enemy creation failed: ${err.message}`);
    }
  }

  /**
   * Create multiple enemies from battle configuration
   */
  createEnemiesFromBattle(request: MultipleEnemiesCreationRequest): MultipleEnemiesCreationResponse {
    const startTime = Date.now();

    try {
      this.logger.logDebug('EntityFactoryDomainService', 'Creating multiple enemies', {
        enemyCount: request.battleEnemies.length,
        level: request.level || 1
      });

      const enemies = this.entityFactory.createEnemiesFromBattle(
        request.battleEnemies,
        request.level
      );
      const creationTime = Date.now() - startTime;

      this.logger.logDebug('EntityFactoryDomainService', 'Multiple enemies created successfully', {
        createdCount: enemies.length,
        enemyTypes: request.battleEnemies.map(e => e.type),
        creationTimeMs: creationTime
      });

      return {
        enemies,
        creationTime
      };

    } catch (error) {
      const creationTime = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.logError('EntityFactoryDomainService', 'Multiple enemies creation failed', {
        enemyCount: request.battleEnemies.length,
        error: err.message,
        creationTimeMs: creationTime
      });

      throw new ValidationError(`Multiple enemies creation failed: ${err.message}`);
    }
  }

  /**
   * Look up a skill by name or ID
   */
  getSkill(request: SkillLookupRequest): SkillLookupResponse {
    try {
      let skill: Ability | undefined;

      if (request.skillName) {
        skill = this.entityFactory.getSkillByName(request.skillName);
      } else if (request.skillId) {
        skill = this.entityFactory.getSkillById(request.skillId);
      }

      this.logger.logDebug('EntityFactoryDomainService', 'Skill lookup completed', {
        skillName: request.skillName,
        skillId: request.skillId,
        found: skill !== undefined,
        skillFound: skill?.name
      });

      return {
        skill,
        found: skill !== undefined
      };

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.logError('EntityFactoryDomainService', 'Skill lookup failed', {
        skillName: request.skillName,
        skillId: request.skillId,
        error: err.message
      });

      return {
        skill: undefined,
        found: false
      };
    }
  }

  /**
   * Look up a job by name
   */
  getJob(request: JobLookupRequest): JobLookupResponse {
    try {
      const job = this.entityFactory.getJobDetails(request.jobName);

      this.logger.logDebug('EntityFactoryDomainService', 'Job lookup completed', {
        jobName: request.jobName,
        found: job !== undefined,
        jobFound: job?.name
      });

      return {
        job,
        found: job !== undefined
      };

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.logError('EntityFactoryDomainService', 'Job lookup failed', {
        jobName: request.jobName,
        error: err.message
      });

      return {
        job: undefined,
        found: false
      };
    }
  }

  /**
   * Look up an enemy template by type
   */
  getEnemyTemplate(request: EnemyLookupRequest): EnemyLookupResponse {
    try {
      const enemy = this.entityFactory.getEnemyDetails(request.enemyType);

      this.logger.logDebug('EntityFactoryDomainService', 'Enemy template lookup completed', {
        enemyType: request.enemyType,
        found: enemy !== undefined,
        enemyFound: enemy?.type
      });

      return {
        enemy,
        found: enemy !== undefined
      };

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.logError('EntityFactoryDomainService', 'Enemy template lookup failed', {
        enemyType: request.enemyType,
        error: err.message
      });

      return {
        enemy: undefined,
        found: false
      };
    }
  }

  /**
   * Validate skill references
   */
  validateSkillReferences(request: EntityValidationRequest): EntityValidationResponse {
    try {
      this.logger.logDebug('EntityFactoryDomainService', 'Validating skill references', {
        skillCount: request.skillIds.length
      });

      const result = this.entityFactory.validateSkillReferences(request.skillIds);

      this.logger.logDebug('EntityFactoryDomainService', 'Skill validation completed', {
        validCount: result.valid.length,
        invalidCount: result.invalid.length
      });

      return result;

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.logError('EntityFactoryDomainService', 'Skill validation failed', {
        error: err.message
      });

      return {
        valid: [],
        invalid: request.skillIds
      };
    }
  }

  /**
   * List available entities
   */
  listEntities(request: EntityListRequest): EntityListResponse {
    try {
      let items: string[];

      switch (request.type) {
        case 'jobs':
          items = this.entityFactory.listAvailableJobs();
          break;
        case 'enemies':
          items = this.entityFactory.listAvailableEnemies();
          break;
        case 'skills':
          items = this.entityFactory.listAvailableSkills();
          break;
        default:
          throw new ValidationError(`Invalid entity type: ${request.type}`);
      }

      this.logger.logDebug('EntityFactoryDomainService', 'Entity list retrieved', {
        type: request.type,
        count: items.length
      });

      return {
        items,
        count: items.length
      };

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.logError('EntityFactoryDomainService', 'Entity list retrieval failed', {
        type: request.type,
        error: err.message
      });

      return {
        items: [],
        count: 0
      };
    }
  }

  /**
   * Get the underlying EntityFactory instance for advanced operations
   */
  getEntityFactory(): EntityFactory {
    return this.entityFactory;
  }
}