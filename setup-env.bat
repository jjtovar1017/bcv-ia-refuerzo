@echo off
echo Configurando variables de entorno para el Asistente de Medios BCV...
echo.

(
echo # APIs de Google (Gemini^)
echo VITE_GEMINI_API_KEY=AIzaSyAojUUxKxHNZd37FLlxgmvi0L5VguQgvC4
echo.
echo # Telegram (tus credenciales^)
echo VITE_TELEGRAM_API_ID=24872368
echo VITE_TELEGRAM_API_HASH=530f9c024100d709ea0f7ce47f998a9a
echo VITE_TELEGRAM_BOT_TOKEN=8324282576:AAFxcAxkLHtD9vguAlvEdZMYUgP19MtkGUg
echo.
echo # Otras APIs de IA
echo VITE_DEEPSEEK_API_KEY=sk-6fd9b7f128864de0affe6af2fc6d1540
echo VITE_MISTRAL_API_KEY=InAfPsMLdqKVtrfM3e98xeVMdwWtVCoo
echo VITE_ASSEMBLYAI_API_KEY=adc8f30c594f45f2bda5006b521c1d22
echo.
echo # Supabase
echo VITE_SUPABASE_URL=https://hhrbeihchhzjkwandnuu.supabase.co
echo VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhocmJlaWhjaGh6amt3YW5kbnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzOTI0ODAsImV4cCI6MjA2OTk2ODQ4MH0.poV-PtvJ6X5apmd2wlcavyEjPoI7b7TF9xa10Qn1sKA
echo.
echo # APIs adicionales para servicios reales
echo VITE_NEWS_API_KEY=96e755c09a944dbb80c920a680ca5712
echo VITE_SERP_API_KEY=184e5e93159a075a62a6d269c7372a6b56064526339a9550fab3e453ebe98fcf
echo.
echo # Configuracion adicional
echo VITE_TRACCAR_API_URL=your_traccar_url
echo VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
) > .env

echo ✅ Archivo .env creado exitosamente con todas las API keys configuradas.
echo.
echo Ahora reinicia el servidor de desarrollo para aplicar los cambios:
echo npm run dev
echo.
pause
