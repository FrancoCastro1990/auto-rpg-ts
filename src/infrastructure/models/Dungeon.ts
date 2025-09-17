import mongoose, { Schema, Document } from 'mongoose';

// Interfaces para el modelo Dungeon
export interface IDungeonEnemy {
  id: string;
  name: string;
  level: number;
  stats: {
    hp: number;
    mp: number;
    str: number;
    def: number;
    mag: number;
    spd: number;
  };
  skills: string[];
}

export interface IDungeonBattle {
  id: string;
  enemies: IDungeonEnemy[];
  rewards: {
    gold: number;
    experience: number;
    items: Array<{
      id: string;
      name: string;
      type: string;
      rarity: string;
      value: number;
    }>;
  };
  order: number;
}

export interface IDungeonDocument extends Document {
  name: string;
  description: string;
  difficulty: number;
  minLevel: number;
  battles: IDungeonBattle[];
  createdAt: Date;
  updatedAt: Date;
}

// Esquema de Mongoose para Dungeon
const DungeonEnemySchema = new Schema<IDungeonEnemy>({
  id: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  level: { type: Number, required: true, min: 1 },
  stats: {
    hp: { type: Number, required: true, min: 0 },
    mp: { type: Number, required: true, min: 0 },
    str: { type: Number, required: true, min: 0 },
    def: { type: Number, required: true, min: 0 },
    mag: { type: Number, required: true, min: 0 },
    spd: { type: Number, required: true, min: 0 }
  },
  skills: [{ type: String, trim: true }]
}, { _id: false });

const DungeonBattleSchema = new Schema<IDungeonBattle>({
  id: { type: String, required: true },
  enemies: [{
    type: DungeonEnemySchema,
    required: true
  }],
  rewards: {
    gold: { type: Number, required: true, min: 0, default: 0 },
    experience: { type: Number, required: true, min: 0, default: 0 },
    items: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      type: { type: String, required: true },
      rarity: { type: String, required: true },
      value: { type: Number, required: true, min: 0 }
    }]
  },
  order: { type: Number, required: true, min: 0 }
}, { _id: false });

const DungeonSchema = new Schema<IDungeonDocument>({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 500
  },
  difficulty: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  minLevel: {
    type: Number,
    required: true,
    min: 1
  },
  battles: [{
    type: DungeonBattleSchema,
    required: true
  }]
}, {
  timestamps: true,
  collection: 'dungeons'
});

// Índices para optimizar consultas
DungeonSchema.index({ name: 1 });
DungeonSchema.index({ difficulty: -1 });
DungeonSchema.index({ minLevel: 1 });
DungeonSchema.index({ 'battles.order': 1 });

// Validaciones
DungeonSchema.pre('save', function(next) {
  // Validar que haya al menos una batalla
  if (!this.battles || this.battles.length === 0) {
    next(new Error('Dungeon must have at least one battle'));
    return;
  }

  // Validar que los orders sean únicos y consecutivos
  const orders = this.battles.map(b => b.order).sort((a, b) => a - b);
  for (let i = 0; i < orders.length; i++) {
    if (orders[i] !== i) {
      next(new Error('Battle orders must be consecutive starting from 0'));
      return;
    }
  }

  next();
});

// Modelo de Mongoose
export const DungeonModel = mongoose.model<IDungeonDocument>('Dungeon', DungeonSchema);