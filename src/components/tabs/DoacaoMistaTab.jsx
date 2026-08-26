const { useState, useEffect } = React;
import { criarEventoDoacao, criarDoacaoFinanceira, criarDoacaoMaterial } from '../../services/doacoesService.js';
import { formatarDocumento, formatarTelefone } from '../../utils/formatters.js';
import { useToast } from '../../context/ToastContext.jsx';

export function DoacaoMistaTab({ isVisible, doadores, categorias, onDoacaoRegistrada, onLoadingStart, onLoadingEnd }) {
    const { mostrarToast } = useToast();

    const [idDoador, setIdDoador] = useState('');
    const [doadorSearchQuery, setDoadorSearchQuery] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [canal, setCanal] = useState('Presencial');
    const [observacoes, setObservacoes] = useState('');

    const [checkFinanceiro, setCheckFinanceiro] = useState(false);
    const [finValor, setFinValor] = useState('');
    const [finComprovante, setFinComprovante] = useState('');

    const [checkMaterial, setCheckMaterial] = useState(false);
    const [matDescricao, setMatDescricao] = useState('');
    const [matCategoria, setMatCategoria] = useState('');
    const [matQtd, setMatQtd] = useState(1);
    const [matUnidade, setMatUnidade] = useState('Unidade');
    const [matEstado, setMatEstado] = useState('Não se aplica');
    const [matDestino, setMatDestino] = useState('Estoque Geral');

    useEffect(() => {
        if (categorias.length > 0 && !matCategoria) {
            setMatCategoria(categorias[0].id_categoria);
        }
    }, [categorias]);

    useEffect(() => {
        if (window.lucide) {
            lucide.createIcons();
        }
    }, [isVisible, checkFinanceiro, checkMaterial, dropdownOpen]);

    if (!isVisible) return null;

    const doadoresFiltrados = doadores.filter(d => {
        const query = doadorSearchQuery.toLowerCase().trim();
        if (!query) return true;
        return d.nome.toLowerCase().includes(query) ||
            (d.documento && d.documento.includes(query)) ||
            (d.telefone && d.telefone.includes(query)) ||
            (d.email && d.email.toLowerCase().includes(query));
    });

    const resetForm = () => {
        setIdDoador('');
        setDoadorSearchQuery('');
        setCanal('Presencial');
        setObservacoes('');
        setCheckFinanceiro(false);
        setFinValor('');
        setFinComprovante('');
        setCheckMaterial(false);
        setMatDescricao('');
        if (categorias.length > 0) setMatCategoria(categorias[0].id_categoria);
        setMatQtd(1);
        setMatUnidade('Unidade');
        setMatEstado('Não se aplica');
        setMatDestino('Estoque Geral');
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!checkFinanceiro && !checkMaterial) {
            mostrarToast('Por favor, marque pelo menos uma opção (Financeira ou Material).', 'error');
            return;
        }

        if (!idDoador) {
            mostrarToast('Por favor, pesquise e selecione um doador válido da lista.', 'error');
            return;
        }

        if (onLoadingStart) onLoadingStart();

        try {
            const dadosDoacao = {
                id_doador: parseInt(idDoador),
                canal_recebimento: canal,
                observacoes: observacoes || null
            };

            const { data: doacaoCriada, error: errorPai } = await criarEventoDoacao(dadosDoacao);
            if (errorPai) throw errorPai;

            if (!doacaoCriada || doacaoCriada.length === 0) {
                throw new Error('Erro ao obter o ID da doação criada.');
            }

            const idDoacaoGerado = doacaoCriada[0].id_doacao;

            if (checkFinanceiro) {
                const dadosFin = {
                    id_doacao: idDoacaoGerado,
                    valor: parseFloat(finValor),
                    comprovante_transacao: finComprovante || null
                };
                const { error: errorFin } = await criarDoacaoFinanceira(dadosFin);
                if (errorFin) mostrarToast('Erro ao salvar dados financeiros: ' + errorFin.message, 'error');
            }

            if (checkMaterial) {
                const dadosMat = {
                    id_doacao: idDoacaoGerado,
                    id_categoria: parseInt(matCategoria),
                    descricao_item: matDescricao,
                    quantidade: parseInt(matQtd),
                    unidade_medida: matUnidade,
                    estado_conservacao: matEstado,
                    destino_item: matDestino
                };
                const { error: errorMat } = await criarDoacaoMaterial(dadosMat);
                if (errorMat) mostrarToast('Erro ao salvar materiais: ' + errorMat.message, 'error');
            }

            mostrarToast('Doação registrada com sucesso no Supabase!', 'success');
            resetForm();
            if (onDoacaoRegistrada) onDoacaoRegistrada();
        } catch (err) {
            mostrarToast('Erro ao criar evento de doação: ' + err.message, 'error');
        } finally {
            if (onLoadingEnd) onLoadingEnd();
        }
    };

    return (
        <div id="tab-doacao_mista" className="tab-content active visible bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <i data-lucide="gift" className="text-rose-600"></i> Registrar Nova Doação (Mista / Financeira / Material)
            </h2>

            <form id="form-doacao" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative" id="container-search-doador-form">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Pesquisar Doador *</label>
                        <div className="relative">
                            <input
                                type="text"
                                id="doador-search-input"
                                autoComplete="off"
                                value={doadorSearchQuery}
                                onChange={(e) => { setDoadorSearchQuery(e.target.value); setDropdownOpen(true); }}
                                onFocus={() => setDropdownOpen(true)}
                                placeholder="Digite o nome ou CPF/CNPJ..."
                                className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500 ${idDoador ? 'bg-rose-50/50 border-rose-300 font-semibold' : ''}`}
                            />
                            {idDoador && (
                                <button
                                    type="button"
                                    onClick={() => { setIdDoador(''); setDoadorSearchQuery(''); }}
                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                >
                                    <i data-lucide="x" className="w-4 h-4"></i>
                                </button>
                            )}
                        </div>

                        {dropdownOpen && (
                            <div id="dropdown-doadores-form" className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-2xl shadow-xl z-30">
                                {doadoresFiltrados.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-gray-400 font-medium">Nenhum doador encontrado.</div>
                                ) : (
                                    doadoresFiltrados.map(d => (
                                        <div
                                            key={d.id_doador}
                                            onMouseDown={() => { setIdDoador(d.id_doador); setDoadorSearchQuery(d.nome); setDropdownOpen(false); }}
                                            className="p-3 hover:bg-rose-50/80 cursor-pointer flex items-center justify-between border-b border-gray-50 last:border-0"
                                        >
                                            <div>
                                                <div className="font-semibold text-sm text-slate-800">{d.nome}</div>
                                                <div className="text-[11px] text-gray-500">Doc: {formatarDocumento(d.documento || '', d.tipo_doador)}</div>
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
                            id="doacao-canal"
                            value={canal}
                            onChange={(e) => setCanal(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500"
                        >
                            <option value="Presencial">Presencial (Sede Institucional)</option>
                            <option value="PIX">Transferência / PIX</option>
                            <option value="Dinheiro">Dinheiro Espécie / Cofrinho / Bazar</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Observações Internas</label>
                    <input
                        type="text"
                        id="doacao-observacoes"
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        placeholder="Informações relevantes sobre a doação..."
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500"
                    />
                </div>

                {/* Seleção do Tipo de Doação */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Categorias da Doação (Selecione pelo menos uma)</label>
                    <div className="flex flex-wrap gap-6">
                        <label className="flex items-center gap-2 cursor-pointer font-semibold text-sm text-slate-800">
                            <input
                                type="checkbox"
                                id="check-financeiro"
                                checked={checkFinanceiro}
                                onChange={(e) => setCheckFinanceiro(e.target.checked)}
                                className="accent-rose-600 w-4 h-4 rounded"
                            />
                            💰 Doação Financeira
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-semibold text-sm text-slate-800">
                            <input
                                type="checkbox"
                                id="check-material"
                                checked={checkMaterial}
                                onChange={(e) => setCheckMaterial(e.target.checked)}
                                className="accent-rose-600 w-4 h-4 rounded"
                            />
                            📦 Doação Material / Física
                        </label>
                    </div>
                </div>

                {/* Sub-form Financeiro */}
                {checkFinanceiro && (
                    <div id="sub-financeiro" className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                            <i data-lucide="dollar-sign" className="w-4 h-4 text-emerald-600"></i> Dados Financeiros
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Valor (R$) *</label>
                                <input
                                    type="number"
                                    id="fin-valor"
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
                                    id="fin-comprovante"
                                    value={finComprovante}
                                    onChange={(e) => setFinComprovante(e.target.value)}
                                    placeholder="Ex: TX-984201"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500 font-mono"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Sub-form Material */}
                {checkMaterial && (
                    <div id="sub-material" className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-blue-800 flex items-center gap-2">
                            <i data-lucide="package" className="w-4 h-4 text-blue-600"></i> Dados dos Materiais Doados
                        </h4>

                        {/* Presets */}
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
                                    id="mat-descricao"
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
                                    id="mat-categoria"
                                    value={matCategoria}
                                    onChange={(e) => setMatCategoria(e.target.value)}
                                    required
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
                                    id="mat-qtd"
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
                                    id="mat-unidade"
                                    value={matUnidade}
                                    onChange={(e) => setMatUnidade(e.target.value)}
                                    required
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
                                    id="mat-estado"
                                    value={matEstado}
                                    onChange={(e) => setMatEstado(e.target.value)}
                                    required
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
                                    id="mat-destino"
                                    value={matDestino}
                                    onChange={(e) => setMatDestino(e.target.value)}
                                    required
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

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        className="bg-rose-600 text-white font-bold px-6 py-3 rounded-xl shadow-md hover:bg-rose-700 transition duration-150 cursor-pointer flex items-center gap-2"
                    >
                        <i data-lucide="check-circle" className="w-5 h-5"></i> Registrar Doação Completa
                    </button>
                </div>
            </form>
        </div>
    );
}
