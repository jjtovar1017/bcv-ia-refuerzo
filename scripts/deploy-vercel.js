#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

<<<<<<< HEAD
// API Keys from .env file - REPLACE WITH YOUR ACTUAL VALUES
const API_KEYS = {
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
// API Keys from .env file
const API_KEYS = {
    'VITE_GEMINI_API_KEY': 'REDACTED',
    'VITE_TELEGRAM_API_ID': '24872368',
    'VITE_TELEGRAM_API_HASH': 'REDACTED',
    'VITE_DEEPSEEK_API_KEY': 'REDACTED-v1-cf228bddb366ebe43003937b8b9a935a95bf591651514f153b46c04af5da43fa',
    'VITE_MISTRAL_API_KEY': 'expFd0dF8dFMjJzMhDWpKpQbhW2plC5A',
    'VITE_ASSEMBLYAI_API_KEY': 'REDACTED',
    'VITE_SUPABASE_URL': 'https://nrvtxgkkjmmvxyypybkt.supabase.co',
    'VITE_SUPABASE_KEY': 'REDACTED...',
    'VITE_NEWS_API_KEY': 'REDACTED'
>>>>>>> 0d38ca5586e0d0883fe98444281ec01408abba36
};

async function deployToVercel() {
    console.log('🚀 Iniciando deploy a Vercel...\n');

    try {
        // Paso 1: Verificar que Vercel CLI esté instalado
        console.log('1️⃣ Verificando Vercel CLI...');
        try {
            execSync('vercel --version', { stdio: 'pipe' });
            console.log('✅ Vercel CLI encontrado');
        } catch (error) {
            console.log('❌ Vercel CLI no encontrado. Instalando...');
            execSync('npm install -g vercel', { stdio: 'inherit' });
        }

        // Paso 2: Configurar variables de entorno
        console.log('\n2️⃣ Configurando variables de entorno...');
        for (const [key, value] of Object.entries(API_KEYS)) {
            try {
                execSync(`vercel env add ${key} production`, { 
                    input: value + '\n',
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                console.log(`✅ ${key} configurado`);
            } catch (error) {
                console.log(`⚠️ ${key} ya existe o hubo un error`);
            }
        }

        // Paso 3: Hacer build
        console.log('\n3️⃣ Construyendo proyecto...');
        execSync('npm run build', { stdio: 'inherit' });
        console.log('✅ Build completado');

        // Paso 4: Deploy
        console.log('\n4️⃣ Desplegando a Vercel...');
        execSync('vercel --prod', { stdio: 'inherit' });

        console.log('\n🎉 ¡Deploy completado exitosamente!');
        console.log('\n📋 Próximos pasos:');
        console.log('1. Verificar que la aplicación funcione en producción');
        console.log('2. Probar todas las funcionalidades');
        console.log('3. Configurar dominio personalizado si es necesario');

    } catch (error) {
        console.error('❌ Error durante el deploy:', error.message);
        console.log('\n🔧 Soluciones posibles:');
        console.log('1. Verificar que estés logueado en Vercel: vercel login');
        console.log('2. Verificar que el proyecto esté inicializado: vercel');
        console.log('3. Verificar que las variables de entorno estén configuradas');
    }
}

// Ejecutar el deploy
deployToVercel().catch(console.error); 
