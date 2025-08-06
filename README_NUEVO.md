# Asistente de Medios BCV

Sistema integral de asistencia para medios del Banco Central de Venezuela, con capacidades de generación de contenido, transcripción de audio, monitoreo de Telegram y análisis geopolítico.

## 🚀 Características Principales

- **Generador de Contenido**: Creación automática de comunicados y notas de prensa
- **Transcripción de Audio**: Conversión de archivos de audio a texto
- **Monitoreo de Telegram**: Seguimiento en tiempo real de canales de noticias
- **Análisis Geopolítico**: Evaluación de riesgos y análisis de entorno
- **Dashboard Interactivo**: Panel de control con métricas en tiempo real
- **Soporte Móvil**: Aplicación híbrida con Capacitor

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Cuentas de API para los servicios configurados

## 🛠️ Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd asistente-de-medios-bcv
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar APIs (Opcional - Guiado)
```bash
npm run setup:apis
```

### 4. Configuración Manual de APIs

Si prefieres configurar manualmente, crea un archivo `.env` en la raíz del proyecto:

```bash
# Copiar el archivo de ejemplo
cp env.example .env
```

Luego edita el archivo `.env` con tus credenciales:

```env
# AI Services
REDACTED
REDACTED
REDACTED

# Telegram Configuration
REDACTED
REDACTED
REDACTED
REDACTED

# News API
REDACTED

# AssemblyAI for Audio Transcription
REDACTED

# Supabase Configuration
REDACTED
REDACTED
```

### 5. Obtener Credenciales de API

#### Telegram API
1. Ve a https://my.telegram.org/auth
2. Inicia sesión con tu número: +5804123868364
3. Ve a "API development tools"
4. Crea una nueva aplicación

#### Gemini API
1. Ve a https://makersuite.google.com/app/apikey
2. Crea una nueva API key

#### DeepSeek API
1. Ve a https://platform.deepseek.com/
2. Regístrate y obtén tu API key

#### News API
1. Ve a https://newsapi.org/register
2. Regístrate para obtener tu API key

## 🚀 Ejecutar el Proyecto

### Desarrollo
```bash
npm run dev
```
El servidor se iniciará en http://localhost:3000

### Producción
```bash
npm run build
npm run preview
```

## 📱 Aplicación Móvil

### Sincronizar con Capacitor
```bash
npm run capacitor:sync
```

### Ejecutar en Android
```bash
npm run capacitor:run:android
```

### Generar APK
```bash
npm run capacitor:build:android
```

## 🏗️ Estructura del Proyecto

```
asistente-de-medios-bcv/
├── components/           # Componentes React
│   ├── dashboard/       # Panel de control
│   ├── generator/       # Generador de contenido
│   ├── transcription/   # Transcripción de audio
│   ├── monitoring/      # Monitoreo de Telegram
│   ├── settings/        # Configuraciones
│   ├── layout/          # Componentes de layout
│   └── ui/              # Componentes UI reutilizables
├── services/            # Servicios de API
│   ├── geminiService.ts
│   ├── telegramService.ts
│   ├── newsService.ts
│   └── ...
├── types.ts             # Definiciones de tipos TypeScript
├── constants.ts         # Constantes de la aplicación
└── android/             # Configuración Android (Capacitor)
```

## 🔧 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construir para producción
- `npm run setup:apis` - Configurar APIs (guiado)
- `npm run capacitor:sync` - Sincronizar con Capacitor
- `npm run capacitor:run:android` - Ejecutar en Android
- `npm run test` - Ejecutar tests
- `npm run lint` - Verificar código

## 📊 Funcionalidades

### Dashboard
- Métricas en tiempo real
- Feed de noticias de Telegram
- Acciones rápidas para generar contenido

### Generador de Contenido
- Creación de comunicados institucionales
- Análisis de contexto
- Múltiples modelos de IA (Gemini, DeepSeek, Mistral)

### Transcripción de Audio
- Soporte para múltiples formatos
- Integración con AssemblyAI
- Procesamiento en tiempo real

### Monitoreo de Telegram
- Seguimiento de canales oficiales
- Búsqueda por palabras clave
- Análisis de sentimiento

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Para soporte técnico o preguntas sobre el proyecto, contacta al equipo de desarrollo del BCV.

---

**Nota**: Este proyecto está diseñado específicamente para el Banco Central de Venezuela y utiliza el número de teléfono +5804123868364 para las integraciones de Telegram. 
