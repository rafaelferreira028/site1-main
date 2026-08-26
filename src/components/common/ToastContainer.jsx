const { useEffect } = React;

function ToastContainer() {
    const { toasts, removerToast } = window.useToast();

    useEffect(() => {
        if (window.lucide) {
            lucide.createIcons();
        }
    }, [toasts]);

    return (
        <div id="toast-container" className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none">
            {toasts.map(toast => {
                let bgClass = '';
                let iconName = '';
                if (toast.tipo === 'success') {
                    bgClass = 'bg-emerald-50/95 border-emerald-150 text-emerald-800 shadow-emerald-500/5';
                    iconName = 'check-circle-2';
                } else if (toast.tipo === 'error') {
                    bgClass = 'bg-rose-50/95 border-rose-150 text-rose-800 shadow-rose-500/5';
                    iconName = 'alert-circle';
                } else {
                    bgClass = 'bg-blue-50/95 border-blue-150 text-blue-800 shadow-blue-500/5';
                    iconName = 'info';
                }

                return (
                    <div
                        key={toast.id}
                        onClick={() => removerToast(toast.id)}
                        className={`toast-item p-4 rounded-xl shadow-lg border backdrop-blur-md flex items-center gap-3 transition-all duration-300 pointer-events-auto cursor-pointer max-w-sm w-full ${bgClass}`}
                        style={{
                            transform: toast.isExiting ? 'translateY(-12px) scale(0.95)' : 'translateY(0) scale(1)',
                            opacity: toast.isExiting ? 0 : 1
                        }}
                    >
                        <i data-lucide={iconName} className="w-5 h-5 flex-shrink-0"></i>
                        <span className="text-sm font-semibold">{toast.mensagem}</span>
                    </div>
                );
            })}
        </div>
    );
}

window.ToastContainer = ToastContainer;
