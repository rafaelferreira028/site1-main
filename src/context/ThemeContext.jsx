const { createContext, useContext, useState, useEffect } = React;

const ThemeContext = createContext();

const TEMAS_VALIDOS = ['light', 'dark', 'ultra-dark'];

function getTemaInicial() {
    try {
        const salvo = localStorage.getItem('site-theme');
        return TEMAS_VALIDOS.includes(salvo) ? salvo : 'light';
    } catch (_) {
        return 'light';
    }
}

function ThemeProvider({ children, onShowToast }) {
    const [theme, setThemeState] = useState(getTemaInicial);
    const [menuOpen, setMenuOpen] = useState(false);

    const applyTheme = (newTheme) => {
        const temaFinal = TEMAS_VALIDOS.includes(newTheme) ? newTheme : 'light';
        setThemeState(temaFinal);

        try {
            localStorage.setItem('site-theme', temaFinal);
        } catch (e) {
            console.warn("Não foi possível salvar o tema no localStorage:", e);
        }

        document.body.classList.remove('theme-light', 'theme-dark', 'theme-ultra-dark');
        document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-ultra-dark');

        document.body.classList.add('theme-' + temaFinal);
        document.documentElement.classList.add('theme-' + temaFinal);
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
        if (e && e.stopPropagation) e.stopPropagation();
        setMenuOpen(prev => !prev);
    };

    const closeMenu = () => {
        setMenuOpen(false);
    };

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (!(e.target instanceof Element)) return;
            if (!e.target.closest('.theme-selector-container')) {
                closeMenu();
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, changeTheme, menuOpen, toggleMenu, closeMenu }}>
            {children}
        </ThemeContext.Provider>
    );
}

function useTheme() {
    return useContext(ThemeContext);
}

window.ThemeProvider = ThemeProvider;
window.useTheme = useTheme;
