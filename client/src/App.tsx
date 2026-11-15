import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectsPage } from './pages/ProjectsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#05060B] text-[#FFF6EA] font-sans selection:bg-[#FFB454]/30 selection:text-white">
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/projects" replace />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="*" element={<Navigate to="/projects" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
