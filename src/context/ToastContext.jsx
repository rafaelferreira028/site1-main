const { createContext, useContext, useState, useEffect, useRef } = React;

const ToastContext = createContext();

function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timersRef = useRef(new Map());

    const limparTimer = (id) => {
        if (timersRef.current.has(id)) {
            clearTimeout(timersRef.current.get(id));
            timersRef.current.delete(id);
        }
    };

    const removerToast = (id) => {
        limparTimer(id);
        setToasts(prev => prev.map(t => t.id === id ? { ...t, isExiting: true } : t));
        const exitTimer = setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
            timersRef.current.delete(`exit_${id}`);
        }, 300);
        timersRef.current.set(`exit_${id}`, exitTimer);
    };

    const mostrarToast = (mensagem, tipo = 'success') => {
        const id = Date.now() + Math.random();
        const newToast = { id, mensagem, tipo, isExiting: false };

        setToasts(prev => [...prev, newToast]);

        const autoTimer = setTimeout(() => {
            removerToast(id);
        }, 4000);
        timersRef.current.set(id, autoTimer);
    };

    useEffect(() => {
        return () => {
            timersRef.current.forEach(timerId => clearTimeout(timerId));
            timersRef.current.clear();
        };
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, mostrarToast, removerToast }}>
            {children}
        </ToastContext.Provider>
    );
}

function useToast() {
    return useContext(ToastContext);
}

window.ToastProvider = ToastProvider;
window.useToast = useToast;
