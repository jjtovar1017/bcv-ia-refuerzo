import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { AIModel, EconomicNewsResult, GroundingSource, TranscriptionSource, NewsSearchType, TelegramMessage } from "../types";

// Accede a la variable de entorno de forma segura
const apiKey: string = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.warn("VITE_GEMINI_API_KEY environment variable not set. Gemini API calls will fail.");
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

export async function generateBcvContent(
    topic: string,
    contentType: string,
    contextText: string
): Promise<string> {
    if (!apiKey) {
        return "Error: La clave de API de Gemini no está configurada.";
    }

    const prompt = `
        Genera un ${contentType} sobre el siguiente tema: "${topic}".
        ${contextText ? `Contexto adicional: ${contextText}` : ''}
        El contenido debe ser profesional, claro y adecuado para el Banco Central de Venezuela.
    `;
// geminiService.ts

export async function generateBcvContent(
  topic: string,
  contentType: string,
  model: string,
  contextText: string
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("API key for Gemini is not configured.");
  }

  const prompt = `
    Genera un ${contentType} sobre el siguiente tema: "${topic}".
    ${contextText ? `Contexto adicional: ${contextText}` : ''}
    El contenido debe ser profesional, claro y adecuado para el Banco Central de Venezuela.
    Por favor, proporciona una respuesta bien estructurada y completa.
  `.trim();

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 2048
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error(`Error al generar contenido con Gemini. Status: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the generated text from the response
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 
           "No se pudo generar contenido. La respuesta de la API fue inesperada.";
    
  } catch (error) {
    console.error('Error in generateBcvContent:', error);
    throw new Error(`Error al conectar con el servicio Gemini: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function generateImageWithImagen(
  prompt: string,
  model: string = "gemini-pro-vision"
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("API key for Gemini is not configured.");
  }

  try {
    // Note: For image generation, you might need to adjust this endpoint
    // depending on whether you're using Gemini Pro Vision or another service
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              // If you need to include an image, you would add it here as a base64 part
              // { inlineData: { mimeType, data } }
            ]
          }],
          generationConfig: {
            temperature
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Error al generar contenido con Gemini: ${response.statusText}`);
        }

        const data = await response.json();
        // Ajusta según la estructura real de la respuesta de Gemini
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar contenido.";
    } catch (error) {
        console.error("Error al generar contenido con Gemini:", error);
        return "Error al generar contenido. Por favor, revise la consola para más detalles.";
    }
}

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
            const imageBytes = response.generatedImages[0].image?.imageBytes;
            if (imageBytes) {
                return imageBytes;
            } else {
                throw new Error("La imagen generada no tiene bytes de imagen válidos.");
            }
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
            const audioFile = source.payload as File;
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

            return response.text || "No se pudo transcribir el audio. La respuesta de la API está vacía.";
        } catch (error: any) {
            console.error("Error transcribing audio with Gemini:", error);
            throw new Error(error.message || "Ha ocurrido un error durante la transcripción. Asegúrese de que el formato del archivo es compatible y no excede el límite de tamaño.");
        }
    } else { // 'url', keep simulation
        const prompt = `
            Eugenio te ha proporcionado una URL de YouTube y quiere una transcripción.
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
            return response.text || "Error al simular la transcripción. La respuesta de la API está vacía.";
        } catch (error) {
            console.error("Error simulating transcription with Gemini:", error);
            throw new Error("Error al simular la transcripción.");
        }
    }
};

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

        // Asegurarse de que el summary no sea undefined
        return { summary: summary || "No se pudo generar un resumen.", sources };
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
        
        if (!jsonText) {
             throw new Error("La respuesta de la API está vacía o no es válida.");
        }

        const parsed = JSON.parse(jsonText);
        
        if (parsed && Array.isArray(parsed.messages)) {
            return parsed.messages.sort((a: TelegramMessage, b: TelegramMessage) => {
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