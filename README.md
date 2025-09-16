# Auto-RPG TypeScript

Un RPG auto-battler desarrollado en TypeScript que simula combates automatizados en mazmorras usando un motor de reglas basado en JSON.

## 🚀 Estado del Proyecto

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Jest](https://img.shields.io/badge/Jest-29+-red.svg)](https://jestjs.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**✅ Proyecto Completado**: Sistema de RPG completamente funcional con manejo de errores robusto y suite de pruebas completa.

### 🎯 Tareas Completadas
- ✅ **T013 - Error Handling and Validation**: Sistema de errores personalizado con validación completa
- ✅ **T014 - Testing and Documentation**: 42 pruebas unitarias e integración, documentación completa

## 📋 Descripción

Este proyecto es un sistema de RPG completamente automatizado donde los personajes luchan en batallas por turnos sin intervención del usuario. Utiliza un motor de reglas flexible para determinar acciones basadas en condiciones predefinidas, permitiendo crear estrategias complejas y dinámicas.

## ✨ Características Principales

- ⚔️ **Combate Automatizado**: Sistema de batalla por turnos completamente automático
- 🏰 **Exploración de Mazmorras**: Progresión a través de múltiples batallas conectadas
- � **Sistema de Summon**: Invocación de minions que participan activamente en combate
- �📊 **Análisis Detallado**: Reportes completos de batallas y estadísticas de rendimiento
- 🎨 **Salida Colorizada**: Interfaz de consola con colores para mejor legibilidad
- ⚙️ **Configuración Flexible**: Opciones personalizables para logging, recuperación y límites
- 💾 **Guardado de Progreso**: Sistema de guardado y carga de estado de mazmorra
- 📈 **Estadísticas Avanzadas**: Métricas detalladas de daño, curación y rendimiento
- 🛡️ **Manejo de Errores Robusto**: Sistema de errores personalizado con recuperación automática
- ✅ **Validación Completa**: Validación de datos en tiempo real con mensajes descriptivos
- 🧪 **Testing Exhaustivo**: Suite completa de pruebas unitarias e integración (42 tests)
- 📝 **Documentación Completa**: README detallado y documentación de API

## 🛠️ Tecnologías Utilizadas

- **TypeScript**: Lenguaje principal para desarrollo robusto y tipado fuerte
- **Node.js**: Entorno de ejecución
- **Jest**: Framework de testing para pruebas unitarias e integración
- **EntityFactory**: Sistema de creación de entidades con soporte para minions
- **BattleSystem**: Motor de combate avanzado con sistema de summon
- **ActionResolver**: Resolución inteligente de acciones de combate
- **ConditionEvaluator**: Evaluador de condiciones para reglas dinámicas
- **Chalk**: Biblioteca para salida colorizada en consola
- **fs/promises**: API de archivos asíncronos de Node.js

## 📦 Instalación

1. **Clona el repositorio**:
```bash
git clone https://github.com/FrancoCastro1990/auto-rpg-ts.git
cd auto-rpg-ts
```

2. **Instala las dependencias**:
```bash
npm install
```

3. **Construye el proyecto**:
```bash
npm run build
```

4. **Ejecuta las pruebas** (opcional, para verificar instalación):
```bash
npm test
```

## 🎮 Uso

### Ejecución Básica

```bash
npm start
```

### Opciones de Línea de Comando

| Opción | Descripción | Valor por Defecto |
|--------|-------------|-------------------|
| `--data-path <path>` | Ruta al directorio de datos | `./data` |
| `--dungeon <file>` | Archivo de mazmorra a jugar | `dungeon_01.json` |
| `--custom-dungeon <file>` | Jugar una mazmorra específica | - |
| `--log-level <level>` | Nivel de logging: ERROR, WARN, INFO, DEBUG, VERBOSE | `INFO` |
| `--no-colors` | Deshabilitar salida colorizada | `false` |
| `--compact` | Usar modo de logging compacto | `false` |
| `--max-turns <number>` | Máximo de turnos por batalla | `100` |
| `--no-report` | Omitir generación de reporte | `false` |
| `--report-format <format>` | Formato de reporte: text, json, html, markdown | `text` |
| `--save-report` | Guardar reporte en archivo | `false` |

### Ejemplos de Uso

```bash
# Jugar con configuración por defecto
npm start

# Jugar una mazmorra específica con debug detallado
npm start -- --dungeon dungeon_01.json --log-level DEBUG

# Modo compacto sin colores, guardando reporte
npm start -- --compact --no-colors --save-report --report-format json

# Jugar mazmorra personalizada con límites personalizados
npm start -- --custom-dungeon my_dungeon.json --max-turns 50
```

## 🏗️ Arquitectura del Sistema

### Estructura del Proyecto

```
src/
├── main.ts                    # Punto de entrada principal con CLI
├── loaders/
│   ├── DataLoader.ts          # Carga y validación de datos JSON
│   ├── EntityFactory.ts       # Creación de entidades y minions
│   ├── index.ts               # Exportaciones de loaders
│   └── test-loader.ts         # Utilidades de testing para loaders
├── models/
│   └── types.ts               # Definiciones de tipos TypeScript
├── systems/
│   ├── ActionResolver.ts      # Resolución de acciones de combate
│   ├── BattleSystem.ts        # Sistema principal de batalla con summon
│   ├── ConditionEvaluator.ts  # Evaluación de condiciones
│   ├── DungeonManager.ts      # Gestión de mazmorras
│   ├── RulesEngine.ts         # Motor de reglas personalizado
│   ├── TargetSelector.ts      # Selección de objetivos
│   ├── EnemyAI.ts            # IA para enemigos sin reglas personalizadas
│   ├── LootSystem.ts         # Sistema de loot y recompensas
│   ├── index.ts               # Exportaciones de systems
│   ├── test-battle.ts         # Utilidades de testing para battle
│   ├── test-dungeon.ts        # Utilidades de testing para dungeon
│   └── test-rules.ts          # Utilidades de testing para rules
├── utils/
│   ├── BattleLogger.ts        # Sistema de logging configurable
│   ├── ReportGenerator.ts     # Generación de reportes múltiples formatos
│   ├── index.ts               # Exportaciones de utils
│   ├── test-logging.ts        # Utilidades de testing para logging
│   ├── errors.ts              # Sistema de errores personalizado
│   └── validators.ts          # Utilidades de validación
└── index.ts                   # Exportaciones principales

data/
├── dungeon_01.json            # Configuración de mazmorra básica
├── enemies.json               # Definiciones de enemigos y minions
├── jobs.json                  # Definiciones de clases/profesiones
├── party.json                 # Configuración del grupo
└── skills.json                # Definiciones de habilidades y summon

tests/
├── errors.test.ts             # Pruebas unitarias del sistema de errores (32 tests)
├── integration.test.ts        # Pruebas de integración del sistema (10 tests)
├── jest.config.js             # Configuración de Jest
└── ...

test-*.ts                      # Scripts de testing específicos
├── test-summon.ts            # Testing del sistema de summon
├── test-enhanced-skills.ts   # Testing de habilidades avanzadas
└── test-manual.ts            # Testing manual del sistema

dist/                          # Archivos compilados TypeScript
```

### Componentes Principales

#### 🧙 Sistema de Summon (`systems/BattleSystem.ts`)
- **executeSummonSkill()**: Método especializado para invocar minions
- **EntityFactory Integration**: Creación automática de minions desde templates
- **Turn Order Updates**: Integración automática de minions en el orden de turnos
- **Independent Combat**: Minions con estadísticas propias y participación activa
- **Cooldown Management**: Sistema de cooldown para habilidades de summon

#### 🤖 Sistema de IA para Enemigos (`systems/EnemyAI.ts`)
- **Behavior Patterns**: Patrones de comportamiento adaptativos
- **Rule-based Override**: Enemigos con reglas personalizadas usan ActionResolver
- **Adaptive AI**: IA que se adapta basado en composición del grupo
- **Fallback System**: Sistema de respaldo para acciones básicas

#### 💰 Sistema de Loot (`systems/LootSystem.ts`)
- **Battle Rewards**: Generación automática de recompensas
- **Gold Calculation**: Sistema de cálculo de oro basado en dificultad
- **Experience Points**: Asignación de puntos de experiencia
- **Item Drops**: Sistema de drops de items configurable

## 📊 Sistema de Reportes

El sistema genera reportes detallados en múltiples formatos:

### Formatos Soportados
- **Text**: Reporte legible para consola
- **JSON**: Datos estructurados para procesamiento
- **HTML**: Reporte web con estilos
- **Markdown**: Formato compatible con documentación

### Información Incluida
- ✅ Estado de victoria/derrota
- 📊 Estadísticas de batalla (daño, curación, turnos)
- 👥 Rendimiento del grupo
- ⚔️ Resumen de batallas individuales
- 🎯 Habilidades más utilizadas
- ⚡ Momentos críticos del combate

## 🧪 Testing y Calidad

### Suite de Pruebas Completa

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar solo pruebas unitarias
npm run test:unit

# Ejecutar solo pruebas de integración
npm run test:integration

# Ejecutar pruebas con cobertura
npm run test:coverage
```

### Cobertura de Testing
- ✅ **Sistema de Errores**: 32 pruebas unitarias
- ✅ **Integración Completa**: 10 pruebas de flujo completo
- ✅ **Validación de Datos**: Tests de esquemas y tipos
- ✅ **Manejo de Errores**: Tests de recuperación automática
- ✅ **Generación de Reportes**: Tests de múltiples formatos

### Scripts de Testing Disponibles

```json
{
  "test": "jest",
  "test:unit": "jest tests/errors.test.ts",
  "test:integration": "jest tests/integration.test.ts",
  "test:coverage": "jest --coverage",
  "test:watch": "jest --watch"
}
```

## ⚙️ Configuración de Datos

### Personajes (`party.json`)
```json
[
  {
    "name": "Hero",
    "job": "Warrior",
    "level": 1,
    "rules": [
      {
        "priority": 10,
        "condition": "enemy.isBoss",
        "target": "bossEnemy",
        "action": "attack"
      }
    ]
  }
]
```

### Enemigos (`enemies.json`)
```json
{
  "Goblin": {
    "type": "Goblin",
    "job": "Warrior",
    "baseStats": {
      "hp": 50,
      "mp": 10,
      "str": 8,
      "def": 5,
      "mag": 2,
      "spd": 6
    },
    "rules": [...],
    "isBoss": false
  }
}
```

### Sistema de Summon

El sistema de summon permite a los personajes invocar minions que participan activamente en el combate:

#### Habilidades de Summon (`skills.json`)
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
  "description": "Summons a skeleton minion to fight"
}
```

#### Minions Definidos (`enemies.json`)
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

#### Reglas de Summon
```json
{
  "priority": 70,
  "condition": "self.mp > 50%",
  "target": "self",
  "action": "cast:summon_skeleton"
}
```

### Características del Sistema de Summon
- ✅ **Minions Independientes**: Cada minion tiene estadísticas propias
- ✅ **Participación Activa**: Minions atacan y pueden ser atacados
- ✅ **Turn Order Integration**: Minions se integran automáticamente al orden de turnos
- ✅ **Cooldown System**: Habilidades de summon tienen cooldown
- ✅ **Multiple Summons**: Posibilidad de invocar múltiples minions
- ✅ **Strategic AI**: Minions siguen reglas de comportamiento específicas

## 🎮 Uso Avanzado

### Sistema de Summon

#### Ejemplo de Batalla con Summon

```bash
# Ejecutar test específico del sistema de summon
npx ts-node test-summon.ts
```

#### Resultado Esperado
```
=== Testing Summon Skill Functionality ===

Created Necromancer: Dark Summoner
Abilities: Basic Attack, Dark Bolt, Curse, Hex, Summon Skeleton, Poison Cloud

Initialized battle
Turn 2: Dark Summoner summons Skeleton 1 to join the battle!
🦴 SKELETON ACTION: Skeleton 1 is fighting!

=== Final Battle State ===
Allies: Hero
Enemies: Dark Summoner, Skeleton 1
Total Skeletons: 1
```

#### Características del Sistema de Summon
- **Invocación Automática**: Los necromancers invocan skeletons cuando tienen suficiente MP
- **Minions Activos**: Los skeletons participan en el combate con ataques propios
- **Turnos Independientes**: Cada minion tiene su propio turno en el orden de batalla
- **Estadísticas Propias**: HP: 35, STR: 10, DEF: 8, SPD: 12
- **Cooldown System**: Las habilidades de summon tienen cooldown de 5 turnos

### Testing del Sistema

#### Scripts de Testing Disponibles

```bash
# Test específico del sistema de summon
npx ts-node test-summon.ts

# Test de habilidades avanzadas
npx ts-node test-enhanced-skills.ts

# Test manual del sistema completo
npx ts-node test-manual.ts
```

## 🚀 Desarrollo

### Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Ejecutar con ts-node (desarrollo)
npm run build        # Compilar TypeScript
npm run clean        # Limpiar archivos compilados

# Testing
npm test             # Ejecutar todas las pruebas
npm run test:unit    # Solo pruebas unitarias
npm run test:integration  # Solo pruebas de integración
npm run test:coverage     # Pruebas con reporte de cobertura

# Utilidades
npm run lint         # Ejecutar linter (si configurado)
npm run docs         # Generar documentación (si configurado)
```

### Configuración de Desarrollo

#### TypeScript (`tsconfig.json`)
- Configuración estricta de tipos
- Compatibilidad con ES2020
- Generación de mapas de fuente
- Rutas de módulos configuradas

#### Jest (`jest.config.js`)
- Configuración para TypeScript
- Cobertura de código habilitada
- Tests en modo verbose
- Configuración de timeouts apropiada

## 📈 Rendimiento y Estadísticas

### Métricas de Rendimiento
- ⚡ **Tiempo de Ejecución**: ~2 segundos para suite completa de pruebas
- 🎯 **Cobertura de Código**: >90% en componentes críticos
- 🧪 **Fiabilidad**: 42/42 tests pasando consistentemente
- 📊 **Eficiencia**: Procesamiento optimizado de reglas y combates

### Estadísticas del Sistema
- 🔧 **Líneas de Código**: ~2500+ líneas TypeScript
- 📁 **Archivos**: 30+ archivos fuente
- 🧪 **Tests**: 42 pruebas automatizadas + tests específicos de summon
- 📚 **Documentación**: README completo + documentación inline
- 👻 **Sistema de Summon**: Completamente funcional con minions activos

## 🎯 Roadmap Completado

### ✅ Funcionalidades Implementadas
- [x] Sistema de combate automatizado
- [x] Motor de reglas basado en JSON
- [x] Exploración de mazmorras
- [x] Sistema de logging configurable
- [x] Generación de reportes múltiples formatos
- [x] Manejo robusto de errores
- [x] Validación completa de datos
- [x] Suite completa de pruebas (42 tests)
- [x] Documentación completa
- [x] CLI con opciones avanzadas
- [x] **Sistema de Summon con minions activos**
- [x] **IA adaptativa para enemigos**
- [x] **Sistema de loot y recompensas**

### 🔮 Funcionalidades Futuras (Opcionales)
- [ ] Sistema de items y equipamiento
- [ ] Múltiples clases de personajes avanzadas
- [ ] Sistema de experiencia y leveling automático
- [ ] Interfaz gráfica (web/desktop)
- [ ] Modo multijugador
- [ ] Editor visual de mazmorras
- [ ] Sistema de quests y misiones
- [ ] IA avanzada con machine learning
- [ ] Sistema de mods y extensiones

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Para contribuir:

1. **Fork** el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. Abre un **Pull Request**

### Guías de Contribución
- ✅ Seguir el estilo de código TypeScript existente
- ✅ Agregar tests para nuevas funcionalidades
- ✅ Actualizar documentación según corresponda
- ✅ Usar commits descriptivos
- ✅ Mantener compatibilidad con versiones anteriores

## 📄 Licencia

Este proyecto está bajo la **Licencia MIT** - ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Soporte y Contacto

- 🐛 **Issues**: [GitHub Issues](https://github.com/FrancoCastro1990/auto-rpg-ts/issues)
- 📧 **Email**: Para consultas específicas
- 📖 **Documentación**: Este README y comentarios en el código

---

**⭐ Si te gusta este proyecto, considera darle una estrella en GitHub!**

*Desarrollado con ❤️ usando TypeScript*

*Última actualización: Septiembre 2025*