#!/usr/bin/env node

import { telegramService } from '../services/telegramService.js';

async function testTelegramIntegration() {
    console.log('🧪 Probando integración con Telegram...\n');

    try {
        // Test 1: Verificar configuración
        console.log('1️⃣ Verificando configuración de Telegram...');
        const botInfo = await telegramService.getBotInfo();
        console.log('✅ Configuración de bot:', botInfo ? 'OK' : 'No disponible');
        
        // Test 2: Obtener noticias reales
        console.log('\n2️⃣ Obteniendo noticias reales de Telegram...');
        const realNews = await telegramService.getRealTimeNews(['bcv_oficial', 'veneconomia'], 3);
        console.log(`✅ Noticias reales obtenidas: ${realNews.length} mensajes`);
        
        if (realNews.length > 0) {
            console.log('\n📰 Últimas noticias:');
            realNews.forEach((msg, index) => {
                console.log(`${index + 1}. [${msg.channel}] ${msg.text.substring(0, 100)}...`);
                console.log(`   📅 ${msg.timestamp}`);
            });
        }

        // Test 3: Obtener noticias específicas del BCV
        console.log('\n3️⃣ Obteniendo noticias específicas del BCV...');
        const bcvNews = await telegramService.getBCVNews(5);
        console.log(`✅ Noticias del BCV: ${bcvNews.length} mensajes`);
        
        if (bcvNews.length > 0) {
            console.log('\n🏦 Noticias relacionadas con BCV:');
            bcvNews.forEach((msg, index) => {
                console.log(`${index + 1}. [${msg.channel}] ${msg.text.substring(0, 100)}...`);
            });
        }

        // Test 4: Obtener noticias financieras venezolanas
        console.log('\n4️⃣ Obteniendo noticias financieras venezolanas...');
        const venezuelanNews = await telegramService.getVenezuelanFinancialNews(5);
        console.log(`✅ Noticias financieras venezolanas: ${venezuelanNews.length} mensajes`);

        // Test 5: Búsqueda por palabras clave
        console.log('\n5️⃣ Probando búsqueda por palabras clave...');
        const searchResults = await telegramService.searchMessages(['bcv_oficial', 'veneconomia'], 'tipo de cambio', 3);
        console.log(`✅ Resultados de búsqueda: ${searchResults.length} mensajes`);

        console.log('\n🎉 ¡Todas las pruebas completadas exitosamente!');
        console.log('\n📊 Resumen:');
        console.log(`- Noticias reales: ${realNews.length}`);
        console.log(`- Noticias BCV: ${bcvNews.length}`);
        console.log(`- Noticias financieras: ${venezuelanNews.length}`);
        console.log(`- Resultados de búsqueda: ${searchResults.length}`);

    } catch (error) {
        console.error('❌ Error durante las pruebas:', error.message);
        console.log('\n🔧 Posibles soluciones:');
        console.log('1. Verificar que las credenciales de Telegram estén correctas');
        console.log('2. Verificar conexión a internet');
        console.log('3. Verificar que los canales existan y sean públicos');
        console.log('4. Revisar los logs del navegador para más detalles');
    }
}

// Ejecutar las pruebas
testTelegramIntegration().catch(console.error); 