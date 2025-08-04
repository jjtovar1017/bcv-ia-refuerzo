
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import FloatingNavigation from './components/layout/FloatingNavigation';
import MobileNavigation from './components/layout/MobileNavigation';
import MinimalHeader from './components/layout/MinimalHeader';
import Dashboard from './components/dashboard/Dashboard';
import ContentGenerator from './components/generator/ContentGenerator';
import AudioTranscriber from './components/transcription/AudioTranscriber';
import TelegramMonitor from './components/monitoring/TelegramMonitor';
import InstitutionalAnalysis from './components/analysis/InstitutionalAnalysis';
import SettingsPage from './components/settings/SettingsPage';

const App: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <HashRouter>
            <div className="min-h-screen bg-gradient-to-br from-bcv-gray-50 to-bcv-gray-100 text-bcv-gray-800">
                {/* Floating Navigation for Desktop */}
                <FloatingNavigation />
                
                {/* Mobile Navigation */}
                <MobileNavigation 
                    isOpen={isMobileMenuOpen} 
                    onToggle={toggleMobileMenu} 
                />
                
                {/* Main Content Area */}
                <div className="flex flex-col min-h-screen">
                    <MinimalHeader />
                    
                    <main className="flex-1 p-4 md:p-8 md:ml-20 transition-all duration-300">
                        <div className="max-w-7xl mx-auto">
                            <Routes>
                                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/generador" element={<ContentGenerator />} />
                                <Route path="/transcriptor" element={<AudioTranscriber />} />
                                <Route path="/monitoreo" element={<TelegramMonitor />} />
                                <Route path="/analisis" element={<InstitutionalAnalysis />} />
                                <Route path="/configuracion" element={<SettingsPage />} />
                            </Routes>
                        </div>
                    </main>
                </div>
            </div>
        </HashRouter>
    );
};

export default App;
