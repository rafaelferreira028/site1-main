async function exigirAutenticacao() {
    if (window.authService && window.authService.verificarSessaoSupabase) {
        const { session } = await window.authService.verificarSessaoSupabase();
        if (!session) {
            throw new Error("Acesso negado: Sessão inválida ou expirada. Faça login novamente.");
        }
        return session;
    }
}

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
        .select('*, doacoes_financeiras(*), doacoes_materiais(*, categorias_itens(nome_categoria))')
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
    await exigirAutenticacao();
    const resultado = await window.supabaseClient.from('doacoes_materiais').update(dadosItem).eq('id_material', idMaterial);
    if (resultado.error) throw resultado.error;
    return resultado;
}

async function atualizarEstoqueConsolidado(lotes, diferenca, novosDados) {
    if (!window.supabaseClient) throw new Error("Supabase não disponível");
    if (!Array.isArray(lotes) || lotes.length === 0) throw new Error("Nenhum lote válido fornecido para atualização.");
    await exigirAutenticacao();

    const diferencaNum = Number(String(diferenca).replace(',', '.')) || 0;
    const somaAtual = lotes.reduce((acc, l) => acc + (parseFloat(String(l.quantidade).replace(',', '.')) || 0), 0);

    if (somaAtual + diferencaNum < 0) {
        throw new Error(`Operação inválida: a redução (${Math.abs(diferencaNum)}) é maior que o saldo em estoque (${somaAtual}).`);
    }

    let diferencaRestante = diferencaNum;
    const operacoesConcluidas = [];

    try {
        for (const lote of lotes) {
            const quantidadeAtual = parseFloat(String(lote.quantidade).replace(',', '.')) || 0;
            let qtdLote = quantidadeAtual;

            if (diferencaRestante > 0) {
                qtdLote += diferencaRestante;
                diferencaRestante = 0;
            } else if (diferencaRestante < 0) {
                const reducao = Math.min(quantidadeAtual, -diferencaRestante);
                qtdLote -= reducao;
                diferencaRestante += reducao;
            }

            const payloadAtualizacao = {
                quantidade: Math.round(qtdLote * 100) / 100
            };

            if (novosDados) {
                if (novosDados.descricao_item) payloadAtualizacao.descricao_item = novosDados.descricao_item;
                if (novosDados.id_categoria) payloadAtualizacao.id_categoria = Number(novosDados.id_categoria);
                if (novosDados.unidade_medida) payloadAtualizacao.unidade_medida = novosDados.unidade_medida;
                if (novosDados.estado_conservacao) payloadAtualizacao.estado_conservacao = novosDados.estado_conservacao;
                if (novosDados.destino_item) payloadAtualizacao.destino_item = novosDados.destino_item;
            }

            if (qtdLote <= 0) {
                const { error: delErr } = await window.supabaseClient
                    .from('doacoes_materiais')
                    .delete()
                    .eq('id_material', lote.id_material);
                if (delErr) throw new Error(`Falha ao remover item zerado do estoque: ${delErr.message}`);
                operacoesConcluidas.push({ tipo: 'delete', loteOriginal: lote });
            } else {
                const { error: updErr } = await window.supabaseClient
                    .from('doacoes_materiais')
                    .update(payloadAtualizacao)
                    .eq('id_material', lote.id_material);
                if (updErr) throw new Error(`Falha ao atualizar lote #${lote.id_material}: ${updErr.message}`);
                operacoesConcluidas.push({ tipo: 'update', loteOriginal: lote });
            }
        }
        return true;
    } catch (errLoop) {
        const falhasRollback = [];
        for (const op of operacoesConcluidas) {
            try {
                if (op.tipo === 'delete') {
                    const payloadRestauracao = {
                        id_material: op.loteOriginal.id_material,
                        id_doacao: op.loteOriginal.id_doacao,
                        id_categoria: op.loteOriginal.id_categoria,
                        descricao_item: op.loteOriginal.descricao_item,
                        quantidade: op.loteOriginal.quantidade,
                        unidade_medida: op.loteOriginal.unidade_medida,
                        estado_conservacao: op.loteOriginal.estado_conservacao,
                        destino_item: op.loteOriginal.destino_item
                    };
                    const { error: insErr } = await window.supabaseClient.from('doacoes_materiais').insert([payloadRestauracao]);
                    if (insErr) throw insErr;
                } else if (op.tipo === 'update') {
                    const payloadReversao = {
                        quantidade: op.loteOriginal.quantidade,
                        descricao_item: op.loteOriginal.descricao_item,
                        id_categoria: op.loteOriginal.id_categoria,
                        unidade_medida: op.loteOriginal.unidade_medida,
                        estado_conservacao: op.loteOriginal.estado_conservacao,
                        destino_item: op.loteOriginal.destino_item
                    };
                    const { error: updErr } = await window.supabaseClient.from('doacoes_materiais').update(payloadReversao).eq('id_material', op.loteOriginal.id_material);
                    if (updErr) throw updErr;
                }
            } catch (errRollback) {
                console.error("Falha ao reverter lote #", op.loteOriginal.id_material, errRollback);
                falhasRollback.push({ id: op.loteOriginal.id_material, erro: errRollback.message });
            }
        }
        if (falhasRollback.length > 0) {
            throw new Error(`Erro crítico na atualização: ${errLoop.message}. ATENÇÃO: Falha ao restaurar ${falhasRollback.length} lote(s).`);
        }
        throw new Error(`Falha ao atualizar lotes: ${errLoop.message}. As modificações foram revertidas.`);
    }
}

window.estoqueService = {
    buscarEstoqueMateriais,
    buscarEstoqueDoacoesCanais,
    atualizarItemEstoqueLote,
    atualizarEstoqueConsolidado
};
