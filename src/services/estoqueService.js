async function buscarEstoqueMateriais() {
    if (!window.supabaseClient) return { data: [], error: null };
    const { data: matData, error } = await window.supabaseClient
        .from('doacoes_materiais')
        .select('*, categorias_itens(nome_categoria), doacoes(data_doacao, canal_recebimento, observacoes)')
        .order('id_material', { ascending: false });

    if (error) return { data: [], error };

    const listaNormalizada = (matData || []).map(m => {
        if (m.doacoes && (m.doacoes.canal_recebimento === 'Conta Bancária' || m.doacoes.canal_recebimento === 'Cofrinho' || m.doacoes.canal_recebimento === 'Bazar')) {
            m.doacoes.canal_recebimento = 'Dinheiro';
        }
        return m;
    });

    return { data: listaNormalizada, error: null };
}

async function buscarEstoqueDoacoesCanais() {
    if (!window.supabaseClient) return { data: [], error: null };
    const { data: doaData, error } = await window.supabaseClient
        .from('doacoes')
        .select('*, doacoes_financeiras(*), doacoes_materiais(*, categorias_itens(nome_categoria)))')
        .order('data_doacao', { ascending: false });

    if (error) return { data: [], error };

    const listaNormalizada = (doaData || []).map(d => {
        if (d.canal_recebimento === 'Conta Bancária' || d.canal_recebimento === 'Cofrinho' || d.canal_recebimento === 'Bazar') {
            d.canal_recebimento = 'Dinheiro';
        }
        return d;
    });

    return { data: listaNormalizada, error: null };
}

async function atualizarItemEstoqueLote(idMaterial, dadosItem) {
    if (!window.supabaseClient) throw new Error("Supabase não disponível");
    return await window.supabaseClient.from('doacoes_materiais').update(dadosItem).eq('id_material', idMaterial);
}

async function atualizarEstoqueConsolidado(lotes, diferenca, novosDados) {
    if (!window.supabaseClient) throw new Error("Supabase não disponível");
    const updatePromises = lotes.map((lote, index) => {
        let qtdLote = lote.quantidade;
        if (index === 0) {
            qtdLote = Math.max(0, lote.quantidade + diferenca);
        }
        return window.supabaseClient
            .from('doacoes_materiais')
            .update({
                ...novosDados,
                quantidade: qtdLote
            })
            .eq('id_material', lote.id_material);
    });

    const results = await Promise.all(updatePromises);
    const hasError = results.some(r => r.error);
    if (hasError) throw new Error("Erro ao atualizar alguns lotes do estoque.");
    return true;
}

window.estoqueService = {
    buscarEstoqueMateriais,
    buscarEstoqueDoacoesCanais,
    atualizarItemEstoqueLote,
    atualizarEstoqueConsolidado
};
