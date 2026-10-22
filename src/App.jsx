const { useState, useEffect } = React;

function AppContent() {
    const useAuth = window.useAuth;
    const useToast = window.useToast;
    const ThemeProvider = window.ThemeProvider;
    const ProgressBar = window.ProgressBar;
    const ToastContainer = window.ToastContainer;
    const MainAppView = window.MainAppView;
    const LoginView = window.LoginView;

    const { authenticated } = useAuth();
    const { mostrarToast } = useToast();

    const [progressWidth, setProgressWidth] = useState(0);
    const [progressOpacity, setProgressOpacity] = useState(0);
    const progressTimersRef = React.useRef([]);

    const clearProgressTimers = () => {
        progressTimersRef.current.forEach(id => clearTimeout(id));
        progressTimersRef.current = [];
    };

    const handleLoadingStart = () => {
        clearProgressTimers();
        setProgressOpacity(1);
        setProgressWidth(0);
        progressTimersRef.current.push(setTimeout(() => setProgressWidth(30), 50));
        progressTimersRef.current.push(setTimeout(() => setProgressWidth(70), 200));
    };

    const handleLoadingEnd = () => {
        clearProgressTimers();
        setProgressWidth(100);
        progressTimersRef.current.push(setTimeout(() => {
            setProgressOpacity(0);
            progressTimersRef.current.push(setTimeout(() => setProgressWidth(0), 300));
        }, 200));
    };

    useEffect(() => {
        return () => clearProgressTimers();
    }, []);

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

function App() {
    const ToastProvider = window.ToastProvider;
    const AuthProvider = window.AuthProvider;

    return (
        <ToastProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </ToastProvider>
    );
}

window.App = App;
