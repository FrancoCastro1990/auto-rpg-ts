import mongoose, { Schema, Document } from 'mongoose';

// Interfaces para el modelo Enemy
export interface IEnemyRule {
  priority: number;
  condition: string;
  target: string;
  action: string;
}

export interface IEnemyStats {
  hp: number;
  mp: number;
  str: number;
  def: number;
  mag: number;
  spd: number;
}

export interface IEnemyDocument extends Document {
  type: string;
  job: string;
  description: string;
  baseStats: IEnemyStats;
  rules: IEnemyRule[];
  skillIds: string[];
  isBoss?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Esquema de Mongoose para Enemy
const EnemyRuleSchema = new Schema<IEnemyRule>({
  priority: { type: Number, required: true, min: 0 },
  condition: { type: String, required: true, trim: true },
  target: { type: String, required: true, trim: true },
  action: { type: String, required: true, trim: true }
}, { _id: false });

const EnemyStatsSchema = new Schema<IEnemyStats>({
  hp: { type: Number, required: true, min: 0 },
  mp: { type: Number, required: true, min: 0 },
  str: { type: Number, required: true, min: 0 },
  def: { type: Number, required: true, min: 0 },
  mag: { type: Number, required: true, min: 0 },
  spd: { type: Number, required: true, min: 0 }
}, { _id: false });

const EnemySchema = new Schema<IEnemyDocument>({
  type: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  job: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  baseStats: {
    type: EnemyStatsSchema,
    required: true
  },
  rules: [{
    type: EnemyRuleSchema,
    required: true
  }],
  skillIds: [{
    type: String,
    required: true,
    trim: true
  }],
  isBoss: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'enemies'
});

// Índices para optimizar consultas
EnemySchema.index({ type: 1 });
EnemySchema.index({ job: 1 });
EnemySchema.index({ isBoss: 1 });
EnemySchema.index({ skillIds: 1 });

// Modelo de Mongoose
export const EnemyModel = mongoose.model<IEnemyDocument>('Enemy', EnemySchema);