# RPG Auto-Battler Development Plan

## Project Overview
Transformación del RPG auto-battler de consola a una **REST API moderna** usando Clean Architecture, MongoDB, Docker y TypeScript. El proyecto mantiene la lógica de combate automatizada pero expone funcionalidades vía API REST.

## Task Breakdown

### R001: Express.js Base Setup ✅ COMPLETADO
**Quiero** establecer la base de Express.js con TypeScript
**Para** tener un servidor REST API funcional

- ✅ Configurar Express.js con TypeScript y estructura modular
- ✅ Instalar dependencias: express, @types/express, cors, helmet, dotenv
- ✅ Crear estructura básica de servidor con configuración centralizada
- ✅ Configurar middlewares básicos (CORS, JSON parsing, security headers)
- ✅ Crear endpoint de health check con información del sistema
- ✅ Configurar variables de entorno y validación
- ✅ Implementar logging básico del servidor
- ✅ Crear estructura de respuesta API consistente

### R002: Clean Architecture Structure ✅ COMPLETADO
**Quiero** implementar la estructura de Clean Architecture
**Para** tener una base sólida y mantenible

- ✅ Crear interfaces de dominio (entities/interfaces.ts)
- ✅ Implementar interfaces de repositorio (repositories/interfaces.ts)
- ✅ Definir contratos de casos de uso (use-cases/interfaces.ts)
- ✅ Configurar contenedor de inyección de dependencias
- ✅ Crear archivos index.ts para exportaciones limpias
- ✅ Documentar arquitectura (CLEAN_ARCHITECTURE.md)

### R003: MongoDB Models (PENDIENTE)
**Quiero** crear los modelos de MongoDB con Mongoose
**Para** tener persistencia de datos estructurada

- Crear esquemas de Mongoose para entidades principales
- Implementar validaciones de esquema
- Crear índices para consultas frecuentes
- Configurar conexión a MongoDB
- Implementar modelos concretos (Player, Party, Dungeon, etc.)

### R004: Docker Compose Setup ✅ COMPLETADO
**Quiero** configurar Docker para MongoDB
**Para** tener un entorno de desarrollo consistente

- ✅ Crear docker-compose.yml con MongoDB
- ✅ Configurar volúmenes persistentes
- ✅ Exponer puerto 27018 para evitar conflictos
- ✅ Agregar scripts de inicialización
- ✅ Verificar conexión desde la aplicación

### R005: Domain Models Implementation (PENDIENTE)
**Quiero** implementar las entidades de dominio concretas
**Para** tener objetos de negocio funcionales

- Crear clases concretas de entidades (Player, Party, etc.)
- Implementar value objects (Stats, Experience, etc.)
- Agregar validaciones de dominio con Zod
- Crear factories para construcción de objetos
- Implementar métodos de negocio en entidades

### R006: Repository Implementations (PENDIENTE)
**Quiero** implementar repositorios concretos con MongoDB
**Para** tener acceso a datos funcional

- Crear MongoPlayerRepository implementando IPlayerRepository
- Crear MongoPartyRepository implementando IPartyRepository
- Crear MongoDungeonRepository implementando IDungeonRepository
- Implementar consultas complejas y filtros
- Agregar manejo de errores de base de datos

### R007: Battle System Use Cases (PENDIENTE)
**Quiero** implementar casos de uso del sistema de combate
**Para** tener lógica de negocio encapsulada

- Crear ExecuteBattleUseCase
- Crear CalculateTurnOrderUseCase
- Crear ProcessBattleActionUseCase
- Implementar validaciones de reglas de combate
- Agregar logging de batalla

### R008: Dungeon Management Use Cases (PENDIENTE)
**Quiero** implementar casos de uso de gestión de dungeons
**Para** coordinar secuencias de batalla

- Crear ExecuteDungeonUseCase
- Crear ManagePartyStateUseCase
- Crear GenerateDungeonReportUseCase
- Implementar lógica de progresión
- Agregar validaciones de dungeon

### R009: Character Management Use Cases (PENDIENTE)
**Quiero** implementar casos de uso de gestión de personajes
**Para** manejar stats, buffs y leveling

- Crear CreateCharacterUseCase
- Crear UpdateCharacterStatsUseCase
- Crear ApplyBuffDebuffUseCase
- Implementar sistema de experiencia
- Agregar validaciones de personaje

### R010: Zod Validation Schemas (PENDIENTE)
**Quiero** crear esquemas de validación con Zod
**Para** validar requests y responses de API

- Crear esquemas para entidades principales
- Implementar validación de requests HTTP
- Crear esquemas para responses
- Agregar validación de parámetros de ruta
- Implementar manejo de errores de validación

### R011: Error Handling Middleware (PENDIENTE)
**Quiero** implementar middleware de manejo de errores
**Para** tener respuestas de error consistentes

- Crear middleware de errores global
- Implementar formateo de errores consistente
- Agregar logging de errores
- Crear tipos de error personalizados
- Implementar recuperación de errores

### R012: Battle Controller (PENDIENTE)
**Quiero** crear controlador para endpoints de batalla
**Para** exponer funcionalidad de combate vía API

- Crear POST /api/battles - Ejecutar batalla
- Crear GET /api/battles/:id - Obtener resultado de batalla
- Implementar validación de requests
- Agregar documentación de endpoints
- Crear DTOs para requests/responses

### R013: Dungeon Controller (PENDIENTE)
**Quiero** crear controlador para endpoints de dungeon
**Para** exponer gestión de dungeons vía API

- Crear POST /api/dungeons - Crear dungeon
- Crear GET /api/dungeons/:id - Obtener dungeon
- Crear POST /api/dungeons/:id/execute - Ejecutar dungeon
- Implementar validación de requests
- Agregar documentación de endpoints

### R014: Character Controller (PENDIENTE)
**Quiero** crear controlador para endpoints de personajes
**Para** exponer gestión de personajes vía API

- Crear POST /api/characters - Crear personaje
- Crear GET /api/characters/:id - Obtener personaje
- Crear PUT /api/characters/:id - Actualizar personaje
- Crear GET /api/characters - Listar personajes
- Implementar validación de requests

### R015: Route Configuration (PENDIENTE)
**Quiero** configurar las rutas de la aplicación
**Para** tener una estructura de endpoints organizada

- Crear archivos de rutas separados por dominio
- Configurar middleware de rutas
- Implementar versionado de API (v1)
- Agregar documentación de rutas
- Crear middleware de autenticación (futuro)

### R016: API Documentation (PENDIENTE)
**Quiero** documentar la API
**Para** facilitar el uso y desarrollo

- Crear documentación con OpenAPI/Swagger
- Documentar todos los endpoints
- Agregar ejemplos de requests/responses
- Crear guía de uso de la API
- Documentar esquemas de datos

### R017: Testing Setup (PENDIENTE)
**Quiero** configurar el entorno de testing
**Para** asegurar calidad del código

- Instalar Jest y dependencias de testing
- Configurar tests unitarios para casos de uso
- Crear tests de integración para controladores
- Implementar tests de repositorio
- Agregar tests de validación

### R018: Docker for Application (PENDIENTE)
**Quiero** dockerizar la aplicación
**Para** tener despliegue consistente

- Crear Dockerfile para la aplicación
- Actualizar docker-compose.yml
- Configurar variables de entorno
- Agregar health checks
- Crear script de despliegue

### R019: Legacy Logic Migration & Data Seeding ✅ COMPLETADO
**Quiero** transformar la lógica existente del sistema de combate en servicios y migrar datos JSON a MongoDB
**Para** preservar la funcionalidad existente mientras integramos con la nueva arquitectura

- ✅ Analizar lógica existente en sistemas originales (BattleSystem, RulesEngine, etc.)
- ✅ Crear servicios de dominio para encapsular lógica de combate
- ✅ Migrar datos de jobs.json a colección Jobs en MongoDB (5 registros)
- ✅ Migrar datos de skills.json a colección Skills en MongoDB (59 registros)
- ✅ Migrar datos de enemies.json a colección Enemies en MongoDB (14 registros)
- ✅ Migrar datos de dungeon_01.json a colección Dungeons en MongoDB (1 registro)
- ✅ Crear scripts de seeding para poblar base de datos con datos iniciales
- 🔄 Adaptar EntityFactory para trabajar con datos de base de datos
- 🔄 Crear servicios para RulesEngine y TargetSelector
- 🔄 Implementar servicio de BattleSystem como caso de uso
- 🔄 Crear servicio de DungeonManager para exploración
- 🔄 Integrar servicios con contenedor de dependencias
- 🔄 Crear tests de integración para servicios migrados
- 🔄 Documentar cambios y compatibilidad con lógica original

## Dependencies Required
### Core Dependencies
- `express`: Framework web para Node.js
- `@types/express`: Tipos TypeScript para Express
- `mongoose`: ODM para MongoDB
- `@types/mongoose`: Tipos TypeScript para Mongoose
- `zod`: Validación de esquemas
- `cors`: Middleware CORS
- `helmet`: Seguridad básica
- `dotenv`: Variables de entorno

### Development Dependencies
- `typescript`: Compilador TypeScript
- `ts-node`: Ejecución directa de TypeScript
- `@types/node`: Tipos Node.js
- `@types/cors`: Tipos para CORS
- `nodemon`: Recarga automática en desarrollo
- `jest`: Framework de testing
- `@types/jest`: Tipos para Jest

## File Structure
```
auto-rpg-ts/
├── src/
│   ├── entities/              # 📋 Reglas de negocio puras
│   │   ├── interfaces.ts     # Interfaces de dominio
│   │   └── index.ts
│   ├── use-cases/            # 🎯 Casos de uso
│   │   ├── interfaces.ts     # Contratos de casos de uso
│   │   └── index.ts
│   ├── controllers/          # 🌐 Controladores HTTP
│   │   └── index.ts
│   ├── repositories/         # 💾 Repositorios
│   │   ├── IBaseRepository.ts # Interfaz base
│   │   ├── interfaces.ts     # Interfaces específicas
│   │   └── index.ts
│   ├── infrastructure/       # 🔧 Infraestructura
│   │   ├── database.ts       # Conexión MongoDB
│   │   ├── dependencyContainer.ts # DI Container
│   │   ├── middleware/       # Middlewares Express
│   │   └── index.ts
│   └── index.ts              # Exportaciones principales
├── data/                     # Archivos JSON originales
├── tests/                    # Tests
├── docker-compose.yml        # Docker configuration
├── Dockerfile               # Container definition
├── package.json
├── tsconfig.json
├── CLEAN_ARCHITECTURE.md    # 📚 Documentación de arquitectura
└── README.md
```

## Success Criteria
- ✅ API REST funcional con Express.js
- ✅ Arquitectura limpia implementada
- ✅ MongoDB con Docker funcionando
- 🔄 Endpoints CRUD para entidades principales
- 🔄 Sistema de combate automatizado vía API
- 🔄 Gestión de dungeons y progresión
- 🔄 Validación robusta con Zod
- 🔄 Documentación completa de API
- 🔄 Tests unitarios e integración
- 🔄 Docker containerizado completamente

## Current Status
- **R001**: ✅ Completado - Express.js base setup
- **R002**: ✅ Completado - Clean Architecture structure
- **R003**: 🔄 Pendiente - MongoDB models
- **R004**: ✅ Completado - Docker Compose setup
- **R005-R018**: 🔄 Pendientes - Implementación incremental
- **R019**: ✅ Completado - Legacy Logic Migration & Data Seeding