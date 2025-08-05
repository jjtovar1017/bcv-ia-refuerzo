#!/usr/bin/env node

import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Variables de entorno requeridas
const ENV_VARS = [
    {
        name: 'VITE_GEMINI_API_KEY',
        description: 'Clave de API de Google Gemini para generación de contenido'
    },
    {
        name: 'VITE_TELEGRAM_API_ID',
        description: 'ID de la aplicación de Telegram'
    },
    {
        name: 'VITE_TELEGRAM_API_HASH',
        description: 'Hash de la aplicación de Telegram'
    },
    {
        name: 'VITE_DEEPSEEK_API_KEY',
        description: 'Clave de API de DeepSeek para análisis avanzado'
    },
    {
        name: 'VITE_MISTRAL_API_KEY',
        description: 'Clave de API de Mistral como alternativa'
    },
    {
        name: 'VITE_ASSEMBLYAI_API_KEY',
        description: 'Clave de API de AssemblyAI para transcripción de audio'
    },
    {
        name: 'VITE_SUPABASE_URL',
        description: 'URL de tu proyecto de Supabase'
    },
    {
        name: 'VITE_SUPABASE_KEY',
        description: 'Clave anónima de Supabase'
    },
    {
        name: 'VITE_NEWS_API_KEY',
        description: 'Clave de API de News API para noticias adicionales'
    }
];

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

async function setupNetlifyEnvironment() {
    console.log('🔧 Configurando variables de entorno en Netlify...\n');
    
    try {
        // Verificar que Netlify CLI esté instalado y logueado
        console.log('1️⃣ Verificando Netlify CLI...');
        try {
            execSync('netlify status', { stdio: 'pipe' });
            console.log('✅ Netlify CLI configurado correctamente\n');
        } catch (error) {
            console.log('❌ Necesitas hacer login en Netlify primero');
            console.log('Ejecuta: netlify login\n');
            return;
        }

        console.log('📋 Configuraremos las siguientes variables de entorno:\n');
        ENV_VARS.forEach((env, index) => {
            console.log(`${index + 1}. ${env.name}`);
            console.log(`   ${env.description}\n`);
        });

        const proceed = await askQuestion('¿Deseas continuar? (y/n): ');
        if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
            console.log('❌ Configuración cancelada');
            rl.close();
            return;
        }

        console.log('\n2️⃣ Configurando variables de entorno...\n');

        for (const env of ENV_VARS) {
            const value = await askQuestion(`Ingresa el valor para ${env.name}: `);
            
            if (value.trim()) {
                try {
                    // Configurar variable en Netlify
                    execSync(`netlify env:set ${env.name} "${value}"`, { stdio: 'pipe' });
                    console.log(`✅ ${env.name} configurado correctamente`);
                } catch (error) {
                    console.log(`❌ Error configurando ${env.name}: ${error.message}`);
                }
            } else {
                console.log(`⚠️ Saltando ${env.name} (valor vacío)`);
            }
        }

        console.log('\n🎉 ¡Variables de entorno configuradas!');
        console.log('\n📋 Próximos pasos:');
        console.log('1. Ejecutar deploy: npm run deploy:netlify');
        console.log('2. Verificar que la aplicación funcione correctamente');
        console.log('3. Probar todas las funcionalidades');

    } catch (error) {
        console.error('❌ Error durante la configuración:', error.message);
    } finally {
        rl.close();
    }
}

// Ejecutar la configuración
setupNetlifyEnvironment().catch(console.error);
