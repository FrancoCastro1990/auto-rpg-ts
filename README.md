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
- 📊 **Análisis Detallado**: Reportes completos de batallas y estadísticas de rendimiento
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
- **json-rules-engine**: Motor de reglas para lógica de combate automatizada
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
│   ├── EntityFactory.ts       # Creación de entidades del juego
│   ├── index.ts               # Exportaciones de loaders
│   └── test-loader.ts         # Utilidades de testing para loaders
├── models/
│   └── types.ts               # Definiciones de tipos TypeScript
├── systems/
│   ├── ActionResolver.ts      # Resolución de acciones de combate
│   ├── BattleSystem.ts        # Sistema principal de batalla
│   ├── ConditionEvaluator.ts  # Evaluación de condiciones
│   ├── DungeonManager.ts      # Gestión de mazmorras
│   ├── RulesEngine.ts         # Motor de reglas personalizado
│   ├── TargetSelector.ts      # Selección de objetivos
│   ├── index.ts               # Exportaciones de systems
│   ├── test-battle.ts         # Utilidades de testing para battle
│   ├── test-dungeon.ts        # Utilidades de testing para dungeon
│   └── test-rules.ts          # Utilidades de testing para rules
└── utils/
    ├── BattleLogger.ts        # Sistema de logging configurable
    ├── ReportGenerator.ts     # Generación de reportes múltiples formatos
    ├── index.ts               # Exportaciones de utils
    ├── test-logging.ts        # Utilidades de testing para logging
    ├── errors.ts              # Sistema de errores personalizado
    └── validators.ts          # Utilidades de validación

data/
├── dungeon_01.json            # Configuración de mazmorra básica
├── enemies.json               # Definiciones de enemigos
├── jobs.json                  # Definiciones de clases/profesiones
├── party.json                 # Configuración del grupo
└── skills.json                # Definiciones de habilidades

tests/
├── errors.test.ts             # Pruebas unitarias del sistema de errores (32 tests)
├── integration.test.ts        # Pruebas de integración del sistema (10 tests)
├── jest.config.js             # Configuración de Jest
└── ...

dist/                          # Archivos compilados TypeScript
```

### Componentes Principales

#### 🛡️ Sistema de Errores (`utils/errors.ts`)
- **ErrorHandler**: Gestor centralizado de errores
- **GameError**: Clase base para errores del juego
- **ValidationError**: Errores de validación de datos
- **DataLoadError**: Errores de carga de archivos
- **BattleError**: Errores durante batallas
- Recuperación automática y logging detallado

#### ✅ Sistema de Validación (`utils/validators.ts`)
- Validación de esquemas JSON
- Verificación de integridad de datos
- Validación de reglas y condiciones
- Mensajes de error descriptivos

#### 🧪 Sistema de Testing
- **42 pruebas automatizadas** (32 unitarias + 10 integración)
- Cobertura completa de funcionalidades críticas
- Tests de manejo de errores y edge cases
- Configuración Jest optimizada para TypeScript

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

### Sistema de Reglas

El motor de reglas utiliza condiciones lógicas para determinar acciones:

#### Condiciones Disponibles
- `always`: Siempre se cumple
- `enemy.isBoss`: El enemigo es un jefe
- `ally.hp < 30%`: Aliado con vida baja
- `self.mp > 50%`: Suficiente mana
- `enemy.count > 1`: Múltiples enemigos

#### Objetivos Disponibles
- `weakestEnemy`: Enemigo más débil
- `strongestEnemy`: Enemigo más fuerte
- `lowestHpAlly`: Aliado con menos vida
- `self`: El propio personaje

#### Acciones Disponibles
- `attack`: Ataque básico
- `ability`: Usar habilidad específica
- `skip`: Pasar turno

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
- 🔧 **Líneas de Código**: ~2000+ líneas TypeScript
- 📁 **Archivos**: 25+ archivos fuente
- 🧪 **Tests**: 42 pruebas automatizadas
- 📚 **Documentación**: README completo + documentación inline

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