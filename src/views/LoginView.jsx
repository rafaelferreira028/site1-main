const { useState, useEffect } = React;
import { useAuth } from '../context/AuthContext.jsx';
import { ThemeSelector } from '../components/common/ThemeSelector.jsx';

export function LoginView() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (window.lucide) {
            lucide.createIcons();
        }
    }, [errorMsg]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        const res = await login(email, password);
        if (!res.success) {
            setErrorMsg(res.error ? res.error.message : 'Credenciais inválidas. Tente novamente.');
            setPassword('');
        }
    };

    return (
        <div id="global-login-container" className="min-h-screen flex items-center justify-center bg-slate-50 px-4 relative">
            {/* Theme Selector Flutuante no Topo Direito */}
            <div className="absolute top-6 right-6 z-20">
                <ThemeSelector />
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full relative z-10 space-y-6">
                <div className="text-center space-y-2">
                    <div className="bg-rose-600 text-white p-3 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center shadow-md shadow-rose-600/20">
                        <i data-lucide="shield-check" className="w-8 h-8"></i>
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Portal Institucional</h2>
                    <p className="text-xs text-gray-500 font-medium">Acesso restrito para funcionários e operadores autorizados</p>
                </div>

                <form id="form-global-login" onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">E-mail Corporativo</label>
                        <input
                            type="email"
                            id="global-email-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="E-mail de Acesso"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-rose-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Senha de Acesso</label>
                        <input
                            type="password"
                            id="global-password-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Senha de Acesso"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-rose-500"
                        />
                    </div>

                    {errorMsg && (
                        <p id="global-login-error-msg" className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100 flex items-center gap-2">
                            <i data-lucide="alert-triangle" className="w-4 h-4 text-rose-600"></i> {errorMsg}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl shadow-md shadow-rose-600/20 transition duration-150 cursor-pointer flex items-center justify-center gap-2"
                    >
                        <i data-lucide="log-in" className="w-4 h-4"></i> Entrar no Sistema
                    </button>
                </form>

                <div className="text-center pt-2">
                    <p className="text-[11px] text-gray-400 font-medium">Rede de Combate ao Câncer de Catanduva &copy; 2026</p>
                </div>
            </div>
        </div>
    );
}
