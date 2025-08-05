
import React, { useState, useCallback } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
<<<<<<< HEAD
import { transcriptionService } from '../../services/transcriptionService';
=======
import { transcribeAudioWithGemini } from '../../services/geminiService';
>>>>>>> 0d38ca5586e0d0883fe98444281ec01408abba36
import { TranscriptionSource } from '../../types';
import { MicrophoneIcon, DocumentDuplicateIcon, LinkIcon } from '../icons/Icons';

const AudioTranscriber: React.FC = () => {
    const [inputFile, setInputFile] = useState<File | null>(null);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
<<<<<<< HEAD
            const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
            if (selectedFile.size > MAX_FILE_SIZE) {
                setError('El archivo es demasiado grande. Por favor, seleccione un archivo de menos de 100MB.');
=======
            const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
            if (selectedFile.size > MAX_FILE_SIZE) {
                setError('El archivo es demasiado grande. Por favor, seleccione un archivo de menos de 25MB.');
>>>>>>> 0d38ca5586e0d0883fe98444281ec01408abba36
                setInputFile(null);
                event.target.value = ''; // Reset file input to allow re-selection of the same file
                return;
            }
<<<<<<< HEAD
            
            // Check if file type is supported
            if (!transcriptionService.isFileTypeSupported(selectedFile)) {
                setError('Formato de archivo no compatible. Use MP3, MP4, WAV, M4A, FLAC, OGG, WEBM, etc.');
                setInputFile(null);
                event.target.value = '';
                return;
            }
=======
>>>>>>> 0d38ca5586e0d0883fe98444281ec01408abba36
            setInputFile(selectedFile);
            setYoutubeUrl(''); // Clear the other input
            setTranscript('');
            setError('');
        }
    };
    
    const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setYoutubeUrl(event.target.value);
        setInputFile(null); // Clear the other input
        const fileInput = document.getElementById('audio-upload') as HTMLInputElement;
        if(fileInput) fileInput.value = ''; // Reset file input
        setTranscript('');
        setError('');
    };

    const handleTranscribe = useCallback(async () => {
        let source: TranscriptionSource | null = null;
        if (inputFile) {
            source = { type: 'file', payload: inputFile };
        } else if (youtubeUrl) {
            const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
            if (!youtubeRegex.test(youtubeUrl)) {
                setError('Por favor, ingrese una URL de YouTube válida.');
                return;
            }
            source = { type: 'url', payload: youtubeUrl };
        } else {
            setError('Por favor, seleccione un archivo o ingrese una URL de YouTube.');
            return;
        }

        setIsTranscribing(true);
        setError('');
        setTranscript('');

        try {
<<<<<<< HEAD
            const resultTranscript = await transcriptionService.transcribeAudio(source);
=======
            const resultTranscript = await transcribeAudioWithGemini(source);
>>>>>>> 0d38ca5586e0d0883fe98444281ec01408abba36
            setTranscript(resultTranscript);
        } catch (e: any) {
            setError(e.message || 'Error al procesar la solicitud.');
        } finally {
            setIsTranscribing(false);
        }
    }, [inputFile, youtubeUrl]);

    const handleCopyToClipboard = () => {
        if (!transcript) return;
        navigator.clipboard.writeText(transcript);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const fileName = inputFile ? inputFile.name : '';

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <Card title="Transcribir Audio o Video">
                <div className="space-y-6">
                    {/* File Upload Section */}
                    <div>
                        <div className="p-8 border-2 border-dashed border-bcv-gray-300 rounded-lg text-center">
                            <MicrophoneIcon className="w-16 h-16 text-bcv-gray-400 mx-auto" />
                            <p className="mt-2 font-semibold text-bcv-dark">Transcripción Real de Archivos</p>
                            <p className="mt-1 text-sm text-bcv-gray-600">Sube un archivo para obtener una transcripción precisa usando la IA.</p>
                            <label
                                htmlFor="audio-upload"
                                className="mt-4 inline-block px-4 py-2 bg-bcv-blue text-white rounded-md cursor-pointer hover:bg-opacity-90 transition-colors"
                            >
                                Seleccionar Archivo
                            </label>
                            <input id="audio-upload" type="file" className="hidden" onChange={handleFileChange} accept=".mp3,.wav,.mp4,.m4a" disabled={!!youtubeUrl}/>
                            <p className="mt-2 text-xs text-bcv-gray-500">Soportados: MP3, WAV, MP4, M4A. (Máx 25MB)</p>
                            {fileName && <p className="mt-4 font-semibold text-bcv-dark text-sm">Archivo seleccionado: {fileName}</p>}
                        </div>
                    </div>

                    <div className="my-2 flex items-center">
                        <hr className="flex-grow border-bcv-gray-200" />
                        <span className="px-4 text-bcv-gray-500 font-semibold text-sm">O</span>
                        <hr className="flex-grow border-bcv-gray-200" />
                    </div>

                    {/* YouTube URL Section */}
                    <div>
                         <p className="font-semibold text-bcv-dark text-center">Transcripción Simulada de YouTube</p>
                         <p className="mt-1 text-sm text-bcv-gray-600 text-center mb-4">Pega un enlace para generar una transcripción ficticia. La IA no puede ver el video.</p>
                        <label htmlFor="youtube-url" className="sr-only">
                            Pegar enlace de YouTube
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <LinkIcon className="h-5 w-5 text-bcv-gray-400" />
                            </div>
                            <input
                                type="text"
                                id="youtube-url"
                                value={youtubeUrl}
                                onChange={handleUrlChange}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="block w-full rounded-md border-0 py-2.5 pl-10 text-bcv-gray-900 ring-1 ring-inset ring-bcv-gray-300 placeholder:text-bcv-gray-400 focus:ring-2 focus:ring-inset focus:ring-bcv-blue sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:bg-bcv-gray-50 disabled:text-bcv-gray-500"
                                disabled={!!inputFile}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <Button onClick={handleTranscribe} isLoading={isTranscribing} disabled={!inputFile && !youtubeUrl || isTranscribing}>
                        {inputFile ? 'Iniciar Transcripción Real' : (youtubeUrl ? 'Generar Transcripción Simulada' : 'Transcribir')}
                    </Button>
                </div>
                {error && <p className="mt-4 text-center text-red-600">{error}</p>}
            </Card>

            {(isTranscribing || transcript) && (
                 <Card title="Resultado de la Transcripción">
                    {isTranscribing ? (
                        <div className="flex flex-col items-center justify-center h-64 text-bcv-gray-600">
                            <Spinner size={12} />
                            <p className="mt-4">Analizando y transcribiendo...</p>
                        </div>
                    ) : (
                        <div>
                            <div className="relative">
                                <button
                                    onClick={handleCopyToClipboard}
                                    className="absolute top-2 right-2 p-2 text-bcv-gray-500 hover:bg-bcv-gray-200 rounded-md hover:text-bcv-blue transition-colors"
                                    title="Copiar al portapapeles"
                                >
                                    {isCopied ? 
                                        <span className="text-sm text-green-600 font-semibold">¡Copiado!</span> : 
                                        <DocumentDuplicateIcon className="w-5 h-5" />
                                    }
                                </button>
                                <div className="p-4 bg-bcv-gray-100 rounded-md max-h-96 overflow-y-auto">
                                    <p className="whitespace-pre-wrap text-bcv-gray-800">{transcript}</p>

                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
};

export default AudioTranscriber;