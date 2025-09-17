import mongoose, { Schema, Document } from 'mongoose';

// Interfaces para el modelo Skill
export interface ISkillEffect {
  damage?: number;
  heal?: number;
  statModifier?: Record<string, number>;
  duration?: number;
  summon?: string;
  count?: number;
  aoe?: boolean;
  revive?: boolean;
  selfDamage?: number;
  chainDamage?: number;
  maxChains?: number;
  elementalDamage?: Record<string, number>;
  doomTimer?: number;
  dodgeChance?: number;
  perfectBlock?: boolean;
  control?: boolean;
  teleport?: boolean;
}

export interface ISkillDocument extends Document {
  id: string;
  name: string;
  type: 'attack' | 'heal' | 'buff' | 'debuff';
  effect: ISkillEffect;
  mpCost: number;
  cooldown?: number;
  level?: number;
  combinations?: string[];
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// Esquema de Mongoose para Skill
const SkillSchema = new Schema<ISkillDocument>({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['attack', 'heal', 'buff', 'debuff']
  },
  effect: {
    damage: { type: Number, min: 0 },
    heal: { type: Number, min: 0 },
    statModifier: { type: Map, of: Number },
    duration: { type: Number, min: 1 },
    summon: { type: String, trim: true },
    count: { type: Number, min: 1 },
    aoe: { type: Boolean, default: false },
    revive: { type: Boolean, default: false },
    selfDamage: { type: Number, min: 0 },
    chainDamage: { type: Number, min: 0 },
    maxChains: { type: Number, min: 1 },
    elementalDamage: { type: Map, of: Number },
    doomTimer: { type: Number, min: 1 },
    dodgeChance: { type: Number, min: 0, max: 100 },
    perfectBlock: { type: Boolean, default: false },
    control: { type: Boolean, default: false },
    teleport: { type: Boolean, default: false }
  },
  mpCost: {
    type: Number,
    required: true,
    min: 0
  },
  cooldown: {
    type: Number,
    min: 1
  },
  level: {
    type: Number,
    min: 1
  },
  combinations: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'skills'
});

// Índices para optimizar consultas
SkillSchema.index({ id: 1 });
SkillSchema.index({ type: 1 });
SkillSchema.index({ level: 1 });
SkillSchema.index({ combinations: 1 });

// Modelo de Mongoose
export const SkillModel = mongoose.model<ISkillDocument>('Skill', SkillSchema);