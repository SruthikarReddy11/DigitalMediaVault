import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { AudioPlayerProvider } from './contexts/AudioPlayerContext';
import { AppRoutes } from './routes/AppRoutes';

export const App: React.FC = () => {
  useEffect(() => {
    // Keep backend & database awake while browser tab is active
    const keepAliveTimer = setInterval(() => {
      fetch('/api/ping').catch(() => {});
    }, 60 * 1000);

    return () => clearInterval(keepAliveTimer);
  }, []);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AudioPlayerProvider>
              <AppRoutes />
            </AudioPlayerProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
