const { useState, useEffect } = React;

function LoginView() {
    const { login, register } = window.useAuth();
    const ThemeSelector = window.ThemeSelector;

    // 'login' ou 'register'
    const [mode, setMode] = useState('login');

    // Campos de Login
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    // Campos de Registro (Criar Login)
    const [regType, setRegType] = useState('id'); // 'id' ou 'email'
    const [regNome, setRegNome] = useState('');
    const [regIdentifier, setRegIdentifier] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirmPassword, setRegConfirmPassword] = useState('');
    const [showRegPassword, setShowRegPassword] = useState(false);

    // Mensagens de Feedback
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (window.lucide) {
            lucide.createIcons();
        }
    }, [mode, regType, errorMsg, successMsg, showLoginPassword, showRegPassword, isSubmitting]);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');
        setIsSubmitting(true);

        try {
            const res = await login(loginIdentifier, loginPassword);
            if (!res.success) {
                setErrorMsg(res.error ? res.error.message : 'Credenciais inválidas. Verifique seu login e senha.');
                setLoginPassword('');
            }
        } catch (err) {
            setErrorMsg(err.message || 'Erro ao realizar login.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!regIdentifier.trim()) {
            setErrorMsg(`Por favor, preencha o ${regType === 'email' ? 'e-mail' : 'ID'} desejado.`);
            return;
        }

        if (regType === 'email' && (!regIdentifier.includes('@') || !regIdentifier.includes('.'))) {
            setErrorMsg('Por favor, informe um endereço de e-mail válido (ex: seu.nome@email.com).');
            return;
        }

        if (regPassword.length < 3) {
            setErrorMsg('A senha deve conter no mínimo 3 caracteres.');
            return;
        }

        if (regPassword !== regConfirmPassword) {
            setErrorMsg('As senhas digitadas não coincidem. Por favor, verifique.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await register({
                identificador: regIdentifier.trim(),
                senha: regPassword,
                nome: regNome.trim(),
                tipo: regType
            });

            if (res.success) {
                setSuccessMsg('Conta criada com sucesso! Conectando ao sistema...');
            } else {
                setErrorMsg(res.error ? res.error.message : 'Não foi possível cadastrar o login.');
                setIsSubmitting(false);
            }
        } catch (err) {
            setErrorMsg(err.message || 'Erro ao cadastrar novo usuário.');
            setIsSubmitting(false);
        }
    };

    return (
        <div id="global-login-container" className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#05080e] px-4 relative transition-colors duration-200">
            {/* Theme Selector Flutuante no Topo Direito */}
            <div className="absolute top-6 right-6 z-20">
                <ThemeSelector />
            </div>

            <div className="bg-white dark:bg-[#0f172a] p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 max-w-md w-full relative z-10 space-y-6 transition-all duration-200">
                {/* Cabeçalho do Card */}
                <div className="text-center space-y-2">
                    <div className="bg-rose-600 text-white p-3 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center shadow-md shadow-rose-600/20">
                        <i data-lucide={mode === 'login' ? "shield-check" : "user-plus"} className="w-8 h-8"></i>
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {mode === 'login' ? 'Acesso Administrativo' : 'Criar Novo Acesso'}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                        {mode === 'login'
                            ? 'Acesso restrito para operadores autorizados'
                            : 'Crie seu login com o E-mail ou ID e senha que você quiser'}
                    </p>
                </div>

                {/* Alternador de Abas (Entrar / Criar Login) */}
                <div className="flex bg-gray-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-gray-200/50 dark:border-slate-700/50">
                    <button
                        type="button"
                        onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                        className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                            mode === 'login'
                                ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        <i data-lucide="log-in" className="w-4 h-4"></i>
                        <span>Entrar</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
                        className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                            mode === 'register'
                                ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        <i data-lucide="user-plus" className="w-4 h-4"></i>
                        <span>Criar Login</span>
                    </button>
                </div>

                {/* Formulário de Login */}
                {mode === 'login' && (
                    <form id="form-global-login" onSubmit={handleLoginSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <i data-lucide="user" className="w-3.5 h-3.5 text-rose-600"></i>
                                E-mail ou ID de Acesso
                            </label>
                            <input
                                type="text"
                                id="global-email-input"
                                value={loginIdentifier}
                                onChange={(e) => setLoginIdentifier(e.target.value)}
                                placeholder="Digite seu E-mail ou ID"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-sm focus:border-rose-500 bg-white dark:bg-[#070c14] text-slate-800 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <i data-lucide="lock" className="w-3.5 h-3.5 text-rose-600"></i>
                                Senha de Acesso
                            </label>
                            <div className="relative">
                                <input
                                    type={showLoginPassword ? "text" : "password"}
                                    id="global-password-input"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    placeholder="Senha de Acesso"
                                    required
                                    className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 dark:border-slate-700 text-sm focus:border-rose-500 bg-white dark:bg-[#070c14] text-slate-800 dark:text-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 cursor-pointer"
                                    title={showLoginPassword ? "Ocultar senha" : "Ver senha"}
                                >
                                    <i data-lucide={showLoginPassword ? "eye-off" : "eye"} className="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>

                        {errorMsg && (
                            <p id="global-login-error-msg" className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2">
                                <i data-lucide="alert-triangle" className="w-4 h-4 text-rose-600 shrink-0"></i>
                                <span>{errorMsg}</span>
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold py-3 rounded-xl shadow-md shadow-rose-600/20 transition duration-150 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Acessando...</span>
                                </>
                            ) : (
                                <>
                                    <i data-lucide="log-in" className="w-4 h-4"></i>
                                    <span>Entrar no Sistema</span>
                                </>
                            )}
                        </button>

                        <div className="pt-2 text-center">
                            <button
                                type="button"
                                onClick={() => { setMode('register'); setErrorMsg(''); }}
                                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                            >
                                Não possui um login? <span className="font-bold">Criar conta com E-mail ou ID</span>
                            </button>
                        </div>
                    </form>
                )}

                {/* Formulário de Criação de Login */}
                {mode === 'register' && (
                    <form id="form-global-register" onSubmit={handleRegisterSubmit} className="space-y-4">
                        {/* Seletor de Tipo: ID Personalizado ou E-mail */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Escolha o Tipo de Acesso
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setRegType('id'); setErrorMsg(''); }}
                                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                                        regType === 'id'
                                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-600 dark:text-rose-400'
                                            : 'bg-transparent border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <i data-lucide="hash" className="w-3.5 h-3.5"></i>
                                    <span>ID que eu quiser</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setRegType('email'); setErrorMsg(''); }}
                                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                                        regType === 'email'
                                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-600 dark:text-rose-400'
                                            : 'bg-transparent border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <i data-lucide="mail" className="w-3.5 h-3.5"></i>
                                    <span>Com E-mail</span>
                                </button>
                            </div>
                        </div>

                        {/* Campo Nome do Operador */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                Nome ou Apelido (Opcional)
                            </label>
                            <input
                                type="text"
                                value={regNome}
                                onChange={(e) => setRegNome(e.target.value)}
                                placeholder="Ex: Rafael Ferreira ou Operador"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm focus:border-rose-500 bg-white dark:bg-[#070c14] text-slate-800 dark:text-white"
                            />
                        </div>

                        {/* Campo de ID ou E-mail */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                                <span>{regType === 'email' ? 'E-mail de Acesso' : 'ID Personalizado Desejado'}</span>
                                <span className="text-[10px] text-gray-400 normal-case font-normal">
                                    {regType === 'email' ? 'Ex: rafael@exemplo.com' : 'Ex: rafael, operador01, admin'}
                                </span>
                            </label>
                            <input
                                type={regType === 'email' ? 'email' : 'text'}
                                value={regIdentifier}
                                onChange={(e) => setRegIdentifier(e.target.value)}
                                placeholder={regType === 'email' ? 'Digite seu e-mail' : 'Digite o ID que você quiser'}
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm focus:border-rose-500 bg-white dark:bg-[#070c14] text-slate-800 dark:text-white"
                            />
                        </div>

                        {/* Campo Senha */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                Senha que Você Quiser
                            </label>
                            <div className="relative">
                                <input
                                    type={showRegPassword ? "text" : "password"}
                                    value={regPassword}
                                    onChange={(e) => setRegPassword(e.target.value)}
                                    placeholder="Digite a senha desejada"
                                    required
                                    className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 dark:border-slate-700 text-sm focus:border-rose-500 bg-white dark:bg-[#070c14] text-slate-800 dark:text-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowRegPassword(!showRegPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 cursor-pointer"
                                    title={showRegPassword ? "Ocultar senha" : "Ver senha"}
                                >
                                    <i data-lucide={showRegPassword ? "eye-off" : "eye"} className="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>

                        {/* Campo Confirmar Senha */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                Confirmar Senha
                            </label>
                            <input
                                type={showRegPassword ? "text" : "password"}
                                value={regConfirmPassword}
                                onChange={(e) => setRegConfirmPassword(e.target.value)}
                                placeholder="Digite a mesma senha novamente"
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm focus:border-rose-500 bg-white dark:bg-[#070c14] text-slate-800 dark:text-white"
                            />
                        </div>

                        {errorMsg && (
                            <p className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2">
                                <i data-lucide="alert-triangle" className="w-4 h-4 text-rose-600 shrink-0"></i>
                                <span>{errorMsg}</span>
                            </p>
                        )}

                        {successMsg && (
                            <p className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                                <i data-lucide="check-circle-2" className="w-4 h-4 text-emerald-600 shrink-0"></i>
                                <span>{successMsg}</span>
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold py-3 rounded-xl shadow-md shadow-rose-600/20 transition duration-150 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Criando Acesso...</span>
                                </>
                            ) : (
                                <>
                                    <i data-lucide="check" className="w-4 h-4"></i>
                                    <span>Criar Meu Acesso e Entrar</span>
                                </>
                            )}
                        </button>

                        <div className="pt-2 text-center">
                            <button
                                type="button"
                                onClick={() => { setMode('login'); setErrorMsg(''); }}
                                className="text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:underline cursor-pointer"
                            >
                                Já possui um login? <span className="font-bold">Voltar para o Login</span>
                            </button>
                        </div>
                    </form>
                )}

                <div className="text-center pt-2 border-t border-gray-100 dark:border-slate-800/80">
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 font-medium">Rede de Combate ao Câncer de Catanduva &copy; 2026</p>
                </div>
            </div>
        </div>
    );
}

window.LoginView = LoginView;
