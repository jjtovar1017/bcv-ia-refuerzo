import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import { AI_MODELS, CONTENT_TYPES } from '../../constants';
import { AIModel, AIModelOption } from '../../types';
import { generateBcvContent, generateImageWithImagen } from '../../services/geminiService';
import Spinner from '../ui/Spinner';
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { DocumentDuplicateIcon, DownloadIcon, UploadIcon, XCircleIcon, PhotoIcon } from '../icons/Icons';


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
            const generatedText = await generateBcvContent(topic, contentType, selectedModel, contextText);
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
                            <h4 className="font-semibold text-bcv-dark mb-3">3. Elija el Modelo de IA</h4>
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
        </div>
    );
};

export default ContentGenerator;