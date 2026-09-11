const { useEffect } = React;

function Header() {
    const { logout, currentUser } = window.useAuth();
    const ThemeSelector = window.ThemeSelector;

    useEffect(() => {
        if (window.lucide) {
            lucide.createIcons();
        }
    }, [currentUser]);

    const userDisplayName = currentUser
        ? (currentUser.user_metadata?.name || currentUser.identificador || currentUser.email || 'Operador')
        : null;

    return (
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
                <div className="bg-rose-600 text-white p-2.5 rounded-2xl shadow-sm">
                    <i data-lucide="heart-handshake" className="w-7 h-7"></i>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Rede de Combate ao Câncer</h1>
                    <p className="text-xs font-medium text-gray-500 dark:text-slate-400">Sistema Institucional de Gestão de Doações e Estoque</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Identificação do Usuário Conectado */}
                {userDisplayName && (
                    <div className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-gray-200/60 dark:border-slate-700/60 text-xs">
                        <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-[10px]">
                            {userDisplayName[0].toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 max-w-[150px] truncate" title={userDisplayName}>
                            {userDisplayName}
                        </span>
                    </div>
                )}

                {/* Seletor de Tema com Acessibilidade Visual */}
                <ThemeSelector />

                {/* Botão de Logout Global */}
                <button
                    id="btn-global-logout"
                    onClick={logout}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-rose-600 hover:text-white transition duration-150 focus:outline-none cursor-pointer flex items-center gap-1.5"
                    title="Sair do Sistema"
                >
                    <i data-lucide="log-out" className="w-4 h-4"></i>
                    <span>Sair</span>
                </button>

            </div>
        </header>
    );
}

window.Header = Header;
