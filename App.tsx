
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './components/dashboard/Dashboard';
import ContentGenerator from './components/generator/ContentGenerator';
import AudioTranscriber from './components/transcription/AudioTranscriber';
import TelegramMonitor from './components/monitoring/TelegramMonitor';
import SettingsPage from './components/settings/SettingsPage';
import { NAVIGATION_ITEMS } from './constants';

const App: React.FC = () => {
    return (
        <HashRouter>
            <div className="flex h-screen bg-bcv-gray-100 text-bcv-gray-800">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-bcv-gray-100 p-6 md:p-8">
                        <Routes>
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/generador" element={<ContentGenerator />} />
                            <Route path="/transcriptor" element={<AudioTranscriber />} />
                            <Route path="/monitoreo" element={<TelegramMonitor />} />
                            <Route path="/configuracion" element={<SettingsPage />} />
                        </Routes>
                    </main>
                </div>
            </div>
        </HashRouter>
    );
};

export default App;
