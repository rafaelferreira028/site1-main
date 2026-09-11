// Serviço de Autenticação com suporte a E-mail, ID Personalizado e Supabase Auth
const STORAGE_USERS_KEY = 'rede_usuarios_sistema';
const STORAGE_SESSION_KEY = 'rede_sessao_ativa';

function getUsuariosLocais() {
    try {
        const raw = localStorage.getItem(STORAGE_USERS_KEY);
        if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list) && list.length > 0) return list;
        }
    } catch (e) {
        console.error("Erro ao ler usuários locais:", e);
    }
    // Conta administrativa padrão inicial
    const padrao = [{
        id: 'usr_admin',
        identificador: 'admin',
        nome: 'Administrador',
        tipo: 'id',
        senha: 'admin',
        criadoEm: new Date().toISOString()
    }];
    try {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(padrao));
    } catch (e) {}
    return padrao;
}

function salvarUsuariosLocais(usuarios) {
    try {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(usuarios));
    } catch (e) {
        console.error("Erro ao salvar usuários locais:", e);
    }
}

async function cadastrarNovoUsuario({ identificador, senha, nome, tipo }) {
    if (!identificador || !identificador.trim()) {
        throw new Error("Por favor, preencha o E-mail ou ID de Acesso desejado.");
    }
    if (!senha || senha.length < 3) {
        throw new Error("A senha deve conter no mínimo 3 caracteres.");
    }

    const idLimpo = identificador.trim();
    const isEmail = idLimpo.includes('@');
    const tipoFinal = tipo || (isEmail ? 'email' : 'id');

    if (tipoFinal === 'email' && !idLimpo.includes('.')) {
        throw new Error("Por favor, digite um endereço de e-mail válido.");
    }

    const usuarios = getUsuariosLocais();
    const jaExiste = usuarios.some(u => u.identificador.toLowerCase() === idLimpo.toLowerCase());
    if (jaExiste) {
        throw new Error(`O ${tipoFinal === 'email' ? 'e-mail' : 'ID'} "${idLimpo}" já está cadastrado. Escolha outro ou faça login.`);
    }

    const novo = {
        id: 'usr_' + Date.now(),
        identificador: idLimpo,
        nome: (nome && nome.trim()) ? nome.trim() : idLimpo,
        tipo: tipoFinal,
        senha: senha,
        criadoEm: new Date().toISOString()
    };

    usuarios.push(novo);
    salvarUsuariosLocais(usuarios);

    // Se for e-mail e Supabase estiver conectado, tenta registrar em segundo plano
    if (isEmail && window.supabaseClient) {
        try {
            await window.supabaseClient.auth.signUp({
                email: idLimpo,
                password: senha,
                options: { data: { name: novo.nome } }
            });
        } catch (e) {
            console.warn("Aviso ao registrar usuário no Supabase Auth:", e);
        }
    }

    return { success: true, usuario: novo };
}

async function realizarLoginFlexivel(identificadorOuEmail, password) {
    const termo = (identificadorOuEmail || '').trim();
    if (!termo) throw new Error("Informe o E-mail ou ID de Acesso.");
    if (!password) throw new Error("Informe a senha de acesso.");

    // 1. Tenta autenticar pelo repositório local (aceita ID ou E-mail cadastrados)
    const usuarios = getUsuariosLocais();
    const usuarioLocal = usuarios.find(u => u.identificador.toLowerCase() === termo.toLowerCase());

    if (usuarioLocal) {
        if (usuarioLocal.senha === password) {
            const sessaoLocal = {
                user: {
                    id: usuarioLocal.id,
                    email: usuarioLocal.tipo === 'email' ? usuarioLocal.identificador : `${usuarioLocal.identificador}@local.auth`,
                    identificador: usuarioLocal.identificador,
                    user_metadata: { name: usuarioLocal.nome, tipo: usuarioLocal.tipo }
                },
                tipo: 'local'
            };
            try {
                localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(sessaoLocal));
            } catch (e) {}
            return { data: { session: sessaoLocal, user: sessaoLocal.user }, error: null };
        } else {
            throw new Error("Senha incorreta. Verifique e tente novamente.");
        }
    }

    // 2. Se não encontrou nas contas locais e Supabase estiver ativo, tenta autenticar no Supabase
    if (window.supabaseClient) {
        const emailSupabase = termo.includes('@') ? termo : `${termo.toLowerCase()}@rede.org.br`;
        try {
            const res = await window.supabaseClient.auth.signInWithPassword({
                email: emailSupabase,
                password: password
            });
            if (res.data && res.data.session) {
                return res;
            }
            if (res.error && termo.includes('@')) {
                throw res.error;
            }
        } catch (err) {
            if (termo.includes('@')) {
                throw err;
            }
        }
    }

    throw new Error(`O login "${termo}" não foi encontrado. Crie seu acesso na opção "Criar Novo Login".`);
}

async function verificarSessaoSupabase() {
    // 1. Verifica sessão no Supabase
    if (window.supabaseClient) {
        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (session) return { session, user: session.user };
        } catch (e) {
            console.error("Erro sessão Supabase:", e);
        }
    }
    // 2. Verifica sessão local persistida
    try {
        const raw = localStorage.getItem(STORAGE_SESSION_KEY);
        if (raw) {
            const sessao = JSON.parse(raw);
            return { session: sessao, user: sessao.user };
        }
    } catch (e) {}

    return { session: null, user: null };
}

async function realizarLogoutSupabase() {
    try {
        localStorage.removeItem(STORAGE_SESSION_KEY);
    } catch (e) {}
    if (window.supabaseClient) {
        try {
            await window.supabaseClient.auth.signOut();
        } catch (e) {}
    }
    return { success: true };
}

window.authService = {
    verificarSessaoSupabase,
    realizarLoginSupabase: realizarLoginFlexivel,
    realizarLogoutSupabase,
    cadastrarNovoUsuario,
    getUsuariosLocais
};
