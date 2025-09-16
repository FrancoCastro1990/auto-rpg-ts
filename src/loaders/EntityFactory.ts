import {
  Character,
  EnemyInstance,
  Job,
  Enemy,
  PartyMember,
  Ability,
  Stats
} from '../models/types';

export class EntityFactory {
  private skills: Map<string, Ability>;
  private jobs: Map<string, Job>;
  private enemies: Map<string, Enemy>;

  constructor(skills: Ability[], jobs: Job[], enemies: Enemy[]) {
    this.skills = new Map(skills.map(skill => [skill.name.toLowerCase().replace(/\s+/g, '_'), skill]));
    this.jobs = new Map(jobs.map(job => [job.name, job]));
    this.enemies = new Map(enemies.map(enemy => [enemy.type, enemy]));
  }

  private calculateStatsForLevel(baseStats: Stats, level: number): Stats {
    const multiplier = 1 + (level - 1) * 0.1;

    return {
      hp: Math.floor(baseStats.hp * multiplier),
      mp: Math.floor(baseStats.mp * multiplier),
      str: Math.floor(baseStats.str * multiplier),
      def: Math.floor(baseStats.def * multiplier),
      mag: Math.floor(baseStats.mag * multiplier),
      spd: Math.floor(baseStats.spd * multiplier)
    };
  }

  private getSkillsForIds(skillIds: string[]): Ability[] {
    const abilities: Ability[] = [];

    for (const skillId of skillIds) {
      const skill = this.skills.get(skillId);
      if (skill) {
        abilities.push(skill);
      } else {
        console.warn(`Warning: Skill not found: ${skillId}`);
      }
    }

    return abilities;
  }

  createCharacter(member: PartyMember): Character {
    const job = this.jobs.get(member.job);
    if (!job) {
      throw new Error(`Job not found: ${member.job}`);
    }

    const baseStats = this.calculateStatsForLevel(job.baseStats, member.level);
    const abilities = this.getSkillsForIds(job.skillIds);

    return {
      id: `char_${member.name.toLowerCase()}`,
      name: member.name,
      job: member.job,
      level: member.level,
      currentStats: { ...baseStats },
      maxStats: { ...baseStats },
      baseStats: { ...job.baseStats },
      abilities,
      rules: member.rules,
      buffs: [],
      isAlive: true,
      isEnemy: false
    };
  }

  createEnemy(enemyType: string, name?: string, level: number = 1): EnemyInstance {
    const enemyTemplate = this.enemies.get(enemyType);
    if (!enemyTemplate) {
      throw new Error(`Enemy type not found: ${enemyType}`);
    }

    const baseStats = this.calculateStatsForLevel(enemyTemplate.baseStats, level);
    const abilities = this.getSkillsForIds(enemyTemplate.skillIds || []);

    const instanceName = name || `${enemyType}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    return {
      id: `enemy_${instanceName.toLowerCase().replace(/\s+/g, '_')}`,
      name: instanceName,
      type: enemyType,
      job: enemyTemplate.job,
      currentStats: { ...baseStats },
      maxStats: { ...baseStats },
      baseStats: { ...enemyTemplate.baseStats },
      abilities,
      rules: enemyTemplate.rules,
      buffs: [],
      isAlive: true,
      isEnemy: true,
      isBoss: enemyTemplate.isBoss || false
    };
  }

  createEnemiesFromBattle(battleEnemies: Array<{ type: string; name?: string }>, level: number = 1): EnemyInstance[] {
    return battleEnemies.map(enemy =>
      this.createEnemy(enemy.type, enemy.name, level)
    );
  }

  getSkillByName(skillName: string): Ability | undefined {
    return this.skills.get(skillName.toLowerCase().replace(/\s+/g, '_'));
  }

  getSkillById(skillId: string): Ability | undefined {
    return this.skills.get(skillId);
  }

  listAvailableJobs(): string[] {
    return Array.from(this.jobs.keys());
  }

  listAvailableEnemies(): string[] {
    return Array.from(this.enemies.keys());
  }

  listAvailableSkills(): string[] {
    return Array.from(this.skills.keys());
  }

  getJobDetails(jobName: string): Job | undefined {
    return this.jobs.get(jobName);
  }

  getEnemyDetails(enemyType: string): Enemy | undefined {
    return this.enemies.get(enemyType);
  }

  validateSkillReferences(skillIds: string[]): { valid: string[]; invalid: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];

    for (const skillId of skillIds) {
      if (this.skills.has(skillId)) {
        valid.push(skillId);
      } else {
        invalid.push(skillId);
      }
    }

    return { valid, invalid };
  }
}