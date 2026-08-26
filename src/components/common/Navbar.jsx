const { useEffect } = React;

export function Navbar({ activeTab, onSwitchTab }) {
    useEffect(() => {
        if (window.lucide) {
            lucide.createIcons();
        }
    }, [activeTab]);

    const tabs = [
        { id: 'doador', label: 'Cadastrar Doador', icon: 'user-plus' },
        { id: 'doacao_mista', label: 'Registrar Doação (Mista)', icon: 'gift' },
        { id: 'admin', label: 'Painel Admin & Relatórios', icon: 'layout-dashboard' },
        { id: 'estoque', label: 'Controle de Estoque', icon: 'boxes' }
    ];

    return (
        <nav className="flex flex-wrap gap-2 pt-4">
            {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                const baseClass = "tab-btn px-5 py-2.5 text-sm font-medium rounded-xl transition duration-150 focus:outline-none flex items-center gap-2 cursor-pointer";
                const activeClass = "bg-rose-50 text-rose-600 shadow-sm border border-rose-100 font-semibold";
                const inactiveClass = "text-gray-500 hover:text-gray-900 hover:bg-gray-50 bg-transparent border border-transparent";

                return (
                    <button
                        key={tab.id}
                        id={`btn-${tab.id}`}
                        onClick={() => onSwitchTab(tab.id)}
                        className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
                    >
                        <i data-lucide={tab.icon} className="w-4 h-4"></i>
                        {tab.label}
                    </button>
                );
            })}
        </nav>
    );
}
