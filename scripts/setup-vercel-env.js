#!/usr/bin/env node

import { execSync } from 'child_process';

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