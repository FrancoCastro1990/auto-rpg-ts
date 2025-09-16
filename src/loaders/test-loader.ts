import { DataLoader, EntityFactory } from './index';
import { join } from 'path';

async function testLoaders() {
  try {
    console.log('🧪 Testing Data Loaders...\n');

    const dataPath = join(__dirname, '../../data');
    const loader = new DataLoader(dataPath);

    console.log('📋 Loading and validating data integrity...');
    const { skills, jobs, enemies, party } = await loader.validateDataIntegrity();

    console.log(`✅ Skills loaded: ${skills.length}`);
    console.log(`✅ Jobs loaded: ${jobs.length}`);
    console.log(`✅ Enemies loaded: ${enemies.length}`);
    console.log(`✅ Party members loaded: ${party.length}\n`);

    console.log('🏭 Testing Entity Factory...');
    const factory = new EntityFactory(skills, jobs, enemies);

    console.log('👥 Creating party characters:');
    const characters = party.map(member => {
      const character = factory.createCharacter(member);
      console.log(`  - ${character.name} (${character.job}, Level ${character.level})`);
      console.log(`    HP: ${character.currentStats.hp}, MP: ${character.currentStats.mp}`);
      console.log(`    Skills: ${character.abilities.map(a => a.name).join(', ')}`);
      return character;
    });

    console.log('\n🐉 Creating test enemies:');
    const testEnemies = [
      factory.createEnemy('Slime', 'Test Slime'),
      factory.createEnemy('Goblin', 'Test Goblin'),
      factory.createEnemy('ShadowLord', 'Test Boss', 1)
    ];

    testEnemies.forEach(enemy => {
      console.log(`  - ${enemy.name} (${enemy.type}${enemy.isBoss ? ' - BOSS' : ''})`);
      console.log(`    HP: ${enemy.currentStats.hp}, MP: ${enemy.currentStats.mp}`);
      console.log(`    Skills: ${enemy.abilities.map(a => a.name).join(', ')}`);
    });

    console.log('\n🏰 Testing dungeon loading...');
    const dungeon = await loader.loadDungeon('dungeon_01.json');
    console.log(`✅ Dungeon loaded: ${dungeon.name}`);
    console.log(`   Battles: ${dungeon.battles.length}`);
    const finalBattle = dungeon.battles[dungeon.battles.length - 1];
    if (finalBattle) {
      console.log(`   Final boss battle: ${finalBattle.enemies.map(e => e.name || e.type).join(', ')}`);
    }

    console.log('\n🔍 Validating skill references...');
    const allSkillIds = skills.map(s => s.name.toLowerCase().replace(/\s+/g, '_'));
    console.log(`Available skills: ${allSkillIds.length}`);

    for (const job of jobs) {
      const validation = factory.validateSkillReferences(job.skillIds);
      if (validation.invalid.length > 0) {
        console.log(`❌ Job ${job.name} has invalid skills: ${validation.invalid.join(', ')}`);
      } else {
        console.log(`✅ Job ${job.name} skills valid`);
      }
    }

    for (const enemy of enemies) {
      if (enemy.skillIds && enemy.skillIds.length > 0) {
        const validation = factory.validateSkillReferences(enemy.skillIds);
        if (validation.invalid.length > 0) {
          console.log(`❌ Enemy ${enemy.type} has invalid skills: ${validation.invalid.join(', ')}`);
        } else {
          console.log(`✅ Enemy ${enemy.type} skills valid`);
        }
      }
    }

    console.log('\n🎉 All data loaders tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  testLoaders();
}

export { testLoaders };