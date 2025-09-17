import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './infrastructure/database';
import { errorHandler } from './infrastructure/middleware/errorHandler';
import { notFoundHandler } from './infrastructure/middleware/notFoundHandler';
import { createAPIRoutes } from './routes';
import { requestLogger, apiLogger, requestIdMiddleware, errorLogger } from './middleware/logging';
import { swaggerUi, specs } from './infrastructure/swagger';
import { BattleLogger } from './utils/BattleLogger';

// Import repositories
import { PartyRepository } from './repositories/PartyRepository';
import { DungeonRepository } from './repositories/DungeonRepository';
import { CombatResultRepository } from './repositories/CombatResultRepository';
import { PlayerRepository } from './repositories/PlayerRepository';
import { UserRepository } from './repositories/UserRepository';

// Import auth components
import { RegisterUserUseCase } from './use-cases/RegisterUserUseCase';
import { LoginUserUseCase } from './use-cases/LoginUserUseCase';
import { RefreshTokenUseCase } from './use-cases/RefreshTokenUseCase';
import { AuthController } from './controllers/AuthController';
import { AuthMiddleware } from './middleware/AuthMiddleware';

// Import systems and loaders
import { BattleSystem } from './systems/BattleSystem';
import { EntityFactory } from './loaders/EntityFactory';
import { BattleSystemAdapter } from './loaders/BattleSystemAdapter';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Custom middleware
app.use(requestIdMiddleware());
app.use(requestLogger());
app.use(apiLogger());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Initialize dependencies
const initializeDependencies = async () => {
  // Create repository instances
  const partyRepository = new PartyRepository();
  const dungeonRepository = new DungeonRepository();
  const combatResultRepository = new CombatResultRepository();
  const playerRepository = new PlayerRepository();
  const userRepository = new UserRepository();

  // Create system instances
  const battleLogger = new BattleLogger({
    logLevel: 'INFO',
    useColors: true,
    compactMode: false
  });

  // For now, create empty instances for EntityFactory dependencies
  // These should be loaded from database in a real implementation
  const entityFactory = new EntityFactory([], [], []);
  const battleAdapter = new BattleSystemAdapter(entityFactory);

  const battleSystem = new BattleSystem(battleLogger, entityFactory);

  // Create authentication components
  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

  const registerUserUseCase = new RegisterUserUseCase(userRepository);
  const loginUserUseCase = new LoginUserUseCase(userRepository, jwtSecret, jwtRefreshSecret);
  const refreshTokenUseCase = new RefreshTokenUseCase(userRepository, jwtSecret, jwtRefreshSecret);
  const authController = new AuthController(registerUserUseCase, loginUserUseCase, refreshTokenUseCase);
  const authMiddleware = new AuthMiddleware(jwtSecret);

  // Store auth components in app locals for use in routes
  app.locals.authController = authController;
  app.locals.authMiddleware = authMiddleware;

  // Create API routes
  const apiRoutes = createAPIRoutes(
    partyRepository,
    dungeonRepository,
    combatResultRepository,
    playerRepository,
    userRepository,
    battleSystem,
    entityFactory,
    battleAdapter,
    battleLogger
  );

  // Mount API routes
  app.use('/api', apiRoutes);

  // Swagger documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

  console.log('🔧 Dependencies initialized successfully');
  return {
    partyRepository,
    dungeonRepository,
    combatResultRepository,
    playerRepository,
    userRepository,
    battleSystem,
    entityFactory,
    battleAdapter,
    battleLogger,
    authController,
    authMiddleware
  };
};

/**
 * Create and configure Express application for testing
 * This function can be used in integration tests
 */
export const createApp = async (): Promise<express.Application> => {
  try {
    // Initialize dependencies
    await initializeDependencies();

    // Error handling middleware (must be last)
    app.use(errorLogger());
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
  } catch (error) {
    console.error('❌ Failed to create app:', error);
    throw error;
  }
};

/**
 * Initialize dependencies without starting the server
 * Useful for integration tests that need repositories but not the full HTTP server
 */
export const initializeTestDependencies = async () => {
  try {
    // Create repository instances
    const partyRepository = new PartyRepository();
    const dungeonRepository = new DungeonRepository();
    const combatResultRepository = new CombatResultRepository();
    const playerRepository = new PlayerRepository();
    const userRepository = new UserRepository();

    // Create system instances
    const battleLogger = new BattleLogger({
      logLevel: 'ERROR', // Minimize output during tests
      useColors: false,
      compactMode: true
    });

    // For now, create empty instances for EntityFactory dependencies
    // These should be loaded from database in a real implementation
    const entityFactory = new EntityFactory([], [], []);
    const battleAdapter = new BattleSystemAdapter(entityFactory);

    const battleSystem = new BattleSystem(battleLogger, entityFactory);

    console.log('🔧 Test dependencies initialized successfully');
    return {
      partyRepository,
      dungeonRepository,
      combatResultRepository,
      playerRepository,
      userRepository,
      battleSystem,
      entityFactory,
      battleAdapter,
      battleLogger
    };
  } catch (error) {
    console.error('❌ Failed to initialize test dependencies:', error);
    throw error;
  }
};

// Error handling middleware (must be last)
app.use(errorLogger());
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database (don't fail in development if MongoDB is not available)
    try {
      await connectDB();
    } catch (dbError) {
      if (process.env.NODE_ENV === 'production') {
        throw dbError;
      } else {
        console.warn('⚠️  MongoDB connection failed, continuing in development mode:', (dbError as Error).message);
      }
    }

    // Create and configure the application
    const app = await createApp();

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🔗 API endpoints available at: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Only start server if this file is run directly (not imported)
if (require.main === module) {
  startServer();
}