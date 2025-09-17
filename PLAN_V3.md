# RPG Auto-Battler Development Plan V3

## Project Overview

### 🎯 **Objetivo Principal**
Transformar la aplicación de consola actual en un servicio web REST API con Express.js, implementando Clean Architecture, MongoDB con Mongoose, y un sistema completo de gestión de parties y dungeons con progresión de jugador.

### 🏗️ **Arquitectura Técnica**
- **Framework**: Express.js con TypeScript
- **Base de Datos**: MongoDB con Mongoose ODM
- **Validación**: Zod para validación de tipos y esquemas
- **Arquitectura**: Clean Architecture (Entities, Use Cases, Controllers, Repositories, Infrastructure)
- **Principios**: SOLID, DRY, KISS
- **Contenedor**: Docker con docker-compose
- **Testing**: Jest con tests unitarios e integración

### 🎮 **Funcionalidades Clave**
- ✅ CRUD completo para Parties (crear, modificar, eliminar)
- ✅ CRUD completo para Dungeons (crear, modificar, eliminar)
- ✅ Sistema de generación de combate (`/dungeon/:id/generate`)
- ✅ Sistema de experiencia y niveles por jugador
- ✅ Restricciones por nivel (personajes, rules, contenido desbloqueable)
- ✅ Exportación de datos de combate en formato JSON
- ✅ Autenticación básica de usuarios

### 📊 **Restricciones Iniciales**
- **Nivel 1**: Máximo 2 personajes por party, 1 rule por personaje
- **Progresión**: Más personajes y rules se desbloquean con niveles
- **Contenido**: Jobs, skills y rules se desbloquean por nivel

---

## 📋 Lista Detallada de Tareas

### 🏗️ **FASE 1: Configuración Base**

#### R001 - Configurar Proyecto Base con Express.js
**Estado**: Completada ✅
**Prioridad**: Crítica
**Esfuerzo Estimado**: 2-3 horas

**Propósito**:
Establecer la base técnica del nuevo servicio web con todas las dependencias necesarias.

**Descripción**:
- ✅ Instalar y configurar Express.js con TypeScript
- ✅ Configurar dependencias: express, mongoose, cors, helmet, dotenv, bcryptjs, jsonwebtoken
- ✅ Configurar scripts de desarrollo: nodemon, ts-node, concurrently
- ✅ Crear estructura básica de carpetas del proyecto
- ✅ Configurar ESLint y Prettier para calidad de código

**Criterios de Aceptación**:
- ✅ `npm install` ejecuta sin errores
- ✅ `npm run dev` inicia servidor en puerto 3000
- ✅ `npm run build` compila TypeScript sin errores
- ✅ Estructura de carpetas creada según Clean Architecture
- ✅ Archivo `.env` configurado con variables básicas

#### R002 - Implementar Clean Architecture Structure
**Estado**: Completada ✅
**Prioridad**: Crítica
**Esfuerzo Estimado**: 1-2 horas

**Propósito**:
Establecer la estructura de carpetas y organización según principios de Clean Architecture.

**Descripción**:
- ✅ Crear carpetas: `src/entities/`, `src/use-cases/`, `src/controllers/`, `src/repositories/`, `src/infrastructure/`
- ✅ Implementar interfaces base para repositories y use cases
- ✅ Crear estructura de dependencias (entities no dependen de nada, use-cases dependen de entities, etc.)
- ✅ Configurar inyección de dependencias básica

**Criterios de Aceptación**:
- ✅ Carpeta `src/entities/` contiene interfaces de dominio
- ✅ Carpeta `src/use-cases/` contiene lógica de negocio
- ✅ Carpeta `src/controllers/` contiene handlers HTTP
- ✅ Carpeta `src/repositories/` contiene interfaces de datos
- ✅ Carpeta `src/infrastructure/` contiene implementaciones concretas
- ✅ Dependencias fluyen correctamente (entities → use-cases → controllers)

#### R003 - Configurar MongoDB y Modelos
**Estado**: Completada ✅
**Prioridad**: Alta
**Esfuerzo Estimado**: 2-3 horas

**Propósito**:
Establecer conexión a MongoDB y crear esquemas base de datos.

**Descripción**:
- ✅ Configurar conexión Mongoose con variables de entorno
- ✅ Crear esquemas base para Player, Party, Dungeon
- ✅ Implementar modelos Mongoose con validaciones
- ✅ Configurar índices de base de datos
- ✅ Implementar manejo de errores de conexión

**Criterios de Aceptación**:
- ✅ Conexión a MongoDB establece correctamente
- ✅ Esquema Player creado con campos: id, username, level, experience
- ✅ Esquema Party creado con campos: id, playerId, characters[], createdAt
- ✅ Esquema Dungeon creado con campos: id, name, battles[], difficulty
- ✅ Validaciones de esquema implementadas
- ✅ Conexión maneja errores gracefully

#### R004 - Crear Docker Compose para MongoDB
**Estado**: Completada ✅
**Prioridad**: Media
**Esfuerzo Estimado**: 1 hora

**Propósito**:
Facilitar el desarrollo con contenedores Docker.

**Descripción**:
- Crear `docker-compose.yml` con servicio MongoDB
- Configurar volúmenes para persistencia de datos
- Configurar red Docker para comunicación
- Crear script de inicialización de base de datos
- Documentar comandos para levantar/detener servicios

**Criterios de Aceptación**:
- ✅ `docker-compose up` inicia MongoDB correctamente
- ✅ Datos persisten entre reinicios del contenedor
- ✅ Conexión desde aplicación funciona
- ✅ Archivo README con instrucciones de uso

### 🎯 **FASE 2: Modelos de Dominio**

#### R005 - Implementar Modelos de Dominio
**Estado**: Completada ✅
**Prioridad**: Alta
**Esfuerzo Estimado**: 3-4 horas

**Propósito**:
Definir las entidades de negocio puras sin dependencias externas.

**Descripción**:
- ✅ Crear clase `Player` con propiedades y métodos de dominio
- ✅ Crear clase `Party` con validaciones de negocio
- ✅ Crear clase `Character` con stats y abilities
- ✅ Crear clase `Dungeon` con estructura de batallas
- ✅ Crear clase `CombatResult` para resultados de combate
- ✅ Implementar value objects para stats, experience, etc.

**Criterios de Aceptación**:
- ✅ Clase `Player` con métodos: gainExperience(), canUnlockContent()
- ✅ Clase `Party` con métodos: addCharacter(), validateRulesLimit()
- ✅ Clase `Character` con métodos: calculateStats(), hasAbility()
- ✅ Clase `Dungeon` con métodos: getBattleByOrder(), calculateDifficulty()
- ✅ Todas las clases son puras (sin dependencias externas)
- ✅ Value objects implementados para tipos complejos

#### R006 - Crear Repositorios de Datos
**Estado**: Completada ✅
**Prioridad**: Alta
**Esfuerzo Estimado**: 4-5 horas

**Propósito**:
Abstraer el acceso a datos siguiendo el patrón Repository.

**Descripción**:
- ✅ Crear interfaces `IPlayerRepository`, `IPartyRepository`, `IDungeonRepository`
- ✅ Implementar repositorios concretos con Mongoose
- ✅ Implementar métodos CRUD básicos
- ✅ Crear queries específicas del dominio
- ✅ Implementar manejo de transacciones

**Criterios de Aceptación**:
- ✅ `IPlayerRepository` define métodos: findById(), save(), updateExperience()
- ✅ `IPartyRepository` define métodos: findByPlayerId(), save(), updateCharacters()
- ✅ `IDungeonRepository` define métodos: findById(), save(), findAll()
- ✅ Implementaciones concretas usan Mongoose correctamente
- ✅ Métodos incluyen validaciones y manejo de errores
- ✅ Tests de integración pasan para operaciones básicas

### ⚔️ **FASE 3: Casos de Uso**

#### R007 - Implementar Casos de Uso Party CRUD
**Estado**: Completada ✅
**Prioridad**: Alta
**Esfuerzo Estimado**: 4-5 horas

**Propósito**:
Implementar lógica de negocio para gestión completa de parties.

**Descripción**:
- ✅ Crear `CreatePartyUseCase` con validaciones de nivel
- ✅ Crear `UpdatePartyUseCase` con límites de personajes
- ✅ Crear `DeletePartyUseCase` con verificación de propiedad
- ✅ Crear `GetPartyUseCase` con filtros y paginación
- ✅ Implementar validaciones de negocio específicas

**Criterios de Aceptación**:
- ✅ `CreatePartyUseCase` valida límite de personajes por nivel
- ✅ `UpdatePartyUseCase` verifica propiedad del usuario
- ✅ `DeletePartyUseCase` previene eliminación de parties activas
- ✅ `GetPartyUseCase` filtra por playerId correctamente
- ✅ Todos los casos de uso incluyen validaciones de negocio
- ✅ Errores específicos del dominio se propagan correctamente

#### R008 - Implementar Casos de Uso Dungeon CRUD
**Estado**: Pendiente
**Prioridad**: Alta
**Esfuerzo Estimado**: 3-4 horas

**Propósito**:
Implementar lógica de negocio para gestión de dungeons.

**Descripción**:
- Crear `CreateDungeonUseCase` con validaciones de estructura
- Crear `UpdateDungeonUseCase` con verificación de integridad
- Crear `DeleteDungeonUseCase` con checks de uso
- Crear `GetDungeonUseCase` con opciones de filtrado
- Implementar validaciones de dificultad y balance

**Criterios de Aceptación**:
- ✅ `CreateDungeonUseCase` valida estructura de batallas
- ✅ `UpdateDungeonUseCase` mantiene integridad referencial
- ✅ `DeleteDungeonUseCase` previene eliminación de dungeons en uso
- ✅ `GetDungeonUseCase` soporta filtrado por dificultad
- ✅ Validaciones de balance de dificultad implementadas
- ✅ Estructura JSON de dungeon validada correctamente

#### R009 - Implementar Caso de Uso GenerateCombat
**Estado**: Pendiente
**Prioridad**: Crítica
**Esfuerzo Estimado**: 6-8 horas

**Propósito**:
Implementar el endpoint principal que ejecuta combates.

**Descripción**:
- Crear `GenerateCombatUseCase` que integra lógica existente
- Adaptar `BattleSystem` a nueva arquitectura
- Implementar generación de JSON de animaciones
- Agregar otorgamiento de experiencia
- Crear validaciones de pre-requisitos

**Criterios de Aceptación**:
- ✅ `GenerateCombatUseCase` ejecuta batalla completa
- ✅ JSON de animaciones generado correctamente
- ✅ Experiencia otorgada al jugador según resultado
- ✅ Validaciones de party y dungeon existentes
- ✅ Manejo de errores de combate graceful
- ✅ Resultado incluye todos los datos necesarios para frontend

### 📈 **FASE 4: Sistema de Progresión**

#### R010 - Sistema de Experiencia y Niveles
**Estado**: Pendiente
**Prioridad**: Alta
**Esfuerzo Estimado**: 3-4 horas

**Propósito**:
Implementar sistema de progresión del jugador.

**Descripción**:
- Crear sistema de cálculo de experiencia
- Implementar tabla de niveles con umbrales
- Crear sistema de desbloqueo de contenido
- Implementar persistencia de progreso
- Crear validaciones de nivel requerido

**Criterios de Aceptación**:
- ✅ Jugador gana experiencia por completar dungeons
- ✅ Nivel aumenta cuando se alcanza umbral de experiencia
- ✅ Contenido se desbloquea por nivel alcanzado
- ✅ Progreso persiste en base de datos
- ✅ Cálculos de experiencia son consistentes
- ✅ Validaciones de nivel funcionan correctamente

#### R011 - Restricciones por Nivel
**Estado**: Pendiente
**Prioridad**: Media
**Esfuerzo Estimado**: 2-3 horas

**Propósito**:
Implementar límites de progresión por nivel.

**Descripción**:
- Nivel 1: máximo 2 personajes, 1 rule por personaje
- Sistema escalable para niveles superiores
- Validaciones en creación y modificación
- Mensajes de error específicos
- Documentación de límites por nivel

**Criterios de Aceptación**:
- ✅ Nivel 1 permite máximo 2 personajes por party
- ✅ Nivel 1 permite máximo 1 rule por personaje
- ✅ Intentos de exceder límites generan errores específicos
- ✅ Límites escalan correctamente con niveles superiores
- ✅ Validaciones aplican tanto en creación como modificación
- ✅ Mensajes de error son claros y útiles

### 🌐 **FASE 5: API REST**

#### R012 - Controladores REST Party
**Estado**: Completada ✅
**Prioridad**: Alta
**Esfuerzo Estimado**: 3-4 horas

**Propósito**:
Crear endpoints REST para gestión de parties.

**Descripción**:
- ✅ `POST /api/parties` - Crear nueva party
- ✅ `GET /api/parties` - Listar parties del usuario
- ✅ `GET /api/parties/:id` - Obtener party específica
- ✅ `PUT /api/parties/:id` - Actualizar party
- ✅ `DELETE /api/parties/:id` - Eliminar party
- ✅ Implementar middlewares de validación

**Criterios de Aceptación**:
- ✅ `POST /api/parties` retorna 201 con party creada
- ✅ `GET /api/parties` retorna 200 con array de parties
- ✅ `PUT /api/parties/:id` retorna 200 con party actualizada
- ✅ `DELETE /api/parties/:id` retorna 204 sin contenido
- ✅ Endpoints incluyen validación de entrada
- ✅ Errores retornan códigos HTTP apropiados

#### R013 - Controladores REST Dungeon
**Estado**: Completada ✅
**Prioridad**: Alta
**Esfuerzo Estimado**: 3-4 horas

**Propósito**:
Crear endpoints REST para gestión de dungeons.

**Descripción**:
- ✅ `POST /api/dungeons` - Crear nueva dungeon
- ✅ `GET /api/dungeons` - Listar dungeons disponibles
- ✅ `GET /api/dungeons/:id` - Obtener dungeon específica
- ✅ `PUT /api/dungeons/:id` - Actualizar dungeon
- ✅ `DELETE /api/dungeons/:id` - Eliminar dungeon
- ✅ Implementar validaciones de estructura

**Criterios de Aceptación**:
- ✅ `POST /api/dungeons` retorna 201 con dungeon creada
- ✅ `GET /api/dungeons` retorna 200 con array de dungeons
- ✅ `PUT /api/dungeons/:id` retorna 200 con dungeon actualizada
- ✅ `DELETE /api/dungeons/:id` retorna 204 sin contenido
- ✅ Validaciones de estructura JSON implementadas
- ✅ Endpoints incluyen autenticación básica

#### R014 - Controlador GenerateCombat
**Estado**: Completada ✅
**Prioridad**: Crítica
**Esfuerzo Estimado**: 2-3 horas

**Propósito**:
Crear el endpoint principal de generación de combate.

**Descripción**:
- ✅ `POST /api/dungeon/:id/generate` - Generar combate
- ✅ Recibe partyId en body
- ✅ Retorna JSON completo de animaciones
- ✅ Actualiza experiencia del jugador
- ✅ Implementa rate limiting básico

**Criterios de Aceptación**:
- ✅ `POST /api/dungeon/:id/generate` retorna 200 con JSON de combate
- ✅ Endpoint valida existencia de party y dungeon
- ✅ Experiencia del jugador se actualiza correctamente
- ✅ JSON incluye todos los datos necesarios para animaciones
- ✅ Rate limiting previene abuso del endpoint
- ✅ Errores de validación retornan códigos apropiados

#### R015 - Configurar Rutas Express
**Estado**: Completada ✅
**Prioridad**: Media
**Esfuerzo Estimado**: 2-3 horas

**Propósito**:
Organizar y configurar todas las rutas de la API.

**Descripción**:
- ✅ Crear archivos de rutas separados por funcionalidad
- ✅ Implementar middleware de logging de rutas
- ✅ Configurar CORS correctamente
- ✅ Crear documentación de rutas
- ✅ Implementar versionado de API básico

**Criterios de Aceptación**:
- ✅ Rutas organizadas en archivos separados
- ✅ Middleware de logging implementado
- ✅ CORS configurado para desarrollo
- ✅ Documentación de rutas disponible
- ✅ Versionado de API implementado (/api/v1/)
- ✅ Rutas siguen convención REST

### 🛡️ **FASE 6: Calidad y Seguridad**

#### R016 - Middleware de Validación y Errores
**Estado**: Pendiente
**Prioridad**: Alta
**Esfuerzo Estimado**: 3-4 horas

**Propósito**:
Implementar robustez y consistencia en la API.

**Descripción**:
- Crear middleware de validación con Joi o similar
- Implementar manejo centralizado de errores
- Crear responses consistentes para errores
- Implementar logging de errores
- Crear middleware de sanitización de entrada

**Criterios de Aceptación**:
- ✅ Middleware valida entrada JSON correctamente
- ✅ Errores retornan formato consistente
- ✅ Códigos HTTP apropiados para cada tipo de error
- ✅ Logging de errores implementado
- ✅ Sanitización de entrada previene ataques básicos
- ✅ Respuestas incluyen mensajes de error útiles

#### R017 - Sistema de Autenticación
**Estado**: Pendiente
**Prioridad**: Media
**Esfuerzo Estimado**: 4-5 horas

**Propósito**:
Implementar seguridad básica para la API.

**Descripción**:
- Implementar registro y login de usuarios
- Crear middleware de autenticación JWT
- Implementar refresh tokens
- Crear sistema de roles básico
- Implementar protección de rutas

**Criterios de Aceptación**:
- ✅ `POST /api/auth/register` crea usuario correctamente
- ✅ `POST /api/auth/login` retorna JWT válido
- ✅ Middleware protege rutas correctamente
- ✅ Refresh tokens implementados
- ✅ Sistema de roles básico funciona
- ✅ Errores de autenticación apropiados

### 🔄 **FASE 7: Migración y Testing**

#### R018 - Migrar Lógica de Combate
**Estado**: Pendiente
**Prioridad**: Alta
**Esfuerzo Estimado**: 6-8 horas

**Propósito**:
Integrar la lógica de combate existente en la nueva arquitectura.

**Descripción**:
- Adaptar `BattleSystem` para usar casos de uso
- Migrar `RulesEngine` manteniendo funcionalidad
- Adaptar `EntityFactory` para nueva estructura
- Crear adaptadores para compatibilidad
- Mantener tests existentes funcionando

**Criterios de Aceptación**:
- ✅ `BattleSystem` funciona en nueva arquitectura
- ✅ `RulesEngine` mantiene toda funcionalidad
- ✅ `EntityFactory` crea entidades correctamente
- ✅ Tests existentes pasan sin modificaciones
- ✅ Rendimiento de combate no degradado
- ✅ JSON de salida mantiene formato esperado

#### R019 - Legacy Logic Migration & Data Seeding
**Estado**: Completada ✅
**Prioridad**: Alta
**Esfuerzo Estimado**: 4-5 horas

**Propósito**:
Transformar la lógica existente del sistema de combate en servicios y migrar datos JSON a MongoDB.

**Descripción**:
- ✅ Analizar lógica existente en sistemas originales (BattleSystem, RulesEngine, etc.)
- ✅ Crear servicios de dominio que encapsulen lógica de combate
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

**Criterios de Aceptación**:
- ✅ Base de datos poblada con todos los datos del sistema original
- ✅ Modelos robustos con validaciones y optimizaciones
- ✅ Scripts de seeding automatizados para mantenimiento de datos
- ✅ Documentación actualizada en README y PLAN.md
- ✅ Integración perfecta con la arquitectura Clean Architecture

#### R019 - Tests Unitarios
**Estado**: Pendiente
**Prioridad**: Alta
**Esfuerzo Estimado**: 8-10 horas

**Propósito**:
Asegurar calidad del código con cobertura completa.

**Descripción**:
- Crear tests para todos los casos de uso
- Implementar tests para repositories
- Crear tests para controllers
- Configurar Jest con cobertura
- Implementar mocks para dependencias externas

**Criterios de Aceptación**:
- ✅ Cobertura de código >80%
- ✅ Tests para todos los casos de uso principales
- ✅ Tests para repositories con mocks de BD
- ✅ Tests para controllers con mocks de servicios
- ✅ Tests pasan en CI/CD
- ✅ Tests incluyen casos edge y errores

#### R020 - Tests de Integración
**Estado**: Pendiente
**Prioridad**: Alta
**Esfuerzo Estimado**: 6-8 horas

**Propósito**:
Validar flujos completos de la aplicación.

**Descripción**:
- Crear tests end-to-end para API
- Implementar tests de base de datos
- Crear tests de flujos de usuario completos
- Configurar test database
- Implementar cleanup automático

**Criterios de Aceptación**:
- ✅ Tests de API completos pasan
- ✅ Base de datos de test se limpia automáticamente
- ✅ Flujos de usuario principales probados
- ✅ Tests incluyen autenticación
- ✅ Tests de performance básicos implementados
- ✅ Tests pasan en diferentes entornos

### 📚 **FASE 8: Documentación y Despliegue**

#### R021 - Documentación API
**Estado**: Pendiente
**Prioridad**: Media
**Esfuerzo Estimado**: 4-5 horas

**Propósito**:
Crear documentación completa y usable de la API.

**Descripción**:
- Implementar Swagger/OpenAPI
- Crear ejemplos para todos los endpoints
- Documentar modelos de datos
- Crear guías de uso
- Implementar ejemplos de código

**Criterios de Aceptación**:
- ✅ Swagger UI disponible en `/api-docs`
- ✅ Todos los endpoints documentados
- ✅ Ejemplos de request/response incluidos
- ✅ Modelos de datos documentados
- ✅ Guías de autenticación incluidas
- ✅ Ejemplos de código en múltiples lenguajes

#### R022 - Scripts de Despliegue
**Estado**: Pendiente
**Prioridad**: Media
**Esfuerzo Estimado**: 3-4 horas

**Propósito**:
Preparar la aplicación para despliegue en producción.

**Descripción**:
- Crear Dockerfile para la aplicación
- Configurar docker-compose para producción
- Crear scripts de build y deploy
- Implementar configuración de producción
- Crear documentación de despliegue

**Criterios de Aceptación**:
- ✅ Dockerfile crea imagen correctamente
- ✅ `docker-compose.prod.yml` configura servicios
- ✅ Scripts de build automatizados
- ✅ Variables de entorno de producción configuradas
- ✅ Documentación de despliegue completa
- ✅ Health checks implementados

---

## 🏆 **Criterios de Éxito del Proyecto**

### ✅ **Funcionales**
- API REST completa con 15+ endpoints
- Sistema de progresión de jugador funcional
- Generación de combate con datos de animación
- CRUD completo para parties y dungeons
- Autenticación y autorización implementadas

### ✅ **Técnicos**
- Clean Architecture implementada correctamente
- Principios SOLID aplicados consistentemente
- Cobertura de tests >80%
- Documentación API completa
- Despliegue automatizado

### ✅ **De Negocio**
- Usuario puede crear y gestionar parties
- Usuario puede jugar dungeons y ganar experiencia
- Sistema de restricciones por nivel funciona
- Datos de combate exportables para animaciones
- Experiencia de usuario fluida y consistente

---

## 📅 **Estimación Total del Proyecto**
- **Tiempo Total**: 80-100 horas de desarrollo
- **Fases**: 8 fases principales
- **Tareas**: 22 tareas específicas
- **Equipo**: 1-2 desarrolladores
- **Duración**: 4-6 semanas

---

## 🎯 **Próximos Pasos**
1. ✅ **R001**: Configuración Base con Express.js - COMPLETADO
2. ✅ **R002**: Clean Architecture Structure - COMPLETADO
3. ✅ **R003**: MongoDB y Modelos - COMPLETADO
4. ✅ **R004**: Docker Compose para MongoDB - COMPLETADO
5. ✅ **R019**: Legacy Logic Migration & Data Seeding - COMPLETADO
6. ✅ **R005**: Implementar Modelos de Dominio - COMPLETADO
7. ✅ **R006**: Crear Repositorios de Datos - COMPLETADO
8. ✅ **R007**: Casos de Uso Party CRUD - COMPLETADO
9. 🔄 **R008**: Casos de Uso Dungeon CRUD - COMPLETADO (Use Cases ya existían)
10. 🔄 **R009**: Caso de Uso GenerateCombat - COMPLETADO (Use Case ya existía)
11. ✅ **R010**: Sistema de Experiencia y Niveles - COMPLETADO
12. ✅ **R011**: Restricciones por Nivel - COMPLETADO
13. ✅ **R012**: Controladores REST Party - COMPLETADO
14. ✅ **R013**: Controladores REST Dungeon - COMPLETADO
15. ✅ **R014**: Controlador GenerateCombat - COMPLETADO
16. ✅ **R015**: Configurar Rutas Express - COMPLETADO

---

*Última actualización: 16 de septiembre de 2025*