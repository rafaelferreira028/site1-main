const { createContext, useContext, useState } = React;

const ToastContext = createContext();

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const mostrarToast = (mensagem, tipo = 'success') => {
        const id = Date.now() + Math.random();
        const newToast = { id, mensagem, tipo, isExiting: false };
        
        setToasts(prev => [...prev, newToast]);

        setTimeout(() => {
            removerToast(id);
        }, 4000);
    };

    const removerToast = (id) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, isExiting: true } : t));
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 300);
    };

    return (
        <ToastContext.Provider value={{ toasts, mostrarToast, removerToast }}>
            {children}
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
