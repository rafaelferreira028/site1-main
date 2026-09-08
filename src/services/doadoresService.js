async function buscarDoadores() {
    if (!window.supabaseClient) return { data: [], error: null };
    return await window.supabaseClient
        .from('doadores')
        .select('id_doador, nome, tipo_doador, documento, telefone, email, cep, endereco, cidade, data_nascimento')
        .order('nome');
}

async function buscarDoadoresTodos() {
    if (!window.supabaseClient) return { data: [], error: null };
    return await window.supabaseClient.from('doadores').select('*').order('nome');
}

async function criarDoador(dadosDoador) {
    if (!window.supabaseClient) throw new Error("Supabase não disponível");
    return await window.supabaseClient.from('doadores').insert([dadosDoador]).select();
}

async function atualizarDoador(idDoador, dadosDoador) {
    if (!window.supabaseClient) throw new Error("Supabase não disponível");
    const resultado = await window.supabaseClient.from('doadores').update(dadosDoador).eq('id_doador', idDoador);
    if (resultado.error) throw resultado.error;
    return resultado;
}

async function deletarDoadorCascata(idDoador) {
    if (!window.supabaseClient) throw new Error("Supabase não disponível");
    
    // 1. Buscar doações do doador
    const { data: listDoacoes, error: errList } = await window.supabaseClient.from('doacoes').select('id_doacao').eq('id_doador', idDoador);
    if (errList) throw errList;

    if (listDoacoes && listDoacoes.length > 0) {
        const idsDoacoes = listDoacoes.map(d => d.id_doacao);

        // 2. Excluir dados das doações financeiras vinculadas
        const { error: errFin } = await window.supabaseClient.from('doacoes_financeiras').delete().in('id_doacao', idsDoacoes);
        if (errFin) throw errFin;

        // 3. Excluir dados das doações materiais vinculadas
        const { error: errMat } = await window.supabaseClient.from('doacoes_materiais').delete().in('id_doacao', idsDoacoes);
        if (errMat) throw errMat;

        // 4. Excluir as doações vinculadas na tabela pai
        const { error: errDoacoes } = await window.supabaseClient.from('doacoes').delete().in('id_doacao', idsDoacoes);
        if (errDoacoes) throw errDoacoes;
    }

    // 5. Excluir o doador
    const resultado = await window.supabaseClient.from('doadores').delete().eq('id_doador', idDoador);
    if (resultado.error) throw resultado.error;
    return resultado;
}

window.doadoresService = {
    buscarDoadores,
    buscarDoadoresTodos,
    criarDoador,
    atualizarDoador,
    deletarDoadorCascata
};
