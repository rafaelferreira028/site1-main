import { supabaseClient } from '../config/supabaseClient.js';

export async function buscarDoadores() {
    if (!supabaseClient) return { data: [], error: null };
    return await supabaseClient
        .from('doadores')
        .select('id_doador, nome, tipo_doador, documento, telefone, email, cidade, data_nascimento')
        .order('nome');
}

export async function buscarDoadoresTodos() {
    if (!supabaseClient) return { data: [], error: null };
    return await supabaseClient.from('doadores').select('*').order('nome');
}

export async function criarDoador(dadosDoador) {
    if (!supabaseClient) throw new Error("Supabase não disponível");
    return await supabaseClient.from('doadores').insert([dadosDoador]).select();
}

export async function atualizarDoador(idDoador, dadosDoador) {
    if (!supabaseClient) throw new Error("Supabase não disponível");
    return await supabaseClient.from('doadores').update(dadosDoador).eq('id_doador', idDoador);
}

export async function deletarDoadorCascata(idDoador) {
    if (!supabaseClient) throw new Error("Supabase não disponível");
    
    // 1. Buscar doações do doador
    const { data: listDoacoes, error: errList } = await supabaseClient.from('doacoes').select('id_doacao').eq('id_doador', idDoador);
    if (errList) throw errList;

    if (listDoacoes && listDoacoes.length > 0) {
        const idsDoacoes = listDoacoes.map(d => d.id_doacao);

        // 2. Excluir dados das doações financeiras vinculadas
        const { error: errFin } = await supabaseClient.from('doacoes_financeiras').delete().in('id_doacao', idsDoacoes);
        if (errFin) throw errFin;

        // 3. Excluir dados das doações materiais vinculadas
        const { error: errMat } = await supabaseClient.from('doacoes_materiais').delete().in('id_doacao', idsDoacoes);
        if (errMat) throw errMat;

        // 4. Excluir as doações vinculadas na tabela pai
        const { error: errDoacoes } = await supabaseClient.from('doacoes').delete().in('id_doacao', idsDoacoes);
        if (errDoacoes) throw errDoacoes;
    }

    // 5. Excluir o doador
    return await supabaseClient.from('doadores').delete().eq('id_doador', idDoador);
}
