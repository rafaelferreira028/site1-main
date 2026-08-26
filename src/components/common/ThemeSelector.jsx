const { useEffect } = React;

function ThemeSelector() {
    const { theme, changeTheme, menuOpen, toggleMenu } = window.useTheme();

    const labels = {
        'light': 'Modo Claro',
        'dark': 'Modo Escuro',
        'ultra-dark': 'Visão Sensível'
    };

    const icons = {
        'light': 'sun',
        'dark': 'moon',
        'ultra-dark': 'eye'
    };

    const iconColors = {
        'light': 'text-amber-500',
        'dark': 'text-indigo-400',
        'ultra-dark': 'text-rose-500'
    };

    useEffect(() => {
        if (window.lucide) {
            lucide.createIcons();
        }
    }, [theme, menuOpen]);

    return (
        <div className="relative inline-block text-left theme-selector-container">
            <button
                type="button"
                onClick={toggleMenu}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-xs text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none transition cursor-pointer shadow-2xs"
            >
                <div className="theme-btn-icon-container">
                    <i data-lucide={icons[theme] || 'eye'} className={`w-4 h-4 ${iconColors[theme] || 'text-rose-500'}`}></i>
                </div>
                <span className="theme-btn-label">{labels[theme] || 'Visão Sensível'}</span>
                <i data-lucide="chevron-down" className="w-3.5 h-3.5 text-gray-400"></i>
            </button>

            {menuOpen && (
                <div className="theme-dropdown-menu absolute right-0 mt-2 w-48 rounded-2xl bg-white shadow-xl border border-gray-100 py-1.5 z-50 transition-all duration-200">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                        Acessibilidade Visual
                    </div>
                    <button
                        onClick={() => changeTheme('light')}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-rose-50/60 transition cursor-pointer ${theme === 'light' ? 'font-bold text-rose-600' : 'text-gray-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <i data-lucide="sun" className="w-4 h-4 text-amber-500"></i>
                            <span>Modo Claro (Padrão)</span>
                        </div>
                        {theme === 'light' && <i data-lucide="check" className="w-3.5 h-3.5 text-rose-600"></i>}
                    </button>
                    <button
                        onClick={() => changeTheme('dark')}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-rose-50/60 transition cursor-pointer ${theme === 'dark' ? 'font-bold text-rose-600' : 'text-gray-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <i data-lucide="moon" className="w-4 h-4 text-indigo-400"></i>
                            <span>Modo Escuro</span>
                        </div>
                        {theme === 'dark' && <i data-lucide="check" className="w-3.5 h-3.5 text-rose-600"></i>}
                    </button>
                    <button
                        onClick={() => changeTheme('ultra-dark')}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-rose-50/60 transition cursor-pointer ${theme === 'ultra-dark' ? 'font-bold text-rose-600' : 'text-gray-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <i data-lucide="eye" className="w-4 h-4 text-rose-500"></i>
                            <span>Visão Sensível (Baixo Brilho)</span>
                        </div>
                        {theme === 'ultra-dark' && <i data-lucide="check" className="w-3.5 h-3.5 text-rose-600"></i>}
                    </button>
                </div>
            )}
        </div>
    );
}

window.ThemeSelector = ThemeSelector;
