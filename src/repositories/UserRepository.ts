// Repository: User MongoDB implementation
import { Model } from 'mongoose';
import { IUserRepository } from './interfaces';
import { IUser } from '../entities/interfaces';
import { User } from '../entities/User';
import { UserModel, IUserDocument } from '../infrastructure/models/User';

export class UserRepository implements IUserRepository {
  constructor(
    private userModel: Model<IUserDocument> = UserModel
  ) {}

  private documentToUser(doc: IUserDocument): IUser {
    return {
      id: (doc._id as any).toString(),
      email: doc.email,
      username: doc.username,
      passwordHash: doc.passwordHash,
      role: doc.role,
      isActive: doc.isActive,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      lastLoginAt: doc.lastLoginAt
    };
  }

  async findById(id: string): Promise<IUser | null> {
    try {
      const user = await this.userModel.findById(id).exec();
      return user ? this.documentToUser(user) : null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<IUser | null> {
    try {
      const user = await this.userModel.findOne({ email }).exec();
      return user ? this.documentToUser(user) : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  async findByUsername(username: string): Promise<IUser | null> {
    try {
      const user = await this.userModel.findOne({ username }).exec();
      return user ? this.documentToUser(user) : null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  async findActiveUsers(): Promise<IUser[]> {
    try {
      const users = await this.userModel.find({ isActive: true }).exec();
      return users.map(user => this.documentToUser(user));
    } catch (error) {
      console.error('Error finding active users:', error);
      throw error;
    }
  }

  async save(user: IUser): Promise<IUser> {
    try {
      const userDoc = new this.userModel(user);
      const savedUser = await userDoc.save();
      return this.documentToUser(savedUser);
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  async update(id: string, user: Partial<IUser>): Promise<IUser | null> {
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, user, { new: true })
        .exec();
      return updatedUser ? this.documentToUser(updatedUser) : null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async updateLastLogin(id: string): Promise<IUser | null> {
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          id,
          { lastLoginAt: new Date() },
          { new: true }
        )
        .exec();
      return updatedUser ? this.documentToUser(updatedUser) : null;
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }

  async deactivateUser(id: string): Promise<IUser | null> {
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          id,
          { isActive: false },
          { new: true }
        )
        .exec();
      return updatedUser ? this.documentToUser(updatedUser) : null;
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.userModel.findByIdAndDelete(id).exec();
      return !!result;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const count = await this.userModel.countDocuments({ _id: id }).exec();
      return count > 0;
    } catch (error) {
      console.error('Error checking if user exists:', error);
      throw error;
    }
  }

  async findAll(): Promise<IUser[]> {
    try {
      const users = await this.userModel.find().exec();
      return users.map(user => this.documentToUser(user));
    } catch (error) {
      console.error('Error finding all users:', error);
      throw error;
    }
  }
}