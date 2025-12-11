import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './components/ui/theme-provider';
import { ToastProvider } from './components/ui/Toast';
import { Loader } from './components/ui/Loader';
import { AppRoutes } from './routes/AppRoutes';
import { Theme } from '@poc-admin-form/shared';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme={Theme.LIGHT} storageKey={import.meta.env.VITE_THEME_STORAGE_KEY}>
        <ToastProvider>
          <AuthProvider>
            <React.Suspense fallback={<Loader />}>
              <AppRoutes />
            </React.Suspense>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;