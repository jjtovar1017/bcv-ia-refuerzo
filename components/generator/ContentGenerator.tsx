import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import { AI_MODELS, CONTENT_TYPES } from '../../constants';
import { AIModel, AIModelOption } from '../../types';
import { generateBcvContent, generateImageWithImagen } from '../../services/geminiService';
import { webSearchService, ContentSuggestion } from '../../services/webSearchService';
import Spinner from '../ui/Spinner';
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { DocumentDuplicateIcon, DownloadIcon, UploadIcon, XCircleIcon, PhotoIcon, MagnifyingGlassIcon, CheckCircleIcon, ExclamationTriangleIcon, XMarkIcon, ExternalLinkIcon } from '../icons/Icons';


pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.4.178/legacy/build/pdf.worker.js`;

const ContentGenerator: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [contentType, setContentType] = useState<string>(CONTENT_TYPES[0]);
    const [selectedModel, setSelectedModel] = useState<AIModel>(AIModel.Gemini);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const [contextText, setContextText] = useState('');
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [copySuccess, setCopySuccess] = useState('');

    const [imagePreviewUrl, setImagePreviewUrl] = useState('');
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [imageError, setImageError] = useState('');

    // Web search and suggestions state
    const [contentSuggestion, setContentSuggestion] = useState<ContentSuggestion | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);


    const handleAnalyzeContent = async () => {
        if (!topic) {
            setError('Por favor, ingrese un tema para analizar.');
            return;
        }
        
        setIsAnalyzing(true);
        setError('');
        
        try {
            const suggestion = await webSearchService.analyzeContentAndSuggest(topic, contentType);
            setContentSuggestion(suggestion);
            setShowSuggestions(true);
        } catch (e: any) {
            setError(e.message || 'Error al analizar el contenido.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerate = async () => {
        if (!topic) {
            setError('Por favor, ingrese un tema para generar el contenido.');
            return;
        }
        setIsLoading(true);
        setError('');
        setResult('');
        setImagePreviewUrl('');
        setImageError('');

        try {
            // Include web research context if available
            let enhancedContext = contextText;
            if (contentSuggestion && contentSuggestion.relatedNews.length > 0) {
                const newsContext = contentSuggestion.relatedNews
                    .map(news => `${news.title}: ${news.snippet}`)
                    .join('\n\n');
                enhancedContext = `${contextText}\n\nInformación adicional de fuentes web:\n${newsContext}`;
            }
            
            const generatedText = await generateBcvContent(topic, contentType, selectedModel, enhancedContext);
            setResult(generatedText);
        } catch (e: any) {
            setError(e.message || 'Ocurrió un error inesperado.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileContextChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        setUploadedFileName(file.name);
        setError('');
        setContextText('');

        try {
            const arrayBuffer = await file.arrayBuffer();
            let text = '';
            if (file.type === 'application/pdf') {
                const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
                }
                text = fullText;
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
                const result = await mammoth.extractRawText({ arrayBuffer });
                text = result.value;
            } else {
                throw new Error('Formato de archivo no soportado. Use PDF o DOCX.');
            }
            setContextText(text);
        } catch (e: any) {
            setError(e.message || 'Error al procesar el archivo.');
            setUploadedFileName('');
        } finally {
            setIsParsing(false);
            event.target.value = '';
        }
    };
    
    const clearFileContext = () => {
        setContextText('');
        setUploadedFileName('');
    };

    const handleDownloadPdf = () => {
        if (!result) return;
        const doc = new jsPDF();
        const plainText = result.replace(/\*\*(.*?)\*\*/g, '$1');
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(12);
        const lines = doc.splitTextToSize(plainText, 180);
        doc.text(lines, 15, 20);
        doc.save(`BCV_Contenido_${Date.now()}.pdf`);
    };

    const handleDownloadTxt = () => {
        if (!result) return;
        const plainText = result.replace(/\*\*(.*?)\*\*/g, '$1');
        const blob = new Blob([plainText], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `BCV_Contenido_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const handleCopyToClipboard = () => {
        if(!result) return;
        const plainText = result.replace(/\*\*(.*?)\*\*/g, '$1');
        navigator.clipboard.writeText(plainText);
        setCopySuccess('¡Copiado!');
        setTimeout(() => setCopySuccess(''), 2000);
    };

    const handleGenerateImagePreview = async () => {
        if (!result) return;
        setIsGeneratingImage(true);
        setImageError('');
        setImagePreviewUrl('');

        try {
            const imagePromptInstruction = "Genera una imagen conceptual y profesional que represente visualmente el siguiente comunicado. Evita usar texto en la imagen. La imagen debe ser simbólica, abstracta y adecuada para un banco central, usando colores sobrios y una estética moderna.";
            const textForPrompt = result.split('\n').slice(0, 5).join(' ');
            const fullPrompt = `${imagePromptInstruction}\n\nComunicado: "${textForPrompt}"`;

            const base64Image = await generateImageWithImagen(fullPrompt);
            setImagePreviewUrl(`data:image/jpeg;base64,${base64Image}`);
        } catch (e: any) {
            setImageError(e.message || 'Error al generar la imagen.');
        } finally {
            setIsGeneratingImage(false);
        }
    };


    const selectedModelInfo = AI_MODELS.find(m => m.id === selectedModel);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1">
                 <Card title="Configuración y Generación">
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-semibold text-bcv-dark mb-3">1. Defina el Contenido</h4>
                            <div className="space-y-4">
                                <Textarea
                                    id="topic"
                                    label="Tema Principal"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="Ej: Intervención cambiaria de la semana"
                                    rows={3}
                                />
                                <Select
                                    id="content-type"
                                    label="Tipo de Contenido"
                                    value={contentType}
                                    onChange={(e) => setContentType(e.target.value)}
                                >
                                    {CONTENT_TYPES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </Select>
                            </div>
                        </div>

                        <div>
                             <h4 className="font-semibold text-bcv-dark mb-3">2. Añada Contexto (Opcional)</h4>
                             <div className="space-y-4">
                                <label htmlFor="file-upload" className="w-full inline-flex items-center justify-center px-4 py-2 border-2 border-dashed border-bcv-gray-300 rounded-md cursor-pointer bg-white hover:bg-bcv-gray-100 text-bcv-dark">
                                    <UploadIcon className="w-5 h-5 mr-2" />
                                    <span>Subir PDF o DOCX</span>
                                </label>
                                <input id="file-upload" type="file" className="hidden" onChange={handleFileContextChange} accept=".pdf,.docx" disabled={isParsing} />
                            
                                {isParsing && <div className="text-sm text-bcv-gray-600 flex items-center"><Spinner size={4}/> <span className="ml-2">Procesando archivo...</span></div>}

                                {uploadedFileName && !isParsing && (
                                    <div className="flex items-center justify-between text-sm bg-bcv-gray-100 p-2 rounded-md">
                                        <span className="truncate pr-2">{uploadedFileName}</span>
                                        <button onClick={clearFileContext} className="text-bcv-gray-500 hover:text-bcv-dark">
                                            <XCircleIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold text-bcv-dark mb-3">3. Análisis Web (Recomendado)</h4>
                            <div className="space-y-4">
                                <Button
                                    onClick={handleAnalyzeContent}
                                    disabled={!topic || isAnalyzing}
                                    variant="secondary"
                                    className="w-full flex items-center justify-center"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Spinner size={4} />
                                            <span className="ml-2">Analizando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
                                            Buscar Información Web
                                        </>
                                    )}
                                </Button>
                                
                                {contentSuggestion && (
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h5 className="font-medium text-gray-900">Análisis del Contenido</h5>
                                            <div className="flex items-center">
                                                {contentSuggestion.recommendation === 'good' && (
                                                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                                                )}
                                                {contentSuggestion.recommendation === 'needs_improvement' && (
                                                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                                                )}
                                                {contentSuggestion.recommendation === 'poor' && (
                                                    <XMarkIcon className="w-5 h-5 text-red-600" />
                                                )}
                                                <span className="ml-1 text-sm font-medium">
                                                    {contentSuggestion.credibilityScore}/100
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {contentSuggestion.suggestions.length > 0 && (
                                            <div>
                                                <h6 className="text-sm font-medium text-gray-700 mb-2">Sugerencias:</h6>
                                                <ul className="text-xs text-gray-600 space-y-1">
                                                    {contentSuggestion.suggestions.slice(0, 3).map((suggestion, index) => (
                                                        <li key={index} className="flex items-start">
                                                            <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                                            {suggestion}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {contentSuggestion.relatedNews.length > 0 && (
                                            <div>
                                                <h6 className="text-sm font-medium text-gray-700 mb-2">Fuentes Encontradas:</h6>
                                                <div className="text-xs text-gray-600">
                                                    {contentSuggestion.relatedNews.length} artículos relevantes
                                                </div>
                                            </div>
                                        )}
                                        
                                        <button
                                            onClick={() => setShowSuggestions(!showSuggestions)}
                                            className="text-xs text-blue-600 hover:text-blue-800"
                                        >
                                            {showSuggestions ? 'Ocultar detalles' : 'Ver detalles completos'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold text-bcv-dark mb-3">4. Elija el Modelo de IA</h4>
                            <div className="space-y-2">
                                <Select
                                    id="ai-model"
                                    label="Modelo de IA"
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value as AIModel)}
                                >
                                    {AI_MODELS.map((model) => (
                                        <option key={model.id} value={model.id}>
                                            {model.name}
                                        </option>
                                    ))}
                                </Select>
                                {selectedModelInfo && (
                                    <p className="text-xs text-bcv-gray-600">{selectedModelInfo.description}</p>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-bcv-gray-200 pt-6">
                            <Button onClick={handleGenerate} isLoading={isLoading || isParsing} disabled={isLoading || isParsing || isGeneratingImage} className="w-full">
                                Generar Contenido
                            </Button>
                            {error && <p className="text-sm text-red-600 mt-2 text-center">{error}</p>}
                        </div>
                    </div>
                </Card>
            </div>

            <div className="lg:col-span-2">
                <Card>
                    <div className="flex justify-between items-center mb-4">
                         <h3 className="text-lg font-semibold text-bcv-dark">Contenido Generado</h3>
                         {result && !isLoading && (
                             <div className="flex items-center space-x-2">
                                <span className="text-sm text-green-600 transition-opacity duration-300">{copySuccess}</span>
                                <button onClick={handleCopyToClipboard} title="Copiar texto" className="p-1.5 text-bcv-gray-500 hover:text-bcv-blue hover:bg-bcv-gray-100 rounded-md">
                                    <DocumentDuplicateIcon className="w-5 h-5"/>
                                </button>
                                <button onClick={handleDownloadPdf} title="Descargar como PDF" className="p-1.5 text-bcv-gray-500 hover:text-bcv-blue hover:bg-bcv-gray-100 rounded-md">
                                    <span className="font-bold text-xs">PDF</span>
                                </button>
                                <button onClick={handleDownloadTxt} title="Descargar como TXT" className="p-1.5 text-bcv-gray-500 hover:text-bcv-blue hover:bg-bcv-gray-100 rounded-md">
                                    <span className="font-bold text-xs">TXT</span>
                                </button>
                                <button onClick={handleGenerateImagePreview} disabled={isGeneratingImage} title="Generar imagen de avance" className="p-1.5 text-bcv-gray-500 hover:text-bcv-blue hover:bg-bcv-gray-100 rounded-md disabled:opacity-50 disabled:cursor-wait">
                                    {isGeneratingImage ? <Spinner size={5}/> : <PhotoIcon className="w-5 h-5"/>}
                                </button>
                             </div>
                         )}
                    </div>
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-96 text-bcv-gray-600">
                            <Spinner size={12} />
                            <p className="mt-4">Generando contenido... Por favor espere.</p>
                        </div>
                    )}
                    {result && !isLoading && (
                        <div>
                            <div 
                                id="result-content"
                                className="prose prose-sm max-w-none whitespace-pre-wrap bg-bcv-gray-50 p-4 rounded-md min-h-[10rem] text-bcv-gray-800"
                                dangerouslySetInnerHTML={{ __html: result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }}
                            />

                            {(isGeneratingImage || imagePreviewUrl || imageError) && (
                                <div className="mt-6">
                                    <h4 className="text-md font-semibold text-bcv-dark mb-2">Avance de Imagen</h4>
                                    {isGeneratingImage && (
                                        <div className="flex flex-col items-center justify-center h-64 bg-bcv-gray-50 rounded-md">
                                            <Spinner size={12} />
                                            <p className="mt-4 text-bcv-gray-600">Generando imagen... Esto puede tardar un momento.</p>
                                        </div>
                                    )}
                                    {imageError && (
                                        <div className="text-center p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                                            <p>Error: {imageError}</p>
                                        </div>
                                    )}
                                    {imagePreviewUrl && (
                                        <div className="border border-bcv-gray-200 rounded-lg p-2">
                                            <img src={imagePreviewUrl} alt="Avance de imagen generado por IA" className="rounded-md w-full" />
                                            <a 
                                                href={imagePreviewUrl} 
                                                download={`BCV_Imagen_${Date.now()}.jpeg`}
                                                className="mt-2 inline-flex items-center justify-center w-full px-4 py-2 bg-bcv-blue text-white rounded-md hover:bg-opacity-90 transition-colors"
                                            >
                                                <DownloadIcon className="w-5 h-5 mr-2" />
                                                Descargar Imagen
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {!result && !isLoading && (
                        <div className="text-center h-96 flex items-center justify-center text-bcv-gray-500">
                            <p>El contenido generado aparecerá aquí.</p>
                        </div>
                    )}
                </Card>
            </div>
            
            {/* Panel de detalles expandido */}
            {showSuggestions && contentSuggestion && (
                <div className="lg:col-span-3 mt-8">
                    <Card title="Análisis Detallado de Contenido">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Sugerencias y Recomendaciones */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-bcv-dark mb-3 flex items-center">
                                        {contentSuggestion.recommendation === 'good' && (
                                            <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                                        )}
                                        {contentSuggestion.recommendation === 'needs_improvement' && (
                                            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                                        )}
                                        {contentSuggestion.recommendation === 'poor' && (
                                            <XMarkIcon className="w-5 h-5 text-red-600 mr-2" />
                                        )}
                                        Evaluación: {contentSuggestion.credibilityScore}/100
                                    </h4>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">Puntuación de Credibilidad</span>
                                            <span className="text-sm font-bold text-gray-900">{contentSuggestion.credibilityScore}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full ${
                                                    contentSuggestion.credibilityScore >= 70 ? 'bg-green-500' :
                                                    contentSuggestion.credibilityScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                                style={{ width: `${contentSuggestion.credibilityScore}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                                
                                {contentSuggestion.suggestions.length > 0 && (
                                    <div>
                                        <h5 className="font-medium text-gray-900 mb-3">Sugerencias de Mejora</h5>
                                        <ul className="space-y-2">
                                            {contentSuggestion.suggestions.map((suggestion, index) => (
                                                <li key={index} className="flex items-start bg-blue-50 p-3 rounded-md">
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                                    <span className="text-sm text-gray-700">{suggestion}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                
                                {contentSuggestion.improvementTips.length > 0 && (
                                    <div>
                                        <h5 className="font-medium text-gray-900 mb-3">Consejos de Mejora</h5>
                                        <ul className="space-y-2">
                                            {contentSuggestion.improvementTips.map((tip, index) => (
                                                <li key={index} className="flex items-start bg-yellow-50 p-3 rounded-md">
                                                    <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                                                    <span className="text-sm text-gray-700">{tip}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            
                            {/* Fuentes y Noticias Relacionadas */}
                            <div className="space-y-4">
                                {contentSuggestion.keyPoints.length > 0 && (
                                    <div>
                                        <h5 className="font-medium text-gray-900 mb-3">Puntos Clave Identificados</h5>
                                        <ul className="space-y-2">
                                            {contentSuggestion.keyPoints.map((point, index) => (
                                                <li key={index} className="flex items-start bg-green-50 p-3 rounded-md">
                                                    <CheckCircleIcon className="w-4 h-4 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                                                    <span className="text-sm text-gray-700">{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                
                                {contentSuggestion.relatedNews.length > 0 && (
                                    <div>
                                        <h5 className="font-medium text-gray-900 mb-3">Fuentes de Información ({contentSuggestion.relatedNews.length})</h5>
                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {contentSuggestion.relatedNews.map((news, index) => (
                                                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h6 className="font-medium text-gray-900 text-sm mb-1">{news.title}</h6>
                                                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{news.snippet}</p>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs text-gray-500">{news.source}</span>
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                                        {Math.round(news.relevanceScore * 100)}% relevante
                                                                    </span>
                                                                    <button
                                                                        onClick={() => window.open(news.url, '_blank')}
                                                                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                                                    >
                                                                        <ExternalLinkIcon className="w-3 h-3 mr-1" />
                                                                        Ver
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default ContentGenerator;