const { useEffect } = React;

function Header() {
    const { logout } = window.useAuth();
    const ThemeSelector = window.ThemeSelector;

    useEffect(() => {
        if (window.lucide) {
            lucide.createIcons();
        }
    }, []);

    return (
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
                <div className="bg-rose-600 text-white p-2.5 rounded-2xl shadow-sm">
                    <i data-lucide="heart-handshake" className="w-7 h-7"></i>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Rede de Combate ao Câncer</h1>
                    <p className="text-xs font-medium text-gray-500">Sistema Institucional de Gestão de Doações e Estoque</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
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

                <div className="hidden md:flex items-center gap-2 bg-rose-50/60 border border-rose-100 px-3.5 py-1.5 rounded-full text-rose-700 font-semibold text-xs">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    <span>Ambiente Seguro</span>
                </div>
            </div>
        </header>
    );
}

window.Header = Header;
