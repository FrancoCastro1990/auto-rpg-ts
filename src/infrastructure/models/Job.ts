import mongoose, { Schema, Document } from 'mongoose';

// Interfaces para el modelo Job
export interface IJobStats {
  hp: number;
  mp: number;
  str: number;
  def: number;
  mag: number;
  spd: number;
}

export interface IJobDocument extends Document {
  name: string;
  description: string;
  baseStats: IJobStats;
  skillIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Esquema de Mongoose para Job
const JobSchema = new Schema<IJobDocument>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  baseStats: {
    hp: { type: Number, required: true, min: 0 },
    mp: { type: Number, required: true, min: 0 },
    str: { type: Number, required: true, min: 0 },
    def: { type: Number, required: true, min: 0 },
    mag: { type: Number, required: true, min: 0 },
    spd: { type: Number, required: true, min: 0 }
  },
  skillIds: [{
    type: String,
    required: true,
    trim: true
  }]
}, {
  timestamps: true,
  collection: 'jobs'
});

// Índices para optimizar consultas
JobSchema.index({ name: 1 });
JobSchema.index({ skillIds: 1 });

// Modelo de Mongoose
export const JobModel = mongoose.model<IJobDocument>('Job', JobSchema);