import { supabaseClient } from '../config/supabaseClient.js';

export async function buscarCategoriasItens() {
    if (!supabaseClient) return { data: [], error: null };
    return await supabaseClient.from('categorias_itens').select('id_categoria, nome_categoria').order('id_categoria');
}

export async function criarEventoDoacao(dadosDoacao) {
    if (!supabaseClient) throw new Error("Supabase não disponível");
    return await supabaseClient.from('doacoes').insert([dadosDoacao]).select();
}

export async function criarDoacaoFinanceira(dadosFin) {
    if (!supabaseClient) throw new Error("Supabase não disponível");
    return await supabaseClient.from('doacoes_financeiras').insert([dadosFin]);
}

export async function criarDoacaoMaterial(dadosMat) {
    if (!supabaseClient) throw new Error("Supabase não disponível");
    return await supabaseClient.from('doacoes_materiais').insert([dadosMat]);
}

export async function buscarDoacoesAdmin() {
    if (!supabaseClient) return { data: [], error: null };
    const { data, error } = await supabaseClient
        .from('doacoes')
        .select('*, doadores(nome), doacoes_financeiras(*), doacoes_materiais(*)')
        .order('data_doacao', { ascending: false });

    if (error) return { data: [], error };

    // Normalizar canais antigos
    const listaNormalizada = (data || []).map(d => {
        if (d.canal_recebimento === 'Conta Bancária' || d.canal_recebimento === 'Cofrinho' || d.canal_recebimento === 'Bazar') {
            d.canal_recebimento = 'Dinheiro';
        }
        return d;
    });

    return { data: listaNormalizada, error: null };
}

export async function deletarDoacaoCompleta(idDoacao) {
    if (!supabaseClient) throw new Error("Supabase não disponível");

    const { error: errFin } = await supabaseClient.from('doacoes_financeiras').delete().eq('id_doacao', idDoacao);
    if (errFin) throw errFin;

    const { error: errMat } = await supabaseClient.from('doacoes_materiais').delete().eq('id_doacao', idDoacao);
    if (errMat) throw errMat;

    return await supabaseClient.from('doacoes').delete().eq('id_doacao', idDoacao);
}

export async function atualizarDoacaoCompleta(idDoacao, dadosPai, dadosFin, dadosMat, editHasFin, editHasMat, originalDoacao) {
    if (!supabaseClient) throw new Error("Supabase não disponível");

    // 1. Atualizar registro pai
    const { error: errorPai } = await supabaseClient.from('doacoes').update(dadosPai).eq('id_doacao', idDoacao);
    if (errorPai) throw errorPai;

    // 2. Processar financeiro
    if (editHasFin) {
        const originallyHadFin = originalDoacao && originalDoacao.doacoes_financeiras && originalDoacao.doacoes_financeiras.length > 0;
        if (originallyHadFin) {
            const { error: errFin } = await supabaseClient.from('doacoes_financeiras').update(dadosFin).eq('id_doacao', idDoacao);
            if (errFin) throw errFin;
        } else {
            const { error: errFin } = await supabaseClient.from('doacoes_financeiras').insert([dadosFin]);
            if (errFin) throw errFin;
        }
    } else {
        await supabaseClient.from('doacoes_financeiras').delete().eq('id_doacao', idDoacao);
    }

    // 3. Processar material
    if (editHasMat) {
        const originallyHadMat = originalDoacao && originalDoacao.doacoes_materiais && originalDoacao.doacoes_materiais.length > 0;
        if (originallyHadMat) {
            const { error: errMat } = await supabaseClient.from('doacoes_materiais').update(dadosMat).eq('id_doacao', idDoacao);
            if (errMat) throw errMat;
        } else {
            const { error: errMat } = await supabaseClient.from('doacoes_materiais').insert([dadosMat]);
            if (errMat) throw errMat;
        }
    } else {
        await supabaseClient.from('doacoes_materiais').delete().eq('id_doacao', idDoacao);
    }

    return true;
}
