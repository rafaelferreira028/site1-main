const { createContext, useContext, useState, useEffect } = React;

const AuthContext = createContext();

function AuthProvider({ children, onLoadingStart, onLoadingEnd }) {
    const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem('app_autenticado') === 'true');
    const [session, setSession] = useState(null);

    const checkAuth = async () => {
        if (onLoadingStart) onLoadingStart();
        try {
            const { session: sess } = await window.authService.verificarSessaoSupabase();
            setSession(sess);
            if (sess || sessionStorage.getItem('app_autenticado') === 'true') {
                sessionStorage.setItem('app_autenticado', 'true');
                setAuthenticated(true);
            } else {
                setAuthenticated(false);
            }
        } catch (e) {
            console.error("Erro na checagem de autenticação:", e);
        } finally {
            if (onLoadingEnd) onLoadingEnd();
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (email, password) => {
        if (onLoadingStart) onLoadingStart();
        try {
            const { data, error } = await window.authService.realizarLoginSupabase(email, password);
            if (error) throw error;
            sessionStorage.setItem('app_autenticado', 'true');
            setAuthenticated(true);
            setSession(data ? data.session : null);
            return { success: true };
        } catch (error) {
            return { success: false, error };
        } finally {
            if (onLoadingEnd) onLoadingEnd();
        }
    };

    const logout = async () => {
        if (onLoadingStart) onLoadingStart();
        try {
            await window.authService.realizarLogoutSupabase();
        } catch (e) {
            console.error(e);
        } finally {
            sessionStorage.removeItem('app_autenticado');
            setAuthenticated(false);
            setSession(null);
            if (onLoadingEnd) onLoadingEnd();
        }
    };

    return (
        <AuthContext.Provider value={{ authenticated, session, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

function useAuth() {
    return useContext(AuthContext);
}

window.AuthProvider = AuthProvider;
window.useAuth = useAuth;
