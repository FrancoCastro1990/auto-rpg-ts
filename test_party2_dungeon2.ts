#!/usr/bin/env node

import { AutoRPGGame } from './src/main';

async function testParty2WithDungeon2(): Promise<void> {
  console.log('🧪 Testing Party 2 with Dungeon 2...\n');

  const game = new AutoRPGGame({
    dungeonFile: 'dungeon_02.json',
    partyFile: 'party_2.json',
    logLevel: 'INFO',
    useColors: true,
    compactMode: false,
    maxTurnsPerBattle: 100,
    generateReport: true,
    reportFormat: 'text',
    saveReport: false
  });

  try {
    await game.initialize();
    await game.runAdventure();
    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testParty2WithDungeon2();
}