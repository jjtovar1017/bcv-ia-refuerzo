# 🚀 Guía de Deploy a Netlify - Asistente de Medios BCV

## ✅ **PROYECTO LISTO PARA NETLIFY**

### 🎯 **Resumen**
El proyecto está completamente configurado y listo para ser desplegado en Netlify con todas las variables de entorno configuradas correctamente.

---

## 📋 **Pasos para Deploy en Netlify**

### **Método 1: Deploy Automático (Recomendado)**

#### **1. Instalar Netlify CLI**
```bash
npm install -g netlify-cli
```

#### **2. Login en Netlify**
```bash
netlify login
```
Esto abrirá tu navegador para autenticarte con tu cuenta de Netlify.

#### **3. Configurar Variables de Entorno**
```bash
# Usar el script interactivo (recomendado)
npm run setup:netlify-env
```

El script te pedirá que ingreses cada variable de entorno:
- `VITE_GEMINI_API_KEY` - Tu clave de API de Google Gemini
- `VITE_TELEGRAM_API_ID` - Tu ID de aplicación de Telegram  
- `VITE_TELEGRAM_API_HASH` - Tu hash de aplicación de Telegram
- `VITE_DEEPSEEK_API_KEY` - Tu clave de API de DeepSeek
- `VITE_MISTRAL_API_KEY` - Tu clave de API de Mistral
- `VITE_ASSEMBLYAI_API_KEY` - Tu clave de API de AssemblyAI
- `VITE_SUPABASE_URL` - Tu URL de Supabase
- `VITE_SUPABASE_KEY` - Tu clave anónima de Supabase
- `VITE_NEWS_API_KEY` - Tu clave de API de News API

#### **4. Deploy Automático**
```bash
npm run deploy:netlify
```

---

### **Método 2: Deploy Manual**

#### **1. Build del Proyecto**
```bash
npm run build
```

#### **2. Deploy Manual**
```bash
# Para nuevo sitio
netlify deploy --prod --dir=dist --open

# Para sitio existente
netlify deploy --prod --dir=dist
```

#### **3. Configurar Variables Manualmente**
Ve al dashboard de Netlify:
1. Ir a tu sitio en https://app.netlify.com
2. Ir a **Site settings** > **Environment variables**
3. Agregar cada variable de entorno

---

### **Método 3: Deploy desde GitHub (Continuous Deployment)**

#### **1. Conectar Repositorio**
1. Ir a https://app.netlify.com
2. Hacer clic en "New site from Git"
3. Conectar tu repositorio de GitHub
4. Seleccionar el repositorio `asistente-de-medios-bcv`

#### **2. Configurar Build Settings**
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: `18`

#### **3. Configurar Variables de Entorno**
En el dashboard de Netlify:
1. Ir a **Site settings** > **Environment variables**
2. Agregar todas las variables requeridas

---

## 🔧 **Variables de Entorno Requeridas**

| Variable | Descripción |
|----------|-------------|
| `VITE_GEMINI_API_KEY` | Clave de API de Google Gemini |
| `VITE_TELEGRAM_API_ID` | ID de aplicación de Telegram |
| `VITE_TELEGRAM_API_HASH` | Hash de aplicación de Telegram |
| `VITE_DEEPSEEK_API_KEY` | Clave de API de DeepSeek |
| `VITE_MISTRAL_API_KEY` | Clave de API de Mistral |
| `VITE_ASSEMBLYAI_API_KEY` | Clave de API de AssemblyAI |
| `VITE_SUPABASE_URL` | URL de tu proyecto Supabase |
| `VITE_SUPABASE_KEY` | Clave anónima de Supabase |
| `VITE_NEWS_API_KEY` | Clave de API de News API |

---

## 🧪 **Verificación Post-Deploy**

### **Funcionalidades a Probar**
1. **Dashboard** - Feed de noticias reales
2. **Generador de Contenido** - Creación de comunicados
3. **Transcripción de Audio** - Procesamiento de archivos
4. **Monitoreo de Telegram** - Noticias en tiempo real
5. **Navegación** - Todas las rutas funcionando

### **Comandos de Verificación Local**
```bash
# Probar build local
npm run build

# Probar servidor local
npm run dev

# Probar integración Telegram
npm run test:telegram
```

---

## 🚨 **Solución de Problemas**

### **Error: Variables de Entorno No Encontradas**
```bash
# Verificar variables configuradas
netlify env:list

# Reconfigurar variables
npm run setup:netlify-env
```

### **Error: Build Fallido**
```bash
# Verificar build local
npm run build

# Verificar dependencias
npm install

# Limpiar node_modules
rm -rf node_modules package-lock.json
npm install
```

### **Error: Netlify CLI No Encontrado**
```bash
# Instalar Netlify CLI globalmente
npm install -g netlify-cli

# Verificar instalación
netlify --version
```

---

## 📱 **Configuración de Dominio**

### **Dominio Personalizado**
1. Ir a **Site settings** > **Domain management**
2. Hacer clic en "Add custom domain"
3. Ingresar tu dominio personalizado
4. Configurar DNS según las instrucciones

### **Subdominio de Netlify**
- El proyecto tendrá un subdominio automático
- Formato: `nombre-del-sitio.netlify.app`
- Puedes cambiar el nombre en **Site settings** > **General**

---

## 🎯 **Estado Final Esperado**

### **✅ DESPUÉS DEL DEPLOY**
- [x] Aplicación funcionando en Netlify
- [x] Todas las APIs operativas
- [x] Noticias reales de Telegram
- [x] Generador de contenido funcional
- [x] Transcripción de audio operativa
- [x] Interfaz responsive y moderna

### **📊 Métricas de Éxito**
- Build exitoso en Netlify
- Tiempo de carga < 3 segundos
- Todas las funcionalidades operativas
- Sin errores en consola

---

## 🎉 **Conclusión**

**El proyecto está 100% listo para deploy en Netlify.**

### **Ventajas de Netlify**
- ✅ **Deploy automático** desde GitHub
- ✅ **HTTPS gratuito** incluido
- ✅ **CDN global** para mejor rendimiento
- ✅ **Variables de entorno** fáciles de configurar
- ✅ **Rollbacks** instantáneos
- ✅ **Preview deploys** para branches

### **Comandos Rápidos**
```bash
# Setup completo
npm run setup:netlify-env
npm run deploy:netlify

# Solo deploy
npm run deploy:netlify
```

---

*Última actualización: $(date)*
*Estado: ✅ LISTO PARA NETLIFY*
*Versión: 1.0.0*
