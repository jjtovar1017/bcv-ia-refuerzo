#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Variables de entorno requeridas - REEMPLAZAR CON TUS VALORES REALES
const ENV_VARS = {
    'VITE_GEMINI_API_KEY': process.env.VITE_GEMINI_API_KEY || 'tu_gemini_api_key',
    'VITE_TELEGRAM_API_ID': process.env.VITE_TELEGRAM_API_ID || 'tu_telegram_api_id',
    'VITE_TELEGRAM_API_HASH': process.env.VITE_TELEGRAM_API_HASH || 'tu_telegram_api_hash',
    'VITE_DEEPSEEK_API_KEY': process.env.VITE_DEEPSEEK_API_KEY || 'tu_deepseek_api_key',
    'VITE_MISTRAL_API_KEY': process.env.VITE_MISTRAL_API_KEY || 'tu_mistral_api_key',
    'VITE_ASSEMBLYAI_API_KEY': process.env.VITE_ASSEMBLYAI_API_KEY || 'tu_assemblyai_api_key',
    'VITE_SUPABASE_URL': process.env.VITE_SUPABASE_URL || 'tu_supabase_url',
    'VITE_SUPABASE_KEY': process.env.VITE_SUPABASE_KEY || 'tu_supabase_anon_key',
    'VITE_NEWS_API_KEY': process.env.VITE_NEWS_API_KEY || 'tu_news_api_key'
};

async function deployToNetlify() {
    console.log('🚀 Iniciando deploy a Netlify...\n');

    try {
        // Paso 1: Verificar que Netlify CLI esté instalado
        console.log('1️⃣ Verificando Netlify CLI...');
        try {
            execSync('netlify --version', { stdio: 'pipe' });
            console.log('✅ Netlify CLI encontrado');
        } catch (error) {
            console.log('❌ Netlify CLI no encontrado. Instalando...');
            execSync('npm install -g netlify-cli', { stdio: 'inherit' });
        }

        // Paso 2: Login en Netlify
        console.log('\n2️⃣ Verificando login en Netlify...');
        try {
            execSync('netlify status', { stdio: 'pipe' });
            console.log('✅ Ya estás logueado en Netlify');
        } catch (error) {
            console.log('❌ Necesitas hacer login en Netlify');
            console.log('Ejecuta: netlify login');
            return;
        }

        // Paso 3: Hacer build
        console.log('\n3️⃣ Construyendo proyecto...');
        execSync('npm run build', { stdio: 'inherit' });
        console.log('✅ Build completado');

        // Paso 4: Deploy
        console.log('\n4️⃣ Desplegando a Netlify...');
        
        // Deploy inicial o actualización
        try {
            // Intentar deploy en sitio existente
            execSync('netlify deploy --prod --dir=dist', { stdio: 'inherit' });
        } catch (error) {
            // Si no existe, crear nuevo sitio
            console.log('Creando nuevo sitio en Netlify...');
            execSync('netlify deploy --prod --dir=dist --open', { stdio: 'inherit' });
        }

        console.log('\n🎉 ¡Deploy completado exitosamente!');
        console.log('\n📋 Próximos pasos:');
        console.log('1. Configurar variables de entorno en Netlify dashboard');
        console.log('2. Verificar que la aplicación funcione en producción');
        console.log('3. Probar todas las funcionalidades');
        console.log('4. Configurar dominio personalizado si es necesario');

        console.log('\n🔧 Variables de entorno a configurar en Netlify:');
        Object.keys(ENV_VARS).forEach(key => {
            console.log(`   - ${key}`);
        });

    } catch (error) {
        console.error('❌ Error durante el deploy:', error.message);
        console.log('\n🔧 Soluciones posibles:');
        console.log('1. Verificar que estés logueado en Netlify: netlify login');
        console.log('2. Verificar que el proyecto esté inicializado: netlify init');
        console.log('3. Verificar que las dependencias estén instaladas: npm install');
    }
}

// Ejecutar el deploy
deployToNetlify().catch(console.error);
