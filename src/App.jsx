const { useState, useEffect } = React;
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider, useToast } from './context/ToastContext.jsx';

import { ToastContainer } from './components/common/ToastContainer.jsx';
import { ProgressBar } from './components/common/ProgressBar.jsx';

import { LoginView } from './views/LoginView.jsx';
import { MainAppView } from './views/MainAppView.jsx';

function AppContent() {
    const { authenticated } = useAuth();
    const { mostrarToast } = useToast();

    const [progressWidth, setProgressWidth] = useState(0);
    const [progressOpacity, setProgressOpacity] = useState(0);

    const handleLoadingStart = () => {
        setProgressOpacity(1);
        setProgressWidth(0);
        setTimeout(() => setProgressWidth(30), 50);
        setTimeout(() => setProgressWidth(70), 200);
    };

    const handleLoadingEnd = () => {
        setProgressWidth(100);
        setTimeout(() => {
            setProgressOpacity(0);
            setTimeout(() => setProgressWidth(0), 300);
        }, 200);
    };

    return (
        <ThemeProvider onShowToast={mostrarToast}>
            <ProgressBar width={progressWidth} opacity={progressOpacity} />
            <ToastContainer />

            {authenticated ? (
                <MainAppView
                    onLoadingStart={handleLoadingStart}
                    onLoadingEnd={handleLoadingEnd}
                />
            ) : (
                <LoginView />
            )}
        </ThemeProvider>
    );
}

export function App() {
    return (
        <ToastProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </ToastProvider>
    );
}
