#!/usr/bin/env node

import { DataLoader } from '../src/loaders/DataLoader';
import { DataConsistencyValidator } from '../src/utils/DataConsistencyValidator';

async function validateDataConsistency() {
  console.log('🔍 Validating Data Consistency...\n');

  try {
    const dataLoader = new DataLoader('./data');

    // Load all data
    const [skills, jobs, enemies, party] = await Promise.all([
      dataLoader.loadSkills(),
      dataLoader.loadJobs(),
      dataLoader.loadEnemies(),
      dataLoader.loadParty()
    ]);

    console.log('📊 Data loaded successfully:');
    console.log(`   - Skills: ${skills.length}`);
    console.log(`   - Jobs: ${jobs.length}`);
    console.log(`   - Enemies: ${enemies.length}`);
    console.log(`   - Party Members: ${party.length}\n`);

    // Generate consistency report
    const report = DataConsistencyValidator.generateConsistencyReport(party, jobs, enemies, skills);

    console.log(report.summary);
    console.log();

    // Show detailed errors
    if (report.partyValidation.errors.length > 0) {
      console.log('❌ Party Member Errors:');
      report.partyValidation.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
      console.log();
    }

    if (report.enemyValidation.errors.length > 0) {
      console.log('❌ Enemy Errors:');
      report.enemyValidation.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
      console.log();
    }

    // Show warnings
    const allWarnings = [...report.partyValidation.warnings, ...report.enemyValidation.warnings];
    if (allWarnings.length > 0) {
      console.log('⚠️ Warnings:');
      allWarnings.forEach(warning => {
        console.log(`   - ${warning}`);
      });
      console.log();
    }

    // Show suggestions for corrections
    if (!report.overallValid) {
      console.log('💡 Suggested Corrections:');
      const suggestions = DataConsistencyValidator.suggestCorrections(party, jobs);
      suggestions.forEach(suggestion => {
        console.log(`   - ${suggestion.member}: ${suggestion.suggestion}`);
      });
      console.log();
    }

    // Final status
    if (report.overallValid) {
      console.log('🎉 All data is consistent! No issues found.');
    } else {
      console.log('🔧 Please fix the errors above before proceeding.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

// Show usage if help is requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Data Consistency Validator
==========================

This script validates the consistency between character rules and available skills.

Usage:
  npm run validate-data
  or
  npx ts-node scripts/validate-data-consistency.ts

Options:
  --help, -h    Show this help message

What it validates:
  - Party members reference skills available to their job
  - Enemies reference skills available to their job
  - All referenced skills exist in skills.json
  - Suggests corrections for common issues
  `);
  process.exit(0);
}

// Run validation
validateDataConsistency();