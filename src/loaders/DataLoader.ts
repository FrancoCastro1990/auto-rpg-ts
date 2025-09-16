import { promises as fs } from 'fs';
import { join } from 'path';
import {
  Job,
  Enemy,
  Dungeon,
  PartyMember,
  Ability,
  Stats,
  Rule
} from '../models/types';
import { DataLoadError, ValidationError, Validator } from '../utils/errors';

export class DataLoader {
  private dataPath: string;

  constructor(dataPath: string = './data') {
    this.dataPath = dataPath;
  }

  private async loadJSONFile<T>(filename: string): Promise<T> {
    try {
      const filePath = join(this.dataPath, filename);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new DataLoadError(`Invalid JSON format in ${filename}`, filename);
      }
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new DataLoadError(`File not found: ${filename}`, filename);
      }
      throw new DataLoadError(`Failed to load ${filename}: ${error}`, filename);
    }
  }

  private validateStats(stats: any, context: string): Stats {
    const requiredProps = ['hp', 'mp', 'str', 'def', 'mag', 'spd'];

    if (!stats || typeof stats !== 'object') {
      throw new DataLoadError(`Invalid stats object in ${context}`);
    }

    for (const prop of requiredProps) {
      if (typeof stats[prop] !== 'number' || stats[prop] < 0) {
        throw new DataLoadError(`Invalid or missing ${prop} in stats for ${context}`);
      }
    }

    return {
      hp: stats.hp,
      mp: stats.mp,
      str: stats.str,
      def: stats.def,
      mag: stats.mag,
      spd: stats.spd
    };
  }

  private validateRule(rule: any, context: string): Rule {
    if (!rule || typeof rule !== 'object') {
      throw new DataLoadError(`Invalid rule object in ${context}`);
    }

    if (typeof rule.priority !== 'number' || rule.priority < 0) {
      throw new DataLoadError(`Invalid priority in rule for ${context}`);
    }

    if (typeof rule.condition !== 'string' || !rule.condition.trim()) {
      throw new DataLoadError(`Invalid condition in rule for ${context}`);
    }

    if (typeof rule.target !== 'string' || !rule.target.trim()) {
      throw new DataLoadError(`Invalid target in rule for ${context}`);
    }

    if (typeof rule.action !== 'string' || !rule.action.trim()) {
      throw new DataLoadError(`Invalid action in rule for ${context}`);
    }

    return {
      priority: rule.priority,
      condition: rule.condition,
      target: rule.target,
      action: rule.action
    };
  }

  private validateAbility(ability: any, context: string): Ability {
    if (!ability || typeof ability !== 'object') {
      throw new DataLoadError(`Invalid ability object in ${context}`);
    }

    if (typeof ability.id !== 'string' || !ability.id.trim()) {
      throw new DataLoadError(`Invalid ability id in ${context}`);
    }

    if (typeof ability.name !== 'string' || !ability.name.trim()) {
      throw new DataLoadError(`Invalid ability name in ${context}`);
    }

    const validTypes = ['attack', 'heal', 'buff', 'debuff'];
    if (!validTypes.includes(ability.type)) {
      throw new DataLoadError(`Invalid ability type '${ability.type}' in ${context}`);
    }

    if (typeof ability.mpCost !== 'number' || ability.mpCost < 0) {
      throw new DataLoadError(`Invalid mpCost in ability for ${context}`);
    }

    if (!ability.effect || typeof ability.effect !== 'object') {
      throw new DataLoadError(`Invalid effect object in ability for ${context}`);
    }

    return {
      id: ability.id,
      name: ability.name,
      type: ability.type,
      effect: ability.effect,
      mpCost: ability.mpCost,
      cooldown: ability.cooldown,
      level: ability.level,
      combinations: ability.combinations,
      description: ability.description || ''
    };
  }

  async loadSkills(): Promise<Ability[]> {
    const skillsData = await this.loadJSONFile<any[]>('skills.json');

    if (!Array.isArray(skillsData)) {
      throw new DataLoadError('skills.json must contain an array');
    }

    return skillsData.map((skill, index) =>
      this.validateAbility(skill, `skills.json[${index}]`)
    );
  }

  async loadJobs(): Promise<Job[]> {
    const jobsData = await this.loadJSONFile<any[]>('jobs.json');

    if (!Array.isArray(jobsData)) {
      throw new DataLoadError('jobs.json must contain an array');
    }

    return jobsData.map((job, index) => {
      if (!job.name || typeof job.name !== 'string') {
        throw new DataLoadError(`Invalid job name at index ${index}`);
      }

      if (!Array.isArray(job.skillIds)) {
        throw new DataLoadError(`Invalid skillIds array for job ${job.name}`);
      }

      return {
        name: job.name,
        baseStats: this.validateStats(job.baseStats, `job ${job.name}`),
        skillIds: job.skillIds,
        description: job.description || ''
      };
    });
  }

  async loadEnemies(): Promise<Enemy[]> {
    const enemiesData = await this.loadJSONFile<any[]>('enemies.json');

    if (!Array.isArray(enemiesData)) {
      throw new DataLoadError('enemies.json must contain an array');
    }

    return enemiesData.map((enemy, index) => {
      if (!enemy.type || typeof enemy.type !== 'string') {
        throw new DataLoadError(`Invalid enemy type at index ${index}`);
      }

      if (!enemy.job || typeof enemy.job !== 'string') {
        throw new DataLoadError(`Invalid enemy job for ${enemy.type}`);
      }

      if (!Array.isArray(enemy.rules)) {
        throw new DataLoadError(`Invalid rules array for enemy ${enemy.type}`);
      }

      const rules = enemy.rules.map((rule: any, ruleIndex: number) =>
        this.validateRule(rule, `enemy ${enemy.type} rule[${ruleIndex}]`)
      );

      return {
        type: enemy.type,
        job: enemy.job,
        baseStats: this.validateStats(enemy.baseStats, `enemy ${enemy.type}`),
        rules,
        skillIds: enemy.skillIds || [],
        isBoss: Boolean(enemy.isBoss),
        description: enemy.description || ''
      };
    });
  }

  async loadParty(): Promise<PartyMember[]> {
    const partyData = await this.loadJSONFile<any[]>('party.json');

    if (!Array.isArray(partyData)) {
      throw new DataLoadError('party.json must contain an array');
    }

    return partyData.map((member, index) => {
      if (!member.name || typeof member.name !== 'string') {
        throw new DataLoadError(`Invalid party member name at index ${index}`);
      }

      if (!member.job || typeof member.job !== 'string') {
        throw new DataLoadError(`Invalid job for party member ${member.name}`);
      }

      if (typeof member.level !== 'number' || member.level < 1) {
        throw new DataLoadError(`Invalid level for party member ${member.name}`);
      }

      if (!Array.isArray(member.rules)) {
        throw new DataLoadError(`Invalid rules array for party member ${member.name}`);
      }

      const rules = member.rules.map((rule: any, ruleIndex: number) =>
        this.validateRule(rule, `party member ${member.name} rule[${ruleIndex}]`)
      );

      return {
        name: member.name,
        job: member.job,
        level: member.level,
        rules
      };
    });
  }

  async loadPartyFile(partyFile: string): Promise<PartyMember[]> {
    const partyData = await this.loadJSONFile<any[]>(partyFile);

    if (!Array.isArray(partyData)) {
      throw new DataLoadError(`${partyFile} must contain an array`);
    }

    return partyData.map((member, index) => {
      if (!member.name || typeof member.name !== 'string') {
        throw new DataLoadError(`Invalid party member name at index ${index} in ${partyFile}`);
      }

      if (!member.job || typeof member.job !== 'string') {
        throw new DataLoadError(`Invalid job for party member ${member.name} in ${partyFile}`);
      }

      if (typeof member.level !== 'number' || member.level < 1) {
        throw new DataLoadError(`Invalid level for party member ${member.name} in ${partyFile}`);
      }

      if (!Array.isArray(member.rules)) {
        throw new DataLoadError(`Invalid rules array for party member ${member.name} in ${partyFile}`);
      }

      const rules = member.rules.map((rule: any, ruleIndex: number) =>
        this.validateRule(rule, `party member ${member.name} rule[${ruleIndex}]`)
      );

      return {
        name: member.name,
        job: member.job,
        level: member.level,
        rules
      };
    });
  }

  async loadDungeon(dungeonFile: string): Promise<Dungeon> {
    const dungeonData = await this.loadJSONFile<any>(dungeonFile);

    if (typeof dungeonData.id !== 'number') {
      throw new DataLoadError(`Invalid dungeon id in ${dungeonFile}`);
    }

    if (!dungeonData.name || typeof dungeonData.name !== 'string') {
      throw new DataLoadError(`Invalid dungeon name in ${dungeonFile}`);
    }

    if (!Array.isArray(dungeonData.battles)) {
      throw new DataLoadError(`Invalid battles array in ${dungeonFile}`);
    }

    const battles = dungeonData.battles.map((battle: any, index: number) => {
      if (typeof battle.id !== 'number') {
        throw new DataLoadError(`Invalid battle id at index ${index} in ${dungeonFile}`);
      }

      if (typeof battle.order !== 'number') {
        throw new DataLoadError(`Invalid battle order at index ${index} in ${dungeonFile}`);
      }

      if (!Array.isArray(battle.enemies)) {
        throw new DataLoadError(`Invalid enemies array for battle ${battle.id} in ${dungeonFile}`);
      }

      const enemies = battle.enemies.map((enemy: any, enemyIndex: number) => {
        if (!enemy.type || typeof enemy.type !== 'string') {
          throw new DataLoadError(`Invalid enemy type at battle ${battle.id}, enemy ${enemyIndex} in ${dungeonFile}`);
        }

        return {
          type: enemy.type,
          name: enemy.name || `${enemy.type} ${enemyIndex + 1}`
        };
      });

      return {
        id: battle.id,
        order: battle.order,
        enemies
      };
    });

    return {
      id: dungeonData.id,
      name: dungeonData.name,
      description: dungeonData.description || '',
      battles
    };
  }

  async validateDataIntegrity(): Promise<{
    skills: Ability[];
    jobs: Job[];
    enemies: Enemy[];
    party: PartyMember[];
  }> {
    const [skills, jobs, enemies, party] = await Promise.all([
      this.loadSkills(),
      this.loadJobs(),
      this.loadEnemies(),
      this.loadParty()
    ]);

    const skillIds = new Set(skills.map(skill => skill.id));

    for (const job of jobs) {
      for (const skillId of job.skillIds) {
        if (!skillIds.has(skillId)) {
          throw new DataLoadError(`Job ${job.name} references unknown skill: ${skillId}`);
        }
      }
    }

    for (const enemy of enemies) {
      for (const skillId of enemy.skillIds || []) {
        if (!skillIds.has(skillId)) {
          throw new DataLoadError(`Enemy ${enemy.type} references unknown skill: ${skillId}`);
        }
      }
    }

    const jobNames = new Set(jobs.map(job => job.name));
    for (const member of party) {
      if (!jobNames.has(member.job)) {
        throw new DataLoadError(`Party member ${member.name} has unknown job: ${member.job}`);
      }
    }

    // Validate party member rules against their job skills
    await this.validatePartyRulesConsistency(party, jobs, skills);

    return { skills, jobs, enemies, party };
  }

  private async validatePartyRulesConsistency(
    party: PartyMember[],
    jobs: Job[],
    skills: Ability[]
  ): Promise<void> {
    const jobMap = new Map(jobs.map(job => [job.name, job]));
    const skillMap = new Map(skills.map(skill => [skill.id, skill]));

    for (const member of party) {
      const job = jobMap.get(member.job);
      if (!job) continue;

      const availableSkillIds = new Set(job.skillIds);

      for (const rule of member.rules) {
        if (rule.action.startsWith('cast:')) {
          const skillId = rule.action.substring(5); // Remove 'cast:' prefix
          if (!availableSkillIds.has(skillId)) {
            throw new DataLoadError(
              `Party member ${member.name} (job: ${member.job}) has rule that references skill "${skillId}" ` +
              `which is not available for their job. Available skills: ${Array.from(availableSkillIds).join(', ')}`
            );
          }

          // Additional validation: check if skill exists in skills.json
          if (!skillMap.has(skillId)) {
            throw new DataLoadError(
              `Party member ${member.name} references skill "${skillId}" which does not exist in skills.json`
            );
          }
        }
      }
    }
  }
}