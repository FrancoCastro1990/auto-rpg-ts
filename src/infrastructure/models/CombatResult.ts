import mongoose, { Schema, Document } from 'mongoose';

// Interfaces para el modelo CombatResult
export interface ICombatResultItem {
  id: string;
  name: string;
  type: string;
  rarity: string;
  value: number;
}

export interface ICombatResultReward {
  gold: number;
  experience: number;
  items: ICombatResultItem[];
}

export interface ICombatResultBattleResult {
  id: string;
  battleId: string;
  partyId: string;
  dungeonId: string;
  victory: boolean;
  duration: number;
  rewards: ICombatResultReward;
  log: string[];
  createdAt: Date;
}

export interface ICombatResultDocument extends Document {
  partyId: string;
  dungeonId: string;
  totalBattles: number;
  victories: number;
  totalDuration: number;
  totalRewards: ICombatResultReward;
  battleResults: ICombatResultBattleResult[];
  createdAt: Date;
}

// Esquema de Mongoose para CombatResult
const CombatResultSchema = new Schema<ICombatResultDocument>({
  partyId: {
    type: String,
    required: true,
    index: true
  },
  dungeonId: {
    type: String,
    required: true,
    index: true
  },
  totalBattles: {
    type: Number,
    required: true,
    min: 1
  },
  victories: {
    type: Number,
    required: true,
    min: 0
  },
  totalDuration: {
    type: Number,
    required: true,
    min: 0
  },
  totalRewards: {
    gold: { type: Number, required: true, min: 0, default: 0 },
    experience: { type: Number, required: true, min: 0, default: 0 },
    items: [{
      id: { type: String, required: true },
      name: { type: String, required: true, trim: true },
      type: { type: String, required: true, trim: true },
      rarity: { type: String, required: true, trim: true },
      value: { type: Number, required: true, min: 0 }
    }]
  },
  battleResults: [{
    id: { type: String, required: true },
    battleId: { type: String, required: true },
    partyId: { type: String, required: true },
    dungeonId: { type: String, required: true },
    victory: { type: Boolean, required: true },
    duration: { type: Number, required: true, min: 0 },
    rewards: {
      gold: { type: Number, required: true, min: 0, default: 0 },
      experience: { type: Number, required: true, min: 0, default: 0 },
      items: [{
        id: { type: String, required: true },
        name: { type: String, required: true, trim: true },
        type: { type: String, required: true, trim: true },
        rarity: { type: String, required: true, trim: true },
        value: { type: Number, required: true, min: 0 }
      }]
    },
    log: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'combat_results'
});

// Índices para optimizar consultas
CombatResultSchema.index({ partyId: 1 });
CombatResultSchema.index({ dungeonId: 1 });
CombatResultSchema.index({ createdAt: -1 });
CombatResultSchema.index({ partyId: 1, dungeonId: 1 });
CombatResultSchema.index({ 'battleResults.victory': 1 });

// Validaciones
CombatResultSchema.pre('save', function(next) {
  // Validar que victories no exceda totalBattles
  if (this.victories > this.totalBattles) {
    next(new Error('Victories cannot exceed total battles'));
    return;
  }

  // Validar que el número de battleResults coincida con totalBattles
  if (this.battleResults.length !== this.totalBattles) {
    next(new Error('Battle results count must match total battles'));
    return;
  }

  next();
});

// Modelo de Mongoose
export const CombatResultModel = mongoose.model<ICombatResultDocument>('CombatResult', CombatResultSchema);