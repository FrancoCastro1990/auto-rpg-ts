# Frontend Integration Guide - Auto-RPG Game

## 📖 Introducción

Esta guía proporciona una documentación completa para desarrolladores frontend que desean integrar o extender el **Auto-RPG Game**, un sistema de combate automático por turnos desarrollado en TypeScript. El sistema permite crear aventuras automatizadas con personajes configurables, reglas de combate personalizables y exportación de datos para animaciones.

### 🎯 Propósito
Esta guía te ayudará a:
- Configurar y ejecutar el sistema RPG
- Entender y modificar los archivos JSON de configuración
- Integrar el sistema en aplicaciones frontend
- Crear contenido personalizado (personajes, habilidades, mazmorras)
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
│   ├── enemies.json        # Enemigos disponibles
│   ├── skills.json         # Habilidades y ataques
│   └── dungeon_01.json     # Primera mazmorra
├── src/                    # Código fuente TypeScript
├── combat-animations/      # Datos exportados para animaciones
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

#### Ejemplo Completo
```json
[
  {
    "type": "ShadowLord",
    "job": "DemonKing",
    "description": "Powerful boss demon with devastating abilities",
    "isBoss": true,
    "baseStats": {
      "hp": 200,
      "mp": 80,
      "str": 20,
      "def": 18,
      "mag": 22,
      "spd": 14
    },
    "rules": [
      {
        "priority": 100,
        "condition": "ally.hp < 50%",
        "target": "self",
        "action": "cast:shadow_regeneration"
      }
    ],
    "skillIds": [
      "basic_attack",
      "shadow_strike",
      "soul_crusher"
    ]
  }
]
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

Cuando usas `--export-combat-data`, el sistema genera archivos JSON con datos detallados de cada batalla:

```javascript
// Ejemplo de integración con JavaScript
async function loadCombatData(battleId) {
  const response = await fetch(`./combat-animations/battle_${battleId}.json`);
  const combatData = await response.json();

  // Estructura del archivo generado:
  // {
  //   "battleId": 1,
  //   "participants": [...],
  //   "turns": [...],
  //   "metadata": {...}
  // }

  return combatData;
}

// Usar los datos para animar
function animateBattle(combatData) {
  combatData.turns.forEach((turn, index) => {
    setTimeout(() => {
      animateTurn(turn);
    }, index * 1000); // 1 segundo por turno
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
        "target": "slime_1",
        "damage": 25,
        "effects": []
      },
      "stateChanges": {
        "slime_1": { "hp": -25 }
      }
    }
  ],
  "metadata": {
    "totalTurns": 15,
    "victory": true,
    "duration": 90000
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

  // Obtener estadísticas
  const stats = game.getGameStatistics();
  console.log('Adventure completed:', stats);
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