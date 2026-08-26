const { useState, useEffect } = React;

function AdminTab({ isVisible, onOpenEditDoador, onOpenEditDoacao, onDataChanged, onLoadingStart, onLoadingEnd }) {
    const { mostrarToast } = window.useToast();

    const [adminSubTab, setAdminSubTab] = useState('doadores');
    const [searchQuery, setSearchQuery] = useState('');

    const [doadoresList, setDoadoresList] = useState([]);
    const [doacoesList, setDoacoesList] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    // Métricas
    const [metricDoadores, setMetricDoadores] = useState(0);
    const [metricDoacoes, setMetricDoacoes] = useState(0);
    const [metricFinanceiro, setMetricFinanceiro] = useState(0);
    const [metricMateriais, setMetricMateriais] = useState(0);

    const carregarMetricas = async () => {
        if (!window.supabaseClient) return;
        try {
            const { count: doadoresCount } = await window.supabaseClient.from('doadores').select('*', { count: 'exact', head: true });
            const { count: doacoesCount } = await window.supabaseClient.from('doacoes').select('*', { count: 'exact', head: true });

            const { data: finData } = await window.supabaseClient.from('doacoes_financeiras').select('valor');
            const totalFin = finData ? finData.reduce((acc, r) => acc + parseFloat(r.valor || 0), 0) : 0;

            const { data: matData } = await window.supabaseClient.from('doacoes_materiais').select('quantidade');
            const totalMat = matData ? matData.reduce((acc, r) => acc + parseInt(r.quantidade || 0), 0) : 0;

            setMetricDoadores(doadoresCount || 0);
            setMetricDoacoes(doacoesCount || 0);
            setMetricFinanceiro(totalFin);
            setMetricMateriais(totalMat);
        } catch (e) {
            console.error("Erro ao carregar métricas admin:", e);
        }
    };

    const carregarDadosAdmin = async () => {
        setLoadingData(true);
        if (onLoadingStart) onLoadingStart();
        try {
            await carregarMetricas();
            const { data: dData } = await window.doadoresService.buscarDoadoresTodos();
            setDoadoresList(dData || []);

            const { data: doaData } = await window.doacoesService.buscarDoacoesAdmin();
            setDoacoesList(doaData || []);
        } catch (e) {
            console.error("Erro ao carregar dados admin:", e);
        } finally {
            setLoadingData(false);
            if (onLoadingEnd) onLoadingEnd();
        }
    };

    useEffect(() => {
        if (isVisible) {
            carregarDadosAdmin();
        }
    }, [isVisible]);

    useEffect(() => {
        if (window.lucide) {
            lucide.createIcons();
        }
    }, [isVisible, adminSubTab, doadoresList, doacoesList, searchQuery, loadingData]);

    if (!isVisible) return null;

    const handleDeleteDoador = async (idDoador, nome) => {
        if (!confirm(`ATENÇÃO: Ao excluir o doador "${nome}", TODAS as doações vinculadas a ele (financeiras e materiais) serão excluídas permanentemente! Deseja continuar?`)) {
            return;
        }

        if (onLoadingStart) onLoadingStart();
        try {
            await window.doadoresService.deletarDoadorCascata(idDoador);
            mostrarToast('Doador e todas as doações associadas foram deletados com sucesso!', 'success');
            await carregarDadosAdmin();
            if (onDataChanged) onDataChanged();
        } catch (error) {
            mostrarToast('Erro ao excluir doador: ' + error.message, 'error');
        } finally {
            if (onLoadingEnd) onLoadingEnd();
        }
    };

    const handleDeleteDoacao = async (idDoacao) => {
        if (!confirm('Deseja realmente excluir esta doação permanentemente?')) {
            return;
        }

        if (onLoadingStart) onLoadingStart();
        try {
            await window.doacoesService.deletarDoacaoCompleta(idDoacao);
            mostrarToast('Doação excluída com sucesso!', 'success');
            await carregarDadosAdmin();
            if (onDataChanged) onDataChanged();
        } catch (error) {
            mostrarToast('Erro ao excluir doação: ' + error.message, 'error');
        } finally {
            if (onLoadingEnd) onLoadingEnd();
        }
    };

    const query = searchQuery.toLowerCase().trim();

    const doadoresFiltrados = doadoresList.filter(doador =>
        doador.nome.toLowerCase().includes(query) ||
        (doador.documento && doador.documento.includes(query)) ||
        (doador.email && doador.email.toLowerCase().includes(query)) ||
        (doador.telefone && doador.telefone.includes(query)) ||
        (doador.cidade && doador.cidade.toLowerCase().includes(query)) ||
        (doador.data_nascimento && doador.data_nascimento.includes(query))
    );

    const doacoesFiltradas = doacoesList.filter(doacao => {
        const nomeDoador = doacao.doadores ? doacao.doadores.nome.toLowerCase() : '';
        const canal = doacao.canal_recebimento.toLowerCase();
        const obs = doacao.observacoes ? doacao.observacoes.toLowerCase() : '';

        let detMatch = false;
        if (doacao.doacoes_financeiras && doacao.doacoes_financeiras.length > 0) {
            detMatch = detMatch || String(doacao.doacoes_financeiras[0].valor).includes(query) ||
                (doacao.doacoes_financeiras[0].comprovante_transacao && doacao.doacoes_financeiras[0].comprovante_transacao.toLowerCase().includes(query));
        }
        if (doacao.doacoes_materiais && doacao.doacoes_materiais.length > 0) {
            detMatch = detMatch || doacao.doacoes_materiais[0].descricao_item.toLowerCase().includes(query) ||
                doacao.doacoes_materiais[0].destino_item.toLowerCase().includes(query);
        }

        return nomeDoador.includes(query) || canal.includes(query) || obs.includes(query) || detMatch;
    });

    return (
        <div id="tab-admin" className="tab-content active visible space-y-6">
            {/* Grid de Cards KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-xs hover-scale">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
                        <i data-lucide="users" className="w-6 h-6"></i>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Doadores Cadastrados</p>
                        <h3 id="metric-doadores" className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mt-1">{metricDoadores}</h3>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-xs hover-scale">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                        <i data-lucide="gift" className="w-6 h-6"></i>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total de Eventos Doações</p>
                        <h3 id="metric-doacoes" className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mt-1">{metricDoacoes}</h3>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-xs hover-scale">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                        <i data-lucide="dollar-sign" className="w-6 h-6"></i>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Arrecadado (R$)</p>
                        <h3 id="metric-financeiro" className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mt-1">{window.formatarMoeda(metricFinanceiro)}</h3>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-xs hover-scale">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                        <i data-lucide="package" className="w-6 h-6"></i>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Materiais Arrecadados</p>
                        <h3 id="metric-materiais" className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mt-1">{metricMateriais} <span className="text-xs font-medium text-gray-400">itens</span></h3>
                    </div>
                </div>
            </div>

            {/* Tabela Interativa de Registros */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-2 bg-gray-100/80 p-1 rounded-xl">
                        <button
                            id="btn-sub-doadores"
                            onClick={() => { setAdminSubTab('doadores'); setSearchQuery(''); }}
                            className={`sub-tab-btn px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${adminSubTab === 'doadores' ? 'bg-white shadow-xs text-gray-800' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            <i data-lucide="users" className="w-4 h-4"></i> Tabela de Doadores
                        </button>
                        <button
                            id="btn-sub-doacoes"
                            onClick={() => { setAdminSubTab('doacoes'); setSearchQuery(''); }}
                            className={`sub-tab-btn px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${adminSubTab === 'doacoes' ? 'bg-white shadow-xs text-gray-800' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            <i data-lucide="heart-handshake" className="w-4 h-4"></i> Histórico de Doações
                        </button>
                    </div>

                    <div className="relative flex-1 md:max-w-xs">
                        <i data-lucide="search" className="w-4 h-4 absolute left-3.5 top-3 text-gray-400"></i>
                        <input
                            type="text"
                            id="admin-search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar registros..."
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:border-rose-500"
                        />
                    </div>
                </div>

                {/* Container Tabela Doadores */}
                {adminSubTab === 'doadores' && (
                    <div id="container-tabela-doadores" className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wider font-bold border-b border-gray-200">
                                    <th className="px-6 py-3.5">Nome Completo / Razão Social</th>
                                    <th className="px-6 py-3.5">Tipo</th>
                                    <th className="px-6 py-3.5">Documento (CPF/CNPJ)</th>
                                    <th className="px-6 py-3.5">Cidade</th>
                                    <th className="px-6 py-3.5">Data Nasc./Fund.</th>
                                    <th className="px-6 py-3.5">Telefone</th>
                                    <th className="px-6 py-3.5">E-mail</th>
                                    <th className="px-6 py-3.5 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody id="tabela-doadores-body" className="divide-y divide-gray-100 text-xs">
                                {loadingData ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-10 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-xs font-medium text-gray-500 animate-pulse">Carregando dados com segurança...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : doadoresFiltrados.length === 0 ? (
                                    <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-500">Nenhum doador cadastrado ou encontrado.</td></tr>
                                ) : (
                                    doadoresFiltrados.map(doador => (
                                        <tr key={doador.id_doador} className="hover:bg-gray-50 border-b border-gray-200 transition duration-150">
                                            <td className="px-6 py-4 font-medium text-gray-900">{doador.nome}</td>
                                            <td className="px-6 py-4 text-xs font-semibold text-gray-500">{doador.tipo_doador === 'PF' ? 'Pessoa Física (PF)' : 'Pessoa Jurídica (PJ)'}</td>
                                            <td className="px-6 py-4 font-mono text-xs">{window.formatarDocumento(doador.documento || '', doador.tipo_doador) || '-'}</td>
                                            <td className="px-6 py-4 text-xs">{doador.cidade || '-'}</td>
                                            <td className="px-6 py-4 text-xs font-mono">{window.formatarDataBR(doador.data_nascimento)}</td>
                                            <td className="px-6 py-4 text-xs">{window.formatarTelefone(doador.telefone || '') || '-'}</td>
                                            <td className="px-6 py-4 text-xs">{doador.email || '-'}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => onOpenEditDoador(doador)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-2 rounded-lg cursor-pointer transition flex items-center justify-center w-8 h-8" title="Editar Doador">
                                                        <i data-lucide="pencil" className="w-4 h-4"></i>
                                                    </button>
                                                    <button onClick={() => handleDeleteDoador(doador.id_doador, doador.nome)} className="bg-rose-50 text-rose-600 hover:bg-rose-100 p-2 rounded-lg cursor-pointer transition flex items-center justify-center w-8 h-8" title="Excluir Doador">
                                                        <i data-lucide="trash-2" className="w-4 h-4"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Container Tabela Doações */}
                {adminSubTab === 'doacoes' && (
                    <div id="container-tabela-doacoes" className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wider font-bold border-b border-gray-200">
                                    <th className="px-6 py-3.5">Doador Vinculado</th>
                                    <th className="px-6 py-3.5">Canal</th>
                                    <th className="px-6 py-3.5">Tipo de Doação</th>
                                    <th className="px-6 py-3.5">Detalhes / Valores</th>
                                    <th className="px-6 py-3.5">Observações</th>
                                    <th className="px-6 py-3.5">Data Doação</th>
                                    <th className="px-6 py-3.5 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody id="tabela-doacoes-body" className="divide-y divide-gray-100 text-xs">
                                {loadingData ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-10 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-xs font-medium text-gray-500 animate-pulse">Carregando dados com segurança...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : doacoesFiltradas.length === 0 ? (
                                    <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500">Nenhuma doação registrada ou encontrada.</td></tr>
                                ) : (
                                    doacoesFiltradas.map(doacao => {
                                        const nomeDoador = doacao.doadores ? doacao.doadores.nome : 'Doador Desconhecido';
                                        const dataFmt = new Date(doacao.data_doacao).toLocaleDateString('pt-BR');

                                        const hasFin = doacao.doacoes_financeiras && doacao.doacoes_financeiras.length > 0;
                                        const fin = hasFin ? doacao.doacoes_financeiras[0] : null;

                                        const hasMat = doacao.doacoes_materiais && doacao.doacoes_materiais.length > 0;
                                        const mat = hasMat ? doacao.doacoes_materiais[0] : null;

                                        return (
                                            <tr key={doacao.id_doacao} className="hover:bg-gray-50 border-b border-gray-200 transition duration-150">
                                                <td className="px-6 py-4 font-medium text-gray-900">{nomeDoador}</td>
                                                <td className="px-6 py-4 text-xs">{doacao.canal_recebimento}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap items-center gap-1">
                                                        {hasFin && <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded font-medium">Financeira</span>}
                                                        {hasFin && <span className="text-xs text-gray-500 font-mono">({fin.comprovante_transacao || 'Sem comprovante'})</span>}
                                                        {hasMat && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-medium">Material</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs leading-relaxed">
                                                    {hasFin && (
                                                        <div><strong>{window.formatarMoeda(fin.valor)}</strong></div>
                                                    )}
                                                    {hasMat && (
                                                        <div>
                                                            <span>Item: {mat.descricao_item} ({mat.quantidade} {mat.unidade_medida})</span>
                                                            <span className="text-xs block text-gray-500">Destino: {mat.destino_item} | Estado: {mat.estado_conservacao}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 max-w-[150px] truncate text-xs" title={doacao.observacoes || ''}>{doacao.observacoes || '-'}</td>
                                                <td className="px-6 py-4 text-xs whitespace-nowrap">{dataFmt}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={() => onOpenEditDoacao(doacao)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-2 rounded-lg cursor-pointer transition flex items-center justify-center w-8 h-8" title="Editar Doação">
                                                            <i data-lucide="pencil" className="w-4 h-4"></i>
                                                        </button>
                                                        <button onClick={() => handleDeleteDoacao(doacao.id_doacao)} className="bg-rose-50 text-rose-600 hover:bg-rose-100 p-2 rounded-lg cursor-pointer transition flex items-center justify-center w-8 h-8" title="Excluir Doação">
                                                            <i data-lucide="trash-2" className="w-4 h-4"></i>
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
            </div>
        </div>
    );
}

window.AdminTab = AdminTab;
