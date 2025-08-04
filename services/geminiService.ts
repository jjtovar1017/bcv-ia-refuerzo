
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { AIModel, EconomicNewsResult, GroundingSource, TranscriptionSource, NewsSearchType, TelegramMessage } from "../types";
import { deepSeekService } from "./deepSeekService";
import * as Sentry from '@sentry/react';

// Access environment variables using Vite's import.meta.env
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const deepSeekApiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || "";
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
    // For this app, we will always use Gemini, but this shows how one might route tasks.
    // In a real scenario, this could involve different clients for DeepSeek, Mistral, etc.
    if (modelId === AIModel.Gemini) {
        return 'gemini-2.5-flash';
    }
    // As a fallback or default
    return 'gemini-2.5-flash';
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
*   **Dato A:** Valor simulado
*   **Dato B:** Estimación de ejemplo
*   **Dato C:** Cifra de prueba

**Análisis/Conclusión:**
La presente simulación demuestra la capacidad del sistema para enrutar la solicitud al modelo ${modelName}. En una implementación real, aquí se presentaría un análisis profundo basado en los datos proporcionados y el tema solicitado.
        `.trim();
    };

    switch (model) {
        case AIModel.DeepSeek:
            try {
                // Use DeepSeek for content generation
                const response = await deepSeekService.processRoute({
                    coordinates: [10.4806, -66.9036], // Default Caracas coordinates
                    destination: [10.4806, -66.9036],
                    assetType: 'personnel' // Default for content generation
                });
                
                // For now, return a formatted response based on the topic
                return await generateDeepSeekContent(topic, contentType, basePrompt);
            } catch (error) {
                console.error("Error generating content with DeepSeek:", error);
                Sentry.captureException(error, {
                    tags: { component: 'deepseek-integration', operation: 'content-generation' }
                });
                
                // Fallback to Gemini when DeepSeek fails (e.g., 402 Payment Required)
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
        // Real transcription for file uploads
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
    } else { // 'url', keep simulation
        const prompt = `
            Eres un asistente de IA. El usuario ha proporcionado una URL de YouTube y quiere una transcripción.
            Como no puedes acceder a URLs externas, genera una **transcripción simulada y ficticia** que podría corresponder a un video con la URL: "${source.payload}".
            El video es un análisis económico sobre la situación actual de Venezuela.
            La transcripción debe incluir:
            - Un aviso claro al inicio que diga: "[NOTA: Esta es una transcripción simulada generada por IA ya que no se puede acceder al contenido de YouTube directamente.]"
            - Identificación del hablante (ej. "Presentador:").
            - Mención de conceptos como 'inflación', 'producto interno bruto', 'reservas', y 'tendencias del mercado'.
            - El tono debe ser informativo y analítico.
            Genera un texto de aproximadamente 150 palabras.
        `;
         try {
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            return response.text;
        } catch (error) {
            console.error("Error simulating transcription with Gemini:", error);
            throw new Error("Error al simular la transcripción.");
        }
    }
}

export const fetchEconomicNews = async (searchType: NewsSearchType): Promise<EconomicNewsResult> => {
    if (!apiKey) {
        throw new Error("La clave de API de Gemini no está configurada.");
    }

    const newsSources = `
      **Fuentes Gubernamentales y Aliadas:**
      - VTV: https://www.vtv.gob.ve
      - Correo del Orinoco: https://www.correodelorinoco.gob.ve
      - RNV: https://www.rnv.gob.ve
      - Ciudad CCS: https://ciudadccs.info
      - Telesur: https://www.telesurtv.net

      **Medios Independientes (Críticos/Neutrales):**
      - Efecto Cocuyo: https://efectococuyo.com
      - RunRun.es: https://runrun.es
      - Tal Cual: https://talcualdigital.com
      - El Pitazo: https://elpitazo.com
      - Armando.info: https://armando.info
      - Crónica Uno: https://cronica.uno
      - Banca y Negocios: https://bancaynegocios.com

      **Medios Internacionales:**
      - BBC Mundo (Venezuela): https://www.bbc.com/mundo/topics/cpzd49v9rd1t
      - Voz de América (Venezuela): https://www.vozdeamerica.com/noticias-venezuela
      - El País (Venezuela): https://elpais.com/noticias/venezuela

      **Plataformas de Verificación:**
      - Cazadores de Fake News: https://cazadoresdefakenews.com
      - OVFN: https://ovfn.org
    `;

    let prompt: string;

    switch (searchType) {
        case 'economic':
            prompt = `
                **Rol:** Eres un analista económico para el Banco Central de Venezuela.
                **Tarea:** Realiza una búsqueda exhaustiva de las noticias económicas más importantes de las últimas 24 horas sobre Venezuela.
                **Foco:** Tu análisis debe centrarse en indicadores clave: política monetaria, inflación, tipo de cambio, actividad económica, y comunicados del BCV.
                **Fuentes:** Basa tu búsqueda en la siguiente lista de medios, dando prioridad a las fuentes económicas como Banca y Negocios y a las oficiales.
                ${newsSources}
                **Resultado:** Genera un resumen ejecutivo conciso y objetivo que sintetice los hallazgos principales.
            `;
            break;
        case 'mixed':
            prompt = `
                **Rol:** Eres un periodista de sala de prensa para el Banco Central de Venezuela.
                **Tarea:** Realiza una búsqueda de las noticias más relevantes de Venezuela en las últimas 24 horas que tengan impacto nacional.
                **Foco:** Cubre los temas políticos, sociales y económicos de mayor trascendencia. Identifica los eventos que marcan la agenda pública.
                **Fuentes:** Basa tu búsqueda en la siguiente lista de medios, tratando de obtener una visión balanceada.
                ${newsSources}
                **Resultado:** Genera un resumen de los 3 a 5 titulares más importantes, explicando brevemente el contexto de cada uno.
            `;
            break;
        case 'threat_alert':
            prompt = `
                **Rol:** Eres un analista de inteligencia y riesgos comunicacionales para el Banco Central de Venezuela.
                **Tarea:** Realiza una búsqueda proactiva para identificar matrices de opinión negativas, campañas de desinformación, o noticias críticas que puedan afectar la reputación e integridad del BCV, de las instituciones del Estado venezolano, o del patrimonio nacional.
                **Foco:** Busca activamente narrativas adversas, críticas a la política económica, rumores financieros, o ataques a la imagen institucional en medios y redes. Presta especial atención a los medios independientes, críticos e internacionales.
                **Fuentes:** Utiliza la siguiente lista como base para tu investigación.
                ${newsSources}
                **Resultado:** Genera un informe de alerta. Resume los hallazgos críticos, explica por qué representan una amenaza potencial y quiénes son los actores principales detrás de estas narrativas. Sé directo y analítico.
            `;
            break;
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const summary = response.text;
        const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

        const sourcesMap = new Map<string, GroundingSource>();
        rawChunks.forEach(chunk => {
            if (chunk.web && chunk.web.uri) {
                sourcesMap.set(chunk.web.uri, { uri: chunk.web.uri, title: chunk.web.title || chunk.web.uri });
            }
        });

        const sources = Array.from(sourcesMap.values());

        return { summary, sources };
    } catch (error) {
        console.error("Error fetching news with Gemini:", error);
        throw new Error("No se pudieron obtener las noticias de actualidad. Inténtelo más tarde.");
    }
};

export const generateSimulatedTelegramFeed = async (channels: string[]): Promise<TelegramMessage[]> => {
    if (!apiKey) {
        throw new Error("La clave de API de Gemini no está configurada.");
    }

    const prompt = `
        **Rol:** Eres un simulador de un feed de Telegram para un analista del Banco Central de Venezuela.
        **Tarea:** Genera una lista de 8 mensajes de Telegram recientes y realistas que simulen la actividad de las últimas horas en los siguientes canales de Venezuela.
        **Canales a simular:** ${channels.join(', ')}.
        
        **Requisitos de los Mensajes:**
        1.  **Temas:** Los mensajes deben centrarse en economía, finanzas, política y noticias relevantes para Venezuela, desde la perspectiva de cada canal. Incluye anuncios del BCV, fluctuaciones del tipo de cambio, análisis económicos, noticias políticas con impacto económico, etc.
        2.  **Estilo:** Imita el tono y estilo de cada canal (algunos más oficiales, otros más analíticos o críticos).
        3.  **Realismo:** Los mensajes deben parecer auténticos y actuales. Usa timestamps relativos y creíbles (ej: "hace 5 minutos", "hace 1 hora", "hace 3 horas").
        4.  **Formato:** La respuesta debe ser un objeto JSON que contenga una única clave "messages" cuyo valor sea un array de objetos. Cada objeto debe tener los siguientes campos: "id" (un número único y secuencial), "channel" (el nombre del canal de la lista), "text" (el contenido del mensaje), y "timestamp" (el tiempo relativo).

        **Ejemplo de estructura de un mensaje:**
        {
          "id": 1,
          "channel": "bcv_oficial",
          "text": "El tipo de cambio de referencia para el día de mañana se ubica en 36.52 Bs/USD.",
          "timestamp": "hace 15 minutos"
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        messages: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.INTEGER },
                                    channel: { type: Type.STRING },
                                    text: { type: Type.STRING },
                                    timestamp: { type: Type.STRING }
                                },
                                required: ["id", "channel", "text", "timestamp"]
                            }
                        }
                    },
                    required: ["messages"]
                }
            }
        });

        const jsonText = response.text;
        const parsed = JSON.parse(jsonText);
        
        if (parsed && Array.isArray(parsed.messages)) {
            // Sort messages to appear somewhat chronologically based on typical relative timestamps
            return parsed.messages.sort((a, b) => {
                const aTime = a.timestamp.toLowerCase();
                const bTime = b.timestamp.toLowerCase();
                if (aTime.includes('minuto')) return -1;
                if (bTime.includes('minuto')) return 1;
                if (aTime.includes('hora') && bTime.includes('horas')) return -1;
                return 0;
            });
        } else {
            console.error("Generated feed has unexpected structure:", parsed);
            return [];
        }

    } catch (error) {
        console.error("Error generating simulated Telegram feed:", error);
        throw new Error("No se pudo generar el feed de monitoreo simulado. Inténtelo más tarde.");
    }
};

/**
 * Generate content using DeepSeek API for BCV communications
 */
async function generateDeepSeekContent(
    topic: string,
    contentType: string,
    basePrompt: string
): Promise<string> {
    try {
        // Create a specialized prompt for DeepSeek content generation
        const deepSeekPrompt = `
**ROLE**: You are a specialized AI assistant for the Banco Central de Venezuela (BCV) communications team.

**TASK**: Generate a professional ${contentType} about: "${topic}"

**REQUIREMENTS**:
${basePrompt}

**ADDITIONAL INSTRUCTIONS**:
- Use DeepSeek's advanced reasoning capabilities for accurate financial analysis
- Ensure all content aligns with BCV's institutional voice
- Include relevant economic indicators and data points
- Maintain professional tone suitable for official BCV communications
- Structure the content according to Venezuelan banking communication standards

**OUTPUT**: Provide the complete ${contentType} ready for publication.
        `.trim();

        // Use DeepSeek's chat completion for content generation
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${deepSeekApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'user',
                        content: deepSeekPrompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error(`DeepSeek API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('No content received from DeepSeek API');
        }

        // Log successful DeepSeek usage
        Sentry.addBreadcrumb({
            category: 'deepseek-integration',
            message: `Content generated for ${contentType}`,
            level: 'info',
            data: { topic, contentType, length: content.length }
        });

        return content;

    } catch (error) {
        console.error('DeepSeek content generation failed:', error);
        Sentry.captureException(error, {
            tags: {
                component: 'deepseek-integration',
                operation: 'content-generation'
            },
            extra: { topic, contentType }
        });

        // Return error message instead of falling back to Gemini
        return `Error: No se pudo generar el contenido con DeepSeek. ${error instanceof Error ? error.message : 'Error desconocido'}. Por favor, inténtelo de nuevo más tarde.`;
    }
}
