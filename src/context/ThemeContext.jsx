const { createContext, useContext, useState, useEffect } = React;

const ThemeContext = createContext();

export function ThemeProvider({ children, onShowToast }) {
    const [theme, setThemeState] = useState(() => localStorage.getItem('site-theme') || 'light');
    const [menuOpen, setMenuOpen] = useState(false);

    const applyTheme = (newTheme) => {
        setThemeState(newTheme);
        localStorage.setItem('site-theme', newTheme);

        document.body.classList.remove('theme-light', 'theme-dark', 'theme-ultra-dark');
        document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-ultra-dark');

        document.body.classList.add('theme-' + newTheme);
        document.documentElement.classList.add('theme-' + newTheme);
    };

    useEffect(() => {
        applyTheme(theme);
    }, []);

    const changeTheme = (newTheme) => {
        applyTheme(newTheme);
        setMenuOpen(false);
        if (onShowToast) {
            if (newTheme === 'ultra-dark') {
                onShowToast('Modo Visão Sensível (Baixa Luminosidade) ativado com sucesso!', 'info');
            } else if (newTheme === 'dark') {
                onShowToast('Modo Escuro Padrão ativado!', 'info');
            } else {
                onShowToast('Modo Claro Padrão ativado!', 'info');
            }
        }
    };

    const toggleMenu = (e) => {
        if (e) e.stopPropagation();
        setMenuOpen(prev => !prev);
    };

    const closeMenu = () => {
        setMenuOpen(false);
    };

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (!e.target.closest('.theme-selector-container')) {
                closeMenu();
            }
        };
        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, changeTheme, menuOpen, toggleMenu, closeMenu }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
