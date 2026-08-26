const { useState, useEffect } = React;
import { Header } from '../components/common/Header.jsx';
import { Navbar } from '../components/common/Navbar.jsx';
import { DoadorTab } from '../components/tabs/DoadorTab.jsx';
import { DoacaoMistaTab } from '../components/tabs/DoacaoMistaTab.jsx';
import { AdminTab } from '../components/tabs/AdminTab.jsx';
import { EstoqueTab } from '../components/tabs/EstoqueTab.jsx';

import { EditDoadorModal } from '../components/modals/EditDoadorModal.jsx';
import { EditDoacaoModal } from '../components/modals/EditDoacaoModal.jsx';
import { EditEstoqueModal } from '../components/modals/EditEstoqueModal.jsx';

import { buscarDoadores, atualizarDoador } from '../services/doadoresService.js';
import { buscarCategoriasItens, atualizarDoacaoCompleta } from '../services/doacoesService.js';
import { atualizarItemEstoqueLote, atualizarEstoqueConsolidado } from '../services/estoqueService.js';
import { useToast } from '../context/ToastContext.jsx';

export function MainAppView({ onLoadingStart, onLoadingEnd }) {
    const { mostrarToast } = useToast();
    const [activeTab, setActiveTab] = useState('doador');

    const [doadoresGlobal, setDoadoresGlobal] = useState([]);
    const [categoriasGlobal, setCategoriasGlobal] = useState([]);

    // Modais States
    const [editDoadorModalOpen, setEditDoadorModalOpen] = useState(false);
    const [selectedDoador, setSelectedDoador] = useState(null);

    const [editDoacaoModalOpen, setEditDoacaoModalOpen] = useState(false);
    const [selectedDoacao, setSelectedDoacao] = useState(null);

    const [editEstoqueModalOpen, setEditEstoqueModalOpen] = useState(false);
    const [selectedEstoqueItem, setSelectedEstoqueItem] = useState(null);
    const [selectedEstoqueModo, setSelectedEstoqueModo] = useState('lote');
    const [selectedEstoqueGrupoKey, setSelectedEstoqueGrupoKey] = useState('');

    const carregarDoadoresEConteudo = async () => {
        try {
            const { data: dData } = await buscarDoadores();
            setDoadoresGlobal(dData || []);

            const { data: cData } = await buscarCategoriasItens();
            setCategoriasGlobal(cData || []);
        } catch (e) {
            console.error("Erro ao carregar dados do app:", e);
        }
    };

    useEffect(() => {
        carregarDoadoresEConteudo();
    }, []);

    useEffect(() => {
        if (window.lucide) {
            lucide.createIcons();
        }
    }, [activeTab]);

    // Handlers modal Doador
    const handleOpenEditDoador = (doador) => {
        setSelectedDoador(doador);
        setEditDoadorModalOpen(true);
    };

    const handleSaveDoador = async (dadosAtualizados) => {
        if (onLoadingStart) onLoadingStart();
        try {
            const { error } = await atualizarDoador(dadosAtualizados.id_doador, dadosAtualizados);
            if (error) {
                mostrarToast('Erro ao atualizar doador: ' + error.message, 'error');
            } else {
                mostrarToast('Doador atualizado com sucesso!', 'success');
                setEditDoadorModalOpen(false);
                carregarDoadoresEConteudo();
            }
        } catch (e) {
            mostrarToast('Erro ao atualizar doador: ' + e.message, 'error');
        } finally {
            if (onLoadingEnd) onLoadingEnd();
        }
    };

    // Handlers modal Doação
    const handleOpenEditDoacao = (doacao) => {
        setSelectedDoacao(doacao);
        setEditDoacaoModalOpen(true);
    };

    const handleSaveDoacao = async (payload) => {
        if (onLoadingStart) onLoadingStart();
        try {
            const dadosPai = {
                id_doador: payload.idDoador,
                canal_recebimento: payload.canal,
                observacoes: payload.observacoes || null
            };

            const dadosFin = {
                id_doacao: payload.idDoacao,
                valor: payload.finValor,
                comprovante_transacao: payload.finComprovante || null
            };

            const dadosMat = {
                id_doacao: payload.idDoacao,
                id_categoria: payload.matCategoria,
                descricao_item: payload.matDescricao,
                quantidade: payload.matQtd,
                unidade_medida: payload.matUnidade,
                estado_conservacao: payload.matEstado,
                destino_item: payload.matDestino
            };

            await atualizarDoacaoCompleta(
                payload.idDoacao,
                dadosPai,
                dadosFin,
                dadosMat,
                payload.checkFinanceiro,
                payload.checkMaterial,
                selectedDoacao
            );

            mostrarToast('Doação atualizada com sucesso!', 'success');
            setEditDoacaoModalOpen(false);
            carregarDoadoresEConteudo();
        } catch (e) {
            mostrarToast('Erro ao atualizar doação: ' + e.message, 'error');
        } finally {
            if (onLoadingEnd) onLoadingEnd();
        }
    };

    // Handlers modal Estoque
    const handleOpenEditEstoque = (item) => {
        setSelectedEstoqueItem(item);
        setSelectedEstoqueModo('lote');
        setSelectedEstoqueGrupoKey('');
        setEditEstoqueModalOpen(true);
    };

    const handleOpenEditEstoqueConsolidado = (grupo) => {
        setSelectedEstoqueItem(grupo);
        setSelectedEstoqueModo('consolidado');
        setSelectedEstoqueGrupoKey(grupo.key);
        setEditEstoqueModalOpen(true);
    };

    const handleSaveEstoque = async (payload) => {
        if (onLoadingStart) onLoadingStart();
        try {
            if (payload.modo === 'consolidado' && selectedEstoqueItem && selectedEstoqueItem.lotes) {
                const diferenca = payload.novaQtd - selectedEstoqueItem.quantidadeTotal;
                const novosDados = {
                    descricao_item: payload.novaDesc,
                    id_categoria: payload.novaCat,
                    unidade_medida: payload.novaUnidade,
                    estado_conservacao: payload.novoEstado,
                    destino_item: payload.novoDestino
                };

                await atualizarEstoqueConsolidado(selectedEstoqueItem.lotes, diferenca, novosDados);
                mostrarToast('Estoque acumulado atualizado com sucesso!', 'success');
            } else {
                const itemAtualizado = {
                    descricao_item: payload.novaDesc,
                    id_categoria: payload.novaCat,
                    quantidade: payload.novaQtd,
                    unidade_medida: payload.novaUnidade,
                    estado_conservacao: payload.novoEstado,
                    destino_item: payload.novoDestino
                };

                const { error } = await atualizarItemEstoqueLote(payload.idMaterial, itemAtualizado);
                if (error) throw error;
                mostrarToast('Item de estoque atualizado com sucesso!', 'success');
            }

            setEditEstoqueModalOpen(false);
            carregarDoadoresEConteudo();
        } catch (e) {
            mostrarToast('Erro ao atualizar estoque: ' + e.message, 'error');
        } finally {
            if (onLoadingEnd) onLoadingEnd();
        }
    };

    return (
        <div id="app-container" className="max-w-6xl mx-auto px-4 py-8 space-y-6">
            <Header />

            <Navbar activeTab={activeTab} onSwitchTab={setActiveTab} />

            <main className="pt-2">
                <DoadorTab
                    isVisible={activeTab === 'doador'}
                    onDoadorCadastrado={carregarDoadoresEConteudo}
                    onLoadingStart={onLoadingStart}
                    onLoadingEnd={onLoadingEnd}
                />

                <DoacaoMistaTab
                    isVisible={activeTab === 'doacao_mista'}
                    doadores={doadoresGlobal}
                    categorias={categoriasGlobal}
                    onDoacaoRegistrada={carregarDoadoresEConteudo}
                    onLoadingStart={onLoadingStart}
                    onLoadingEnd={onLoadingEnd}
                />

                <AdminTab
                    isVisible={activeTab === 'admin'}
                    onOpenEditDoador={handleOpenEditDoador}
                    onOpenEditDoacao={handleOpenEditDoacao}
                    onDataChanged={carregarDoadoresEConteudo}
                    onLoadingStart={onLoadingStart}
                    onLoadingEnd={onLoadingEnd}
                />

                <EstoqueTab
                    isVisible={activeTab === 'estoque'}
                    onOpenEditEstoque={handleOpenEditEstoque}
                    onOpenEditEstoqueConsolidado={handleOpenEditEstoqueConsolidado}
                    onOpenEditDoacao={handleOpenEditDoacao}
                    onLoadingStart={onLoadingStart}
                    onLoadingEnd={onLoadingEnd}
                />
            </main>

            {/* Modais Globais */}
            <EditDoadorModal
                isOpen={editDoadorModalOpen}
                doador={selectedDoador}
                onClose={() => setEditDoadorModalOpen(false)}
                onSave={handleSaveDoador}
            />

            <EditDoacaoModal
                isOpen={editDoacaoModalOpen}
                doacao={selectedDoacao}
                doadores={doadoresGlobal}
                categorias={categoriasGlobal}
                onClose={() => setEditDoacaoModalOpen(false)}
                onSave={handleSaveDoacao}
            />

            <EditEstoqueModal
                isOpen={editEstoqueModalOpen}
                item={selectedEstoqueItem}
                modo={selectedEstoqueModo}
                grupoKey={selectedEstoqueGrupoKey}
                categorias={categoriasGlobal}
                onClose={() => setEditEstoqueModalOpen(false)}
                onSave={handleSaveEstoque}
            />
        </div>
    );
}
