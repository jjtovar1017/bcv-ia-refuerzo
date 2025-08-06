#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function updateNewsAPI() {
    console.log('📰 Actualizando News API Key...\n');

    const envPath = path.join(process.cwd(), '.env');
    
    if (!fs.existsSync(envPath)) {
        console.error('❌ No se encontró el archivo .env');
        return;
    }

    try {
        // Leer el archivo .env actual
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        // Actualizar la News API Key
        const newApiKey = 'REDACTED';
        
        // Reemplazar la línea existente o agregar una nueva
        if (envContent.includes('REDACTED {
            envContent = envContent.replace(
                /REDACTED
                `REDACTED
            );
        } else {
            envContent += `\nREDACTED
        }
        
        // Escribir el archivo actualizado
        fs.writeFileSync(envPath, envContent);
        
        console.log('✅ News API Key actualizada exitosamente!');
        console.log(`📰 Nueva API Key: ${newApiKey}`);
        console.log('\n🔧 Para aplicar los cambios:');
        console.log('1. Reinicia el servidor de desarrollo: npm run dev');
        console.log('2. Las noticias adicionales estarán disponibles');
        
    } catch (error) {
        console.error('❌ Error al actualizar News API Key:', error.message);
    }
}

// Ejecutar la actualización
updateNewsAPI().catch(console.error); 
