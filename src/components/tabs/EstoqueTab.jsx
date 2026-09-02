const { useState, useEffect } = React;

function EstoqueTab({ isVisible, onOpenEditEstoque, onOpenEditEstoqueConsolidado, onOpenEditDoacao, onLoadingStart, onLoadingEnd }) {
    const { mostrarToast } = window.useToast();

    const [estoqueSubTab, setEstoqueSubTab] = useState('Geral');
    const [modoVisao, setModoVisao] = useState('consolidado');
    const [searchQuery, setSearchQuery] = useState('');

    const [estoqueList, setEstoqueList] = useState([]);
    const [estoqueDoacoesList, setEstoqueDoacoesList] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    // Métricas
    const [totalBazar, setTotalBazar] = useState(0);
    const [totalAlimentos, setTotalAlimentos] = useState(0);
    const [totalHigiene, setTotalHigiene] = useState(0);
    const [totalItens, setTotalItens] = useState(0);

    const carregarDadosEstoque = async () => {
        setLoadingData(true);
        if (onLoadingStart) onLoadingStart();
        try {
            const { data: matData } = await window.estoqueService.buscarEstoqueMateriais();
            const listMat = matData || [];
            setEstoqueList(listMat);

            const { data: doaData } = await window.estoqueService.buscarEstoqueDoacoesCanais();
            setEstoqueDoacoesList(doaData || []);

            // Calcular Métricas
            const bzr = listMat.filter(m => m.id_categoria === 6 || m.categorias_itens?.nome_categoria?.toLowerCase().includes('bazar')).reduce((acc, item) => acc + parseInt(item.quantidade || 0), 0);
            const alm = listMat.filter(m => m.id_categoria === 2).reduce((acc, item) => acc + parseInt(item.quantidade || 0), 0);
            const hig = listMat.filter(m => m.id_categoria === 3).reduce((acc, item) => acc + parseInt(item.quantidade || 0), 0);
            const tot = listMat.reduce((acc, item) => acc + parseInt(item.quantidade || 0), 0);

            setTotalBazar(bzr);
            setTotalAlimentos(alm);
            setTotalHigiene(hig);
            setTotalItens(tot);
        } catch (e) {
            console.error("Erro ao carregar estoque:", e);
        } finally {
            setLoadingData(false);
            if (onLoadingEnd) onLoadingEnd();
        }
    };

    useEffect(() => {
        if (isVisible) {
            carregarDadosEstoque();
        }
    }, [isVisible]);

    useEffect(() => {
        if (window.lucide) {
            lucide.createIcons();
        }
    }, [isVisible, estoqueSubTab, modoVisao, searchQuery, estoqueList, estoqueDoacoesList, loadingData]);

    if (!isVisible) return null;

    const handleGerarPDF = async () => {
        if (onLoadingStart) onLoadingStart();
        try {
            const res = await window.pdfService.exportarPDFEstoqueOficial();
            if (res.success) {
                mostrarToast('Relatório de estoque em PDF baixado com sucesso!', 'success');
            } else {
                mostrarToast(res.message, 'info');
            }
        } catch (e) {
            mostrarToast('Erro ao gerar relatório em PDF: ' + e.message, 'error');
        } finally {
            if (onLoadingEnd) onLoadingEnd();
        }
    };

    const isCanalTab = ['Presencial', 'PIX', 'Dinheiro'].includes(estoqueSubTab);

    const query = searchQuery.toLowerCase().trim();
    let canalDoacoesFiltradas = estoqueDoacoesList.filter(d => d.canal_recebimento === estoqueSubTab);
    if (query) {
        canalDoacoesFiltradas = canalDoacoesFiltradas.filter(d => {
            const obs = d.observacoes ? d.observacoes.toLowerCase() : '';
            let hasMatMatch = false;
            let hasFinMatch = false;

            if (d.doacoes_financeiras && d.doacoes_financeiras.length > 0) {
                const fin = d.doacoes_financeiras[0];
                hasFinMatch = String(fin.valor).includes(query) || (fin.comprovante_transacao && fin.comprovante_transacao.toLowerCase().includes(query));
            }
            if (d.doacoes_materiais && d.doacoes_materiais.length > 0) {
                const mat = d.doacoes_materiais[0];
                const catName = mat.categorias_itens ? mat.categorias_itens.nome_categoria.toLowerCase() : '';
                hasMatMatch = mat.descricao_item.toLowerCase().includes(query) || catName.includes(query) || mat.destino_item.toLowerCase().includes(query) || mat.estado_conservacao.toLowerCase().includes(query);
            }

            return obs.includes(query) || hasFinMatch || hasMatMatch;
        });
    }

    let materiaisFiltrados = [];
    if (estoqueSubTab === 'Geral') {
        materiaisFiltrados = estoqueList;
    } else if (estoqueSubTab === 'Bazar') {
        materiaisFiltrados = estoqueList.filter(m => m.id_categoria === 6 || m.categorias_itens?.nome_categoria?.toLowerCase().includes('bazar'));
    } else {
        const mapCat = { 'Alimentos': 2, 'Higiene': 3, 'Cabelo': 4, 'Ortopedicos': 5 };
        const catId = mapCat[estoqueSubTab];
        materiaisFiltrados = estoqueList.filter(m => m.id_categoria === catId || (m.categorias_itens && m.categorias_itens.nome_categoria.toLowerCase().includes(estoqueSubTab.toLowerCase())));
    }

    if (query) {
        materiaisFiltrados = materiaisFiltrados.filter(m => {
            const desc = m.descricao_item.toLowerCase();
            const destino = m.destino_item.toLowerCase();
            const estado = m.estado_conservacao.toLowerCase();
            const unidade = m.unidade_medida.toLowerCase();
            return desc.includes(query) || destino.includes(query) || estado.includes(query) || unidade.includes(query);
        });
    }

    const gruposConsolidados = {};
    if (modoVisao === 'consolidado') {
        materiaisFiltrados.forEach(item => {
            const categoria = item.categorias_itens?.nome_categoria || 'Sem categoria';
            const key = `categoria-${item.id_categoria || categoria.toLowerCase()}`;
            if (!gruposConsolidados[key]) {
                gruposConsolidados[key] = {
                    key,
                    descricao: categoria,
                    quantidadeTotal: 0,
                    unidade: 'Itens',
                    destino: item.destino_item || 'Estoque Geral',
                    estado: 'Não se aplica',
                    id_categoria: null,
                    lotes: []
                };
            }
            gruposConsolidados[key].quantidadeTotal += parseInt(item.quantidade || 0);
            gruposConsolidados[key].lotes.push(item);
        });
    }

    const descricoesBanners = {
        'Geral': { titulo: 'Inventário do Estoque Geral (Todos os Itens e Lotes)', sub: 'Exibição completa e unificada de todos os materiais, cestas, insumos e produtos doados em estoque.', icon: 'layers', color: 'bg-rose-100 text-rose-700' },
        'Bazar': { titulo: 'Resumo Consolidado do Estoque: Bazar', sub: 'Exibição exclusiva e quantitativo acumulado de todos os itens doados para o Bazar.', icon: 'shopping-bag', color: 'bg-rose-100 text-rose-700' },
        'Alimentos': { titulo: 'Resumo Consolidado do Estoque: Alimentos / Cestas', sub: 'Quantitativo acumulado de alimentos e cestas básicas em estoque.', icon: 'apple', color: 'bg-amber-100 text-amber-700' },
        'Higiene': { titulo: 'Resumo Consolidado do Estoque: Produtos de Higiene', sub: 'Quantitativo acumulado de produtos de higiene pessoal.', icon: 'droplet', color: 'bg-sky-100 text-sky-700' },
        'Cabelo': { titulo: 'Resumo Consolidado do Estoque: Cabelo (Perucas)', sub: 'Quantitativo acumulado de perucas e mechas de cabelo.', icon: 'sparkles', color: 'bg-purple-100 text-purple-700' },
        'Ortopedicos': { titulo: 'Resumo Consolidado do Estoque: Equipamentos Ortopédicos', sub: 'Equipamentos ortopédicos disponíveis para pacientes.', icon: 'accessibility', color: 'bg-emerald-100 text-emerald-700' }
    };

    const currentBannerInfo = descricoesBanners[estoqueSubTab] || descricoesBanners['Geral'];

    return (
        <div id="tab-estoque" className="tab-content active visible space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                        <i data-lucide="boxes" className="w-6 h-6 text-rose-600"></i>
                        <span>Controle Integrado de Estoque e Inventário</span>
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Gestão transparente dos insumos, cestas básicas e itens doados por canal</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleGerarPDF}
                        className="group px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-slate-900/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer flex items-center gap-2 select-none"
                        title="Baixar Relatório de Estoque em PDF"
                    >
                        <i data-lucide="file-text" className="w-4 h-4 text-rose-400 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6"></i>
                        <span>Baixar Relatório PDF</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-rose-100/80 bg-rose-50/20 flex items-center gap-4 shadow-xs hover-scale cursor-default">
                    <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl border border-rose-200/50 flex-shrink-0">
                        <i data-lucide="shopping-bag" className="w-6 h-6"></i>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-rose-700 uppercase tracking-wider truncate">Bazar Beneficente</p>
                        <h3 id="stock-metric-bazar" className="text-xl font-extrabold text-slate-900 tracking-tight leading-none mt-1">{totalBazar} <span className="text-xs font-medium text-slate-400">un.</span></h3>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-amber-100/80 bg-amber-50/20 flex items-center gap-4 shadow-xs hover-scale cursor-default">
                    <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl border border-amber-200/50 flex-shrink-0">
                        <i data-lucide="apple" className="w-6 h-6"></i>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-amber-700 uppercase tracking-wider truncate">Alimentos / Cestas</p>
                        <h3 id="stock-metric-alimentos" className="text-xl font-extrabold text-slate-900 tracking-tight leading-none mt-1">{totalAlimentos} <span className="text-xs font-medium text-slate-400">un.</span></h3>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-sky-100/80 bg-sky-50/20 flex items-center gap-4 shadow-xs hover-scale cursor-default">
                    <div className="p-3 bg-sky-100 text-sky-700 rounded-2xl border border-sky-200/50 flex-shrink-0">
                        <i data-lucide="droplet" className="w-6 h-6"></i>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-sky-700 uppercase tracking-wider truncate">Total Higiene</p>
                        <h3 id="stock-metric-higiene" className="text-xl font-extrabold text-slate-900 tracking-tight leading-none mt-1">{totalHigiene} <span className="text-xs font-medium text-slate-400">un.</span></h3>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-xs hover-scale cursor-default">
                    <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl border border-slate-200/60 flex-shrink-0">
                        <i data-lucide="package" className="w-6 h-6"></i>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Total Geral</p>
                        <h3 id="stock-metric-total" className="text-xl font-extrabold text-slate-900 tracking-tight leading-none mt-1">{totalItens} <span className="text-xs font-medium text-slate-400">itens</span></h3>
                    </div>
                </div>
            </div>

            <div className="space-y-4 mb-6 border-b border-gray-200 pb-6">
                <div>
                    <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Inventário de Conteúdo e Itens Doados</span>
                    <div className="flex flex-wrap gap-2">
                        <button
                            id="btn-est-Geral"
                            onClick={() => { setEstoqueSubTab('Geral'); setSearchQuery(''); }}
                            className={`estoque-sub-btn px-4 py-2.5 text-xs font-bold rounded-xl border focus:outline-none transition-all duration-200 cursor-pointer flex items-center gap-2 ${estoqueSubTab === 'Geral' ? 'bg-rose-600 text-white border-rose-600 shadow-xs' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            <i data-lucide="layers" className="w-4 h-4"></i> 📦 Estoque Geral
                        </button>
                        <button
                            id="btn-est-Bazar"
                            onClick={() => { setEstoqueSubTab('Bazar'); setSearchQuery(''); }}
                            className={`estoque-sub-btn px-3.5 py-2 text-xs font-medium rounded-xl border focus:outline-none transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${estoqueSubTab === 'Bazar' ? 'bg-rose-600 text-white border-rose-600 shadow-xs font-bold' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            <i data-lucide="shopping-bag" className="w-3.5 h-3.5"></i> 🛍️ Bazar
                        </button>
                        <button
                            id="btn-est-Alimentos"
                            onClick={() => { setEstoqueSubTab('Alimentos'); setSearchQuery(''); }}
                            className={`estoque-sub-btn px-3.5 py-2 text-xs font-medium rounded-xl border focus:outline-none transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${estoqueSubTab === 'Alimentos' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs font-semibold' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            <i data-lucide="apple" className="w-3.5 h-3.5"></i> Alimentos / Cesta Básica
                        </button>
                        <button
                            id="btn-est-Higiene"
                            onClick={() => { setEstoqueSubTab('Higiene'); setSearchQuery(''); }}
                            className={`estoque-sub-btn px-3.5 py-2 text-xs font-medium rounded-xl border focus:outline-none transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${estoqueSubTab === 'Higiene' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs font-semibold' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            <i data-lucide="droplet" className="w-3.5 h-3.5"></i> Higiene
                        </button>
                        <button
                            id="btn-est-Cabelo"
                            onClick={() => { setEstoqueSubTab('Cabelo'); setSearchQuery(''); }}
                            className={`estoque-sub-btn px-3.5 py-2 text-xs font-medium rounded-xl border focus:outline-none transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${estoqueSubTab === 'Cabelo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs font-semibold' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            <i data-lucide="sparkles" className="w-3.5 h-3.5"></i> Cabelo (Perucas)
                        </button>
                        <button
                            id="btn-est-Ortopedicos"
                            onClick={() => { setEstoqueSubTab('Ortopedicos'); setSearchQuery(''); }}
                            className={`estoque-sub-btn px-3.5 py-2 text-xs font-medium rounded-xl border focus:outline-none transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${estoqueSubTab === 'Ortopedicos' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs font-semibold' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            <i data-lucide="accessibility" className="w-3.5 h-3.5"></i> Ortopédicos
                        </button>
                    </div>
                </div>

                <div>
                    <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Entradas Filtradas por Canais de Arrecadação</span>
                    <div className="flex flex-wrap gap-2">
                        <button
                            id="btn-est-Presencial"
                            onClick={() => { setEstoqueSubTab('Presencial'); setSearchQuery(''); }}
                            className={`estoque-sub-btn px-3.5 py-2 text-xs font-medium rounded-xl border focus:outline-none transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${estoqueSubTab === 'Presencial' ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs font-semibold' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            <i data-lucide="building-2" className="w-3.5 h-3.5"></i> Presencial (Sede)
                        </button>
                        <button
                            id="btn-est-PIX"
                            onClick={() => { setEstoqueSubTab('PIX'); setSearchQuery(''); }}
                            className={`estoque-sub-btn px-3.5 py-2 text-xs font-medium rounded-xl border focus:outline-none transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${estoqueSubTab === 'PIX' ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs font-semibold' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            <i data-lucide="qr-code" className="w-3.5 h-3.5"></i> PIX / Banco
                        </button>
                        <button
                            id="btn-est-Dinheiro"
                            onClick={() => { setEstoqueSubTab('Dinheiro'); setSearchQuery(''); }}
                            className={`estoque-sub-btn px-3.5 py-2 text-xs font-medium rounded-xl border focus:outline-none transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${estoqueSubTab === 'Dinheiro' ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs font-semibold' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            <i data-lucide="coins" className="w-3.5 h-3.5"></i> Dinheiro / Cofrinho / Bazar
                        </button>
                    </div>
                </div>
            </div>

            {!isCanalTab && (
                <div id="banner-estoque-materiais" className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                    <div id="banner-icon-container" className={`p-3 rounded-xl ${currentBannerInfo.color}`}>
                        <i data-lucide={currentBannerInfo.icon} className="w-5 h-5"></i>
                    </div>
                    <div>
                        <h4 id="banner-titulo-subtab" className="font-bold text-sm text-slate-800">{currentBannerInfo.titulo}</h4>
                        <p id="banner-subtitulo-subtab" className="text-xs text-slate-500">{currentBannerInfo.sub}</p>
                    </div>
                </div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 space-y-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-4">
                    <div className="relative w-full md:w-80">
                        <i data-lucide="search" className="w-4 h-4 absolute left-3.5 top-3 text-gray-400"></i>
                        <input
                            type="text"
                            id="stock-search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar itens, lotes ou detalhes..."
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:border-rose-500"
                        />
                    </div>

                    {!isCanalTab && (
                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-medium border border-slate-200">
                            <span className="text-slate-500 px-2 font-semibold text-[11px] uppercase tracking-wider">Modo de Exibição:</span>
                            <button
                                id="btn-visao-consolidado"
                                onClick={() => setModoVisao('consolidado')}
                                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${modoVisao === 'consolidado' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Acumulado / Consolidado
                            </button>
                            <button
                                id="btn-visao-lotes"
                                onClick={() => setModoVisao('lotes')}
                                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${modoVisao === 'lotes' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Lotes Individuais
                            </button>
                        </div>
                    )}
                </div>

                {isCanalTab && (
                    <div id="container-estoque-canais" className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wider font-bold border-b border-gray-200">
                                    <th className="px-6 py-3.5">Data Entrada</th>
                                    <th className="px-6 py-3.5 text-center">Tipo</th>
                                    <th className="px-6 py-3.5">Item / Detalhes</th>
                                    <th className="px-6 py-3.5">Estado / Destino</th>
                                    <th className="px-6 py-3.5">Observações</th>
                                    <th className="px-6 py-3.5 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody id="tabela-estoque-canais-body" className="divide-y divide-gray-100 text-xs">
                                {loadingData ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-10 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-xs font-medium text-gray-500 animate-pulse">Carregando dados do estoque...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : canalDoacoesFiltradas.length === 0 ? (
                                    <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Nenhuma doação registrada para este canal.</td></tr>
                                ) : (
                                    canalDoacoesFiltradas.map(doacao => {
                                        const hasFin = doacao.doacoes_financeiras && doacao.doacoes_financeiras.length > 0;
                                        const fin = hasFin ? doacao.doacoes_financeiras[0] : null;

                                        const hasMat = doacao.doacoes_materiais && doacao.doacoes_materiais.length > 0;
                                        const mat = hasMat ? doacao.doacoes_materiais[0] : null;
                                        const dataFmt = new Date(doacao.data_doacao).toLocaleDateString('pt-BR');

                                        return (
                                            <tr key={doacao.id_doacao} className="hover:bg-gray-50 border-b border-gray-200 transition duration-150">
                                                <td className="px-6 py-4 text-xs whitespace-nowrap font-medium text-gray-900">{dataFmt}</td>
                                                <td className="px-6 py-4 text-center">
                                                    {hasFin && <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded font-medium block mb-1 text-center">Financeira</span>}
                                                    {hasMat && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-medium block text-center">Material</span>}
                                                </td>
                                                <td className="px-6 py-4 text-xs leading-relaxed">
                                                    {hasFin && (
                                                        <div>
                                                            <strong>{window.formatarMoeda(fin.valor)}</strong>
                                                            {fin.comprovante_transacao && <span className="text-xs text-gray-500 font-mono block">ID: {fin.comprovante_transacao}</span>}
                                                        </div>
                                                    )}
                                                    {hasMat && (
                                                        <div>
                                                            <span className="font-medium">{mat.descricao_item}</span>
                                                            <span className="text-xs text-gray-500"> ({mat.categorias_itens ? mat.categorias_itens.nome_categoria : 'Sem Categoria'} - {mat.quantidade} {mat.unidade_medida})</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-xs">
                                                    {hasMat ? (
                                                        <div>
                                                            <span className="text-xs block"><strong>Destino:</strong> {mat.destino_item}</span>
                                                            <span className="text-xs block"><strong>Estado:</strong> {mat.estado_conservacao}</span>
                                                        </div>
                                                    ) : '-'}
                                                </td>
                                                <td className="px-6 py-4 max-w-[150px] truncate text-xs" title={doacao.observacoes || ''}>{doacao.observacoes || '-'}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={() => onOpenEditDoacao(doacao)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-2 rounded-lg cursor-pointer transition flex items-center justify-center w-8 h-8" title="Editar Doação">
                                                            <i data-lucide="pencil" className="w-4 h-4"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {!isCanalTab && (
                    <div id="container-estoque-materiais" className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead id="tabela-estoque-materiais-head">
                                {modoVisao === 'consolidado' ? (
                                    <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wider font-bold border-b border-gray-200">
                                        <th className="px-6 py-3.5 font-bold">Item / Descrição Consolidada</th>
                                        <th className="px-6 py-3.5 font-bold text-center">Quantidade Total Acumulada</th>
                                        <th className="px-6 py-3.5 font-bold">Unidade</th>
                                        <th className="px-6 py-3.5 font-bold">Destino Atual</th>
                                        <th className="px-6 py-3.5 font-bold">Registros de Doação</th>
                                        <th className="px-6 py-3.5 font-bold text-center">Ações</th>
                                    </tr>
                                ) : (
                                    <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wider font-bold border-b border-gray-200">
                                        <th className="px-6 py-3.5 font-bold">Descrição do Item</th>
                                        <th className="px-6 py-3.5 font-bold">Categoria</th>
                                        <th className="px-6 py-3.5 font-bold text-center">Quantidade</th>
                                        <th className="px-6 py-3.5 font-bold">Unidade</th>
                                        <th className="px-6 py-3.5 font-bold">Estado de Conservação</th>
                                        <th className="px-6 py-3.5 font-bold">Destino Atual</th>
                                        <th className="px-6 py-3.5 font-bold">Data de Entrada</th>
                                        <th className="px-6 py-3.5 font-bold text-center">Ações</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody id="tabela-estoque-materiais-body" className="divide-y divide-gray-100 text-xs">
                                {loadingData ? (
                                    <tr>
                                        <td colSpan={modoVisao === 'consolidado' ? 6 : 8} className="px-6 py-10 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-xs font-medium text-gray-500 animate-pulse">Carregando itens do estoque...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : modoVisao === 'consolidado' ? (
                                    Object.values(gruposConsolidados).length === 0 ? (
                                        <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Nenhum item registrado para esta categoria/destino.</td></tr>
                                    ) : (
                                        Object.values(gruposConsolidados).map((grupo) => (
                                            <tr key={grupo.key} className="hover:bg-rose-50/40 border-b border-gray-200 transition duration-150">
                                                <td className="px-6 py-4 font-bold text-slate-800 text-xs flex items-center gap-2">
                                                    <i data-lucide="package-check" className="w-4 h-4 text-rose-600"></i>
                                                    {grupo.descricao}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="bg-rose-100 text-rose-800 font-extrabold text-sm px-3 py-1 rounded-full shadow-2xs">
                                                        {grupo.quantidadeTotal}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-medium text-slate-700">{grupo.unidade}</td>
                                                <td className="px-6 py-4 text-xs">
                                                    <span className="bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-lg font-medium">{grupo.destino}</span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                                                    {grupo.lotes.length} lote(s) doado(s)
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => onOpenEditEstoqueConsolidado(grupo)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-2 rounded-lg cursor-pointer transition inline-flex items-center justify-center w-8 h-8" title="Editar Item Consolidado no Estoque">
                                                        <i data-lucide="pencil" className="w-4 h-4"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )
                                ) : (
                                    materiaisFiltrados.length === 0 ? (
                                        <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-500">Nenhum lote registrado para esta categoria/destino.</td></tr>
                                    ) : (
                                        materiaisFiltrados.map(item => {
                                            const dataEntrada = item.doacoes && item.doacoes.data_doacao
                                                ? new Date(item.doacoes.data_doacao).toLocaleDateString('pt-BR')
                                                : '-';
                                            const catNome = item.categorias_itens ? item.categorias_itens.nome_categoria : 'Estoque Geral';

                                            return (
                                                <tr key={item.id_material} className="hover:bg-gray-50 border-b border-gray-200 transition duration-150">
                                                    <td className="px-6 py-4 font-medium text-gray-900 text-xs">{item.descricao_item}</td>
                                                    <td className="px-6 py-4 text-xs font-semibold text-rose-600">{catNome}</td>
                                                    <td className="px-6 py-4 text-center font-bold text-gray-900 text-xs">{item.quantidade}</td>
                                                    <td className="px-6 py-4 text-xs">{item.unidade_medida}</td>
                                                    <td className="px-6 py-4 text-xs">{item.estado_conservacao}</td>
                                                    <td className="px-6 py-4 text-xs">
                                                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded font-medium">{item.destino_item}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs whitespace-nowrap">{dataEntrada}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button onClick={() => onOpenEditEstoque(item)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-2 rounded-lg cursor-pointer transition flex items-center justify-center w-8 h-8" title="Editar Item no Estoque">
                                                            <i data-lucide="pencil" className="w-4 h-4"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

window.EstoqueTab = EstoqueTab;
