# RPG Auto-Battler REST API

Una API REST moderna para un RPG auto-battler construida con **Clean Architecture**, **TypeScript**, **Express.js**, **MongoDB** y **Docker**. Transforma el sistema de combate automatizado original en una API escalable y mantenible.

## 🚀 Características Principales

- **🏗️ Clean Architecture**: Separación clara de responsabilidades con capas bien definidas
- **🔧 TypeScript**: Tipado fuerte y desarrollo moderno
- **🌐 REST API**: Endpoints bien diseñados siguiendo mejores prácticas
- **💾 MongoDB**: Base de datos NoSQL con Mongoose ODM
- **🐳 Docker**: Contenedorización completa para desarrollo y despliegue
- **✅ Zod**: Validación robusta de esquemas para requests y responses
- **🎯 Combate Automatizado**: Sistema de batalla por turnos con reglas configurables
- **🏰 Gestión de Dungeons**: Exploración de mazmorras con múltiples batallas
- **👥 Gestión de Party**: Sistema completo de personajes y grupos

## 📁 Estructura del Proyecto

```
auto-rpg-ts/
├── src/
│   ├── entities/              # 📋 Reglas de negocio puras
│   ├── use-cases/            # 🎯 Casos de uso y lógica de negocio
│   ├── controllers/          # 🌐 Controladores HTTP y DTOs
│   ├── repositories/         # 💾 Interfaces y implementaciones de datos
│   ├── infrastructure/       # 🔧 Configuración externa (DB, middlewares)
│   └── index.ts              # Punto de entrada de la aplicación
├── data/                     # 📄 Archivos JSON originales (legacy)
├── tests/                    # 🧪 Tests unitarios e integración
├── docker-compose.yml        # 🐳 Configuración de Docker
├── CLEAN_ARCHITECTURE.md     # 📚 Documentación de arquitectura
├── PLAN.md                   # 📋 Plan de desarrollo detallado
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ Tecnologías Utilizadas

### Backend
- **Express.js**: Framework web rápido y minimalista
- **TypeScript**: JavaScript con tipado fuerte
- **MongoDB**: Base de datos NoSQL
- **Mongoose**: ODM para MongoDB con validaciones

### Validación y Seguridad
- **Zod**: Validación de esquemas TypeScript-first
- **Helmet**: Headers de seguridad HTTP
- **CORS**: Configuración de Cross-Origin Resource Sharing

### Desarrollo
- **Docker**: Contenedorización completa
- **Docker Compose**: Orquestación de servicios
- **Nodemon**: Recarga automática en desarrollo

## 🚀 Inicio Rápido

### Prerrequisitos
- Docker y Docker Compose instalados
- Node.js 18+ (para desarrollo local)
- npm o yarn

### Instalación y Ejecución

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd auto-rpg-ts
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Iniciar servicios con Docker**
   ```bash
   docker-compose up -d
   ```

4. **Ejecutar la aplicación**
   ```bash
   # Desarrollo con recarga automática
   npm run dev

   # Producción
   npm run build
   npm start
   ```

5. **Verificar funcionamiento**
   ```bash
   curl http://localhost:3000/health
   ```

## 📡 API Endpoints

### Health Check
- `GET /health` - Verificar estado del servicio

### Characters (Personajes)
- `POST /api/v1/characters` - Crear personaje
- `GET /api/v1/characters` - Listar personajes
- `GET /api/v1/characters/:id` - Obtener personaje específico
- `PUT /api/v1/characters/:id` - Actualizar personaje
- `DELETE /api/v1/characters/:id` - Eliminar personaje

### Parties (Grupos)
- `POST /api/v1/parties` - Crear grupo
- `GET /api/v1/parties` - Listar grupos
- `GET /api/v1/parties/:id` - Obtener grupo específico
- `PUT /api/v1/parties/:id` - Actualizar grupo
- `POST /api/v1/parties/:id/members` - Agregar miembro al grupo

### Dungeons (Mazmorras)
- `POST /api/v1/dungeons` - Crear mazmorra
- `GET /api/v1/dungeons` - Listar mazmorras
- `GET /api/v1/dungeons/:id` - Obtener mazmorra específica
- `POST /api/v1/dungeons/:id/execute` - Ejecutar exploración de mazmorra

### Battles (Batallas)
- `POST /api/v1/battles` - Ejecutar batalla
- `GET /api/v1/battles/:id` - Obtener resultado de batalla
- `GET /api/v1/battles` - Listar batallas recientes

## 📋 Ejemplos de Uso

### Crear un Personaje
```bash
curl -X POST http://localhost:3000/api/v1/characters \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aragorn",
    "job": "warrior",
    "level": 1
  }'
```

### Ejecutar una Batalla
```bash
curl -X POST http://localhost:3000/api/v1/battles \
  -H "Content-Type: application/json" \
  -d '{
    "partyId": "party-123",
    "enemyIds": ["enemy-456", "enemy-789"]
  }'
```

### Explorar una Mazmorra
```bash
curl -X POST http://localhost:3000/api/v1/dungeons/dungeon-001/execute \
  -H "Content-Type: application/json" \
  -d '{
    "partyId": "party-123"
  }'
```

## 🏗️ Arquitectura

Este proyecto sigue los principios de **Clean Architecture**:

1. **Entities**: Reglas de negocio puras e independientes
2. **Use Cases**: Lógica de aplicación y casos de uso
3. **Controllers**: Capa de presentación y adaptadores web
4. **Repositories**: Abstracción de acceso a datos
5. **Infrastructure**: Detalles de implementación externos

Para más detalles, consulta [`CLEAN_ARCHITECTURE.md`](./CLEAN_ARCHITECTURE.md).

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Tests con cobertura
npm run test:coverage

# Tests de integración
npm run test:integration
```

## 🌱 Database Seeding

El proyecto incluye scripts para poblar la base de datos MongoDB con los datos originales:

```bash
# Seeding completo (todas las colecciones)
npm run seed

# Seeding individual por colección
npm run seed:jobs      # Migrar jobs.json (5 registros)
npm run seed:skills    # Migrar skills.json (59 registros)
npm run seed:enemies   # Migrar enemies.json (14 registros)
npm run seed:dungeons  # Migrar dungeon_01.json (1 registro)

# Limpiar todas las colecciones
npm run seed:clear
```

### Datos Migrados
- **Jobs**: 5 clases de personaje (Warrior, WhiteMage, BlackMage, Rogue, Ranger)
- **Skills**: 59 habilidades con efectos complejos (ataques, heals, buffs, debuffs)
- **Enemies**: 14 tipos de enemigos con reglas de IA personalizadas
- **Dungeons**: 1 mazmorra completa con 7 batallas progresivas

## 📚 Documentación Adicional

- **[CLEAN_ARCHITECTURE.md](./CLEAN_ARCHITECTURE.md)**: Documentación detallada de la arquitectura
- **[PLAN.md](./PLAN.md)**: Plan de desarrollo completo con tareas pendientes
- **API Documentation**: Próximamente con Swagger/OpenAPI

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- Inspirado en sistemas de RPG clásicos
- Arquitectura basada en "Clean Architecture" de Robert C. Martin
- Comunidad de TypeScript y Node.js

---

**Estado del Proyecto**: 🏗️ En Desarrollo Activo

- ✅ Express.js base setup
- ✅ Clean Architecture structure
- ✅ Docker Compose con MongoDB
- ✅ Legacy Logic Migration & Data Seeding
- 🔄 Implementando modelos de dominio
- 🔄 Desarrollo de endpoints REST
- 🔄 Sistema de validación con Zod

### Cálculo de Experiencia

```typescript
// Experiencia por completar dungeon
experience = baseExperience * difficultyMultiplier * levelBonus

// Subida de nivel cuando se alcanza el umbral
levelUpThreshold = currentLevel * 1000 + (currentLevel - 1) * 500
```

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Tests con cobertura
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

### Estructura de Tests

```
tests/
├── unit/                 # Tests unitarios
│   ├── entities/
│   ├── use-cases/
│   └── repositories/
├── integration/         # Tests de integración
│   ├── api/
│   └── database/
└── e2e/                 # Tests end-to-end
```

## 📚 Documentación API

### Swagger/OpenAPI

La documentación completa estará disponible en:
```
GET /api-docs
```

### Ejemplo de Response

```json
{
  "success": true,
  "data": {
    "party": {
      "id": "party_123",
      "playerId": "player_456",
      "characters": [...],
      "createdAt": "2025-09-16T10:00:00Z"
    }
  },
  "timestamp": "2025-09-16T10:00:00Z"
}
```

## 🚀 Desarrollo

### Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor con hot-reload
npm run build        # Compilar TypeScript
npm start           # Servidor de producción

# Testing
npm test            # Ejecutar tests
npm run test:coverage # Tests con cobertura

# Calidad
npm run lint        # Ejecutar linter
npm run lint:fix    # Corregir problemas de linting

# Docker
npm run docker:up   # Iniciar MongoDB
npm run docker:down # Detener MongoDB
```

### Configuración de Desarrollo

#### TypeScript (tsconfig.json)
- ✅ Configuración estricta de tipos
- ✅ Decoradores experimentales
- ✅ Generación de mapas de fuente
- ✅ Rutas de módulos configuradas

#### ESLint (Próximamente)
- ✅ Reglas de TypeScript
- ✅ Reglas de Node.js
- ✅ Formato consistente

## 🎯 Roadmap de Desarrollo

### ✅ Fase 1: Configuración Base (Completada)
- [x] R001 - Configurar Proyecto Base con Express.js
- [x] R002 - Implementar Clean Architecture Structure
- [x] R003 - Configurar MongoDB y Modelos
- [x] R004 - Crear Docker Compose para MongoDB

### 🔄 Fase 2: Modelos de Dominio (En Progreso)
- [ ] R005 - Implementar Modelos de Dominio
- [ ] R006 - Crear Repositorios de Datos

### 🎯 Fase 3: Casos de Uso
- [ ] R007 - Implementar Casos de Uso Party CRUD
- [ ] R008 - Implementar Casos de Uso Dungeon CRUD
- [ ] R009 - Implementar Caso de Uso GenerateCombat

### 📈 Fase 4: Sistema de Progresión
- [ ] R010 - Sistema de Experiencia y Niveles
- [ ] R011 - Restricciones por Nivel

### 🌐 Fase 5: API REST
- [ ] R012 - Controladores REST Party
- [ ] R013 - Controladores REST Dungeon
- [ ] R014 - Controlador GenerateCombat
- [ ] R015 - Configurar Rutas Express

### 🛡️ Fase 6: Calidad y Seguridad
- [ ] R016 - Middleware de Validación y Errores
- [ ] R017 - Sistema de Autenticación

### 🔄 Fase 7: Migración y Testing
- [ ] R018 - Migrar Lógica de Combate
- [ ] R019 - Tests Unitarios
- [ ] R020 - Tests de Integración

### 📚 Fase 8: Documentación y Despliegue
- [ ] R021 - Documentación API
- [ ] R022 - Scripts de Despliegue

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Para contribuir:

1. **Fork** el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. Abre un **Pull Request**

### Guías de Contribución
- ✅ Seguir la estructura de Clean Architecture
- ✅ Agregar tests para nuevas funcionalidades
- ✅ Actualizar documentación según corresponda
- ✅ Usar commits descriptivos
- ✅ Mantener compatibilidad con versiones anteriores

## 📄 Licencia

Este proyecto está bajo la **Licencia MIT** - ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Soporte y Contacto

- 🐛 **Issues**: [GitHub Issues](https://github.com/FrancoCastro1990/auto-rpg-ts/issues)
- 📧 **Email**: Para consultas específicas
- 📖 **Documentación**: Este README y PLAN_V3.md

---

**⭐ Si te gusta este proyecto, considera darle una estrella en GitHub!**

*Desarrollado con ❤️ usando TypeScript y Clean Architecture*

*Última actualización: 16 de septiembre de 2025*

## 🚀 Estado del Proyecto

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Nod#### Características del Sistema de Summon
- ✅ **Minions Independientes**: Cada minion tiene estadísticas propias
- ✅ **Participación Activa**: Minions atacan y pueden ser atacados
- ✅ **Turn Order Integration**: Minions se integran automáticamente al orden de turnos
- ✅ **Cooldown System**: Habilidades tienen cooldown
- ✅ **Multiple Summons**: Posibilidad de invocar múltiples minions
- ✅ **Strategic AI**: Minions siguen reglas de comportamiento específicas

## 💰 Sistema de Loot Detallado

### Tipos de Items Disponibles

#### 🧪 Consumibles
- **Health Potion**: Restaura 50 HP (Valor: 50 oro)
- **Mana Potion**: Restaura 30 MP (Valor: 40 oro)
- **Greater Health Potion**: Restaura 120 HP (Valor: 120 oro, Uncommon)

#### 🔧 Materiales
- **Slime Gel**: Sustancia gelatinosa de slimes (Valor: 10 oro)
- **Goblin Tooth**: Diente afilado de goblin (Valor: 15 oro)
- **Orc Tusk**: Colmillo grande de orc (Valor: 35 oro, Uncommon)
- **Dark Crystal**: Cristal infundido con magia oscura (Valor: 100 oro, Rare)
- **Dragon Scale**: Escama de dragón (Valor: 250 oro, Epic)

#### ⚔️ Armas y Armaduras
- **Rusty Sword**: Espada oxidada (+2 STR, Valor: 75 oro)
- **Bone Staff**: Bastón de huesos (+3 MAG, Valor: 150 oro, Uncommon)
- **Leather Armor**: Armadura de cuero (+3 DEF, Valor: 80 oro)
- **Chain Mail**: Cota de malla pesada (+5 DEF, Valor: 200 oro, Uncommon)

### Tablas de Loot por Enemigo

#### 🟢 Enemigos Comunes
- **Slime**: 5-15 oro, 10 EXP, Slime Gel (80%), Health Potion (30%)
- **Goblin**: 8-20 oro, 15 EXP, Goblin Tooth (60%), Rusty Sword (20%)
- **Orc**: 15-35 oro, 25 EXP, Orc Tusk (50%), Chain Mail (10%)

#### 🟡 Enemigos Avanzados
- **DarkMage**: 20-45 oro, 30 EXP, Dark Crystal (40%), Bone Staff (15%)
- **Troll**: 12-28 oro, 20 EXP, Greater Health Potion (30%), Leather Armor (25%)
- **FireElemental**: 18-40 oro, 28 EXP, Mana Potions (50%)
- **IceGolem**: 16-35 oro, 22 EXP, Chain Mail (30%)
- **Wraith**: 22-48 oro, 32 EXP, Dark Crystal (30%)
- **Minotaur**: 20-42 oro, 35 EXP, Orc Tusk (70%), Chain Mail (20%)
- **Necromancer**: 30-65 oro, 45 EXP, Dark Crystal (60%), Bone Staff (40%)
- **DragonWhelp**: 25-55 oro, 40 EXP, Dragon Scale (50%)

#### 🟣 Jefes (Bosses)
- **ShadowLord**: 100-200 oro, 100 EXP, **Dark Crystal garantizado (2-3)**, Bone Staff (40%)

### Sistema de Rareza
- **Common**: Items básicos, alta probabilidad de drop
- **Uncommon**: Items mejores, probabilidad media
- **Rare**: Items valiosos, baja probabilidad
- **Epic**: Items legendarios, muy rara probabilidad

### Generación de Loot en Batalla

```javascript
// Ejemplo de loot generado para un Goblin derrotado
{
  "gold": 14,
  "experience": 15,
  "items": [
    {
      "item": {
        "id": "goblin_tooth",
        "name": "Goblin Tooth",
        "type": "material",
        "rarity": "common",
        "value": 15,
        "description": "Sharp tooth from a goblin"
      },
      "quantity": 2
    }
  ],
  "source": "Goblin Warrior"
}
```

### Estadísticas de Batalla con Loot

```javascript
// Resumen completo de loot por batalla
{
  "totalGold": 156,
  "totalExperience": 85,
  "allItems": [
    {
      "item": { "name": "Goblin Tooth", "rarity": "common" },
      "quantity": 3,
      "source": "Goblin Warrior"
    },
    {
      "item": { "name": "Orc Tusk", "rarity": "uncommon" },
      "quantity": 1,
      "source": "Orc Berserker"
    }
  ],
  "lootByEnemy": [
    {
      "enemy": "Goblin Warrior",
      "loot": { "gold": 14, "experience": 15, "items": [...] }
    },
    {
      "enemy": "Orc Berserker",
      "loot": { "gold": 28, "experience": 25, "items": [...] }
    }
  ]
}
```+-green.svg)](https://nodejs.org/)
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

#### 💰 Sistema de Loot (`systems/LootSystem.ts`)
- **Loot Tables**: Tablas de loot específicas por tipo de enemigo
- **Item System**: Sistema completo de items con rarezas y efectos
- **Gold Calculation**: Oro variable basado en dificultad del enemigo
- **Experience Rewards**: Puntos de experiencia por derrota
- **Drop Rates**: Sistema de probabilidades para items
- **Battle Summary**: Resumen completo de loot por batalla

#### 🤖 Sistema de IA para Enemigos (`systems/EnemyAI.ts`)
- **Behavior Patterns**: Patrones de comportamiento adaptativos
- **Rule-based Override**: Enemigos con reglas personalizadas usan ActionResolver
- **Adaptive AI**: IA que se adapta basado en composición del grupo
- **Fallback System**: Sistema de respaldo para acciones básicas

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

*Última actualización: 16 de septiembre de 2025*