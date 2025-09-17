import mongoose, { Schema, Document } from 'mongoose';

// Interfaces para el modelo Player
export interface IPlayerStats {
  hp: number;
  mp: number;
  str: number;
  def: number;
  mag: number;
  spd: number;
}

export interface IPlayerExperience {
  current: number;
  nextLevel: number;
  total: number;
}

export interface IPlayerDocument extends Document {
  username: string;
  level: number;
  experience: IPlayerExperience;
  createdAt: Date;
  updatedAt: Date;
}

// Esquema de Mongoose para Player
const PlayerSchema = new Schema<IPlayerDocument>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  experience: {
    current: { type: Number, required: true, min: 0, default: 0 },
    nextLevel: { type: Number, required: true, min: 1 },
    total: { type: Number, required: true, min: 0, default: 0 }
  }
}, {
  timestamps: true,
  collection: 'players'
});

// Índices para optimizar consultas
PlayerSchema.index({ username: 1 });
PlayerSchema.index({ level: -1 });
PlayerSchema.index({ 'experience.total': -1 });

// Validaciones pre-save
PlayerSchema.pre('save', function(next) {
  // Calcular nextLevel si no está establecido
  if (!this.experience.nextLevel) {
    this.experience.nextLevel = this.level * 100 + (this.level - 1) * 50;
  }
  next();
});

// Modelo de Mongoose
export const PlayerModel = mongoose.model<IPlayerDocument>('Player', PlayerSchema);