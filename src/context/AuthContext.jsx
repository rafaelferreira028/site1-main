const { createContext, useContext, useState, useEffect } = React;

const AuthContext = createContext();

function AuthProvider({ children, onLoadingStart, onLoadingEnd }) {
    const [authenticated, setAuthenticated] = useState(false);
    const [session, setSession] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    const checkAuth = async () => {
        if (onLoadingStart) onLoadingStart();
        try {
            const { session: sess, user } = await window.authService.verificarSessaoSupabase();
            setSession(sess);
            setCurrentUser(user || (sess ? sess.user : null));
            setAuthenticated(Boolean(sess));
        } catch (e) {
            console.error("Erro na checagem de autenticação:", e);
        } finally {
            if (onLoadingEnd) onLoadingEnd();
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (identifier, password) => {
        if (onLoadingStart) onLoadingStart();
        try {
            const { data, error } = await window.authService.realizarLoginSupabase(identifier, password);
            if (error) throw error;
            setAuthenticated(true);
            setSession(data ? data.session : null);
            setCurrentUser(data && data.user ? data.user : (data ? data.session?.user : null));
            return { success: true };
        } catch (error) {
            return { success: false, error };
        } finally {
            if (onLoadingEnd) onLoadingEnd();
        }
    };

    const register = async ({ identificador, senha, nome, tipo }) => {
        if (onLoadingStart) onLoadingStart();
        try {
            const res = await window.authService.cadastrarNovoUsuario({ identificador, senha, nome, tipo });
            if (!res || !res.success) throw new Error("Falha ao registrar usuário.");
            // Login imediato após o cadastro
            const loginRes = await login(identificador, senha);
            if (!loginRes.success) throw loginRes.error;
            return { success: true, usuario: res.usuario };
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
            setAuthenticated(false);
            setSession(null);
            setCurrentUser(null);
            if (onLoadingEnd) onLoadingEnd();
        }
    };

    return (
        <AuthContext.Provider value={{ authenticated, session, currentUser, login, register, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

function useAuth() {
    return useContext(AuthContext);
}

window.AuthProvider = AuthProvider;
window.useAuth = useAuth;
