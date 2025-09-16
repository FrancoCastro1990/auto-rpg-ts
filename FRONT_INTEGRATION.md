# Frontend Integration Guide - Auto-RPG Game

## 📖 Introducción

Esta guía proporciona una documentación completa para desarrolladores frontend que desean integrar o extender el **Auto-RPG Game**, un sistema de combate automático por turnos desarrollado en TypeScript. El sistema permite crear aventuras automatizadas con personajes configurables, reglas de combate personalizables, **sistema de summon con minions activos** y exportación de datos para animaciones.

### 🎯 Propósito
Esta guía te ayudará a:
- Configurar y ejecutar el sistema RPG
- Entender y modificar los archivos JSON de configuración
- Integrar el sistema en aplicaciones frontend
- Crear contenido personalizado (personajes, habilidades, mazmorras)
- **Implementar y configurar el sistema de summon**
- Solucionar problemas comunes
- Implementar mejores prácticas

---

## 🚀 Instalación y Configuración

### Prerrequisitos
- **Node.js** versión 16 o superior
- **npm** o **yarn** para gestión de paquetes
- **TypeScript** (opcional, para desarrollo)

### Instalación Paso a Paso

#### 1. Clonar o Descargar el Proyecto
```bash
# Si tienes acceso al repositorio
git clone https://github.com/your-username/auto-rpg-ts.git
cd auto-rpg-ts

# O descarga el ZIP y extrae los archivos
```

#### 2. Instalar Dependencias
```bash
npm install
```

#### 3. Verificar Instalación
```bash
# Ejecutar tests para verificar que todo funciona
npm test

# Ejecutar el juego con configuración por defecto
npm start
```

#### 4. Configuración Básica
El proyecto incluye configuración por defecto que funciona inmediatamente:

```
auto-rpg-ts/
├── data/                    # Archivos JSON de configuración
│   ├── party.json          # Configuración del grupo
│   ├── jobs.json           # Clases de personajes
│   ├── enemies.json        # Enemigos y minions disponibles
│   ├── skills.json         # Habilidades, ataques y summon
│   └── dungeon_01.json     # Primera mazmorra
├── src/                    # Código fuente TypeScript
│   ├── systems/
│   │   ├── BattleSystem.ts # Motor de combate con summon
│   │   ├── EnemyAI.ts     # IA para enemigos sin reglas
│   │   └── LootSystem.ts  # Sistema de recompensas
│   └── loaders/
│       └── EntityFactory.ts # Creación de entidades y minions
├── combat-animations/      # Datos exportados para animaciones
├── test-summon.ts         # Tests del sistema de summon
└── package.json           # Configuración del proyecto
```

---

## 📋 Estructura de Archivos JSON

### 🎭 party.json - Configuración del Grupo

Define los personajes que formarán parte de tu grupo de aventureros.

#### Estructura Básica
```json
[
  {
    "name": "Nombre del Personaje",
    "job": "Clase del Personaje",
    "level": 1,
    "rules": [
      {
        "priority": 100,
        "condition": "Condición de activación",
        "target": "Objetivo de la acción",
        "action": "Acción a realizar"
      }
    ]
  }
]
```

#### Campos Obligatorios
- **`name`**: Nombre único del personaje (string)
- **`job`**: Clase que debe existir en `jobs.json` (string)
- **`level`**: Nivel del personaje (number, mínimo 1)
- **`rules`**: Array de reglas de comportamiento (array)

#### Sistema de Reglas
Cada regla define cuándo y cómo actúa un personaje:

```json
{
  "priority": 100,           // Prioridad (número mayor = más prioridad)
  "condition": "enemy.isBoss", // Condición para activar la regla
  "target": "bossEnemy",     // Objetivo de la acción
  "action": "cast:power_strike" // Acción a realizar
}
```

#### Ejemplo Completo
```json
[
  {
    "name": "Kael",
    "job": "Warrior",
    "level": 1,
    "rules": [
      {
        "priority": 100,
        "condition": "enemy.isBoss",
        "target": "bossEnemy",
        "action": "cast:power_strike"
      },
      {
        "priority": 80,
        "condition": "ally.hp < 30%",
        "target": "self",
        "action": "cast:taunt"
      },
      {
        "priority": 60,
        "condition": "self.mp > 50%",
        "target": "strongestEnemy",
        "action": "cast:power_strike"
      },
      {
        "priority": 10,
        "condition": "always",
        "target": "weakestEnemy",
        "action": "attack"
      }
    ]
  }
]
```

### 🏋️ jobs.json - Clases de Personajes

Define las clases disponibles y sus estadísticas base.

#### Estructura Básica
```json
[
  {
    "name": "Nombre de la Clase",
    "description": "Descripción de la clase",
    "baseStats": {
      "hp": 100,
      "mp": 50,
      "str": 15,
      "def": 10,
      "mag": 8,
      "spd": 12
    },
    "skillIds": [
      "skill_id_1",
      "skill_id_2"
    ]
  }
]
```

#### Estadísticas Base
- **`hp`**: Puntos de vida (health points)
- **`mp`**: Puntos de magia (magic points)
- **`str`**: Fuerza (strength) - afecta daño físico
- **`def`**: Defensa (defense) - reduce daño recibido
- **`mag`**: Magia (magic) - afecta daño mágico y curación
- **`spd`**: Velocidad (speed) - determina orden de turnos

#### Ejemplo Completo
```json
[
  {
    "name": "Warrior",
    "description": "Front-line fighter with high physical damage and defense",
    "baseStats": {
      "hp": 150,
      "mp": 20,
      "str": 18,
      "def": 15,
      "mag": 5,
      "spd": 8
    },
    "skillIds": [
      "basic_attack",
      "power_strike",
      "shield_bash",
      "taunt"
    ]
  }
]
```

### 👹 enemies.json - Enemigos

Define los tipos de enemigos disponibles en el juego.

#### Estructura Básica
```json
[
  {
    "type": "Nombre del Tipo",
    "job": "Clase del Enemigo",
    "description": "Descripción del enemigo",
    "isBoss": false,
    "baseStats": {
      "hp": 100,
      "mp": 30,
      "str": 12,
      "def": 8,
      "mag": 6,
      "spd": 10
    },
    "rules": [...],
    "skillIds": [...]
  }
]
```

#### Campos Especiales
- **`isBoss`**: Marca si es un jefe (boolean, opcional)
- **`type`**: Nombre único del tipo de enemigo
- **`job`**: Clase base (debe existir en jobs.json)

#### Sistema de Loot en enemies.json
Los enemigos pueden tener configuraciones específicas de loot:

```json
{
  "type": "Goblin",
  "job": "Warrior",
  "description": "A sneaky goblin warrior",
  "baseStats": { "hp": 80, "mp": 20, "str": 12, "def": 8, "mag": 4, "spd": 14 },
  "rules": [...],
  "skillIds": ["basic_attack", "goblin_strike"],
  "lootConfig": {
    "goldRange": { "min": 8, "max": 20 },
    "experienceReward": 15,
    "guaranteedDrops": [],
    "randomDrops": [
      { "itemId": "goblin_tooth", "dropRate": 0.6, "minQuantity": 1, "maxQuantity": 3 },
      { "itemId": "health_potion", "dropRate": 0.4, "minQuantity": 1, "maxQuantity": 1 }
    ]
  }
}
```

### ⚔️ skills.json - Habilidades y Ataques

Define todas las habilidades disponibles en el juego.

#### Estructura Básica
```json
[
  {
    "id": "unique_skill_id",
    "name": "Nombre de la Habilidad",
    "type": "attack|heal|buff|debuff",
    "effect": {
      "damage": 25,
      "heal": 0,
      "statModifier": {
        "str": 5,
        "def": 3
      },
      "duration": 3
    },
    "mpCost": 10,
    "description": "Descripción de la habilidad"
  }
]
```

#### Tipos de Habilidades
- **`attack`**: Causa daño directo
- **`heal`**: Restaura puntos de vida
- **`buff`**: Mejora estadísticas temporalmente
- **`debuff`**: Reduce estadísticas temporalmente

#### Campos del Efecto
- **`damage`**: Daño causado (para ataques)
- **`heal`**: Curación proporcionada (para heals)
- **`statModifier`**: Modificadores de estadísticas
- **`duration`**: Duración en turnos (para buffs/debuffs)

#### Ejemplo Completo
```json
[
  {
    "id": "power_strike",
    "name": "Power Strike",
    "type": "attack",
    "effect": {
      "damage": 25
    },
    "mpCost": 5,
    "description": "A powerful melee attack that deals heavy damage"
  },
  {
    "id": "blessing",
    "name": "Blessing",
    "type": "buff",
    "effect": {
      "statModifier": {
        "str": 8,
        "mag": 8
      },
      "duration": 4
    },
    "mpCost": 12,
    "description": "Increases ally's attack power"
  }
]
```

### 👻 Sistema de Summon - Habilidades Especiales

El sistema de summon permite a los personajes invocar minions que participan activamente en el combate.

#### Habilidades de Summon
```json
{
  "id": "summon_skeleton",
  "name": "Summon Skeleton",
  "type": "buff",
  "effect": {
    "summon": "Skeleton",
    "count": 1
  },
  "mpCost": 20,
  "cooldown": 5,
  "description": "Summons a skeleton minion to fight alongside the caster"
}
```

#### Campos Especiales para Summon
- **`summon`**: Tipo de minion a invocar (debe existir en `enemies.json`)
- **`count`**: Número de minions a invocar (opcional, por defecto 1)
- **`cooldown`**: Turnos de cooldown antes de poder usar nuevamente

#### Minions en enemies.json
Los minions son definidos como enemigos normales pero con reglas específicas:

```json
{
  "type": "Skeleton",
  "job": "Warrior",
  "description": "Undead minion summoned by necromancers",
  "baseStats": {
    "hp": 35,
    "mp": 0,
    "str": 10,
    "def": 8,
    "mag": 2,
    "spd": 12
  },
  "rules": [
    {
      "priority": 10,
      "condition": "always",
      "target": "randomEnemy",
      "action": "attack"
    }
  ],
  "skillIds": ["basic_attack"]
}
```

#### Reglas para Usar Summon
```json
{
  "priority": 70,
  "condition": "self.mp > 50%",
  "target": "self",
  "action": "cast:summon_skeleton"
}
```

#### Características del Sistema de Summon
- ✅ **Minions Independientes**: Cada minion tiene estadísticas propias
- ✅ **Participación Activa**: Los minions atacan y pueden ser atacados
- ✅ **Turn Order Integration**: Se integran automáticamente al orden de turnos
- ✅ **Cooldown System**: Las habilidades tienen cooldown
- ✅ **Multiple Summons**: Posibilidad de invocar múltiples minions
- ✅ **Strategic AI**: Los minions siguen reglas de comportamiento específicas

### 🏰 dungeon_*.json - Mazmorras

Define las mazmorras y secuencias de combate.

#### Estructura Básica
```json
{
  "id": 1,
  "name": "Nombre de la Mazmorra",
  "description": "Descripción de la mazmorra",
  "defaultMaxTurns": 20,
  "battles": [
    {
      "id": 1,
      "order": 0,
      "enemies": [
        { "type": "TipoEnemigo", "name": "NombreEspecífico" }
      ],
      "maxTurns": 30
    }
  ]
}
```

#### Campos Importantes
- **`defaultMaxTurns`**: Límite de turnos por defecto para todas las batallas
- **`battles`**: Array de batallas en orden
- **`maxTurns`**: Límite específico para una batalla (opcional)

#### Ejemplo Completo
```json
{
  "id": 1,
  "name": "Cavernas de la Sombra",
  "description": "Una serie de cavernas infestadas de criaturas malévolas",
  "defaultMaxTurns": 20,
  "battles": [
    {
      "id": 1,
      "order": 0,
      "enemies": [
        { "type": "Slime", "name": "Slime Verde" },
        { "type": "Slime", "name": "Slime Azul" }
      ]
    },
    {
      "id": 7,
      "order": 6,
      "enemies": [
        { "type": "ShadowLord", "name": "Malachar el Señor de las Sombras" }
      ],
      "maxTurns": 50
    }
  ]
}
```

---

## 🎮 Uso Básico

### Ejecutar con Configuración por Defecto
```bash
npm start
```

### Ejecutar una Mazmorra Específica
```bash
npm start -- --dungeon dungeon_02.json
```

### Ejecutar con Grupo Personalizado
```bash
npm start -- --party my_party.json
```

### Probar el Sistema de Summon
```bash
# Ejecutar test específico del sistema de summon
npx ts-node test-summon.ts

# Ejecutar con logging detallado para ver minions en acción
npm start -- --log-level DEBUG
```

### Modo Interactivo
```bash
npm start -- --interactive
```

### Listar Contenido Disponible
```bash
npm start -- --list
```

---

## ⚙️ Opciones Avanzadas de CLI

### Configuración del Sistema
```bash
# Cambiar directorio de datos
npm start -- --data-path ./my-data

# Nivel de logging detallado
npm start -- --log-level DEBUG

# Desactivar colores
npm start -- --no-colors

# Modo compacto
npm start -- --compact
```

### Configuración de Combate
```bash
# Límite de turnos por batalla
npm start -- --max-turns 50

# Exportar datos para animaciones
npm start -- --export-combat-data

# Directorio personalizado para datos de combate
npm start -- --combat-data-dir ./my-animations
```

### Reportes y Análisis
```bash
# Generar reporte en formato JSON
npm start -- --report-format json

# Guardar reporte en archivo
npm start -- --save-report

# Desactivar reportes
npm start -- --no-report
```

---

## 🔧 Integración con Frontend

### Consumir Datos de Combate para Animaciones

Cuando usas `--export-combat-data`, el sistema genera archivos JSON con datos detallados de cada batalla, incluyendo información sobre minions summon:

```javascript
// Ejemplo de integración con JavaScript
async function loadCombatData(battleId) {
  const response = await fetch(`./combat-animations/battle_${battleId}.json`);
  const combatData = await response.json();

  // Estructura del archivo generado incluye información de summon:
  // {
  //   "battleId": 1,
  //   "participants": [...], // Incluye minions con type: "minion"
  //   "turns": [...],       // Acciones de minions aparecen aquí
  //   "metadata": {...}
  // }

  return combatData;
}

// Detectar acciones de summon
function hasSummonActions(combatData) {
  return combatData.turns.some(turn =>
    turn.action?.type === 'summon' ||
    turn.message?.includes('summons')
  );
}

// Animar minions
function animateMinions(combatData) {
  const minions = combatData.participants.filter(p => p.type === 'minion');

  minions.forEach(minion => {
    // Crear sprite o elemento visual para el minion
    createMinionSprite(minion);

    // Animar acciones del minion
    const minionTurns = combatData.turns.filter(turn => turn.actor === minion.id);
    animateMinionActions(minionTurns);
  });
}
```

### Estructura de Datos Exportados

```json
{
  "battleId": 1,
  "startTime": "2025-09-16T10:00:00.000Z",
  "endTime": "2025-09-16T10:01:30.000Z",
  "participants": [
    {
      "id": "kael",
      "name": "Kael",
      "type": "party",
      "job": "Warrior",
      "initialStats": { "hp": 150, "mp": 20, "str": 18, "def": 15 },
      "finalStats": { "hp": 120, "mp": 15, "str": 18, "def": 15 }
    },
    {
      "id": "necromancer_1",
      "name": "Dark Summoner",
      "type": "enemy",
      "job": "BlackMage",
      "initialStats": { "hp": 65, "mp": 60, "str": 4, "def": 9 },
      "finalStats": { "hp": 65, "mp": 40, "str": 4, "def": 9 }
    },
    {
      "id": "skeleton_1",
      "name": "Skeleton 1",
      "type": "minion",
      "job": "Warrior",
      "summonedBy": "necromancer_1",
      "summonedAtTurn": 2,
      "initialStats": { "hp": 35, "mp": 0, "str": 10, "def": 8 },
      "finalStats": { "hp": 25, "mp": 0, "str": 10, "def": 8 }
    }
  ],
  "turns": [
    {
      "turnNumber": 1,
      "timestamp": "2025-09-16T10:00:01.000Z",
      "actor": "kael",
      "action": {
        "type": "skill",
        "skillId": "power_strike",
        "target": "necromancer_1",
        "damage": 25,
        "effects": []
      },
      "stateChanges": {
        "necromancer_1": { "hp": -25 }
      }
    },
    {
      "turnNumber": 2,
      "timestamp": "2025-09-16T10:00:02.000Z",
      "actor": "necromancer_1",
      "action": {
        "type": "summon",
        "skillId": "summon_skeleton",
        "target": "necromancer_1",
        "summonedMinions": ["skeleton_1"],
        "effects": []
      },
      "stateChanges": {
        "necromancer_1": { "mp": -20 },
        "new_participants": ["skeleton_1"]
      }
    },
    {
      "turnNumber": 3,
      "timestamp": "2025-09-16T10:00:03.000Z",
      "actor": "skeleton_1",
      "action": {
        "type": "attack",
        "skillId": "basic_attack",
        "target": "kael",
        "damage": 8,
        "effects": []
      },
      "stateChanges": {
        "kael": { "hp": -8 }
      }
    }
  ],
  "metadata": {
    "totalTurns": 15,
    "victory": true,
    "duration": 90000,
    "totalSummons": 1,
    "activeMinions": 1
  }
}
```

### Integración Programática

```typescript
// Ejemplo de uso programático
import { AutoRPGGame, GameOptions } from './src/main';

const options: GameOptions = {
  dataPath: './data',
  dungeonFile: 'dungeon_01.json',
  exportCombatData: true,
  logLevel: 'INFO'
};

const game = new AutoRPGGame(options);

async function runCustomAdventure() {
  await game.initialize();
  await game.runAdventure();

  // Obtener estadísticas incluyendo loot
  const stats = game.getGameStatistics();
  console.log('Adventure completed:', stats);

  // Procesar loot obtenido
  if (stats.loot) {
    displayLootSummary(stats.loot);
  }
}

// Función para mostrar resumen de loot
function displayLootSummary(loot: BattleLootSummary) {
  console.log(`Total Gold: ${loot.totalGold}`);
  console.log(`Total Experience: ${loot.totalExperience}`);

  loot.allItems.forEach(itemDrop => {
    console.log(`${itemDrop.item.name} x${itemDrop.quantity} (from ${itemDrop.source})`);
  });
}
```

---

## 🔍 Sistema de Condiciones

### Condiciones Básicas
- **`always`**: Siempre se cumple
- **`self.hp < 50%`**: HP propio por debajo del 50%
- **`ally.hp < 30%`**: HP de aliado por debajo del 30%
- **`enemy.isBoss`**: El enemigo es un jefe
- **`enemy.count > 2`**: Más de 2 enemigos
- **`self.mp > 70%`**: MP propio por encima del 70%

### Operadores Disponibles
- **`<`**, **`>`**: Menor/mayor que
- **`<=`**, **`>=`**: Menor/mayor o igual que
- **`==`**: Igual a
- **`!=`**: Diferente de
- **`%`**: Porcentaje (ej: `50%`)

### Ejemplos de Condiciones Complejas
```json
{
  "condition": "self.hp < 30% && ally.count < 2",
  "condition": "enemy.isBoss || enemy.hp > 80%",
  "condition": "self.mp > 50% && enemy.count == 1"
}
```

---

## 🎯 Sistema de Objetivos

### Objetivos Disponibles
- **`self`**: El propio personaje
- **`weakestEnemy`**: Enemigo con menos HP
- **`strongestEnemy`**: Enemigo con más HP
- **`lowestHpAlly`**: Aliado con menos HP
- **`randomEnemy`**: Enemigo aleatorio
- **`randomAlly`**: Aliado aleatorio
- **`bossEnemy`**: Enemigo marcado como jefe

### Ejemplos de Uso
```json
{
  "target": "lowestHpAlly",
  "action": "cast:greater_heal"
},
{
  "target": "strongestEnemy",
  "action": "cast:meteor"
}
```

---

## 🛠️ Solución de Problemas

### Errores Comunes

#### 1. "No party members found"
**Causa**: Archivo `party.json` vacío o malformado
**Solución**: Verificar que `party.json` contenga al menos un personaje válido

#### 2. "Job 'X' not found in jobs.json"
**Causa**: Personaje referencia una clase que no existe
**Solución**: Verificar que todas las clases en `party.json` existan en `jobs.json`

#### 3. "Skill 'X' not found"
**Causa**: Habilidad referenciada no existe en `skills.json`
**Solución**: Verificar que todas las `skillIds` en `jobs.json` existan en `skills.json`

#### 4. "Maximum turns exceeded"
**Causa**: Batalla se prolonga demasiado
**Solución**: Aumentar `maxTurns` o revisar reglas de personajes

#### 5. "Invalid JSON format"
**Causa**: Error de sintaxis en archivos JSON
**Solución**: Usar un validador JSON online o IDE con validación

### Problemas Específicos del Sistema de Summon

#### 6. "Minions no aparecen en combate"
**Causa**: Habilidad de summon mal configurada o falta implementación
**Solución**:
- Verificar que el skill tenga `"summon": "Skeleton"` y `"count": 1`
- Asegurar que el minion esté definido en `enemies.json`
- Revisar que `BattleSystem.ts` tenga `executeSummonSkill` implementado

#### 7. "Minions no tienen turno en combate"
**Causa**: Integración fallida con el sistema de turnos
**Solución**:
- Verificar que los minions se agreguen al array de participantes
- Asegurar que tengan estadística `spd` (speed) definida
- Revisar que `EntityFactory` cree correctamente las entidades de minions

#### 8. "Error de compilación con summon"
**Causa**: Tipos TypeScript no actualizados para propiedades de summon
**Solución**:
- Verificar que la interface `Ability` incluya propiedades `summon` y `count`
- Actualizar tipos en `types.ts` si es necesario
- Revisar imports en archivos relacionados

#### 9. "Minions no atacan"
**Causa**: Falta configuración de reglas o skills para minions
**Solución**:
- Asegurar que los minions tengan `basic_attack` en `skillIds`
- Verificar que tengan reglas de comportamiento en `enemies.json`
- Revisar que las reglas usen `randomEnemy` como target

#### 10. "Múltiples summons causan lag"
**Causa**: Demasiados minions activos simultáneamente
**Solución**:
- Implementar límite de minions por summoner (máximo 2-3)
- Agregar cooldown a habilidades de summon
- Considerar remover minions derrotados del array de participantes

### Debugging

#### Activar Logging Detallado
```bash
npm start -- --log-level DEBUG
```

#### Ver Información del Sistema
```bash
npm start -- --list
```

#### Modo Interactivo para Diagnóstico
```bash
npm start -- --interactive
```

---

## 📚 Mejores Prácticas

### Organización de Archivos
```
data/
├── parties/          # Grupos personalizados
│   ├── beginners.json
│   └── experts.json
├── dungeons/         # Mazmorras personalizadas
│   ├── tutorial.json
│   └── nightmare.json
├── jobs/            # Clases personalizadas
└── skills/          # Habilidades personalizadas
```

### Nomenclatura Consistente
- Usar IDs en minúsculas con guiones bajos: `power_strike`
- Nombres descriptivos pero concisos
- Prefijos para diferentes tipos: `skill_`, `job_`, `enemy_`

### Balance de Juego
- **HP/MP**: Ajustar según dificultad deseada
- **Daño**: Skills básicas 10-20, avanzadas 25-40, ultimate 50+
- **Costos**: MP apropiados para frecuencia de uso
- **Prioridades**: Reglas críticas > 80, normales 40-60, fallback 10
- **Summon Balance**: Minions con 30-50% del HP del summoner, cooldown 4-6 turnos

### Sistema de Summon
- **Minion Stats**: 30-60% de las estadísticas del summoner
- **Cooldown**: 4-6 turnos para habilidades de summon
- **Count**: Máximo 2-3 minions por summon para evitar overpower
- **MP Cost**: 15-25 MP para mantener el balance
- **AI Rules**: Mantener reglas simples para minions (solo ataque básico)

### Optimización de Rendimiento
- Limitar número de reglas por personaje (máximo 10)
- Usar condiciones específicas en lugar de `always`
- Evitar reglas contradictorias
- Mantener archivos JSON por debajo de 1MB

### Versionado y Backup
- Mantener backups de configuraciones funcionales
- Versionar archivos JSON junto con código
- Documentar cambios significativos
- Probar cambios en entornos separados

---

## 🎨 Ejemplos Avanzados

### Creando una Nueva Clase
```json
// jobs.json - Agregar nueva clase
{
  "name": "Paladin",
  "description": "Holy warrior with defensive and healing abilities",
  "baseStats": {
    "hp": 160,
    "mp": 40,
    "str": 16,
    "def": 18,
    "mag": 12,
    "spd": 9
  },
  "skillIds": [
    "basic_attack",
    "holy_strike",
    "divine_shield",
    "lay_on_hands"
  ]
}
```

### Sistema de Combos
```json
// skills.json - Habilidades que interactúan
{
  "id": "fireball",
  "name": "Fireball",
  "type": "attack",
  "effect": { "damage": 30 },
  "mpCost": 12,
  "combinesWith": ["wind_slash"],
  "comboResult": "inferno_blast"
},
{
  "id": "inferno_blast",
  "name": "Inferno Blast",
  "type": "attack",
  "effect": { "damage": 60 },
  "mpCost": 20,
  "description": "Powerful fire-wind combination attack"
}
```

### Mazmorra con Eventos Especiales
```json
// dungeon_custom.json
{
  "id": 99,
  "name": "Mystic Temple",
  "description": "Ancient temple with magical challenges",
  "defaultMaxTurns": 25,
  "battles": [
    {
      "id": 1,
      "order": 0,
      "enemies": [
        { "type": "Golem", "name": "Stone Guardian" }
      ],
      "events": [
        {
          "trigger": "enemy.hp < 50%",
          "type": "summon",
          "summonType": "SmallGolem",
          "count": 2
        }
      ]
    }
  ]
}
```

### Ejemplos Avanzados de Summon

#### Summoner con Múltiples Tipos de Minions
```json
// party.json - Personaje con diferentes summons
{
  "name": "ArchNecromancer",
  "job": "Necromancer",
  "level": 5,
  "rules": [
    {
      "priority": 90,
      "condition": "enemy.count > 2",
      "target": "self",
      "action": "cast:summon_skeleton_horde"
    },
    {
      "priority": 70,
      "condition": "self.hp < 40%",
      "target": "self",
      "action": "cast:summon_bone_golem"
    },
    {
      "priority": 50,
      "condition": "always",
      "target": "self",
      "action": "cast:summon_skeleton"
    }
  ]
}
```

#### Minion con Habilidades Avanzadas
```json
// enemies.json - Minion con múltiples habilidades
{
  "type": "BoneGolem",
  "job": "Guardian",
  "description": "Powerful undead construct with defensive capabilities",
  "baseStats": {
    "hp": 80,
    "mp": 0,
    "str": 15,
    "def": 20,
    "mag": 5,
    "spd": 6
  },
  "rules": [
    {
      "priority": 80,
      "condition": "summoner.hp < 50%",
      "target": "summoner",
      "action": "cast:protect_summoner"
    },
    {
      "priority": 60,
      "condition": "enemy.isBoss",
      "target": "bossEnemy",
      "action": "cast:bone_shield"
    },
    {
      "priority": 10,
      "condition": "always",
      "target": "randomEnemy",
      "action": "attack"
    }
  ],
  "skillIds": ["basic_attack", "bone_shield", "protect_summoner"]
}
```

#### Habilidad de Summon con Cooldown
```json
// skills.json - Summon con sistema de cooldown
{
  "id": "summon_skeleton_horde",
  "name": "Summon Skeleton Horde",
  "type": "buff",
  "effect": {
    "summon": "Skeleton",
    "count": 3
  },
  "mpCost": 35,
  "cooldown": 8,
  "description": "Summons three skeleton minions to overwhelm enemies"
}
```

#### Integración con Sistema de Loot
```javascript
// Configuración que recompensa summon exitoso
{
  "victoryCondition": "all_enemies_defeated",
  "lootTable": {
    "summon_bonus": {
      "condition": "minions_used > 0",
      "items": [
        { "type": "gold", "amount": 50 },
        { "type": "item", "id": "summon_scroll", "chance": 0.3 }
      ]
    }
  }
}
```

---

## 💰 Sistema de Loot - Integración Frontend

### Consumir Datos de Loot para UI

Cuando el sistema genera loot, puedes acceder a los datos para mostrarlos en tu interfaz:

```javascript
// Ejemplo de integración con React/Vue
async function loadLootData(battleId) {
  const response = await fetch(`./loot-data/battle_${battleId}_loot.json`);
  const lootData = await response.json();

  // Estructura del archivo de loot:
  // {
  //   "totalGold": 156,
  //   "totalExperience": 85,
  //   "allItems": [...],
  //   "lootByEnemy": [...]
  // }

  return lootData;
}

// Componente para mostrar loot
function LootDisplay({ loot }) {
  return (
    <div className="loot-summary">
      <h3>Recompensas Obtenidas</h3>
      <div className="gold-display">
        <span className="gold-icon">💰</span>
        <span className="gold-amount">{loot.totalGold} oro</span>
      </div>
      <div className="exp-display">
        <span className="exp-icon">⭐</span>
        <span className="exp-amount">{loot.totalExperience} EXP</span>
      </div>
      <div className="items-list">
        {loot.allItems.map((itemDrop, index) => (
          <div key={index} className={`item ${itemDrop.item.rarity}`}>
            <span className="item-name">{itemDrop.item.name}</span>
            <span className="item-quantity">x{itemDrop.quantity}</span>
            <span className="item-source">({itemDrop.source})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Sistema de Items en Frontend

```javascript
// Definir tipos de items para tu UI
const ITEM_TYPES = {
  consumable: { icon: '🧪', color: 'blue' },
  material: { icon: '🔧', color: 'gray' },
  weapon: { icon: '⚔️', color: 'red' },
  armor: { icon: '🛡️', color: 'green' }
};

const ITEM_RARITIES = {
  common: { color: '#8B8B8B', name: 'Común' },
  uncommon: { color: '#4CAF50', name: 'Poco Común' },
  rare: { color: '#2196F3', name: 'Raro' },
  epic: { color: '#9C27B0', name: 'Épico' }
};

// Función para renderizar item con estilo
function renderItem(item, quantity = 1) {
  const typeInfo = ITEM_TYPES[item.type];
  const rarityInfo = ITEM_RARITIES[item.rarity];

  return `
    <div class="item-card ${item.rarity}" style="border-color: ${rarityInfo.color}">
      <div class="item-header">
        <span class="item-icon">${typeInfo.icon}</span>
        <span className="item-name">${item.name}</span>
        ${quantity > 1 ? `<span className="item-quantity">x${quantity}</span>` : ''}
      </div>
      <div className="item-description">${item.description}</div>
      <div className="item-value">${item.value} oro</div>
      <div className="item-rarity">${rarityInfo.name}</div>
    </div>
  `;
}
```

### Inventario y Gestión de Items

```javascript
// Clase para manejar inventario del jugador
class PlayerInventory {
  constructor() {
    this.items = new Map();
    this.gold = 0;
    this.experience = 0;
  }

  // Agregar loot de una batalla
  addBattleLoot(lootSummary) {
    this.gold += lootSummary.totalGold;
    this.experience += lootSummary.totalExperience;

    lootSummary.allItems.forEach(itemDrop => {
      const existing = this.items.get(itemDrop.item.id) || { item: itemDrop.item, quantity: 0 };
      existing.quantity += itemDrop.quantity;
      this.items.set(itemDrop.item.id, existing);
    });

    this.saveToStorage();
  }

  // Usar un item consumible
  useItem(itemId) {
    const itemEntry = this.items.get(itemId);
    if (!itemEntry || itemEntry.quantity <= 0) return false;

    // Aplicar efecto del item
    this.applyItemEffect(itemEntry.item);

    itemEntry.quantity--;
    if (itemEntry.quantity <= 0) {
      this.items.delete(itemId);
    }

    this.saveToStorage();
    return true;
  }

  // Aplicar efecto de item
  applyItemEffect(item) {
    if (item.effect) {
      if (item.effect.heal) {
        player.hp = Math.min(player.maxHp, player.hp + item.effect.heal);
      }
      if (item.effect.mpRestore) {
        player.mp = Math.min(player.maxMp, player.mp + item.effect.mpRestore);
      }
      // Otros efectos...
    }
  }

  // Guardar en localStorage
  saveToStorage() {
    localStorage.setItem('playerInventory', JSON.stringify({
      items: Array.from(this.items.entries()),
      gold: this.gold,
      experience: this.experience
    }));
  }

  // Cargar desde localStorage
  loadFromStorage() {
    const saved = localStorage.getItem('playerInventory');
    if (saved) {
      const data = JSON.parse(saved);
      this.items = new Map(data.items);
      this.gold = data.gold;
      this.experience = data.experience;
    }
  }
}
```

---

## 📞 Soporte y Contribución

### Reportar Problemas
1. Verificar que el problema no esté documentado en esta guía
2. Reproducir el problema con configuración mínima
3. Incluir archivos JSON relevantes
4. Describir pasos para reproducir

### Contribuir
1. Fork el repositorio
2. Crear rama para nueva funcionalidad
3. Seguir convenciones de código existentes
4. Agregar tests para nuevas funcionalidades
5. Actualizar documentación

### Recursos Adicionales
- [Documentación TypeScript](https://www.typescriptlang.org/docs/)
- [JSON Schema Validation](https://json-schema.org/)
- [Game Design Patterns](https://gameprogrammingpatterns.com/)

---

*Esta guía se mantiene actualizada con las últimas funcionalidades del sistema. Para la versión más reciente, consulta el repositorio oficial.*

*Última actualización: 16 de septiembre de 2025*