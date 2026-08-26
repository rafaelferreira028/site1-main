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

window.formatarCPF = formatarCPF;
window.formatarCNPJ = formatarCNPJ;
window.formatarDocumento = formatarDocumento;
window.formatarTelefone = formatarTelefone;
window.formatarMoeda = formatarMoeda;
window.formatarDataBR = formatarDataBR;
window.limitarAnoDataInput = limitarAnoDataInput;
