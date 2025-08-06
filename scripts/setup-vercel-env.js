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
    'VITE_GEMINI_API_KEY': 'REDACTED',
    'VITE_TELEGRAM_API_ID': '24872368',
    'VITE_TELEGRAM_API_HASH': 'REDACTED',
    'VITE_DEEPSEEK_API_KEY': 'REDACTED-v1-cf228bddb366ebe43003937b8b9a935a95bf591651514f153b46c04af5da43fa',
    'VITE_MISTRAL_API_KEY': 'expFd0dF8dFMjJzMhDWpKpQbhW2plC5A',
    'VITE_ASSEMBLYAI_API_KEY': 'REDACTED',
    'VITE_SUPABASE_URL': 'https://nrvtxgkkjmmvxyypybkt.supabase.co',
    'VITE_SUPABASE_KEY': 'REDACTED.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydnR4Z2tram1tdnh5eXB5Ymt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NzI5NzAsImV4cCI6MjA1MTU0ODk3MH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8',
    'VITE_NEWS_API_KEY': 'REDACTED'
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
