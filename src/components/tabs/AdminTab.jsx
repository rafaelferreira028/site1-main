const { useState, useEffect } = React;

function AdminTab({ isVisible, onOpenEditDoador, onOpenEditDoacao, onDataChanged, onLoadingStart, onLoadingEnd }) {
    const { mostrarToast } = window.useToast();

    const [adminSubTab, setAdminSubTab] = useState('doadores');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedDoadorId, setExpandedDoadorId] = useState(null);

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
    }, [isVisible, adminSubTab, doadoresList, doacoesList, searchQuery, loadingData, expandedDoadorId]);

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

    const handleExportarPDF = async () => {
        if (onLoadingStart) onLoadingStart();
        try {
            const res = await window.pdfService.exportarPDFDoacoesOficial();
            if (res && res.success) {
                mostrarToast('Relatório PDF de Doações baixado com sucesso!', 'success');
            } else if (res && res.message) {
                mostrarToast(res.message, 'warning');
            }
        } catch (err) {
            mostrarToast('Erro ao gerar PDF: ' + err.message, 'error');
        } finally {
            if (onLoadingEnd) onLoadingEnd();
        }
    };

    const query = searchQuery.toLowerCase().trim();

    const doadoresFiltrados = doadoresList.filter(doador => {
        const basicMatch = doador.nome.toLowerCase().includes(query) ||
            (doador.documento && doador.documento.includes(query)) ||
            (doador.email && doador.email.toLowerCase().includes(query)) ||
            (doador.telefone && doador.telefone.includes(query)) ||
            (doador.cidade && doador.cidade.toLowerCase().includes(query)) ||
            (doador.data_nascimento && doador.data_nascimento.includes(query));

        if (!query) return true;
        if (basicMatch) return true;

        const doacoesDoDoador = doacoesList.filter(d => d.id_doador === doador.id_doador);
        return doacoesDoDoador.some(doacao => {
            const canalMatch = doacao.canal_recebimento && doacao.canal_recebimento.toLowerCase().includes(query);
            const obsMatch = doacao.observacoes && doacao.observacoes.toLowerCase().includes(query);
            let finMatch = false;
            if (doacao.doacoes_financeiras) {
                finMatch = doacao.doacoes_financeiras.some(f => String(f.valor).includes(query) || (f.comprovante_transacao && f.comprovante_transacao.toLowerCase().includes(query)));
            }
            let matMatch = false;
            if (doacao.doacoes_materiais) {
                matMatch = doacao.doacoes_materiais.some(m => m.descricao_item.toLowerCase().includes(query) || (m.destino_item && m.destino_item.toLowerCase().includes(query)));
            }
            return canalMatch || obsMatch || finMatch || matMatch;
        });
    });

    const doacoesFiltradas = doacoesList.filter(doacao => {
        const nomeDoador = doacao.doadores ? doacao.doadores.nome.toLowerCase() : '';
        const canal = doacao.canal_recebimento ? doacao.canal_recebimento.toLowerCase() : '';
        const obs = doacao.observacoes ? doacao.observacoes.toLowerCase() : '';

        let detMatch = false;
        if (doacao.doacoes_financeiras && doacao.doacoes_financeiras.length > 0) {
            detMatch = detMatch || doacao.doacoes_financeiras.some(f => String(f.valor).includes(query) || (f.comprovante_transacao && f.comprovante_transacao.toLowerCase().includes(query)));
        }
        if (doacao.doacoes_materiais && doacao.doacoes_materiais.length > 0) {
            detMatch = detMatch || doacao.doacoes_materiais.some(m => m.descricao_item.toLowerCase().includes(query) || (m.destino_item && m.destino_item.toLowerCase().includes(query)));
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
                    <div className="flex items-center gap-2 bg-slate-200 p-1.5 rounded-2xl">
                        <button
                            id="btn-sub-doadores"
                            onClick={() => { setAdminSubTab('doadores'); setSearchQuery(''); }}
                            className={`sub-tab-btn px-4 py-2 text-xs font-extrabold rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-2 ${adminSubTab === 'doadores' ? 'bg-white shadow-md text-rose-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                        >
                            <i data-lucide="users" className="w-4 h-4"></i> Tabela de Doadores
                        </button>
                        <button
                            id="btn-sub-doacoes"
                            onClick={() => { setAdminSubTab('doacoes'); setSearchQuery(''); }}
                            className={`sub-tab-btn px-4 py-2 text-xs font-extrabold rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-2 ${adminSubTab === 'doacoes' ? 'bg-white shadow-md text-rose-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                        >
                            <i data-lucide="heart-handshake" className="w-4 h-4"></i> Histórico de Doações
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 md:w-64">
                            <i data-lucide="search" className="w-4 h-4 absolute left-3.5 top-3 text-gray-400"></i>
                            <input
                                type="text"
                                id="admin-search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar doador, item ou valor..."
                                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:border-rose-500"
                            />
                        </div>
                        <button
                            onClick={handleExportarPDF}
                            className="group bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-600/20 hover:shadow-lg hover:shadow-rose-600/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 whitespace-nowrap select-none"
                            title="Baixar Relatório Oficial de Doações em PDF"
                        >
                            <i data-lucide="file-text" className="w-4 h-4 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6"></i> Relatório PDF
                        </button>
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
                                    <th className="px-6 py-3.5">O que doou (Resumo & Detalhes)</th>
                                    <th className="px-6 py-3.5">Cidade</th>
                                    <th className="px-6 py-3.5">Telefone / E-mail</th>
                                    <th className="px-6 py-3.5 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody id="tabela-doadores-body" className="divide-y divide-gray-100 text-xs">
                                {loadingData ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-10 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-xs font-medium text-gray-500 animate-pulse">Carregando dados com segurança...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : doadoresFiltrados.length === 0 ? (
                                    <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500">Nenhum doador cadastrado ou encontrado.</td></tr>
                                ) : (
                                    doadoresFiltrados.map(doador => {
                                        const doacoesDoDoador = doacoesList.filter(d => d.id_doador === doador.id_doador);
                                        let totFinDoador = 0;
                                        let matItemsDoador = [];

                                        doacoesDoDoador.forEach(d => {
                                            if (d.doacoes_financeiras && d.doacoes_financeiras.length > 0) {
                                                d.doacoes_financeiras.forEach(f => {
                                                    totFinDoador += parseFloat(f.valor || 0);
                                                });
                                            }
                                            if (d.doacoes_materiais && d.doacoes_materiais.length > 0) {
                                                d.doacoes_materiais.forEach(m => {
                                                    matItemsDoador.push(m);
                                                });
                                            }
                                        });

                                        const isExpanded = expandedDoadorId === doador.id_doador;

                                        return (
                                            <React.Fragment key={doador.id_doador}>
                                                <tr className={`hover:bg-gray-50 border-b border-gray-200 transition duration-150 ${isExpanded ? 'bg-rose-50/20' : ''}`}>
                                                    <td className="px-6 py-4 font-bold text-gray-900">{doador.nome}</td>
                                                    <td className="px-6 py-4 text-xs font-semibold text-gray-500">{doador.tipo_doador === 'PF' ? 'PF' : 'PJ'}</td>
                                                    <td className="px-6 py-4 font-mono text-xs">{window.formatarDocumento(doador.documento || '', doador.tipo_doador) || '-'}</td>
                                                    <td className="px-6 py-4 text-xs">
                                                        {doacoesDoDoador.length === 0 ? (
                                                            <span className="text-gray-400 italic">Sem doações</span>
                                                        ) : (
                                                            <div className="space-y-1.5 max-w-xs">
                                                                <div className="flex flex-wrap items-center gap-1.5">
                                                                    {totFinDoador > 0 && (
                                                                        <span className="bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 text-[11px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 shadow-2xs">
                                                                            <i data-lucide="dollar-sign" className="w-3.5 h-3.5 text-emerald-600"></i> {window.formatarMoeda(totFinDoador)}
                                                                        </span>
                                                                    )}
                                                                    {matItemsDoador.length > 0 && (
                                                                        <span className="bg-blue-500/15 text-blue-700 border border-blue-500/30 text-[11px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 shadow-2xs" title={matItemsDoador.map(m => `${m.descricao_item} (${m.quantidade} ${m.unidade_medida})`).join(', ')}>
                                                                            <i data-lucide="package" className="w-3.5 h-3.5 text-blue-600"></i> {matItemsDoador.reduce((a, m) => a + parseInt(m.quantidade || 0), 0)} itens
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    onClick={() => setExpandedDoadorId(isExpanded ? null : doador.id_doador)}
                                                                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer pt-0.5 transition"
                                                                >
                                                                    <i data-lucide={isExpanded ? "chevron-up" : "chevron-down"} className="w-3.5 h-3.5"></i>
                                                                    {isExpanded ? 'Ocultar detalhes' : `Ver detalhes (${doacoesDoDoador.length} doação${doacoesDoDoador.length > 1 ? 'ões' : ''})`}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs">{doador.cidade || '-'}</td>
                                                    <td className="px-6 py-4 text-xs">
                                                        <div className="font-medium text-gray-800">{window.formatarTelefone(doador.telefone || '') || '-'}</div>
                                                        {doador.email && <div className="text-[11px] text-gray-500">{doador.email}</div>}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex justify-center gap-2">
                                                            <button onClick={() => onOpenEditDoador(doador)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200/60 p-2 rounded-xl cursor-pointer transition flex items-center justify-center w-8 h-8 shadow-2xs" title="Editar Cadastro do Doador">
                                                                <i data-lucide="pencil" className="w-4 h-4"></i>
                                                            </button>
                                                            <button onClick={() => handleDeleteDoador(doador.id_doador, doador.nome)} className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/60 p-2 rounded-xl cursor-pointer transition flex items-center justify-center w-8 h-8 shadow-2xs" title="Excluir Doador">
                                                                <i data-lucide="trash-2" className="w-4 h-4"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr className="bg-rose-50/30 border-b border-rose-100">
                                                        <td colSpan="7" className="px-6 py-4">
                                                            <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-md space-y-3">
                                                                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                                                                    <h4 className="text-xs font-bold text-gray-800 flex items-center gap-2">
                                                                        <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                                                                            <i data-lucide="gift" className="w-4 h-4"></i>
                                                                        </div>
                                                                        Histórico de Doações de <span className="text-rose-600 font-extrabold">{doador.nome}</span>
                                                                    </h4>
                                                                    <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{doacoesDoDoador.length} registro(s)</span>
                                                                </div>
                                                                <div className="divide-y divide-gray-100 text-xs">
                                                                    {doacoesDoDoador.map((doa, idx) => (
                                                                        <div key={doa.id_doacao || idx} className="py-3 flex flex-col md:flex-row md:items-start justify-between gap-3">
                                                                            <div className="flex items-center gap-2 shrink-0">
                                                                                <span className="text-gray-400 font-mono text-[11px]">#{idx + 1}</span>
                                                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px] font-semibold text-gray-700">
                                                                                    {new Date(doa.data_doacao).toLocaleDateString('pt-BR')}
                                                                                </span>
                                                                                <span className="text-gray-500 text-[11px]">Via: <strong>{doa.canal_recebimento}</strong></span>
                                                                            </div>
                                                                            <div className="flex-1 space-y-1.5">
                                                                                {doa.doacoes_financeiras && doa.doacoes_financeiras.map((f, i) => (
                                                                                    <div key={i} className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 font-extrabold text-xs border border-emerald-500/30">
                                                                                        <span>💰 {window.formatarMoeda(f.valor)}</span>
                                                                                        {f.comprovante_transacao && <span className="text-gray-500 font-mono text-[10px] font-normal">(Nº {f.comprovante_transacao})</span>}
                                                                                    </div>
                                                                                ))}
                                                                                {doa.doacoes_materiais && doa.doacoes_materiais.map((m, i) => (
                                                                                    <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
                                                                                        <div className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                                                                                            <i data-lucide="package" className="w-4 h-4 text-amber-500 shrink-0"></i>
                                                                                            <span><strong>{m.descricao_item}</strong></span>
                                                                                            <span className="text-[11px] text-gray-500">• Destino: {m.destino_item} | Estado: {m.estado_conservacao}</span>
                                                                                        </div>
                                                                                        <span className="text-[11px] font-extrabold font-mono px-2.5 py-0.5 rounded-md bg-blue-500/15 text-blue-700 border border-blue-500/25 shrink-0">{m.quantidade} {m.unidade_medida}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                            {doa.observacoes && (
                                                                                <div className="text-[11px] text-gray-500 italic max-w-xs truncate bg-gray-50 p-2 rounded-lg border border-gray-100" title={doa.observacoes}>
                                                                                    Obs: {doa.observacoes}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
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
                                    <th className="px-6 py-3.5">Detalhes / Valores Completos</th>
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
                                        const hasMat = doacao.doacoes_materiais && doacao.doacoes_materiais.length > 0;

                                        return (
                                            <tr key={doacao.id_doacao} className="hover:bg-gray-50 border-b border-gray-200 transition duration-150">
                                                <td className="px-6 py-4 font-bold text-gray-900">{nomeDoador}</td>
                                                <td className="px-6 py-4 text-xs font-semibold text-gray-600">{doacao.canal_recebimento}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        {hasFin && <span className="bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 text-[11px] px-2.5 py-1 rounded-lg font-bold">Financeira</span>}
                                                        {hasMat && <span className="bg-blue-500/15 text-blue-700 border border-blue-500/30 text-[11px] px-2.5 py-1 rounded-lg font-bold">Material</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs space-y-2 max-w-md">
                                                    {hasFin && doacao.doacoes_financeiras.map((fin, fIdx) => (
                                                        <div key={fIdx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 font-extrabold text-xs shadow-2xs">
                                                            <i data-lucide="dollar-sign" className="w-4 h-4 text-emerald-600"></i>
                                                            <span>{window.formatarMoeda(fin.valor)}</span>
                                                            {fin.comprovante_transacao && (
                                                                <span className="text-[10px] font-mono font-medium opacity-90 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                                                    Nº {fin.comprovante_transacao}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {hasMat && doacao.doacoes_materiais.map((mat, mIdx) => (
                                                        <div key={mIdx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                                                    <i data-lucide="package" className="w-4 h-4 text-amber-500 shrink-0"></i>
                                                                    {mat.descricao_item}
                                                                </span>
                                                                <span className="shrink-0 text-[11px] font-extrabold font-mono px-2.5 py-0.5 rounded-md bg-blue-500/15 text-blue-700 border border-blue-500/25">
                                                                    {mat.quantidade} {mat.unidade_medida}
                                                                </span>
                                                            </div>
                                                            <div className="text-[11px] text-gray-500 flex items-center gap-3 font-medium pt-0.5">
                                                                <span>Destino: <strong className="text-gray-700">{mat.destino_item}</strong></span>
                                                                <span>•</span>
                                                                <span>Estado: <strong className="text-gray-700">{mat.estado_conservacao}</strong></span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </td>
                                                <td className="px-6 py-4 max-w-[150px] truncate text-xs text-gray-600" title={doacao.observacoes || ''}>{doacao.observacoes || '-'}</td>
                                                <td className="px-6 py-4 text-xs font-mono whitespace-nowrap text-gray-700">{dataFmt}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={() => onOpenEditDoacao(doacao)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200/60 p-2 rounded-xl cursor-pointer transition flex items-center justify-center w-8 h-8 shadow-2xs" title="Editar Doação">
                                                            <i data-lucide="pencil" className="w-4 h-4"></i>
                                                        </button>
                                                        <button onClick={() => handleDeleteDoacao(doacao.id_doacao)} className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/60 p-2 rounded-xl cursor-pointer transition flex items-center justify-center w-8 h-8 shadow-2xs" title="Excluir Doação">
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
