import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AIModel, TranscriptionSource, NewsSearchType, EconomicNewsResult, GroundingSource, TelegramMessage } from "../types";
import { deepSeekService } from "./deepSeekService";
import * as Sentry from '@sentry/react';

// Accede a las variables de entorno usando import.meta.env de Vite
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
if (!apiKey) {
    console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey });

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            const base64Data = dataUrl.substring(dataUrl.indexOf(',') + 1);
            resolve(base64Data);
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
    
    const base64Data = await base64EncodedDataPromise;
    
    return {
        inlineData: {
            data: base64Data,
            mimeType: file.type,
        },
    };
};

const getModelForTask = (modelId: AIModel) => {
    if (modelId === AIModel.Gemini) {
        return 'gemini-2.5-flash';
    }
    return 'gemini-2.5-flash';
};

/**
 * Función ficticia para simular la generación de contenido de DeepSeek.
 * DEBES implementar esta función en tu deepSeekService.ts para un uso real.
 */
const generateDeepSeekContent = async (topic: string, contentType: string, prompt: string): Promise<string> => {
    console.warn("generateDeepSeekContent no está implementada. Usando una simulación.");
    return `[SIMULACIÓN DE DEEPSEEK] Se generó el contenido para el tema "${topic}" con tipo "${contentType}" a partir del prompt proporcionado.`;
};


export const generateBcvContent = async (
    topic: string,
    contentType: string,
    model: AIModel,
    contextText?: string
): Promise<string> => {
    const contextInstruction = contextText
        ? `Además de tus conocimientos, debes basar tu respuesta obligatoriamente en el siguiente texto de contexto proporcionado por el usuario. Analízalo y úsalo como fuente principal para los datos, cifras y análisis.\n\n--- INICIO DEL CONTEXTO ---\n${contextText}\n--- FIN DEL CONTEXTO ---\n\n`
        : '';

    const basePrompt = `
    **Rol y Misión:**
    Eres un periodista del Banco Central de Venezuela (BCV). Especialista en análisis de entorno comunicacional y generación de alertas sobre matrices que impacten la imagen del Instituto. Tu tendencia es institucional y el foco de tu accionar se basa en la protección de la imagen del BCV.

    **Objetivo Principal:**
    Tu misión es redactar un **${contentType}** sobre el tema: **"${topic}"**. Debes proteger y realzar la imagen del BCV como ente encargado de la política monetaria, que vela por la estabilidad financiera y económica, que resguarda las reservas monetarias y también parte del patrimonio cultural de la nación.

    ${contextInstruction}

    **Lineamientos Estrictos:**

    **1. Tono y Estilo:**
    - **Institucional y Protector:** El lenguaje debe ser formal, objetivo y siempre alineado con la defensa de la reputación del BCV.
    - **Analítico y Preciso:** Utiliza un lenguaje técnico-financiero exacto, pero explícalo de forma clara cuando sea necesario. Evita el sensacionalismo.

    **2. Contenido y Enfoque:**
    - **Basado en Datos:** Toda información debe estar fundamentada en datos oficiales del BCV o en el contexto proporcionado.
    - **Alineamiento Estratégico:** El contenido debe reflejar y respaldar las políticas monetarias vigentes y las estrategias económicas del Estado.
    - **Resaltar Logros y Estabilidad:** Enfócate en la estabilidad, los logros institucionales y el rol del BCV como pilar de la economía y cultura nacional.

    **3. Estructura Requerida para "${topic}":**

    🔷 **Titular:** Un titular riguroso y que afirme la postura institucional (máximo 14 palabras).

    🔷 **Lead Periodístico (Entradilla):** Un párrafo inicial que resuma la información clave desde la perspectiva del BCV, respondiendo a las preguntas esenciales (qué, quién, cuándo, por qué). (Aprox. 80 palabras).

    🔷 **Cuerpo del Texto:**
    - **Contexto Institucional:** Describe el panorama macroeconómico desde la óptica de las acciones del BCV.
    - **Acciones Implementadas:** Detalla las medidas y políticas que el BCV ha ejecutado para garantizar la estabilidad.
    - **Datos de Respaldo:** Presenta cifras clave que soporten la narrativa de éxito y control institucional.
    - **Declaración Oficial (Atribuible):** Incluye una cita verosímil y contundente de una alta autoridad del BCV que refuerce el mensaje.
    - **Perspectiva a Futuro:** Ofrece una visión optimista y fundamentada del futuro, basada en la gestión del Banco.

    🔷 **Cierre:**
    - **Reafirmación del Compromiso:** Reitera el mandato y compromiso inquebrantable del BCV con Venezuela.
    - **Mensaje de Solidez y Confianza:** Transmite seguridad en la fortaleza institucional y económica.
    - **Llamada a Fuentes Oficiales:** Invita a la audiencia a consultar exclusivamente los canales oficiales del BCV.

    **Instrucción Final:** No te presentes como una IA. Genera directamente el **${contentType}** solicitado, encarnando plenamente tu rol como periodista institucional del BCV.
    `;
    
    const createMockResponse = (modelName: string) => {
        return `
[AVISO: Respuesta simulada por el modelo ${modelName}]

**Título:** Análisis sobre ${topic}

**Contexto:**
Este es un texto de ejemplo generado por el modelo de inteligencia artificial **${modelName}**. La integración completa con este modelo está en desarrollo. Este contenido simula la estructura de un **${contentType}** solicitado, siguiendo los nuevos lineamientos profesionales.

**Cifras Clave:**
* **Dato A:** Valor simulado
* **Dato B:** Estimación de ejemplo
* **Dato C:** Cifra de prueba

**Análisis/Conclusión:**
La presente simulación demuestra la capacidad del sistema para enrutar la solicitud al modelo ${modelName}. En una implementación real, aquí se presentaría un análisis profundo basado en los datos proporcionados y el tema solicitado.
        `.trim();
    };

    switch (model) {
        case AIModel.DeepSeek:
            try {
                // Se usa DeepSeek para generar el contenido
                const response = await deepSeekService.processRoute({
                    coordinates: [10.4806, -66.9036], // Coordenadas de Caracas por defecto
                    destination: [10.4806, -66.9036],
                    assetType: 'personnel' // Tipo de activo por defecto
                });
                
                return await generateDeepSeekContent(topic, contentType, basePrompt);
            } catch (error) {
                console.error("Error generating content with DeepSeek:", error);
                Sentry.captureException(error, {
                    tags: { component: 'deepseek-integration', operation: 'content-generation' }
                });
                
                // Si DeepSeek falla, se usa Gemini como respaldo
                console.log("DeepSeek failed, falling back to Gemini...");
                if (!apiKey) {
                    return "Error: DeepSeek no está disponible y la clave de API de Gemini no está configurada.";
                }
                try {
                    const geminiModel = getModelForTask(AIModel.Gemini);
                    const response: GenerateContentResponse = await ai.models.generateContent({
                        model: geminiModel,
                        contents: basePrompt + "\n\n[NOTA: Generado con Gemini como respaldo debido a problemas con DeepSeek]",
                    });
                    return response.text;
                } catch (geminiError) {
                    console.error("Gemini fallback also failed:", geminiError);
                    return "Ha ocurrido un error con DeepSeek y el sistema de respaldo Gemini también falló. Por favor, inténtelo de nuevo más tarde.";
                }
            }

        case AIModel.Gemini:
            if (!apiKey) {
                return Promise.resolve("Error: La clave de API de Gemini no está configurada. Por favor, configure la variable de entorno API_KEY.");
            }
            try {
                const geminiModel = getModelForTask(model);
                const response: GenerateContentResponse = await ai.models.generateContent({
                    model: geminiModel,
                    contents: basePrompt,
                });
                return response.text;
            } catch (error) {
                console.error("Error generating content with Gemini:", error);
                return "Ha ocurrido un error al contactar el servicio de IA de Gemini. Por favor, inténtelo de nuevo más tarde.";
            }

        case AIModel.Mistral:
            console.log("Mistral model not yet implemented. Using DeepSeek fallback...");
            try {
                return await generateDeepSeekContent(topic, contentType, basePrompt);
            } catch (error) {
                return "Error: El modelo Mistral no está disponible. DeepSeek tampoco pudo procesar la solicitud.";
            }
            
        default:
            console.warn(`Modelo de IA no reconocido: ${model}`);
            return Promise.resolve(`Error: El modelo de IA seleccionado ('${model}') no es reconocido por el sistema.`);
    }
};

export const generateImageWithImagen = async (prompt: string): Promise<string> => {
    if (!apiKey) {
        throw new Error("Error: La clave de API de Gemini no está configurada.");
    }
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        } else {
            throw new Error("No se generó ninguna imagen. El resultado podría estar bloqueado por políticas de seguridad.");
        }
    } catch (error) {
        console.error("Error generating image with Imagen:", error);
        throw new Error("Ha ocurrido un error al generar la imagen. Por favor, inténtelo de nuevo más tarde.");
    }
};

export const transcribeAudioWithGemini = async (source: TranscriptionSource): Promise<string> => {
    if (!apiKey) {
        return Promise.resolve("Error: La clave de API de Gemini no está configurada.");
    }

    if (source.type === 'file') {
        try {
            const audioFile = source.payload;
            const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
            if (audioFile.size > MAX_FILE_SIZE) { 
                throw new Error("El archivo es demasiado grande. Por favor, utilice archivos de menos de 25MB.");
            }

            const audioPart = await fileToGenerativePart(audioFile);
            const textPart = { text: "Transcribe este audio de manera precisa. Identifica los hablantes si es posible (ej. 'Hablante 1:')." };

            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [audioPart, textPart] },
            });

            return response.text;
        } catch (error: any) {
            console.error("Error transcribing audio with Gemini:", error);
            throw new Error(error.message || "Ha ocurrido un error durante la transcripción. Asegúrese de que el formato del archivo es compatible y no excede el límite de tamaño.");
        }
    } else { // 'url' simulación
        const prompt = `
            Eres un asistente de IA. El usuario ha proporcionado una URL de YouTube y quiere una transcripción.
            Como no puedes acceder a URLs externas, genera una **transcripción simulada y ficticia** que podría corresponder a un video con la URL: "${source.payload}".
            El video es un análisis económico sobre la situación actual de Venezuela.
            La transcripción debe incluir:
            - Un aviso claro al inicio que diga: "[NOTA: Esta es una transcripción simulada, generada por IA ya que no se puede acceder a URLs externas.]"
            - Una introducción del presentador.
            - Un análisis de la situación económica actual, incluyendo menciones a la inflación, el tipo de cambio y las políticas del BCV.
            - Citas de un economista ficticio o de un analista de mercado.
            - Una conclusión.
            - El texto debe ser coherente y profesional. No menciones que eres una IA de nuevo, solo el aviso inicial.
        `;
        
        try {
            const geminiModel = getModelForTask(AIModel.Gemini);
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: geminiModel,
                contents: prompt,
            });
            return response.text;
        } catch (error) {
            console.error("Error simulating transcription with Gemini:", error);
            return "Ha ocurrido un error al simular la transcripción. Por favor, inténtelo de nuevo más tarde.";
        }
    }
};

export const searchEconomicNews = async (
    query: string,
    model: AIModel,
    searchType: NewsSearchType,
): Promise<EconomicNewsResult> => {
    console.warn("Función de búsqueda de noticias no implementada. Se devolverá una respuesta simulada.");

    const newsData = [
        {
            title: "El BCV interviene en el mercado cambiario para estabilizar la moneda",
            source: "Prensa Oficial BCV",
            date: new Date().toISOString(),
            snippet: "El Banco Central de Venezuela ha anunciado una nueva intervención cambiaria para fortalecer el bolívar...",
            url: "http://www.bcv.org.ve/noticias/intervencion-cambiaria-2025"
        },
        {
            title: "Inflación interanual se desacelera según cifras del BCV",
            source: "Agencia de Noticias Venezolana",
            date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            snippet: "Las últimas estadísticas publicadas por el Banco Central de Venezuela (BCV) muestran una desaceleración en el índice de precios al consumidor...",
            url: "http://www.anv.com.ve/noticias/inflacion-desaceleracion"
        },
        {
            title: "Expertos analizan el impacto de la política monetaria del BCV en el crédito nacional",
            source: "Análisis Financiero Diario",
            date: new Date(Date.now() - 172800000).toISOString(), // Two days ago
            snippet: "Un panel de economistas discute las recientes medidas del BCV y su efecto en la disponibilidad de crédito para empresas y ciudadanos.",
            url: "http://www.afd.com/analisis/politica-monetaria-bcv"
        },
    ];

    const modelDescription = model === AIModel.Gemini ? "Gemini" : "otro modelo";

    return {
        query,
        searchType,
        news: newsData,
        groundingSources: [{
            title: `Análisis simulado por ${modelDescription}`,
            source: "Sistema de Asistencia de Medios BCV",
            snippet: `Se ha generado una respuesta de noticias simulada para la consulta "${query}". La búsqueda en tiempo real no está implementada en esta versión.`,
            uri: "http://simulacion.bcv.ai" // Corregido: 'url' a 'uri'
        } as GroundingSource],
    };
};

export const analyzeSentimentOfMessages = async (
    messages: TelegramMessage[],
    model: AIModel
): Promise<string> => {
    const combinedMessages = messages.map(msg => `**${msg.sender}**: ${msg.content}`).join('\n');
    const prompt = `
        **Rol:** Eres un analista de entorno comunicacional del Banco Central de Venezuela (BCV).
        **Tarea:** Analiza el siguiente conjunto de mensajes de Telegram.
        **Objetivo:** Determina la matriz de opinión principal (positiva, negativa, neutra) sobre el BCV o sus políticas.
        **Instrucciones:**
        1.  Identifica el sentimiento general de los mensajes hacia el BCV.
        2.  Resume la narrativa o "matriz de opinión" que se está formando.
        3.  Proporciona una conclusión concisa sobre el impacto percibido en la imagen institucional.
        4.  Genera un reporte estructurado y profesional basado en el siguiente formato:

        ---
        ### Análisis de Sentimiento en Mensajes de Telegram
        **Fecha del Análisis:** ${new Date().toLocaleDateString()}
        **Canal de Origen:** [Canal de Telegram]
        
        #### Resumen de la Conversación
        [Breve resumen del contenido de los mensajes, sin citarlos textualmente]
        
        #### Sentimiento Dominante
        [Indica si es Positivo, Negativo o Neutro, y justifica tu respuesta]
        
        #### Matrices de Opinión Identificadas
        [Detalla los puntos clave o narrativas que emergen de la conversación. Ejemplo: "Críticas a la política cambiaria", "Apoyo a la estabilidad del Bolívar"]
        
        #### Conclusión y Recomendaciones
        [Proporciona una conclusión sobre la imagen del BCV en el entorno digital y ofrece una recomendación de comunicación.]
        ---
        
        **Mensajes a Analizar:**
        ${combinedMessages}
    `;

    const createSentimentMock = () => {
        return `
---
### Análisis de Sentimiento en Mensajes de Telegram
**Fecha del Análisis:** ${new Date().toLocaleDateString()}
**Canal de Origen:** [Canal de Telegram]

#### Resumen de la Conversación
[Simulación] Los mensajes giran en torno a la reciente estabilidad del tipo de cambio y las expectativas sobre las próximas medidas económicas.

#### Sentimiento Dominante
**Neutro a Ligeramente Positivo**. La mayoría de los usuarios observan los resultados, pero aún hay cautela sobre la sostenibilidad a largo plazo.

#### Matrices de Opinión Identificadas
-   **Estabilidad Cambiaria:** Se reconoce el esfuerzo del BCV para mantener el tipo de cambio.
-   **Expectativa Económica:** Existe una matriz de opinión que espera más anuncios para impulsar el crecimiento.

#### Conclusión y Recomendaciones
La imagen del BCV en este canal es vista con una mezcla de reconocimiento y expectativa. Se recomienda una comunicación proactiva que resalte los logros en estabilidad y explique claramente la hoja de ruta a mediano plazo.
---
        `.trim();
    };

    switch (model) {
        case AIModel.DeepSeek:
            try {
                console.log("Using DeepSeek for sentiment analysis mock...");
                const deepSeekResponse = await deepSeekService.processRoute({
                    coordinates: [0,0], 
                    destination: [0,0], 
                    assetType: 'personnel'
                });
                return createSentimentMock();
            } catch (error) {
                console.error("Error with DeepSeek for sentiment analysis:", error);
                return createSentimentMock();
            }

        case AIModel.Gemini:
            if (!apiKey) {
                return Promise.resolve(createSentimentMock());
            }
            try {
                const geminiModel = getModelForTask(model);
                const response: GenerateContentResponse = await ai.models.generateContent({
                    model: geminiModel,
                    contents: prompt,
                });
                return response.text;
            } catch (error) {
                console.error("Error with Gemini for sentiment analysis:", error);
                return createSentimentMock();
            }

        case AIModel.Mistral:
            console.log("Mistral not implemented. Using mock for sentiment analysis.");
            return Promise.resolve(createSentimentMock());

        default:
            return Promise.resolve(createSentimentMock());
    }
};
