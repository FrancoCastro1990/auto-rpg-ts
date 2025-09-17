// Base repository interface following Repository pattern
export interface IBaseRepository<T, TId = string> {
  findById(id: TId): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  update(id: TId, entity: Partial<T>): Promise<T | null>;
  delete(id: TId): Promise<boolean>;
  exists(id: TId): Promise<boolean>;
}

// Base use case interface
export interface IBaseUseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}

// Generic result type for operations
export interface IOperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination interface
export interface IPaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IPaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}