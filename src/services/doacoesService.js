async function buscarCategoriasItens() {
    if (!window.supabaseClient) return { data: [], error: null };
    return await window.supabaseClient.from('categorias_itens').select('id_categoria, nome_categoria').order('id_categoria');
}

async function criarEventoDoacao(dadosDoacao) {
    if (!window.supabaseClient) throw new Error("Supabase não disponível");
    return await window.supabaseClient.from('doacoes').insert([dadosDoacao]).select();
}

async function criarDoacaoFinanceira(dadosFin) {
    if (!window.supabaseClient) throw new Error("Supabase não disponível");
    return await window.supabaseClient.from('doacoes_financeiras').insert([dadosFin]);
}

async function criarDoacaoMaterial(dadosMat) {
    if (!window.supabaseClient) throw new Error("Supabase não disponível");
    return await window.supabaseClient.from('doacoes_materiais').insert([dadosMat]);
}

async function buscarDoacoesAdmin() {
    if (!window.supabaseClient) return { data: [], error: null };
    const { data, error } = await window.supabaseClient
        .from('doacoes')
        .select('*, doadores(nome), doacoes_financeiras(*), doacoes_materiais(*)')
        .order('data_doacao', { ascending: false });

    if (error) return { data: [], error };

    const listaNormalizada = (data || []).map(d => {
        if (d.canal_recebimento === 'Conta Bancária' || d.canal_recebimento === 'Cofrinho' || d.canal_recebimento === 'Bazar') {
            d.canal_recebimento = 'Dinheiro';
        }
        return d;
    });

    return { data: listaNormalizada, error: null };
}

async function deletarDoacaoCompleta(idDoacao) {
    if (!window.supabaseClient) throw new Error("Supabase não disponível");

    const { error: errFin } = await window.supabaseClient.from('doacoes_financeiras').delete().eq('id_doacao', idDoacao);
    if (errFin) throw errFin;

    const { error: errMat } = await window.supabaseClient.from('doacoes_materiais').delete().eq('id_doacao', idDoacao);
    if (errMat) throw errMat;

    const resultado = await window.supabaseClient.from('doacoes').delete().eq('id_doacao', idDoacao);
    if (resultado.error) throw resultado.error;
    return resultado;
}

async function atualizarDoacaoCompleta(idDoacao, dadosPai, dadosFin, dadosMat, editHasFin, editHasMat, originalDoacao) {
    if (!window.supabaseClient) throw new Error("Supabase não disponível");

    const { error: errorPai } = await window.supabaseClient.from('doacoes').update(dadosPai).eq('id_doacao', idDoacao);
    if (errorPai) throw errorPai;

    if (editHasFin) {
        const originallyHadFin = originalDoacao && originalDoacao.doacoes_financeiras && originalDoacao.doacoes_financeiras.length > 0;
        if (originallyHadFin) {
            const { error: errFin } = await window.supabaseClient.from('doacoes_financeiras').update(dadosFin).eq('id_doacao', idDoacao);
            if (errFin) throw errFin;
        } else {
            const { error: errFin } = await window.supabaseClient.from('doacoes_financeiras').insert([dadosFin]);
            if (errFin) throw errFin;
        }
    } else {
        const { error: errFin } = await window.supabaseClient.from('doacoes_financeiras').delete().eq('id_doacao', idDoacao);
        if (errFin) throw errFin;
    }

    if (editHasMat) {
        const originallyHadMat = originalDoacao && originalDoacao.doacoes_materiais && originalDoacao.doacoes_materiais.length > 0;
        if (originallyHadMat) {
            const { error: errMat } = await window.supabaseClient.from('doacoes_materiais').update(dadosMat).eq('id_doacao', idDoacao);
            if (errMat) throw errMat;
        } else {
            const { error: errMat } = await window.supabaseClient.from('doacoes_materiais').insert([dadosMat]);
            if (errMat) throw errMat;
        }
    } else {
        const { error: errMat } = await window.supabaseClient.from('doacoes_materiais').delete().eq('id_doacao', idDoacao);
        if (errMat) throw errMat;
    }

    return true;
}

window.doacoesService = {
    buscarCategoriasItens,
    criarEventoDoacao,
    criarDoacaoFinanceira,
    criarDoacaoMaterial,
    buscarDoacoesAdmin,
    deletarDoacaoCompleta,
    atualizarDoacaoCompleta
};
