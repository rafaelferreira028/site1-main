// Utilitários de Formatação e Máscaras de Dados

function formatarCPF(val) {
    if (!val) return "";
    val = val.replace(/\D/g, "").slice(0, 11);
    return val
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function formatarCNPJ(val) {
    if (!val) return "";
    val = val.replace(/\D/g, "").slice(0, 14);
    return val
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatarDocumento(val, tipo) {
    if (!val) return "";
    if (tipo === 'PF') {
        return formatarCPF(val);
    } else if (tipo === 'PJ') {
        return formatarCNPJ(val);
    } else {
        const clean = val.replace(/\D/g, "");
        if (clean.length > 11) {
            return formatarCNPJ(clean);
        } else {
            return formatarCPF(clean);
        }
    }
}

function formatarTelefone(val) {
    if (!val) return "";
    val = val.replace(/\D/g, "").slice(0, 11);
    if (val.length > 10) {
        return val
            .replace(/^(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{5})(\d)/, "$1-$2");
    } else {
        return val
            .replace(/^(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{4})(\d)/, "$1-$2");
    }
}

function formatarMoeda(valor) {
    const num = parseFloat(valor || 0);
    return 'R$ ' + num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatarDataBR(dataIso) {
    if (!dataIso) return '-';
    const partes = dataIso.split('-');
    if (partes.length === 3) {
        const ano = partes[0].slice(0, 4);
        const mes = partes[1].padStart(2, '0');
        const dia = partes[2].padStart(2, '0');
        return `${dia}/${mes}/${ano}`;
    }
    return dataIso;
}

function limitarAnoDataInput(input) {
    if (!input || !input.value) return;
    const partes = input.value.split('-');
    if (partes[0] && partes[0].length > 4) {
        partes[0] = partes[0].slice(0, 4);
        input.value = partes.join('-');
    }
}

function formatarCEP(val) {
    if (!val) return "";
    const v = val.replace(/\D/g, "").slice(0, 8);
    if (v.length > 5) {
        return `${v.slice(0, 5)}-${v.slice(5)}`;
    }
    return v;
}

async function consultarCEP(cep) {
    if (!cep) return null;
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return null;

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        if (!response.ok) return { error: 'Não foi possível consultar o CEP.' };
        const data = await response.json();
        if (data.erro) {
            return { error: 'CEP não encontrado.' };
        }
        
        const partesLogradouro = [data.logradouro, data.bairro].filter(Boolean);
        const endereco = partesLogradouro.join(', ');
        const cidadeUf = data.localidade && data.uf ? `${data.localidade} - ${data.uf}` : (data.localidade || '');

        return {
            logradouro: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            uf: data.uf || '',
            endereco: endereco,
            cidadeUf: cidadeUf
        };
    } catch (err) {
        return { error: 'Erro ao buscar CEP. Verifique a conexão com a internet.' };
    }
}

window.formatarCPF = formatarCPF;
window.formatarCNPJ = formatarCNPJ;
window.formatarDocumento = formatarDocumento;
window.formatarTelefone = formatarTelefone;
window.formatarMoeda = formatarMoeda;
window.formatarDataBR = formatarDataBR;
window.limitarAnoDataInput = limitarAnoDataInput;
window.formatarCEP = formatarCEP;
window.consultarCEP = consultarCEP;
