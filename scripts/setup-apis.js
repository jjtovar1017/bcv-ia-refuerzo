#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupAPIs() {
    console.log('🚀 Configuración de APIs para Asistente de Medios BCV\n');
    console.log('Este script te ayudará a configurar todas las APIs necesarias.\n');

    const envPath = path.join(process.cwd(), '.env');
    const examplePath = path.join(process.cwd(), 'env.example');

    // Check if .env already exists
    if (fs.existsSync(envPath)) {
        const overwrite = await question('El archivo .env ya existe. ¿Deseas sobrescribirlo? (y/N): ');
        if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
            console.log('Configuración cancelada.');
            rl.close();
            return;
        }
    }

    let envContent = '';

    console.log('📱 Configuración de Telegram:');
    console.log('Para obtener las credenciales de Telegram:');
    console.log('1. Ve a https://my.telegram.org/auth');
    console.log('2. Inicia sesión con tu número: +5804123868364');
    console.log('3. Ve a "API development tools"');
    console.log('4. Crea una nueva aplicación\n');

    const telegramApiId = await question('Telegram API ID: ');
    const telegramApiHash = await question('Telegram API Hash: ');
    const telegramBotToken = await question('Telegram Bot Token (opcional): ');

    console.log('\n🤖 Configuración de AI Services:');
    console.log('Para obtener las API keys:');
    console.log('- Gemini: https://makersuite.google.com/app/apikey');
    console.log('- DeepSeek: https://platform.deepseek.com/');
    console.log('- Mistral: https://console.mistral.ai/\n');

    const geminiApiKey = await question('Gemini API Key: ');
    const deepSeekApiKey = await question('DeepSeek API Key: ');
    const mistralApiKey = await question('Mistral API Key (opcional): ');

    console.log('\n📰 Configuración de News API:');
    console.log('Para obtener News API key: https://newsapi.org/register\n');
    const newsApiKey = await question('News API Key: ');

    console.log('\n🎤 Configuración de AssemblyAI:');
    console.log('Para transcripción de audio: https://www.assemblyai.com/\n');
    const assemblyAiApiKey = await question('AssemblyAI API Key (opcional): ');

    console.log('\n🗄️ Configuración de Supabase:');
    console.log('Para base de datos: https://supabase.com/\n');
    const supabaseUrl = await question('Supabase URL: ');
    const supabaseKey = await question('Supabase Anon Key: ');

    // Build environment content
    envContent = `# API Keys for BCV Media Assistant
# Generated on ${new Date().toISOString()}

# AI Services
VITE_GEMINI_API_KEY=${geminiApiKey}
VITE_DEEPSEEK_API_KEY=${deepSeekApiKey}
VITE_MISTRAL_API_KEY=${mistralApiKey}

# Telegram Configuration
VITE_TELEGRAM_API_ID=${telegramApiId}
VITE_TELEGRAM_API_HASH=${telegramApiHash}
VITE_TELEGRAM_PHONE_NUMBER=+5804123868364
VITE_TELEGRAM_BOT_TOKEN=${telegramBotToken}

# News API
VITE_NEWS_API_KEY=${newsApiKey}

# AssemblyAI for Audio Transcription
VITE_ASSEMBLYAI_API_KEY=${assemblyAiApiKey}

# Supabase Configuration
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_KEY=${supabaseKey}

# GPS Tracking Services (opcional)
VITE_TRACCAR_API_URL=http://localhost:8082/api
VITE_TRACCAR_API_KEY=
VITE_GPSGATE_API_URL=
VITE_GPSGATE_API_KEY=
VITE_FLEETCOMPLETE_API_URL=
VITE_FLEETCOMPLETE_API_KEY=

# WebSocket Configuration
VITE_WS_URL=ws://localhost:3001

# Sentry Configuration (opcional)
VITE_SENTRY_DSN=

# Environment
VITE_NODE_ENV=development
`;

    // Write .env file
    try {
        fs.writeFileSync(envPath, envContent);
        console.log('\n✅ Archivo .env creado exitosamente!');
        console.log('\n📋 Resumen de configuración:');
        console.log(`- Telegram API ID: ${telegramApiId ? '✅ Configurado' : '❌ No configurado'}`);
        console.log(`- Telegram API Hash: ${telegramApiHash ? '✅ Configurado' : '❌ No configurado'}`);
        console.log(`- Gemini API Key: ${geminiApiKey ? '✅ Configurado' : '❌ No configurado'}`);
        console.log(`- DeepSeek API Key: ${deepSeekApiKey ? '✅ Configurado' : '❌ No configurado'}`);
        console.log(`- News API Key: ${newsApiKey ? '✅ Configurado' : '❌ No configurado'}`);
        console.log(`- Supabase URL: ${supabaseUrl ? '✅ Configurado' : '❌ No configurado'}`);
        
        console.log('\n🚀 Para iniciar el proyecto:');
        console.log('1. npm install');
        console.log('2. npm run dev');
        console.log('\n📱 El número de teléfono +5804123868364 ya está configurado para Telegram.');
        
    } catch (error) {
        console.error('❌ Error al crear el archivo .env:', error.message);
    }

    rl.close();
}

setupAPIs().catch(console.error); 