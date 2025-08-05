# 🏛️ BCV Media Assistant

**Sistema Inteligente de Gestión de Medios y Comunicaciones**  
*Banco Central de Venezuela*

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://vercel.com)
[![React](https://img.shields.io/badge/React-18.2.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.3-blue)](https://tailwindcss.com/)

## 📋 Descripción

Sistema integral de asistencia para la gestión de medios, comunicaciones y análisis de información del Banco Central de Venezuela. Incluye monitoreo de noticias económicas, generación de contenido institucional y análisis de alertas en tiempo real.

## ✨ Funcionalidades Principales

### 🎯 **Dashboard Ejecutivo**
- Vista centralizada de todas las operaciones
- Métricas en tiempo real
- Acceso rápido a funcionalidades clave

### 📝 **Generador de Contenido**
- Creación de comunicados institucionales
- Integración con múltiples modelos de IA (Gemini, DeepSeek, Mistral)
- Búsqueda web integrada para validación de información
- Exportación en múltiples formatos (PDF, Word, Texto)

### 🎙️ **Transcriptor de Audio**
- Conversión de audio a texto con alta precisión
- Soporte para múltiples formatos de audio
- Procesamiento en tiempo real

### 📡 **Monitoreo de Telegram**
- Seguimiento de canales oficiales y medios económicos
- Enlaces directos a fuentes originales
- Filtrado inteligente de contenido relevante

### 🚨 **Sistema de Alertas Económicas**
- Monitoreo de noticias nacionales e internacionales
- Análisis de impacto en Venezuela y el BCV
- Evaluación de severidad y recomendaciones estratégicas
- Integración con múltiples APIs de noticias

### 📊 **Análisis Institucional**
- Perspectiva especializada del BCV
- Análisis de matrices de opinión
- Protección de imagen institucional

## 🛠️ Tecnologías

### **Frontend**
- **React 18.2** - Framework principal
- **TypeScript 5.0** - Tipado estático
- **Vite 6.3** - Build tool y dev server
- **Tailwind CSS 3.3** - Framework de estilos
- **React Router 6.8** - Navegación SPA

### **APIs e Integraciones**
- **Google Gemini AI** - Generación de contenido
- **DeepSeek AI** - Modelo alternativo de IA
- **Mistral AI** - Análisis especializado
- **NewsAPI** - Noticias internacionales
- **SerpAPI** - Búsqueda web avanzada
- **Telegram Bot API** - Monitoreo de canales
- **YouTube Data API** - Contenido multimedia

### **Deployment**
- **Vercel** - Hosting y CI/CD
- **GitHub** - Control de versiones

## 🚀 Instalación y Configuración

### **Prerrequisitos**
- Node.js 18+ 
- npm o yarn
- Cuentas en servicios de IA (Gemini, DeepSeek, etc.)

### **Instalación**

```bash
# Clonar el repositorio
git clone https://github.com/bcv-code/bcv-media-assistant.git
cd bcv-media-assistant

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus API keys

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build
```

### **Variables de Entorno**

```env
# IA Models
VITE_GEMINI_API_KEY=tu_gemini_api_key
VITE_DEEPSEEK_API_KEY=tu_deepseek_api_key
VITE_MISTRAL_API_KEY=tu_mistral_api_key

# News APIs
VITE_NEWS_API_KEY=tu_news_api_key
VITE_SERP_API_KEY=tu_serp_api_key

# Social Media
VITE_YOUTUBE_API_KEY=tu_youtube_api_key
VITE_TELEGRAM_BOT_TOKEN=tu_telegram_bot_token
VITE_TELEGRAM_PHONE_NUMBER=tu_numero_telegram
```

## 📱 Uso

### **Dashboard Principal**
Accede a `http://localhost:3000` para ver el dashboard principal con:
- Acciones rápidas para funcionalidades clave
- Feed de monitoreo en tiempo real
- Sección de videos institucionales

### **Canales de Telegram Monitoreados**
- [BCVZLA](https://t.me/BCVZLA) - Canal oficial del BCV
- [VenEconomía](https://t.me/veneconomia)
- [Finanzas Digital](https://t.me/finanzasdigital)
- [Efecto Cocuyo](https://t.me/efectococuyo)
- Y más medios económicos venezolanos

## 🏗️ Arquitectura

```
src/
├── components/          # Componentes React
│   ├── alerts/         # Sistema de alertas
│   ├── dashboard/      # Dashboard principal
│   ├── generator/      # Generador de contenido
│   ├── icons/          # Iconografía SVG
│   ├── layout/         # Componentes de layout
│   ├── monitoring/     # Monitoreo de medios
│   ├── transcription/  # Transcriptor de audio
│   └── ui/            # Componentes base
├── services/           # Servicios y APIs
│   ├── economicAlertsService.ts
│   ├── geminiService.ts
│   ├── telegramService.ts
│   ├── webSearchService.ts
│   └── youtubeService.ts
├── types.ts           # Definiciones TypeScript
├── constants.ts       # Constantes de la app
└── App.tsx           # Componente principal
```

## 🔧 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Linting del código
npm run type-check   # Verificación de tipos
```

## 📊 Funcionalidades Avanzadas

### **Sistema de Alertas Económicas**
- Análisis automático de noticias económicas
- Evaluación de impacto en Venezuela
- Clasificación por severidad (Baja, Media, Alta, Crítica)
- Recomendaciones estratégicas automatizadas

### **Generador de Contenido Inteligente**
- Múltiples modelos de IA para diferentes tipos de contenido
- Búsqueda web integrada para validación
- Templates predefinidos para comunicados oficiales
- Exportación directa en formatos institucionales

## 🤝 Contribución

Este es un proyecto interno del Banco Central de Venezuela. Para contribuciones:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

 2024 Banco Central de Venezuela. Todos los derechos reservados.

## 📞 Soporte

Para soporte técnico o consultas:
- **Email**: soporte-ti@bcv.org.ve
- **Telegram**: [@BCVZLA](https://t.me/BCVZLA)

---

**Desarrollado con ❤️ para el Banco Central de Venezuela**