# Script de Deployment para Vercel - Asistente de Medios BCV
# Autor: Cascade AI Assistant
# Fecha: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

Write-Host "=== DEPLOYMENT ASISTENTE DE MEDIOS BCV ===" -ForegroundColor Cyan
Write-Host "Iniciando proceso de deployment a Vercel..." -ForegroundColor Green

# Verificar si Vercel CLI está instalado
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI encontrado: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI no encontrado. Instalando..." -ForegroundColor Red
    npm install -g vercel
    Write-Host "✅ Vercel CLI instalado correctamente" -ForegroundColor Green
}

# Verificar que estamos en el directorio correcto
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: No se encontró package.json. Ejecute este script desde la raíz del proyecto." -ForegroundColor Red
    exit 1
}

Write-Host "📁 Directorio del proyecto verificado" -ForegroundColor Green

# Limpiar build anterior
Write-Host "🧹 Limpiando builds anteriores..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ Directorio dist eliminado" -ForegroundColor Green
}

# Instalar dependencias
Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al instalar dependencias" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencias instaladas correctamente" -ForegroundColor Green

# Ejecutar build
Write-Host "🔨 Construyendo aplicación..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en el proceso de build" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build completado exitosamente" -ForegroundColor Green

# Verificar que el build se generó correctamente
if (!(Test-Path "dist/index.html")) {
    Write-Host "❌ Error: No se generó el archivo dist/index.html" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Archivos de build verificados" -ForegroundColor Green

# Mostrar información del proyecto
Write-Host "`n📊 INFORMACIÓN DEL PROYECTO:" -ForegroundColor Cyan
Write-Host "Nombre: Asistente de Medios BCV" -ForegroundColor White
Write-Host "Framework: React + TypeScript + Vite" -ForegroundColor White
Write-Host "Directorio de salida: dist/" -ForegroundColor White

# Verificar variables de entorno críticas
Write-Host "`n🔐 VERIFICANDO VARIABLES DE ENTORNO:" -ForegroundColor Cyan
$envVars = @(
    "VITE_GEMINI_API_KEY",
    "VITE_TELEGRAM_API_ID", 
    "VITE_TELEGRAM_API_HASH",
    "VITE_NEWS_API_KEY",
    "VITE_YOUTUBE_API_KEY"
)

foreach ($var in $envVars) {
    $value = [Environment]::GetEnvironmentVariable($var)
    if ($value) {
        Write-Host "✅ $var configurada" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $var no configurada (funcionalidad limitada)" -ForegroundColor Yellow
    }
}

# Preguntar si continuar con deployment
Write-Host "`n🚀 ¿Desea continuar con el deployment a Vercel? (Y/N): " -ForegroundColor Cyan -NoNewline
$response = Read-Host

if ($response -eq "Y" -or $response -eq "y" -or $response -eq "yes" -or $response -eq "Yes") {
    Write-Host "🚀 Iniciando deployment a Vercel..." -ForegroundColor Green
    
    # Ejecutar deployment
    vercel --prod
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n🎉 ¡DEPLOYMENT COMPLETADO EXITOSAMENTE!" -ForegroundColor Green
        Write-Host "✅ La aplicación está ahora disponible en producción" -ForegroundColor Green
        Write-Host "🔗 Revise la URL proporcionada por Vercel arriba" -ForegroundColor Cyan
        
        Write-Host "`n📋 PRÓXIMOS PASOS:" -ForegroundColor Cyan
        Write-Host "1. Configure las variables de entorno en el dashboard de Vercel" -ForegroundColor White
        Write-Host "2. Pruebe todas las funcionalidades en producción" -ForegroundColor White
        Write-Host "3. Configure el dominio personalizado si es necesario" -ForegroundColor White
        
    } else {
        Write-Host "❌ Error durante el deployment" -ForegroundColor Red
        Write-Host "Revise los logs arriba para más detalles" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "⏸️  Deployment cancelado por el usuario" -ForegroundColor Yellow
    Write-Host "El build está listo. Puede ejecutar 'vercel --prod' manualmente cuando esté listo." -ForegroundColor Cyan
}

Write-Host "`n=== PROCESO COMPLETADO ===" -ForegroundColor Cyan
