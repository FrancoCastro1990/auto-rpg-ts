# RPG Auto-Battler Development Plan

## Project Overview
Development of a TypeScript-based RPG auto-battler that runs in console, featuring automated combat with configurable rules, dungeon exploration, and party management.

## Task Breakdown

### T001: Project Setup and Configuration (OK)
**Quiero** establecer la estructura base del proyecto con TypeScript y dependencias
**Para** tener un entorno de desarrollo funcional y organizdo

- Initialize npm project with TypeScript configuration
- Install dependencies: json-rules-engine, chalk, @types/node
- Configure tsconfig.json and build scripts
- Create basic folder structure (/src, /data, /dist)

### T002: Core Data Models (OK)
**Quiero** definir las interfaces y tipos TypeScript para el sistema
**Para** tener una base sólida de tipado y estructura de datos

- Define Character, Stats, Ability, Rule interfaces
- Create Job, Enemy, Battle, Dungeon types
- Implement Buff/Debuff system interfaces
- Define Action and BattleResult types

### T003: JSON Data Loaders (OK)
**Quiero** crear loaders para leer y validar archivos JSON
**Para** poder cargar la configuración del juego de manera robusta

- Implement DataLoader class for JSON files
- Add validation for party.json structure
- Add validation for jobs.json structure
- Add validation for skills.json structure
- Add validation for enemies.json and dungeon files
- Error handling for missing or malformed files

### T004: Rules Engine Integration (OK)
**Quiero** integrar json-rules-engine para el sistema de combate
**Para** permitir comportamientos configurables y complejos

- Create RulesEngine wrapper class
- Implement condition evaluators (hp%, enemy.isBoss, etc.)
- Create facts builder for battle context
- Add rule priority handling system

### T005: Target Selection System (OK)
**Quiero** implementar el sistema de selección de objetivos
**Para** que las reglas puedan elegir targets apropiados

- Implement TargetSelector class
- Add weakestEnemy, strongestEnemy selectors
- Add lowestHpAlly, randomAlly selectors
- Add bossEnemy, self targeting
- Handle edge cases (no valid targets)

### T006: Combat System Core (OK)
**Quiero** crear el sistema central de combate por turnos
**Para** ejecutar batallas automáticas según las reglas

- Implement BattleSystem class
- Create turn order calculation (by speed)
- Add action execution pipeline
- Implement battle state management
- Add victory/defeat conditions

### T007: Ability and Damage System (OK)
**Quiero** implementar el sistema de habilidades y cálculo de daño
**Para** que los personajes puedan usar ataques y habilidades especiales

- Create AbilitySystem class
- Implement damage calculation formulas
- Add healing and buff/debuff effects
- Handle MP consumption and validation
- Add ability type handlers (attack, heal, buff, debuff)

### T008: Character Management (OK)
**Quiero** crear el sistema de gestión de personajes
**Para** manejar stats, buffs y estado entre batallas

- Implement Character class with stats management
- Add buff/debuff application and duration
- Create character factory from job data
- Add level scaling and stat calculation
- Implement state persistence between battles

## T008_ESPECIAL
**Quiero** corregir los errores
**Para** poder avanzar con el resto de tareas.

- tenemos un error. No tenemos alguna validacion de MP de los skills, por ende los actores intentan ocupar skills sin tener MP.
- Falta el 'lowestHpEnemy'.
- Los enemigos deben atacar a sus enemigos (nosotros).
- La cantidad de turno debe venir dada en el json de dungeon_XX.json.

### T009: Dungeon Management
**Quiero** crear el sistema de gestión de dungeons
**Para** coordinar múltiples batallas y progresión

- Implement DungeonManager class
- Add battle sequence management
- Handle party state between battles
- Implement save/load functionality
- Add dungeon completion detection

### T010: Battle Logging System
**Quiero** implementar un sistema de logging detallado
**Para** que el usuario pueda seguir el progreso de las batallas

- Create BattleLogger class
- Add turn-by-turn action logging
- Implement colored console output
- Add battle summary reports
- Create dungeon completion reports

### T011: Sample Data Creation
**Quiero** crear archivos JSON de ejemplo
**Para** poder probar y demostrar el sistema

- Create sample party.json with 2-3 characters
- Create jobs.json with Warrior, Mage, Healer classes
- Create enemies.json with basic enemy types
- Create dungeon_01.json with progressive difficulty
- Add boss enemy with special abilities

### T012: Main Game Entry Point
**Quiero** crear el punto de entrada principal del juego
**Para** que se pueda ejecutar desde línea de comandos

- Implement main.ts with CLI argument handling
- Add game initialization sequence
- Create game loop for dungeon execution
- Add proper error handling and user feedback
- Implement graceful shutdown

### T013: Error Handling and Validation
**Quiero** agregar manejo robusto de errores
**Para** que el juego sea estable y dé feedback útil

- Add comprehensive error handling
- Implement data validation layers
- Add user-friendly error messages
- Handle edge cases in combat
- Add logging for debugging

### T014: Testing and Documentation
**Quiero** crear tests y documentación
**Para** asegurar calidad y facilitar mantenimiento

- Create unit tests for core systems
- Add integration tests for battle scenarios
- Write README with setup and usage instructions
- Document JSON file formats
- Add code comments and JSDoc

## Dependencies Required
- `json-rules-engine`: Rules engine for combat logic
- `chalk`: Console output coloring
- `@types/node`: TypeScript definitions for Node.js
- `typescript`: TypeScript compiler
- `ts-node`: Development execution
- `jest`: Testing framework (optional)

## File Structure
```
auto-rpg-ts/
├── src/
│   ├── models/          # Interfaces and types
│   ├── systems/         # Core game systems
│   ├── loaders/         # Data loading utilities
│   ├── utils/           # Helper functions
│   └── main.ts          # Entry point
├── data/
│   ├── party.json
│   ├── jobs.json
│   ├── enemies.json
│   └── dungeon_01.json
├── tests/
├── dist/                # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## Success Criteria
- ✅ Game runs from command line with dungeon file parameter
- ✅ Automated combat follows configured rules
- ✅ Detailed battle logging to console
- ✅ Party state persistence between battles
- ✅ Configurable characters, enemies, and dungeons via JSON
- ✅ Extensible system for new jobs and abilities