import { Job, Enemy, PartyMember, Ability, Rule } from '../models/types';

export class DataConsistencyValidator {
  /**
   * Valida la consistencia entre las reglas de los miembros del party y las habilidades disponibles de su job
   */
  static validatePartyRulesConsistency(
    party: PartyMember[],
    jobs: Job[],
    skills: Ability[]
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const jobMap = new Map(jobs.map(job => [job.name, job]));
    const skillMap = new Map(skills.map(skill => [skill.name.toLowerCase().replace(/\s+/g, '_'), skill]));

    for (const member of party) {
      const job = jobMap.get(member.job);

      if (!job) {
        errors.push(`Party member ${member.name} has unknown job: ${member.job}`);
        continue;
      }

      const availableSkillIds = new Set(job.skillIds);
      const availableSkillNames = new Set(job.skillIds.map(id => id));

      for (const rule of member.rules) {
        if (rule.action.startsWith('cast:')) {
          const skillId = rule.action.substring(5); // Remove 'cast:' prefix

          if (!availableSkillIds.has(skillId)) {
            errors.push(
              `Party member ${member.name} (job: ${member.job}) has rule that references skill "${skillId}" ` +
              `which is not available for their job. Available skills: ${Array.from(availableSkillIds).join(', ')}`
            );
          }

          if (!skillMap.has(skillId)) {
            errors.push(
              `Party member ${member.name} references skill "${skillId}" which does not exist in skills database`
            );
          }
        }
      }

      // Warning for characters with no cast rules
      const hasCastRules = member.rules.some(rule => rule.action.startsWith('cast:'));
      if (!hasCastRules && job.skillIds.length > 1) { // More than just basic_attack
        warnings.push(
          `Party member ${member.name} (${member.job}) has no cast rules but has ${job.skillIds.length} skills available`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valida la consistencia de las reglas de los enemigos
   */
  static validateEnemyRulesConsistency(
    enemies: Enemy[],
    jobs: Job[],
    skills: Ability[]
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const jobMap = new Map(jobs.map(job => [job.name, job]));
    const skillMap = new Map(skills.map(skill => [skill.name.toLowerCase().replace(/\s+/g, '_'), skill]));

    for (const enemy of enemies) {
      const job = jobMap.get(enemy.job);

      if (!job) {
        errors.push(`Enemy ${enemy.type} has unknown job: ${enemy.job}`);
        continue;
      }

      const availableSkillIds = new Set(job.skillIds);

      for (const rule of enemy.rules) {
        if (rule.action.startsWith('cast:')) {
          const skillId = rule.action.substring(5);

          if (!availableSkillIds.has(skillId)) {
            errors.push(
              `Enemy ${enemy.type} (job: ${enemy.job}) has rule that references skill "${skillId}" ` +
              `which is not available for their job. Available skills: ${Array.from(availableSkillIds).join(', ')}`
            );
          }

          if (!skillMap.has(skillId)) {
            errors.push(
              `Enemy ${enemy.type} references skill "${skillId}" which does not exist in skills database`
            );
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Genera un reporte completo de consistencia de datos
   */
  static generateConsistencyReport(
    party: PartyMember[],
    jobs: Job[],
    enemies: Enemy[],
    skills: Ability[]
  ): {
    partyValidation: { valid: boolean; errors: string[]; warnings: string[] };
    enemyValidation: { valid: boolean; errors: string[]; warnings: string[] };
    overallValid: boolean;
    summary: string;
  } {
    const partyValidation = this.validatePartyRulesConsistency(party, jobs, skills);
    const enemyValidation = this.validateEnemyRulesConsistency(enemies, jobs, skills);

    const overallValid = partyValidation.valid && enemyValidation.valid;

    const summary = `
Data Consistency Report:
========================
Party Members: ${partyValidation.valid ? '✅ Valid' : '❌ Invalid'}
  - Errors: ${partyValidation.errors.length}
  - Warnings: ${partyValidation.warnings.length}

Enemies: ${enemyValidation.valid ? '✅ Valid' : '❌ Invalid'}
  - Errors: ${enemyValidation.errors.length}
  - Warnings: ${enemyValidation.warnings.length}

Overall Status: ${overallValid ? '✅ All data is consistent' : '❌ Data consistency issues found'}
    `.trim();

    return {
      partyValidation,
      enemyValidation,
      overallValid,
      summary
    };
  }

  /**
   * Sugiere correcciones automáticas para problemas comunes
   */
  static suggestCorrections(
    party: PartyMember[],
    jobs: Job[]
  ): Array<{ member: string; rule: Rule; suggestion: string }> {
    const suggestions: Array<{ member: string; rule: Rule; suggestion: string }> = [];
    const jobMap = new Map(jobs.map(job => [job.name, job]));

    for (const member of party) {
      const job = jobMap.get(member.job);
      if (!job) continue;

      const availableSkillIds = new Set(job.skillIds);

      for (const rule of member.rules) {
        if (rule.action.startsWith('cast:')) {
          const skillId = rule.action.substring(5);

          if (!availableSkillIds.has(skillId)) {
            // Find similar skills
            const similarSkills = Array.from(availableSkillIds)
              .filter(id => id !== 'basic_attack')
              .slice(0, 3);

            if (similarSkills.length > 0) {
              suggestions.push({
                member: member.name,
                rule,
                suggestion: `Change 'cast:${skillId}' to 'cast:${similarSkills[0]}' (available: ${similarSkills.join(', ')})`
              });
            } else {
              suggestions.push({
                member: member.name,
                rule,
                suggestion: `Remove or change rule - no suitable skills available for ${member.job}`
              });
            }
          }
        }
      }
    }

    return suggestions;
  }
}