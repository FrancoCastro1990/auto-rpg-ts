import { DungeonProgress } from '../systems/DungeonManager';
import { BattleResult, Character } from '../models/types';
import { TurnResult } from '../systems/BattleSystem';
import { writeFileSync } from 'fs';
import { join } from 'path';

export interface BattleAnalysis {
  battleId: number;
  duration: number;
  outcome: 'victory' | 'defeat';
  damageDealt: number;
  healingDone: number;
  skillsUsed: Record<string, number>;
  participantPerformance: Array<{
    name: string;
    isEnemy: boolean;
    damageDealt: number;
    damageTaken: number;
    healingDone: number;
    skillsUsed: number;
    survived: boolean;
  }>;
}

export interface DungeonAnalysis {
  dungeonId: number;
  totalDuration: number;
  battlesWon: number;
  battlesLost: number;
  totalDamage: number;
  totalHealing: number;
  totalTurns: number;
  avgTurnsPerBattle: number;
  battles: BattleAnalysis[];
  partyPerformance: Array<{
    name: string;
    job: string;
    finalHp: number;
    finalMp: number;
    survived: boolean;
    totalDamageDealt: number;
    totalDamageTaken: number;
    totalHealingDone: number;
    totalSkillsUsed: number;
    favoriteSkill: string;
  }>;
  mostUsedSkills: Array<{ skill: string; uses: number }>;
  criticalMoments: TurnResult[];
}

export type ReportFormat = 'text' | 'json' | 'html' | 'markdown';

export class ReportGenerator {

  static analyzeBattle(battleHistory: { result: BattleResult; turnHistory: TurnResult[] }, battleId: number): BattleAnalysis {
    const { result, turnHistory } = battleHistory;

    let totalDamage = 0;
    let totalHealing = 0;
    const skillsUsed: Record<string, number> = {};
    const participantStats: Record<string, {
      name: string;
      isEnemy: boolean;
      damageDealt: number;
      damageTaken: number;
      healingDone: number;
      skillsUsed: number;
      survived: boolean;
    }> = {};

    // Initialize participant stats
    const allParticipants = [...result.survivingAllies, ...result.defeatedEnemies];
    allParticipants.forEach(p => {
      participantStats[p.id] = {
        name: p.name,
        isEnemy: p.isEnemy,
        damageDealt: 0,
        damageTaken: 0,
        healingDone: 0,
        skillsUsed: 0,
        survived: p.isAlive
      };
    });

    // Analyze turn history
    turnHistory.forEach(turn => {
      const actorStats = participantStats[turn.actor.id];
      if (actorStats) {
        if (turn.damage) {
          actorStats.damageDealt += turn.damage;
          totalDamage += turn.damage;

          if (turn.target) {
            const targetStats = participantStats[turn.target.id];
            if (targetStats) {
              targetStats.damageTaken += turn.damage;
            }
          }
        }

        if (turn.heal) {
          actorStats.healingDone += turn.heal;
          totalHealing += turn.heal;
        }

        if (turn.action.actionType === 'cast' && turn.action.skillId) {
          const skillName = turn.action.skillId;
          skillsUsed[skillName] = (skillsUsed[skillName] || 0) + 1;
          actorStats.skillsUsed++;
        }
      }
    });

    return {
      battleId,
      duration: result.turns,
      outcome: result.victory ? 'victory' : 'defeat',
      damageDealt: totalDamage,
      healingDone: totalHealing,
      skillsUsed,
      participantPerformance: Object.values(participantStats)
    };
  }

  static analyzeDungeon(progress: DungeonProgress): DungeonAnalysis {
    const battles = progress.battleHistory.map((battle, index) =>
      this.analyzeBattle(battle, battle.battleId)
    );

    const totalDamage = battles.reduce((sum, b) => sum + b.damageDealt, 0);
    const totalHealing = battles.reduce((sum, b) => sum + b.healingDone, 0);
    const battlesWon = battles.filter(b => b.outcome === 'victory').length;
    const battlesLost = battles.filter(b => b.outcome === 'defeat').length;

    // Aggregate skill usage
    const allSkillsUsed: Record<string, number> = {};
    battles.forEach(battle => {
      Object.entries(battle.skillsUsed).forEach(([skill, count]) => {
        allSkillsUsed[skill] = (allSkillsUsed[skill] || 0) + count;
      });
    });

    const mostUsedSkills = Object.entries(allSkillsUsed)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([skill, uses]) => ({ skill, uses }));

    // Analyze party performance
    const partyPerformance = progress.partyState.map(member => {
      let totalDamageDealt = 0;
      let totalDamageTaken = 0;
      let totalHealingDone = 0;
      let totalSkillsUsed = 0;
      const skillUsage: Record<string, number> = {};

      battles.forEach(battle => {
        const memberPerf = battle.participantPerformance.find(p => p.name === member.name);
        if (memberPerf) {
          totalDamageDealt += memberPerf.damageDealt;
          totalDamageTaken += memberPerf.damageTaken;
          totalHealingDone += memberPerf.healingDone;
          totalSkillsUsed += memberPerf.skillsUsed;
        }
      });

      // Find favorite skill
      progress.battleHistory.forEach(battle => {
        battle.turnHistory.forEach(turn => {
          if (turn.actor.name === member.name && turn.action.skillId) {
            skillUsage[turn.action.skillId] = (skillUsage[turn.action.skillId] || 0) + 1;
          }
        });
      });

      const favoriteSkill = Object.entries(skillUsage)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'basic_attack';

      return {
        name: member.name,
        job: member.job,
        finalHp: member.currentStats.hp,
        finalMp: member.currentStats.mp,
        survived: member.isAlive,
        totalDamageDealt,
        totalDamageTaken,
        totalHealingDone,
        totalSkillsUsed,
        favoriteSkill
      };
    });

    // Find critical moments (high damage, deaths, boss attacks)
    const criticalMoments: TurnResult[] = [];
    progress.battleHistory.forEach(battle => {
      battle.turnHistory.forEach(turn => {
        if (
          (turn.damage && turn.damage > 30) ||
          (turn.target && turn.target.currentStats.hp <= 0) ||
          (turn.actor.isBoss)
        ) {
          criticalMoments.push(turn);
        }
      });
    });

    criticalMoments.sort((a, b) => (b.damage || 0) - (a.damage || 0)).slice(0, 20);

    const totalDuration = progress.endTime && progress.startTime
      ? (progress.endTime.getTime() - progress.startTime.getTime()) / 1000
      : 0;

    return {
      dungeonId: progress.dungeonId,
      totalDuration,
      battlesWon,
      battlesLost,
      totalDamage,
      totalHealing,
      totalTurns: progress.totalTurns,
      avgTurnsPerBattle: battles.length > 0 ? progress.totalTurns / battles.length : 0,
      battles,
      partyPerformance,
      mostUsedSkills,
      criticalMoments
    };
  }

  static generateReport(analysis: DungeonAnalysis, format: ReportFormat = 'text'): string {
    switch (format) {
      case 'text':
        return this.generateTextReport(analysis);
      case 'json':
        return JSON.stringify(analysis, null, 2);
      case 'html':
        return this.generateHtmlReport(analysis);
      case 'markdown':
        return this.generateMarkdownReport(analysis);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private static generateTextReport(analysis: DungeonAnalysis): string {
    const lines: string[] = [];

    lines.push('🏰 DUNGEON ANALYSIS REPORT');
    lines.push('='.repeat(50));
    lines.push(`Dungeon ID: ${analysis.dungeonId}`);
    lines.push(`Duration: ${Math.round(analysis.totalDuration)}s`);
    lines.push(`Status: ${analysis.battlesLost === 0 ? '🎉 COMPLETED' : '💀 FAILED'}`);
    lines.push(`Battles: ${analysis.battlesWon}W/${analysis.battlesLost}L`);
    lines.push(`Total Turns: ${analysis.totalTurns} (avg: ${Math.round(analysis.avgTurnsPerBattle * 10) / 10})`);
    lines.push(`Total Damage: ${analysis.totalDamage}`);
    lines.push(`Total Healing: ${analysis.totalHealing}`);
    lines.push('');

    lines.push('👥 PARTY PERFORMANCE:');
    analysis.partyPerformance.forEach(member => {
      const status = member.survived ? '✅' : '💀';
      lines.push(`${status} ${member.name} (${member.job}):`);
      lines.push(`   HP: ${member.finalHp}, MP: ${member.finalMp}`);
      lines.push(`   Damage Dealt: ${member.totalDamageDealt}`);
      lines.push(`   Damage Taken: ${member.totalDamageTaken}`);
      lines.push(`   Healing Done: ${member.totalHealingDone}`);
      lines.push(`   Skills Used: ${member.totalSkillsUsed}`);
      lines.push(`   Favorite Skill: ${member.favoriteSkill.replace(/_/g, ' ')}`);
      lines.push('');
    });

    lines.push('⚔️ BATTLE SUMMARY:');
    analysis.battles.forEach((battle, index) => {
      const result = battle.outcome === 'victory' ? '✅' : '❌';
      lines.push(`${result} Battle ${index + 1}: ${battle.duration} turns, ${battle.damageDealt} damage`);
    });
    lines.push('');

    lines.push('🎯 TOP SKILLS USED:');
    analysis.mostUsedSkills.slice(0, 5).forEach((skill, index) => {
      lines.push(`${index + 1}. ${skill.skill.replace(/_/g, ' ')}: ${skill.uses} times`);
    });
    lines.push('');

    lines.push('⚡ CRITICAL MOMENTS:');
    analysis.criticalMoments.slice(0, 5).forEach(moment => {
      if (moment.damage && moment.damage > 30) {
        lines.push(`💥 Turn ${moment.turnNumber}: ${moment.actor.name} deals ${moment.damage} damage to ${moment.target?.name}`);
      } else if (moment.target && moment.target.currentStats.hp <= 0) {
        lines.push(`💀 Turn ${moment.turnNumber}: ${moment.target.name} is defeated by ${moment.actor.name}`);
      }
    });

    return lines.join('\n');
  }

  private static generateMarkdownReport(analysis: DungeonAnalysis): string {
    const lines: string[] = [];

    lines.push('# 🏰 Dungeon Analysis Report');
    lines.push('');
    lines.push('## Overview');
    lines.push(`- **Dungeon ID:** ${analysis.dungeonId}`);
    lines.push(`- **Duration:** ${Math.round(analysis.totalDuration)}s`);
    lines.push(`- **Status:** ${analysis.battlesLost === 0 ? '🎉 COMPLETED' : '💀 FAILED'}`);
    lines.push(`- **Battles:** ${analysis.battlesWon}W/${analysis.battlesLost}L`);
    lines.push(`- **Total Turns:** ${analysis.totalTurns} (avg: ${Math.round(analysis.avgTurnsPerBattle * 10) / 10})`);
    lines.push(`- **Total Damage:** ${analysis.totalDamage}`);
    lines.push(`- **Total Healing:** ${analysis.totalHealing}`);
    lines.push('');

    lines.push('## 👥 Party Performance');
    lines.push('| Character | Job | Status | Final HP | Damage Dealt | Healing Done | Favorite Skill |');
    lines.push('|-----------|-----|--------|----------|--------------|--------------|----------------|');
    analysis.partyPerformance.forEach(member => {
      const status = member.survived ? '✅ Alive' : '💀 Dead';
      const favoriteSkill = member.favoriteSkill.replace(/_/g, ' ');
      lines.push(`| ${member.name} | ${member.job} | ${status} | ${member.finalHp} | ${member.totalDamageDealt} | ${member.totalHealingDone} | ${favoriteSkill} |`);
    });
    lines.push('');

    lines.push('## ⚔️ Battle Summary');
    lines.push('| Battle | Result | Turns | Damage | Healing |');
    lines.push('|--------|--------|-------|--------|---------|');
    analysis.battles.forEach((battle, index) => {
      const result = battle.outcome === 'victory' ? '✅ Victory' : '❌ Defeat';
      lines.push(`| ${index + 1} | ${result} | ${battle.duration} | ${battle.damageDealt} | ${battle.healingDone} |`);
    });
    lines.push('');

    lines.push('## 🎯 Most Used Skills');
    analysis.mostUsedSkills.slice(0, 10).forEach((skill, index) => {
      lines.push(`${index + 1}. **${skill.skill.replace(/_/g, ' ')}**: ${skill.uses} times`);
    });

    return lines.join('\n');
  }

  private static generateHtmlReport(analysis: DungeonAnalysis): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Dungeon Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; color: #333; }
        .overview { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .stat { display: inline-block; margin: 10px; padding: 10px; background: white; border-radius: 3px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .victory { color: green; }
        .defeat { color: red; }
    </style>
</head>
<body>
    <h1 class="header">🏰 Dungeon Analysis Report</h1>

    <div class="overview">
        <h2>Overview</h2>
        <div class="stat"><strong>Dungeon ID:</strong> ${analysis.dungeonId}</div>
        <div class="stat"><strong>Duration:</strong> ${Math.round(analysis.totalDuration)}s</div>
        <div class="stat"><strong>Status:</strong> ${analysis.battlesLost === 0 ? '🎉 COMPLETED' : '💀 FAILED'}</div>
        <div class="stat"><strong>Battles:</strong> ${analysis.battlesWon}W/${analysis.battlesLost}L</div>
        <div class="stat"><strong>Total Damage:</strong> ${analysis.totalDamage}</div>
        <div class="stat"><strong>Total Healing:</strong> ${analysis.totalHealing}</div>
    </div>

    <h2>👥 Party Performance</h2>
    <table>
        <tr><th>Character</th><th>Job</th><th>Status</th><th>Final HP</th><th>Damage Dealt</th><th>Healing Done</th></tr>
        ${analysis.partyPerformance.map(member => `
            <tr>
                <td>${member.name}</td>
                <td>${member.job}</td>
                <td>${member.survived ? '✅ Alive' : '💀 Dead'}</td>
                <td>${member.finalHp}</td>
                <td>${member.totalDamageDealt}</td>
                <td>${member.totalHealingDone}</td>
            </tr>
        `).join('')}
    </table>

    <h2>⚔️ Battle Results</h2>
    <table>
        <tr><th>Battle</th><th>Result</th><th>Turns</th><th>Damage</th><th>Healing</th></tr>
        ${analysis.battles.map((battle, index) => `
            <tr>
                <td>${index + 1}</td>
                <td class="${battle.outcome}">${battle.outcome === 'victory' ? '✅ Victory' : '❌ Defeat'}</td>
                <td>${battle.duration}</td>
                <td>${battle.damageDealt}</td>
                <td>${battle.healingDone}</td>
            </tr>
        `).join('')}
    </table>
</body>
</html>`;
  }

  static saveReport(analysis: DungeonAnalysis, format: ReportFormat, outputDir: string = './reports'): string {
    const report = this.generateReport(analysis, format);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = format === 'text' ? 'txt' : format;
    const filename = `dungeon_${analysis.dungeonId}_${timestamp}.${extension}`;
    const filepath = join(outputDir, filename);

    try {
      writeFileSync(filepath, report, 'utf-8');
      return filepath;
    } catch (error) {
      throw new Error(`Failed to save report: ${error}`);
    }
  }
}