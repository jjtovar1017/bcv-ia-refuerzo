#!/usr/bin/env node

import { execSync } from 'child_process';

<<<<<<< HEAD
// API Keys - REPLACE WITH YOUR ACTUAL VALUES
const ENV_VARS = {
    'VITE_GEMINI_API_KEY': 'tu_gemini_api_key',
    'VITE_TELEGRAM_API_ID': 'tu_telegram_api_id',
    'VITE_TELEGRAM_API_HASH': 'tu_telegram_api_hash',
    'VITE_DEEPSEEK_API_KEY': 'tu_deepseek_api_key',
    'VITE_MISTRAL_API_KEY': 'tu_mistral_api_key',
    'VITE_ASSEMBLYAI_API_KEY': 'tu_assemblyai_api_key',
    'VITE_SUPABASE_URL': 'tu_supabase_url',
    'VITE_SUPABASE_KEY': 'tu_supabase_anon_key',
    'VITE_NEWS_API_KEY': 'tu_news_api_key'
=======
// API Keys
const ENV_VARS = {
    'VITE_GEMINI_API_KEY': 'AIzaSyA2ashMcxgh0v5fyi2c8WNbgWLU4e1sBeE',
    'VITE_TELEGRAM_API_ID': '24872368',
    'VITE_TELEGRAM_API_HASH': '530f9c024100d709ea0f7ce47f998a9a',
    'VITE_DEEPSEEK_API_KEY': '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',
    'VITE_MISTRAL_API_KEY': 'expFd0dF8dFMjJzMhDWpKpQbhW2plC5A',
    'VITE_ASSEMBLYAI_API_KEY': 'adc8f30c594f45f2bda5006b521c1d22',
    'VITE_SUPABASE_URL': 'https://nrvtxgkkjmmvxyypybkt.supabase.co',
    'VITE_SUPABASE_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydnR4Z2tram1tdnh5eXB5Ymt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NzI5NzAsImV4cCI6MjA1MTU0ODk3MH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8',
    'VITE_NEWS_API_KEY': '96e755c09a944dbb80c920a680ca5712'
>>>>>>> 0d38ca5586e0d0883fe98444281ec01408abba36
};

console.log('🔧 Configurando variables de entorno en Vercel...\n');

for (const [key, value] of Object.entries(ENV_VARS)) {
    try {
        console.log(`Configurando ${key}...`);
        execSync(`vercel env add ${key} production`, { 
            input: value + '\n',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        console.log(`✅ ${key} configurado`);
    } catch (error) {
        console.log(`⚠️ ${key} ya existe o hubo un error`);
    }
}

console.log('\n🎉 Variables de entorno configuradas!');
console.log('Ahora puedes ejecutar: vercel --prod'); 