const { useState, useEffect } = React;

function MainAppView({ onLoadingStart, onLoadingEnd }) {
    const { mostrarToast } = window.useToast();

    const Header = window.Header;
    const Navbar = window.Navbar;
    const DoadorTab = window.DoadorTab;
    const DoacaoMistaTab = window.DoacaoMistaTab;
    const AdminTab = window.AdminTab;
    const EstoqueTab = window.EstoqueTab;

    const EditDoadorModal = window.EditDoadorModal;
    const EditDoacaoModal = window.EditDoacaoModal;
    const EditEstoqueModal = window.EditEstoqueModal;

    const [activeTab, setActiveTab] = useState('doador');
    const [doadoresGlobal, setDoadoresGlobal] = useState([]);
    const [categoriasGlobal, setCategoriasGlobal] = useState([]);

    const [editDoadorModalOpen, setEditDoadorModalOpen] = useState(false);
    const [selectedDoador, setSelectedDoador] = useState(null);

    const [editDoacaoModalOpen, setEditDoacaoModalOpen] = useState(false);
    const [selectedDoacao, setSelectedDoacao] = useState(null);

    const [editEstoqueModalOpen, setEditEstoqueModalOpen] = useState(false);
    const [selectedEstoqueItem, setSelectedEstoqueItem] = useState(null);
    const [estoqueEditMode, setEstoqueEditMode] = useState('lote');

    const carregarDadosApp = async () => {
        try {
            const { data: dData } = await window.doadoresService.buscarDoadores();
            setDoadoresGlobal(dData || []);
            const { data: cData } = await window.doacoesService.buscarCategoriasItens();
            setCategoriasGlobal(cData || []);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { carregarDadosApp(); }, []);
    useEffect(() => { if (window.lucide) lucide.createIcons(); }, [activeTab]);

    const handleSaveDoador = async (dados) => {
        if (onLoadingStart) onLoadingStart();
        try {
            await window.doadoresService.atualizarDoador(dados.id_doador, dados);
            mostrarToast('Doador atualizado com sucesso!', 'success');
            setEditDoadorModalOpen(false);
            carregarDadosApp();
        } catch (e) { mostrarToast('Erro: ' + e.message, 'error'); }
        finally { if (onLoadingEnd) onLoadingEnd(); }
    };

    const handleSaveDoacao = async (payload) => {
        if (onLoadingStart) onLoadingStart();
        try {
            await window.doacoesService.atualizarDoacaoCompleta(payload.idDoacao, { id_doador: payload.idDoador, canal_recebimento: payload.canal, observacoes: payload.observacoes || null }, { id_doacao: payload.idDoacao, valor: payload.finValor, comprovante_transacao: payload.finComprovante || null }, { id_doacao: payload.idDoacao, id_categoria: payload.matCategoria, descricao_item: payload.matDescricao, quantidade: payload.matQtd, unidade_medida: payload.matUnidade, estado_conservacao: payload.matEstado, destino_item: payload.matDestino }, payload.checkFinanceiro, payload.checkMaterial, selectedDoacao);
            mostrarToast('Doação atualizada com sucesso!', 'success');
            setEditDoacaoModalOpen(false);
            carregarDadosApp();
        } catch (e) { mostrarToast('Erro: ' + e.message, 'error'); }
        finally { if (onLoadingEnd) onLoadingEnd(); }
    };

    const handleSaveEstoque = async (payload) => {
        if (onLoadingStart) onLoadingStart();
        try {
            const novosDados = { descricao_item: payload.novaDesc, id_categoria: payload.novaCat, unidade_medida: payload.novaUnidade, estado_conservacao: payload.novoEstado, destino_item: payload.novoDestino };
            if (payload.modo === 'consolidado') {
                if (!selectedEstoqueItem || !selectedEstoqueItem.lotes) throw new Error('Dados dos lotes não encontrados.');
                const diferenca = payload.novaQtd - selectedEstoqueItem.quantidadeTotal;
                await window.estoqueService.atualizarEstoqueConsolidado(selectedEstoqueItem.lotes, diferenca, novosDados);
            } else {
                await window.estoqueService.atualizarItemEstoqueLote(payload.idMaterial, { ...novosDados, quantidade: payload.novaQtd });
            }
            mostrarToast('Estoque atualizado com sucesso!', 'success');
            setEditEstoqueModalOpen(false);
            carregarDadosApp();
        } catch (e) { mostrarToast('Erro: ' + e.message, 'error'); }
        finally { if (onLoadingEnd) onLoadingEnd(); }
    };

    return (
        <div id="app-container" className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <Header />
            <Navbar activeTab={activeTab} onSwitchTab={setActiveTab} />
            <main className="pt-2">
                <DoadorTab isVisible={activeTab === 'doador'} onDoadorCadastrado={carregarDadosApp} onLoadingStart={onLoadingStart} onLoadingEnd={onLoadingEnd} />
                <DoacaoMistaTab isVisible={activeTab === 'doacao_mista'} doadores={doadoresGlobal} categorias={categoriasGlobal} onDoacaoRegistrada={carregarDadosApp} onLoadingStart={onLoadingStart} onLoadingEnd={onLoadingEnd} />
                <AdminTab isVisible={activeTab === 'admin'} onOpenEditDoador={(d) => { setSelectedDoador(d); setEditDoadorModalOpen(true); }} onOpenEditDoacao={(d) => { setSelectedDoacao(d); setEditDoacaoModalOpen(true); }} onDataChanged={carregarDadosApp} onLoadingStart={onLoadingStart} onLoadingEnd={onLoadingEnd} />
                <EstoqueTab isVisible={activeTab === 'estoque'} onOpenEditEstoque={(m) => { setSelectedEstoqueItem(m); setEstoqueEditMode('lote'); setEditEstoqueModalOpen(true); }} onOpenEditEstoqueConsolidado={(m) => { setSelectedEstoqueItem(m); setEstoqueEditMode('consolidado'); setEditEstoqueModalOpen(true); }} onOpenEditDoacao={(d) => { setSelectedDoacao(d); setEditDoacaoModalOpen(true); }} onLoadingStart={onLoadingStart} onLoadingEnd={onLoadingEnd} />
            </main>

            <EditDoadorModal isOpen={editDoadorModalOpen} doador={selectedDoador} onClose={() => setEditDoadorModalOpen(false)} onSave={handleSaveDoador} />
            <EditDoacaoModal isOpen={editDoacaoModalOpen} doacao={selectedDoacao} doadores={doadoresGlobal} categorias={categoriasGlobal} onClose={() => setEditDoacaoModalOpen(false)} onSave={handleSaveDoacao} />
            <EditEstoqueModal isOpen={editEstoqueModalOpen} item={selectedEstoqueItem} modo={estoqueEditMode} categorias={categoriasGlobal} onClose={() => setEditEstoqueModalOpen(false)} onSave={handleSaveEstoque} />
        </div>
    );
}

window.MainAppView = MainAppView;
