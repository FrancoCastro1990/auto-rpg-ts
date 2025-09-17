import mongoose, { Schema, Document } from 'mongoose';

// Interfaces para el modelo Party
export interface IPartyCharacter {
  id: string;
  name: string;
  job: string;
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
  rules: {
    id: string;
    priority: number;
    condition: string;
    target: string;
    action: string;
  }[];
}

export interface IPartyDocument extends Document {
  playerId: string;
  name: string;
  characters: IPartyCharacter[];
  createdAt: Date;
  updatedAt: Date;
}

// Esquema de Mongoose para Party
const PartySchema = new Schema<IPartyDocument>({
  playerId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50
  },
  characters: [{
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    job: { type: String, required: true, trim: true },
    level: { type: Number, required: true, min: 1 },
    stats: {
      hp: { type: Number, required: true, min: 0 },
      mp: { type: Number, required: true, min: 0 },
      str: { type: Number, required: true, min: 0 },
      def: { type: Number, required: true, min: 0 },
      mag: { type: Number, required: true, min: 0 },
      spd: { type: Number, required: true, min: 0 }
    },
    skills: [{ type: String, trim: true }],
    rules: [{
      id: { type: String, required: true },
      priority: { type: Number, required: true, min: 0 },
      condition: { type: String, required: true },
      target: { type: String, required: true },
      action: { type: String, required: true }
    }]
  }]
}, {
  timestamps: true,
  collection: 'parties'
});

// Índices para optimizar consultas
PartySchema.index({ playerId: 1 });
PartySchema.index({ name: 1 });
PartySchema.index({ 'characters.job': 1 });

// Validaciones
PartySchema.pre('save', function(next) {
  // Validar que no haya personajes duplicados
  const characterIds = this.characters.map(c => c.id);
  const uniqueIds = new Set(characterIds);
  if (characterIds.length !== uniqueIds.size) {
    next(new Error('Party cannot have duplicate characters'));
    return;
  }

  // Validar límite de personajes (esto se manejará en el dominio)
  if (this.characters.length > 4) {
    next(new Error('Party cannot have more than 4 characters'));
    return;
  }

  next();
});

// Modelo de Mongoose
export const PartyModel = mongoose.model<IPartyDocument>('Party', PartySchema);