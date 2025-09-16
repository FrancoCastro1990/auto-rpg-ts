# RPG Auto-Battler Development Plan V2

## Project Overview
Development of a TypeScript-based RPG auto-battler that runs in console, featuring automated combat with configurable rules, dungeon exploration, and party management. Updated with new features for combat animation support.

## Task Breakdown

### T001: Project Setup and Configuration (COMPLETED)
**Quiero** establecer la estructura base del proyecto con TypeScript y dependencias
**Para** tener un entorno de desarrollo funcional y organizado

- Initialize npm project with TypeScript configuration
- Install dependencies: json-rules-engine, chalk, @types/node
- Configure tsconfig.json and build scripts
- Create basic folder structure (/src, /data, /dist)

### T002: Core Data Models (COMPLETED)
**Quiero** definir las interfaces y tipos TypeScript para el sistema
**Para** tener una base sólida de tipado y estructura de datos

- Define Character, Stats, Ability, Rule interfaces
- Create Job, Enemy, Battle, Dungeon types
- Implement Buff/Debuff system interfaces
- Define Action and BattleResult types

### T003: JSON Data Loaders (COMPLETED)
**Quiero** crear loaders para leer y validar archivos JSON
**Para** poder cargar la configuración del juego de manera robusta

- Implement DataLoader class for JSON files
- Add validation for party.json structure
- Add validation for jobs.json structure
- Add validation for skills.json structure
- Add validation for enemies.json and dungeon files
- Error handling for missing or malformed files

### T004: Rules Engine Integration (COMPLETED)
**Quiero** integrar json-rules-engine para el sistema de combate
**Para** permitir comportamientos configurables y complejos

- Create RulesEngine wrapper class
- Implement condition evaluators (hp%, enemy.isBoss, etc.)
- Create facts builder for battle context
- Add rule priority handling system

### T005: Target Selection System (COMPLETED)
**Quiero** implementar el sistema de selección de objetivos
**Para** que las reglas puedan elegir targets apropiados

- Implement TargetSelector class
- Add weakestEnemy, strongestEnemy selectors
- Add lowestHpAlly, randomAlly selectors
- Add bossEnemy, self targeting
- Handle edge cases (no valid targets)

### T006: Combat System Core (COMPLETED)
**Quiero** crear el sistema central de combate por turnos
**Para** ejecutar batallas automáticas según las reglas

- Implement BattleSystem class
- Create turn order calculation (by speed)
- Add action execution pipeline
- Implement battle state management
- Add victory/defeat conditions

### T007: Ability and Damage System (COMPLETED)
**Quiero** implementar el sistema de habilidades y cálculo de daño
**Para** que los personajes puedan usar ataques y habilidades especiales

- Create AbilitySystem class
- Implement damage calculation formulas
- Add healing and buff/debuff effects
- Handle MP consumption and validation
- Add ability type handlers (attack, heal, buff, debuff)

### T008: Character Management (COMPLETED)
**Quiero** crear el sistema de gestión de personajes
**Para** manejar stats, buffs y estado entre batallas

- Implement Character class with stats management
- Add buff/debuff application and duration
- Create character factory from job data
- Add level scaling and stat calculation
- Implement state persistence between battles

### T008_ESPECIAL: Bug Fixes and Improvements (COMPLETED)
**Quiero** corregir los errores identificados
**Para** poder avanzar con el resto de tareas

- ✅ Corregir validación de MP para skills (actores no deben usar skills sin MP suficiente)
- ✅ Agregar selector 'lowestHpEnemy' faltante
- ✅ Asegurar que los enemigos ataquen correctamente a los aliados
- ✅ Implementar límite de turnos desde dungeon_XX.json

### T009: Dungeon Management (COMPLETED)
**Quiero** crear el sistema de gestión de dungeons
**Para** coordinar múltiples batallas y progresión

- ✅ Implement DungeonManager class
- ✅ Add battle sequence management
- ✅ Handle party state between battles
- ✅ Implement save/load functionality
- ✅ Add dungeon completion detection

### T010: Battle Logging System (COMPLETED)
**Quiero** implementar un sistema de logging detallado
**Para** que el usuario pueda seguir el progreso de las batallas

- ✅ Create BattleLogger class
- ✅ Add turn-by-turn action logging
- ✅ Implement colored console output
- ✅ Add battle summary reports
- ✅ Create dungeon completion reports

### T011: Sample Data Creation (COMPLETED)
**Quiero** crear archivos JSON de ejemplo
**Para** poder probar y demostrar el sistema

- ✅ Create sample party.json with 2-3 characters
- ✅ Create jobs.json with Warrior, Mage, Healer classes
- ✅ Create enemies.json with basic enemy types
- ✅ Create dungeon_01.json with progressive difficulty
- ✅ Add boss enemy with special abilities
- ✅ Agregar personajes adicionales con diferentes niveles
- ✅ Crear dungeon_02.json como ejemplo alternativo
- ✅ Expandir skills.json con nuevas habilidades elementales

### T012: Main Game Entry Point (COMPLETED)
**Quiero** crear el punto de entrada principal del juego
**Para** que se pueda ejecutar desde línea de comandos

- ✅ Implement main.ts with CLI argument handling
- ✅ Add game initialization sequence
- ✅ Create game loop for dungeon execution
- ✅ Add proper error handling and user feedback
- ✅ Implement graceful shutdown
- ✅ Agregar comando --list para mostrar contenido disponible
- ✅ Implementar modo interactivo para configuración
- ✅ Expandir opciones CLI con nuevas funcionalidades
- ✅ Mejorar mensajes de ayuda y documentación

### T013: Error Handling and Validation (PENDING)
**Quiero** agregar manejo robusto de errores
**Para** que el juego sea estable y dé feedback útil

- Add comprehensive error handling
- Implement data validation layers
- Add user-friendly error messages
- Handle edge cases in combat
- Add logging for debugging

### T014: Testing and Documentation (PENDING)
**Quiero** crear tests y documentación
**Para** asegurar calidad y facilitar mantenimiento

- Create unit tests for core systems
- Add integration tests for battle scenarios
- Write README with setup and usage instructions
- Document JSON file formats
- Add code comments and JSDoc

### T015: Combat Animation Data Export (COMPLETED)
**Quiero** implementar exportación de datos detallados del combate en formato JSON
**Para** que se puedan usar para animar las batallas en una interfaz externa

- ✅ Crear estructura de datos completa para exportación de combate
- ✅ Incluir todos los detalles del juego: party, enemigos, stats iniciales
- ✅ Registrar todos los turnos con acciones, daños, curaciones, cambios de stats
- ✅ Incluir información de skills y abilities usadas
- ✅ Agregar timestamps y metadata para sincronización de animaciones
- ✅ Implementar guardado automático del archivo JSON al finalizar cada batalla
- ✅ Crear esquema JSON estandarizado para consumo por sistemas de animación

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
│   ├── skills.json
│   ├── dungeon_01.json
│   └── dungeon_02.json
├── combat-animations/   # Generated JSON files for animations
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
- 🔄 Export detailed combat data in JSON format for animation systems
- 🔄 Support for external animation engines consuming battle data