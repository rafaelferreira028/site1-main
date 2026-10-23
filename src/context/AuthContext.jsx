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
        let isMounted = true;
        checkAuth();

        let authSubscription = null;
        if (window.supabaseClient && window.supabaseClient.auth) {
            try {
                const { data: { subscription } } = window.supabaseClient.auth.onAuthStateChange((event, newSession) => {
                    if (!isMounted) return;
                    if (event === 'SIGNED_OUT') {
                        try { localStorage.removeItem('site1_auth_session'); } catch (_) {}
                        setAuthenticated(false);
                        setSession(null);
                        setCurrentUser(null);
                    } else if (newSession) {
                        setSession(newSession);
                        setCurrentUser(newSession.user);
                        setAuthenticated(true);
                    }
                });
                authSubscription = subscription;
            } catch (e) {
                console.warn("Aviso ao subscrever onAuthStateChange:", e);
            }
        }

        return () => {
            isMounted = false;
            if (authSubscription && authSubscription.unsubscribe) {
                authSubscription.unsubscribe();
            }
        };
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

    const register = async (arg1, arg2, arg3) => {
        if (onLoadingStart) onLoadingStart();
        try {
            // Suporte flexível a formato objeto { identificador, senha, nome, tipo } ou posicional (nome, email, senha)
            let payload;
            if (typeof arg1 === 'object' && arg1 !== null) {
                payload = arg1;
            } else {
                payload = { nome: arg1, identificador: arg2, senha: arg3, tipo: 'email' };
            }

            const res = await window.authService.cadastrarNovoUsuario(payload);
            if (!res || !res.success) throw new Error("Falha ao registrar usuário.");
            // Login imediato após o cadastro
            const loginRes = await login(payload.identificador, payload.senha);
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
