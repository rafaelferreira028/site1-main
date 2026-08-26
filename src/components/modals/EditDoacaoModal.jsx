const { useState, useEffect } = React;

function EditDoacaoModal({ isOpen, doacao, doadores, categorias, onClose, onSave }) {
    const [idDoacao, setIdDoacao] = useState('');
    const [idDoador, setIdDoador] = useState('');
    const [doadorSearchQuery, setDoadorSearchQuery] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [canal, setCanal] = useState('Presencial');
    const [observacoes, setObservacoes] = useState('');

    // Financeiro
    const [checkFinanceiro, setCheckFinanceiro] = useState(false);
    const [finValor, setFinValor] = useState('');
    const [finComprovante, setFinComprovante] = useState('');

    // Material
    const [checkMaterial, setCheckMaterial] = useState(false);
    const [matDescricao, setMatDescricao] = useState('');
    const [matCategoria, setMatCategoria] = useState('');
    const [matQtd, setMatQtd] = useState(1);
    const [matUnidade, setMatUnidade] = useState('Unidade');
    const [matEstado, setMatEstado] = useState('Não se aplica');
    const [matDestino, setMatDestino] = useState('Estoque Geral');

    useEffect(() => {
        if (doacao) {
            setIdDoacao(doacao.id_doacao || '');
            setIdDoador(doacao.id_doador || '');
            const doadorObj = doadores.find(d => d.id_doador === doacao.id_doador);
            setDoadorSearchQuery(doadorObj ? doadorObj.nome : (doacao.doadores ? doacao.doadores.nome : ''));
            setCanal(doacao.canal_recebimento || 'Presencial');
            setObservacoes(doacao.observacoes || '');

            const hasFin = doacao.doacoes_financeiras && doacao.doacoes_financeiras.length > 0;
            setCheckFinanceiro(hasFin);
            if (hasFin) {
                const fin = doacao.doacoes_financeiras[0];
                setFinValor(fin.valor || '');
                setFinComprovante(fin.comprovante_transacao || '');
            } else {
                setFinValor('');
                setFinComprovante('');
            }

            const hasMat = doacao.doacoes_materiais && doacao.doacoes_materiais.length > 0;
            setCheckMaterial(hasMat);
            if (hasMat) {
                const mat = doacao.doacoes_materiais[0];
                setMatDescricao(mat.descricao_item || '');
                setMatCategoria(mat.id_categoria || (categorias[0] ? categorias[0].id_categoria : ''));
                setMatQtd(mat.quantidade || 1);
                setMatUnidade(mat.unidade_medida || 'Unidade');
                setMatEstado(mat.estado_conservacao || 'Não se aplica');
                setMatDestino(mat.destino_item || 'Estoque Geral');
            } else {
                setMatDescricao('');
                setMatCategoria(categorias[0] ? categorias[0].id_categoria : '');
                setMatQtd(1);
                setMatUnidade('Unidade');
                setMatEstado('Não se aplica');
                setMatDestino('Estoque Geral');
            }
        }
    }, [doacao, doadores, categorias]);

    useEffect(() => {
        if (window.lucide) {
            lucide.createIcons();
        }
    }, [isOpen, checkFinanceiro, checkMaterial, dropdownOpen]);

    if (!isOpen) return null;

    const doadoresFiltrados = doadores.filter(d => {
        const query = doadorSearchQuery.toLowerCase().trim();
        if (!query) return true;
        return d.nome.toLowerCase().includes(query) ||
            (d.documento && d.documento.includes(query)) ||
            (d.telefone && d.telefone.includes(query)) ||
            (d.email && d.email.toLowerCase().includes(query));
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            idDoacao: parseInt(idDoacao),
            idDoador: parseInt(idDoador),
            canal,
            observacoes,
            checkFinanceiro,
            checkMaterial,
            finValor: parseFloat(finValor),
            finComprovante,
            matDescricao,
            matCategoria: parseInt(matCategoria),
            matQtd: parseInt(matQtd),
            matUnidade,
            matEstado,
            matDestino
        });
    };

    const selecionarPreset = (tipo) => {
        const presets = {
            'bazar': { catId: 6, desc: 'Itens de Bazar / Vestuário', unidade: 'Unidade', estado: 'Novo', destino: 'Bazar' },
            'alimentos': { catId: 2, desc: 'Cesta Básica / Alimentos', unidade: 'Pacote', estado: 'Não se aplica', destino: 'Estoque Geral' },
            'higiene': { catId: 3, desc: 'Produtos de Higiene Pessoal', unidade: 'Unidade', estado: 'Novo', destino: 'Estoque Geral' },
            'cabelo': { catId: 4, desc: 'Peruca / Cabelo para Doação', unidade: 'Unidade', estado: 'Novo', destino: 'Estoque Geral' },
            'ortopedicos': { catId: 5, desc: 'Equipamento Ortopédico', unidade: 'Unidade', estado: 'Seminovo', destino: 'Uso Direto Paciente' }
        };
        const p = presets[tipo];
        if (!p) return;
        setMatCategoria(p.catId);
        setMatDestino(p.destino);
        setMatUnidade(p.unidade);
        setMatEstado(p.estado);
        setMatDescricao(p.desc);
        if (!matQtd || matQtd <= 0) setMatQtd(1);
    };

    return (
        <div id="modal-editar-doacao" className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay show bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 modal-dialog show relative overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 sticky top-0 bg-white z-20">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                            <i data-lucide="edit-3" className="w-5 h-5"></i>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Editar Registro de Doação</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                        <i data-lucide="x" className="w-5 h-5"></i>
                    </button>
                </div>

                <form id="form-editar-doacao" onSubmit={handleSubmit} className="space-y-6">
                    <input type="hidden" id="edit-doacao-id" value={idDoacao} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Doador Vinculado *</label>
                            <input
                                type="text"
                                value={doadorSearchQuery}
                                onChange={(e) => { setDoadorSearchQuery(e.target.value); setDropdownOpen(true); }}
                                onFocus={() => setDropdownOpen(true)}
                                placeholder="Pesquise o doador..."
                                className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500 ${idDoador ? 'bg-rose-50/50 border-rose-300 font-semibold' : ''}`}
                            />
                            {idDoador && (
                                <button
                                    type="button"
                                    onClick={() => { setIdDoador(''); setDoadorSearchQuery(''); }}
                                    className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                                >
                                    <i data-lucide="x" className="w-4 h-4"></i>
                                </button>
                            )}
                            {dropdownOpen && (
                                <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-2xl shadow-xl z-30">
                                    {doadoresFiltrados.length === 0 ? (
                                        <div className="p-3 text-center text-xs text-gray-400">Nenhum doador encontrado</div>
                                    ) : (
                                        doadoresFiltrados.map(d => (
                                            <div
                                                key={d.id_doador}
                                                onMouseDown={() => { setIdDoador(d.id_doador); setDoadorSearchQuery(d.nome); setDropdownOpen(false); }}
                                                className="p-3 hover:bg-rose-50/80 cursor-pointer flex items-center justify-between border-b border-gray-50 last:border-0"
                                            >
                                                <div>
                                                    <div className="font-semibold text-sm text-slate-800">{d.nome}</div>
                                                    <div className="text-[11px] text-gray-500">Doc: {window.formatarDocumento(d.documento || '', d.tipo_doador)}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Canal de Recebimento *</label>
                            <select
                                value={canal}
                                onChange={(e) => setCanal(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500"
                            >
                                <option value="Presencial">Presencial (Sede Institucional)</option>
                                <option value="PIX">Transferência / PIX</option>
                                <option value="Dinheiro">Dinheiro Espécie / Cofrinho / Bazar</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Observações</label>
                        <input
                            type="text"
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            placeholder="Anotações internas..."
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500"
                        />
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Categorias da Doação (Selecione pelo menos uma)</label>
                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 cursor-pointer font-semibold text-sm text-slate-800">
                                <input
                                    type="checkbox"
                                    checked={checkFinanceiro}
                                    onChange={(e) => setCheckFinanceiro(e.target.checked)}
                                    className="accent-rose-600 w-4 h-4 rounded"
                                />
                                💰 Doação Financeira
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer font-semibold text-sm text-slate-800">
                                <input
                                    type="checkbox"
                                    checked={checkMaterial}
                                    onChange={(e) => setCheckMaterial(e.target.checked)}
                                    className="accent-rose-600 w-4 h-4 rounded"
                                />
                                📦 Doação Material / Física
                            </label>
                        </div>
                    </div>

                    {checkFinanceiro && (
                        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                                <i data-lucide="dollar-sign" className="w-4 h-4 text-emerald-600"></i> Dados Financeiros
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Valor (R$) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={finValor}
                                        onChange={(e) => setFinValor(e.target.value)}
                                        required
                                        placeholder="0.00"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Nº Comprovante / Transação</label>
                                    <input
                                        type="text"
                                        value={finComprovante}
                                        onChange={(e) => setFinComprovante(e.target.value)}
                                        placeholder="Ex: TX-984201"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500 font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {checkMaterial && (
                        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-blue-800 flex items-center gap-2">
                                <i data-lucide="package" className="w-4 h-4 text-blue-600"></i> Dados dos Materiais Doados
                            </h4>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Atalhos / Presets de Conteúdo</label>
                                <div className="flex flex-wrap gap-2">
                                    <button type="button" onClick={() => selecionarPreset('bazar')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-200 hover:border-rose-300 hover:text-rose-600 transition cursor-pointer">🛍️ Bazar</button>
                                    <button type="button" onClick={() => selecionarPreset('alimentos')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-200 hover:border-rose-300 hover:text-rose-600 transition cursor-pointer">🍞 Alimentos</button>
                                    <button type="button" onClick={() => selecionarPreset('higiene')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-200 hover:border-rose-300 hover:text-rose-600 transition cursor-pointer">🧴 Higiene</button>
                                    <button type="button" onClick={() => selecionarPreset('cabelo')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-200 hover:border-rose-300 hover:text-rose-600 transition cursor-pointer">✨ Cabelo</button>
                                    <button type="button" onClick={() => selecionarPreset('ortopedicos')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-200 hover:border-rose-300 hover:text-rose-600 transition cursor-pointer">♿ Ortopédicos</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Descrição do Item *</label>
                                    <input
                                        type="text"
                                        value={matDescricao}
                                        onChange={(e) => setMatDescricao(e.target.value)}
                                        required
                                        placeholder="Ex: Cesta Básica 15kg"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Categoria *</label>
                                    <select
                                        value={matCategoria}
                                        onChange={(e) => setMatCategoria(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500"
                                    >
                                        {categorias.map(c => (
                                            <option key={c.id_categoria} value={c.id_categoria}>{c.nome_categoria}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Quantidade *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={matQtd}
                                        onChange={(e) => setMatQtd(e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Unidade de Medida *</label>
                                    <select
                                        value={matUnidade}
                                        onChange={(e) => setMatUnidade(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500"
                                    >
                                        <option value="Unidade">Unidade (un)</option>
                                        <option value="Kg">Quilograma (kg)</option>
                                        <option value="Pacote">Pacote (pct)</option>
                                        <option value="Caixa">Caixa (cx)</option>
                                        <option value="Litro">Litro (l)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Estado de Conservação *</label>
                                    <select
                                        value={matEstado}
                                        onChange={(e) => setMatEstado(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500"
                                    >
                                        <option value="Novo">Novo (Lacre de fábrica)</option>
                                        <option value="Seminovo">Seminovo (Ótimo estado)</option>
                                        <option value="Usado">Usado (Bom estado)</option>
                                        <option value="Não se aplica">Não se aplica (Alimentos / Descartáveis)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Destino Inicial do Item *</label>
                                    <select
                                        value={matDestino}
                                        onChange={(e) => setMatDestino(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500"
                                    >
                                        <option value="Estoque Geral">Estoque Geral (Uso Institucional)</option>
                                        <option value="Bazar">Bazar Beneficente (Venda / Arrecadação)</option>
                                        <option value="Uso Direto Paciente">Uso Direto Paciente (Doação Direta)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-semibold rounded-xl text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition cursor-pointer flex items-center gap-2"
                        >
                            <i data-lucide="check" className="w-4 h-4"></i> Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

window.EditDoacaoModal = EditDoacaoModal;
