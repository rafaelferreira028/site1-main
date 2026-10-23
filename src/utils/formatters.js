// Utilitários de Formatação e Máscaras de Dados

function formatarCPF(val) {
    if (val === null || val === undefined || val === '') return "";
    const str = String(val).replace(/\D/g, "").slice(0, 11);
    return str
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function formatarCNPJ(val) {
    if (val === null || val === undefined || val === '') return "";
    const str = String(val).replace(/\D/g, "").slice(0, 14);
    return str
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatarDocumento(val, tipo) {
    if (val === null || val === undefined || val === '') return "";
    const clean = String(val).replace(/\D/g, "");
    if (tipo === 'PF') {
        return formatarCPF(clean);
    } else if (tipo === 'PJ') {
        return formatarCNPJ(clean);
    } else {
        if (clean.length > 11) {
            return formatarCNPJ(clean);
        } else {
            return formatarCPF(clean);
        }
    }
}

function formatarTelefone(val) {
    if (val === null || val === undefined || val === '') return "";
    const str = String(val).replace(/\D/g, "").slice(0, 11);
    if (str.length > 10) {
        return str
            .replace(/^(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{5})(\d)/, "$1-$2");
    } else {
        return str
            .replace(/^(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{4})(\d)/, "$1-$2");
    }
}

function sanitizarValorMonetario(val) {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;

    let str = String(val).trim();
    // Remove pontuação de milhar se houver vírgula como separador decimal
    if (str.includes(',') && str.includes('.')) {
        str = str.replace(/\./g, '').replace(',', '.');
    } else if (str.includes(',')) {
        str = str.replace(',', '.');
    }

    const num = parseFloat(str);
    return isNaN(num) || num < 0 ? 0 : Number(num.toFixed(2));
}

function parseDataSeguraBR(dataIso) {
    if (!dataIso) return '-';
    const partes = String(dataIso).split('T')[0].split('-');
    if (partes.length === 3) {
        const ano = partes[0].slice(0, 4);
        const mes = partes[1].padStart(2, '0');
        const dia = partes[2].padStart(2, '0');
        return `${dia}/${mes}/${ano}`;
    }
    return String(dataIso);
}

function formatarMoeda(valor) {
    const num = sanitizarValorMonetario(valor);
    return 'R$ ' + num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatarDataBR(dataIso) {
    return parseDataSeguraBR(dataIso);
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
    if (val === null || val === undefined || val === '') return "";
    const v = String(val).replace(/\D/g, "").slice(0, 8);
    if (v.length > 5) {
        return `${v.slice(0, 5)}-${v.slice(5)}`;
    }
    return v;
}

async function consultarCEP(cep) {
    if (!cep) return null;
    const cepLimpo = String(cep).replace(/\D/g, '');
    if (cepLimpo.length !== 8) return null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

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
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            return { error: 'Tempo limite ao consultar CEP. Preencha manualmente.' };
        }
        return { error: 'Erro ao buscar CEP. Verifique a conexão com a internet.' };
    }
}

// Utilitários de Mascaramento para Proteção de Dados Pessoais (LGPD / AppSec MED-01)
function mascararDocumento(val, tipo) {
    if (val === null || val === undefined || val === '') return "";
    const clean = String(val).replace(/\D/g, "");
    if (tipo === 'PF' || clean.length <= 11) {
        const cpf = formatarCPF(clean);
        return cpf.replace(/^(\d{3})\.(\d{3})\.(\d{3})-(\d{2})$/, "$1.***.***-$2");
    } else {
        const cnpj = formatarCNPJ(clean);
        return cnpj.replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})-(\d{2})$/, "$1.***.***/$4-$2");
    }
}

function mascararTelefone(val) {
    if (val === null || val === undefined || val === '') return "";
    const tel = formatarTelefone(val);
    // Mascara o meio do telefone: (11) 98765-4321 -> (11) 9****-4321
    return tel.replace(/^(\(\d{2}\)\s*\d)(\d{3,4})(-\d{4})$/, (match, p1, p2, p3) => {
        return `${p1}${'*'.repeat(p2.length)}${p3}`;
    });
}

function mascararEmail(email) {
    if (!email || !email.includes('@')) return email || '';
    const [user, domain] = email.split('@');
    if (user.length <= 2) return `${user[0]}*@${domain}`;
    return `${user.slice(0, 2)}${'*'.repeat(Math.max(2, user.length - 2))}@${domain}`;
}

window.formatarCPF = formatarCPF;
window.formatarCNPJ = formatarCNPJ;
window.formatarDocumento = formatarDocumento;
window.formatarTelefone = formatarTelefone;
window.formatarMoeda = formatarMoeda;
window.sanitizarValorMonetario = sanitizarValorMonetario;
window.parseDataSeguraBR = parseDataSeguraBR;
window.formatarDataBR = formatarDataBR;
window.limitarAnoDataInput = limitarAnoDataInput;
window.formatarCEP = formatarCEP;
window.consultarCEP = consultarCEP;
window.mascararDocumento = mascararDocumento;
window.mascararTelefone = mascararTelefone;
window.mascararEmail = mascararEmail;
