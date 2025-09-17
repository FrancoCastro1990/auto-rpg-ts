import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { JobModel } from './models/Job';
import { SkillModel } from './models/Skill';
import { EnemyModel } from './models/Enemy';
import { DungeonModel } from './models/Dungeon';

class DatabaseSeeder {
  private dataPath: string;

  constructor() {
    // Ruta relativa desde src/infrastructure/ hacia data/
    this.dataPath = path.join(process.cwd(), 'data');
  }

  async connect(uri: string = 'mongodb://admin:password123@localhost:27018/auto-rpg-db?authSource=admin'): Promise<void> {
    try {
      await mongoose.connect(uri);
      console.log('✅ Conectado a MongoDB');
    } catch (error) {
      console.error('❌ Error conectando a MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log('✅ Desconectado de MongoDB');
    } catch (error) {
      console.error('❌ Error desconectando de MongoDB:', error);
    }
  }

  private async readJsonFile<T>(filename: string): Promise<T> {
    const filePath = path.join(this.dataPath, filename);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  }

  async seedJobs(): Promise<void> {
    try {
      console.log('🌱 Migrando jobs...');
      const jobs = await this.readJsonFile<any[]>('jobs.json');

      // Limpiar colección existente
      await JobModel.deleteMany({});
      console.log('🧹 Colección jobs limpiada');

      // Insertar datos
      const jobDocuments = jobs.map(job => ({
        name: job.name,
        description: job.description,
        baseStats: job.baseStats,
        skillIds: job.skillIds
      }));

      await JobModel.insertMany(jobDocuments);
      console.log(`✅ Insertados ${jobDocuments.length} jobs`);
    } catch (error) {
      console.error('❌ Error migrando jobs:', error);
      throw error;
    }
  }

  async seedSkills(): Promise<void> {
    try {
      console.log('🌱 Migrando skills...');
      const skills = await this.readJsonFile<any[]>('skills.json');

      // Limpiar colección existente
      await SkillModel.deleteMany({});
      console.log('🧹 Colección skills limpiada');

      // Insertar datos
      const skillDocuments = skills.map(skill => ({
        id: skill.id,
        name: skill.name,
        type: skill.type,
        effect: skill.effect,
        mpCost: skill.mpCost,
        cooldown: skill.cooldown,
        level: skill.level,
        combinations: skill.combinations,
        description: skill.description
      }));

      await SkillModel.insertMany(skillDocuments);
      console.log(`✅ Insertados ${skillDocuments.length} skills`);
    } catch (error) {
      console.error('❌ Error migrando skills:', error);
      throw error;
    }
  }

  async seedEnemies(): Promise<void> {
    try {
      console.log('🌱 Migrando enemies...');
      const enemies = await this.readJsonFile<any[]>('enemies.json');

      // Limpiar colección existente
      await EnemyModel.deleteMany({});
      console.log('🧹 Colección enemies limpiada');

      // Insertar datos
      const enemyDocuments = enemies.map(enemy => ({
        type: enemy.type,
        job: enemy.job,
        description: enemy.description,
        baseStats: enemy.baseStats,
        rules: enemy.rules,
        skillIds: enemy.skillIds,
        isBoss: enemy.isBoss || false
      }));

      await EnemyModel.insertMany(enemyDocuments);
      console.log(`✅ Insertados ${enemyDocuments.length} enemies`);
    } catch (error) {
      console.error('❌ Error migrando enemies:', error);
      throw error;
    }
  }

  async seedDungeons(): Promise<void> {
    try {
      console.log('🌱 Migrando dungeons...');

      // Migrar dungeon_01.json
      const dungeon1 = await this.readJsonFile<any>('dungeon_01.json');

      // Limpiar colección existente
      await DungeonModel.deleteMany({});
      console.log('🧹 Colección dungeons limpiada');

      // Insertar datos
      const dungeonDocuments = [{
        id: dungeon1.id,
        name: dungeon1.name,
        description: dungeon1.description,
        defaultMaxTurns: dungeon1.defaultMaxTurns,
        battles: dungeon1.battles
      }];

      await DungeonModel.insertMany(dungeonDocuments);
      console.log(`✅ Insertados ${dungeonDocuments.length} dungeons`);
    } catch (error) {
      console.error('❌ Error migrando dungeons:', error);
      throw error;
    }
  }

  async seedAll(): Promise<void> {
    try {
      console.log('🚀 Iniciando proceso de seeding completo...');

      await this.seedJobs();
      await this.seedSkills();
      await this.seedEnemies();
      await this.seedDungeons();

      console.log('🎉 Seeding completado exitosamente!');
    } catch (error) {
      console.error('❌ Error durante el seeding:', error);
      throw error;
    }
  }

  async clearAll(): Promise<void> {
    try {
      console.log('🧹 Limpiando todas las colecciones...');

      await Promise.all([
        JobModel.deleteMany({}),
        SkillModel.deleteMany({}),
        EnemyModel.deleteMany({}),
        DungeonModel.deleteMany({})
      ]);

      console.log('✅ Todas las colecciones limpiadas');
    } catch (error) {
      console.error('❌ Error limpiando colecciones:', error);
      throw error;
    }
  }
}

// Función principal para ejecutar el seeding
async function main() {
  const seeder = new DatabaseSeeder();

  try {
    // Conectar a la base de datos
    await seeder.connect();

    // Obtener argumentos de línea de comandos
    const args = process.argv.slice(2);
    const command = args[0] || 'seed';

    switch (command) {
      case 'seed':
        await seeder.seedAll();
        break;
      case 'clear':
        await seeder.clearAll();
        break;
      case 'jobs':
        await seeder.seedJobs();
        break;
      case 'skills':
        await seeder.seedSkills();
        break;
      case 'enemies':
        await seeder.seedEnemies();
        break;
      case 'dungeons':
        await seeder.seedDungeons();
        break;
      default:
        console.log('Uso: npm run seed [seed|clear|jobs|skills|enemies|dungeons]');
        break;
    }
  } catch (error) {
    console.error('❌ Error en el proceso de seeding:', error);
    process.exit(1);
  } finally {
    await seeder.disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

export { DatabaseSeeder };