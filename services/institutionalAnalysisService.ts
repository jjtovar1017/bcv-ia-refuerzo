import { generateBcvContent } from './geminiService';
import { AIModel } from '../types';
import * as Sentry from '@sentry/react';

export interface InstitutionalAlert {
    id: string;
    title: string;
    severity: 'baja' | 'media' | 'alta' | 'critica';
    category: 'reputacional' | 'economica' | 'politica_monetaria' | 'comunicacional' | 'internacional';
    summary: string;
    analysis: string;
    recommendations: string[];
    sources: string[];
    timestamp: string;
    impactLevel: number; // 1-10
}

export interface InstitutionalAnalysisResult {
    alerts: InstitutionalAlert[];
    summary: string;
    overallRisk: 'bajo' | 'medio' | 'alto' | 'critico';
    keyRecommendations: string[];
}

export class InstitutionalAnalysisService {
    private readonly bcvInstitutionalPrompt = `
    Eres un periodista especialista del Banco Central de Venezuela (BCV) con amplia experiencia en análisis de entorno comunicacional y gestión reputacional. Tu rol es:

    PERFIL PROFESIONAL:
    - Especialista en análisis de entorno comunicacional del BCV
    - Experto en generación de alertas sobre matrices que impacten la imagen institucional
    - Enfoque institucional y profesional, nunca amarillista
    - Protector de la imagen del BCV como institución técnica y confiable

    MISIÓN INSTITUCIONAL DEL BCV:
    - Ente encargado de la política monetaria de Venezuela
    - Institución que vela por la estabilidad financiera y económica
    - Guardián de las reservas monetarias internacionales
    - Protector del patrimonio cultural y numismático de la nación
    - Promotor de la inclusión financiera y educación económica

    PRINCIPIOS DE ANÁLISIS:
    1. OBJETIVIDAD: Análisis basado en datos técnicos y evidencia
    2. EQUILIBRIO: Perspectiva balanceada que reconoce logros y desafíos
    3. CONSTRUCTIVIDAD: Enfoque en soluciones y oportunidades de mejora
    4. PROFESIONALISMO: Lenguaje técnico apropiado para una institución financiera
    5. TRANSPARENCIA: Comunicación clara y honesta con base en hechos

    ENFOQUE COMUNICACIONAL:
    - Destacar las fortalezas institucionales del BCV
    - Contextualizar los desafíos dentro del panorama económico global
    - Proponer estrategias de comunicación proactiva
    - Identificar oportunidades para fortalecer la confianza pública
    - Contrarrestar narrativas adversas con datos y logros concretos

    TONO Y ESTILO:
    - Profesional y técnico
    - Respetuoso hacia todas las instituciones del Estado
    - Constructivo y orientado a soluciones
    - Educativo para el público general
    - Defensivo de la autonomía técnica del BCV
    `;

    /**
     * Genera análisis de alertas desde la perspectiva institucional del BCV
     */
    public async generateInstitutionalAlert(
        topic: string,
        context: string,
        severity: InstitutionalAlert['severity'] = 'media'
    ): Promise<InstitutionalAlert> {
        try {
            const alertPrompt = `
            ${this.bcvInstitutionalPrompt}

            TEMA DE ANÁLISIS: ${topic}
            CONTEXTO: ${context}
            NIVEL DE SEVERIDAD SUGERIDO: ${severity}

            INSTRUCCIONES ESPECÍFICAS:
            Genera un análisis de alerta institucional que incluya:

            1. TÍTULO: Título profesional y descriptivo (máximo 80 caracteres)
            
            2. RESUMEN EJECUTIVO: Síntesis objetiva de la situación (100-150 palabras)
            
            3. ANÁLISIS INSTITUCIONAL: Evaluación desde la perspectiva del BCV que incluya:
               - Impacto potencial en la imagen institucional
               - Relación con las funciones del BCV
               - Contexto económico y financiero relevante
               - Oportunidades de comunicación proactiva
            
            4. RECOMENDACIONES ESTRATÉGICAS: 3-5 acciones concretas para:
               - Proteger la reputación institucional
               - Fortalecer la comunicación del BCV
               - Aprovechar oportunidades de posicionamiento
               - Contrarrestar narrativas adversas si las hay

            IMPORTANTE:
            - Mantén un tono profesional y constructivo
            - Evita lenguaje alarmista o sensacionalista
            - Enfócate en la protección y fortalecimiento de la imagen del BCV
            - Propón soluciones, no solo identifiques problemas
            - Reconoce logros y avances cuando sea pertinente

            Formato de respuesta en JSON:
            {
                "title": "Título del análisis",
                "summary": "Resumen ejecutivo",
                "analysis": "Análisis institucional detallado",
                "recommendations": ["Recomendación 1", "Recomendación 2", "..."],
                "category": "reputacional|economica|politica_monetaria|comunicacional|internacional",
                "impactLevel": 1-10
            }
            `;

            const response = await generateBcvContent(
                'Análisis de Alerta Institucional',
                'Informe Especializado BCV',
                AIModel.Gemini,
                alertPrompt
            );

            // Parsear la respuesta JSON
            const alertData = this.parseAlertResponse(response);
            
            return {
                id: this.generateAlertId(),
                title: alertData.title,
                severity,
                category: alertData.category,
                summary: alertData.summary,
                analysis: alertData.analysis,
                recommendations: alertData.recommendations,
                sources: [context],
                timestamp: new Date().toISOString(),
                impactLevel: alertData.impactLevel
            };

        } catch (error) {
            Sentry.captureException(error, {
                tags: { component: 'institutional-analysis', operation: 'generate-alert' }
            });
            
            // Fallback alert en caso de error
            return {
                id: this.generateAlertId(),
                title: 'Análisis de Entorno Comunicacional',
                severity,
                category: 'comunicacional',
                summary: 'Se ha identificado una situación que requiere análisis desde la perspectiva institucional del BCV.',
                analysis: 'El equipo de comunicaciones del BCV debe evaluar esta situación para determinar el impacto potencial en la imagen institucional y desarrollar estrategias de respuesta apropiadas.',
                recommendations: [
                    'Monitorear el desarrollo de la situación',
                    'Preparar mensajes institucionales claros',
                    'Coordinar con el equipo de comunicaciones',
                    'Evaluar oportunidades de comunicación proactiva'
                ],
                sources: [context],
                timestamp: new Date().toISOString(),
                impactLevel: 5
            };
        }
    }

    /**
     * Genera análisis de riesgos reputacionales con enfoque institucional
     */
    public async generateReputationalRiskAnalysis(newsItems: string[]): Promise<InstitutionalAnalysisResult> {
        try {
            const riskPrompt = `
            ${this.bcvInstitutionalPrompt}

            ANÁLISIS DE RIESGOS REPUTACIONALES

            Noticias y contexto para analizar:
            ${newsItems.map((item, index) => `${index + 1}. ${item}`).join('\n')}

            INSTRUCCIONES:
            Como especialista en comunicación del BCV, analiza estas noticias desde la perspectiva institucional y genera:

            1. EVALUACIÓN DE RIESGO GENERAL: Bajo, Medio, Alto, Crítico
            
            2. ALERTAS ESPECÍFICAS: Identifica 2-4 alertas principales con:
               - Título profesional
               - Categoría (reputacional, económica, política monetaria, etc.)
               - Nivel de impacto (1-10)
               - Análisis institucional
               - Recomendaciones estratégicas

            3. RESUMEN EJECUTIVO: Síntesis para la alta dirección del BCV

            4. RECOMENDACIONES CLAVE: 3-5 acciones prioritarias

            ENFOQUE:
            - Proteger la imagen del BCV como institución técnica
            - Identificar oportunidades de comunicación proactiva
            - Proponer estrategias para fortalecer la confianza pública
            - Contextualizar desafíos dentro del panorama económico
            - Destacar logros y avances institucionales cuando sea pertinente

            Responde en formato JSON estructurado.
            `;

            const response = await generateBcvContent(
                'Análisis de Riesgos Reputacionales',
                'Informe Ejecutivo BCV',
                AIModel.Gemini,
                riskPrompt
            );

            return this.parseRiskAnalysisResponse(response, newsItems);

        } catch (error) {
            Sentry.captureException(error, {
                tags: { component: 'institutional-analysis', operation: 'risk-analysis' }
            });

            // Fallback analysis
            return {
                alerts: [{
                    id: this.generateAlertId(),
                    title: 'Monitoreo del Entorno Comunicacional',
                    severity: 'media',
                    category: 'comunicacional',
                    summary: 'Se requiere análisis continuo del entorno comunicacional para proteger la imagen institucional del BCV.',
                    analysis: 'El BCV mantiene su compromiso con la transparencia y la comunicación efectiva con todos los sectores de la sociedad venezolana.',
                    recommendations: [
                        'Fortalecer los canales de comunicación institucional',
                        'Desarrollar contenido educativo sobre las funciones del BCV',
                        'Mantener diálogo constructivo con medios de comunicación'
                    ],
                    sources: newsItems,
                    timestamp: new Date().toISOString(),
                    impactLevel: 5
                }],
                summary: 'El BCV continúa monitoreando el entorno comunicacional para mantener una comunicación transparente y efectiva.',
                overallRisk: 'medio',
                keyRecommendations: [
                    'Mantener comunicación proactiva y transparente',
                    'Fortalecer la educación financiera ciudadana',
                    'Destacar logros en estabilidad monetaria'
                ]
            };
        }
    }

    private parseAlertResponse(response: string): any {
        try {
            // Intentar extraer JSON de la respuesta
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            // Fallback parsing si no hay JSON válido
            return {
                title: 'Análisis Institucional BCV',
                summary: response.substring(0, 200) + '...',
                analysis: response,
                recommendations: [
                    'Monitorear situación',
                    'Preparar comunicación institucional',
                    'Coordinar respuesta estratégica'
                ],
                category: 'comunicacional',
                impactLevel: 5
            };
        } catch (error) {
            console.warn('Error parsing alert response:', error);
            return {
                title: 'Análisis Institucional BCV',
                summary: 'Análisis generado desde la perspectiva institucional del BCV.',
                analysis: response,
                recommendations: ['Revisar análisis detallado'],
                category: 'comunicacional',
                impactLevel: 5
            };
        }
    }

    private parseRiskAnalysisResponse(response: string, sources: string[]): InstitutionalAnalysisResult {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    alerts: parsed.alerts || [],
                    summary: parsed.summary || response.substring(0, 300),
                    overallRisk: parsed.overallRisk || 'medio',
                    keyRecommendations: parsed.keyRecommendations || []
                };
            }
        } catch (error) {
            console.warn('Error parsing risk analysis response:', error);
        }

        // Fallback response
        return {
            alerts: [],
            summary: 'Análisis institucional completado desde la perspectiva del BCV.',
            overallRisk: 'medio',
            keyRecommendations: [
                'Mantener comunicación transparente',
                'Fortalecer imagen institucional',
                'Monitorear entorno comunicacional'
            ]
        };
    }

    private generateAlertId(): string {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Genera contenido educativo sobre las funciones del BCV
     */
    public async generateEducationalContent(topic: string): Promise<string> {
        const educationalPrompt = `
        ${this.bcvInstitutionalPrompt}

        GENERACIÓN DE CONTENIDO EDUCATIVO

        Tema: ${topic}

        Como especialista en comunicación del BCV, genera contenido educativo que:

        1. Explique de manera clara y accesible las funciones del BCV
        2. Destaque la importancia de la estabilidad monetaria
        3. Eduque sobre conceptos económicos básicos
        4. Fortalezca la confianza en las instituciones financieras
        5. Use un lenguaje técnico pero comprensible para el público general

        El contenido debe ser:
        - Educativo y constructivo
        - Basado en las funciones reales del BCV
        - Orientado a fortalecer la confianza ciudadana
        - Profesional y técnicamente preciso
        - Accesible para diferentes audiencias

        Genera un texto de 300-500 palabras.
        `;

        try {
            return await generateBcvContent(
                'Contenido Educativo BCV',
                'Material Divulgativo',
                AIModel.Gemini,
                educationalPrompt
            );
        } catch (error) {
            Sentry.captureException(error);
            return 'El Banco Central de Venezuela continúa trabajando en el fortalecimiento de la estabilidad monetaria y financiera del país, manteniendo su compromiso con la transparencia y la educación económica ciudadana.';
        }
    }
}

// Export singleton instance
export const institutionalAnalysisService = new InstitutionalAnalysisService();
