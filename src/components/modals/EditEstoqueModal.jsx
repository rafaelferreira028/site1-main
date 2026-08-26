const { useState, useEffect } = React;

function EditEstoqueModal({ isOpen, item, modo, grupoKey, categorias, onClose, onSave }) {
    const [idMaterial, setIdMaterial] = useState('');
    const [descricao, setDescricao] = useState('');
    const [categoria, setCategoria] = useState('');
    const [quantidade, setQuantidade] = useState(1);
    const [unidade, setUnidade] = useState('Unidade');
    const [estado, setEstado] = useState('Novo');
    const [destino, setDestino] = useState('Estoque Geral');

    useEffect(() => {
        if (item) {
            setIdMaterial(item.id_material || '');
            setDescricao(modo === 'consolidado' ? item.descricao : (item.descricao_item || ''));
            setCategoria(item.id_categoria || (categorias[0] ? categorias[0].id_categoria : ''));
            setQuantidade(modo === 'consolidado' ? item.quantidadeTotal : (item.quantidade || 1));
            setUnidade(item.unidade || item.unidade_medida || 'Unidade');
            setEstado(item.estado || item.estado_conservacao || 'Novo');
            setDestino(item.destino || item.destino_item || 'Estoque Geral');
        }
    }, [item, modo, categorias]);

    useEffect(() => {
        if (window.lucide) {
            lucide.createIcons();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            idMaterial: parseInt(idMaterial),
            modo,
            grupoKey,
            novaDesc: descricao,
            novaCat: parseInt(categoria),
            novaQtd: parseInt(quantidade),
            novaUnidade: unidade,
            novoEstado: estado,
            novoDestino: destino
        });
    };

    return (
        <div id="modal-editar-estoque" className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay show bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 modal-dialog show relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                            <i data-lucide="package-search" className="w-5 h-5"></i>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">
                            {modo === 'consolidado' ? 'Editar Quantitativo Consolidado do Estoque' : 'Editar Lote Específico do Estoque'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                        <i data-lucide="x" className="w-5 h-5"></i>
                    </button>
                </div>

                <form id="form-editar-estoque" onSubmit={handleSubmit} className="space-y-4">
                    <input type="hidden" id="edit-stock-id" value={idMaterial} />
                    <input type="hidden" id="edit-stock-modo" value={modo} />
                    <input type="hidden" id="edit-stock-grupo-key" value={grupoKey} />

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Descrição do Item *</label>
                        <input
                            type="text"
                            id="edit-stock-descricao"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Categoria *</label>
                            <select
                                id="edit-stock-categoria"
                                value={categoria}
                                onChange={(e) => setCategoria(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500"
                            >
                                {categorias.map(c => (
                                    <option key={c.id_categoria} value={c.id_categoria}>{c.nome_categoria}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                {modo === 'consolidado' ? 'Quantidade Acumulada Total *' : 'Quantidade do Lote *'}
                            </label>
                            <input
                                type="number"
                                id="edit-stock-qtd"
                                min="0"
                                value={quantidade}
                                onChange={(e) => setQuantidade(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500 font-mono"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Unidade de Medida *</label>
                            <select
                                id="edit-stock-unidade"
                                value={unidade}
                                onChange={(e) => setUnidade(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500"
                            >
                                <option value="Unidade">Unidade (un)</option>
                                <option value="Kg">Quilograma (kg)</option>
                                <option value="Pacote">Pacote (pct)</option>
                                <option value="Caixa">Caixa (cx)</option>
                                <option value="Litro">Litro (l)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Estado de Conservação *</label>
                            <select
                                id="edit-stock-estado"
                                value={estado}
                                onChange={(e) => setEstado(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500"
                            >
                                <option value="Novo">Novo (Lacre de fábrica)</option>
                                <option value="Seminovo">Seminovo (Ótimo estado)</option>
                                <option value="Usado">Usado (Bom estado)</option>
                                <option value="Não se aplica">Não se aplica (Alimentos / Descartáveis)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Destino Atual *</label>
                        <select
                            id="edit-stock-destino"
                            value={destino}
                            onChange={(e) => setDestino(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-500"
                        >
                            <option value="Estoque Geral">Estoque Geral (Uso Institucional)</option>
                            <option value="Bazar">Bazar Beneficente (Venda / Arrecadação)</option>
                            <option value="Uso Direto Paciente">Uso Direto Paciente (Doação Direta)</option>
                        </select>
                    </div>

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
                            <i data-lucide="check" className="w-4 h-4"></i> Salvar Alterações no Estoque
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

window.EditEstoqueModal = EditEstoqueModal;
