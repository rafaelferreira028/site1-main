// Serviço de Autenticação com suporte a E-mail, ID Personalizado e Supabase Auth
// Implementação Segura com Hash SHA-256 Salted (Web Crypto API) e TTL de Sessão
const STORAGE_USERS_KEY = 'rede_usuarios_sistema';
const STORAGE_SESSION_KEY = 'rede_sessao_ativa';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 horas

/**
 * Gera hash SHA-256 com salt criptográfico usando a Web Crypto API nativa
 */
async function hashSenha(senha, salt = null) {
    if (!salt) {
        const saltBytes = new Uint8Array(16);
        if (window.crypto && window.crypto.getRandomValues) {
            window.crypto.getRandomValues(saltBytes);
        } else {
            for (let i = 0; i < 16; i++) saltBytes[i] = Math.floor(Math.random() * 256);
        }
        salt = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    const enc = new TextEncoder();
    const data = enc.encode(salt + ":" + senha);
    const hashBuf = await window.crypto.subtle.digest('SHA-256', data);
    const hashArr = Array.from(new Uint8Array(hashBuf));
    const hashHex = hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
    return `${salt}:${hashHex}`;
}

/**
 * Compara a senha informada com o hash armazenado (com retrocompatibilidade para migração automática)
 */
async function verificarSenha(senhaDigitada, hashArmazenado) {
    if (!senhaDigitada || !hashArmazenado) return false;
    // Suporte a migração automática para senhas legadas em texto plano
    if (!hashArmazenado.includes(':')) {
        return hashArmazenado === senhaDigitada;
    }
    const [salt, hashOriginal] = hashArmazenado.split(':');
    const hashGeradoCompleto = await hashSenha(senhaDigitada, salt);
    const [, hashGerado] = hashGeradoCompleto.split(':');
    return hashOriginal === hashGerado;
}

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
    // Conta administrativa padrão inicial protegida com hash salted SHA-256 (senha inicial: 'admin')
    const padrao = [{
        id: 'usr_admin',
        identificador: 'admin',
        nome: 'Administrador',
        tipo: 'id',
        senha: 'a8f5c9e2b1d40376:bfdfdefeddb11aa609173c6a3407dba48bd77ba97c6482db5ab859551bc5c790',
        criadoEm: new Date().toISOString()
    }];
    try {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(padrao));
    } catch (e) {
        console.warn("[Auth] Não foi possível persistir usuário inicial no storage:", e);
    }
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
    if (!senha || senha.length < 8) {
        throw new Error("A senha deve conter no mínimo 8 caracteres.");
    }
    const temLetra = /[a-zA-Z]/.test(senha);
    const temNumero = /\d/.test(senha);
    if (!temLetra || !temNumero) {
        throw new Error("A senha deve conter letras e números para maior segurança.");
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

    // Hash criptográfico da senha antes do armazenamento
    const senhaHash = await hashSenha(senha);

    const novoId = (window.crypto && window.crypto.randomUUID)
        ? 'usr_' + window.crypto.randomUUID()
        : 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

    const novo = {
        id: novoId,
        identificador: idLimpo,
        nome: (nome && nome.trim()) ? nome.trim() : idLimpo,
        tipo: tipoFinal,
        senha: senhaHash,
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

    // Não retornar a senha no objeto de resposta
    const { senha: _, ...usuarioSemSenha } = novo;
    return { success: true, usuario: usuarioSemSenha };
}

async function realizarLoginFlexivel(identificadorOuEmail, password) {
    const termo = (identificadorOuEmail || '').trim();
    if (!termo) throw new Error("Informe o E-mail ou ID de Acesso.");
    if (!password) throw new Error("Informe a senha de acesso.");

    // 1. Tenta autenticar pelo repositório local (aceita ID ou E-mail cadastrados)
    const usuarios = getUsuariosLocais();
    const usuarioLocal = usuarios.find(u => u.identificador.toLowerCase() === termo.toLowerCase());

    if (usuarioLocal) {
        const senhaCorreta = await verificarSenha(password, usuarioLocal.senha);
        if (senhaCorreta) {
            // Migração automática transparente: se a senha ainda estiver em texto plano, atualiza para hash
            if (!usuarioLocal.senha.includes(':')) {
                usuarioLocal.senha = await hashSenha(password);
                salvarUsuariosLocais(usuarios);
            }

            const agora = Date.now();
            const sessaoLocal = {
                user: {
                    id: usuarioLocal.id,
                    email: usuarioLocal.tipo === 'email' ? usuarioLocal.identificador : `${usuarioLocal.identificador}@local.auth`,
                    identificador: usuarioLocal.identificador,
                    user_metadata: { name: usuarioLocal.nome, tipo: usuarioLocal.tipo }
                },
                tipo: 'local',
                criadoEm: agora,
                expiresAt: agora + SESSION_TTL_MS // Expiração após 8 horas
            };
            try {
                localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(sessaoLocal));
            } catch (e) {
                console.error("[Auth] Falha ao persistir sessão local:", e);
                if (e.name === 'QuotaExceededError') {
                    throw new Error("Armazenamento do navegador cheio. Limpe o histórico do navegador para fazer login.");
                }
            }
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
    if (window.supabaseClient && window.supabaseClient.auth) {
        try {
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            if (!error && session && session.user) {
                return { session, user: session.user };
            }
        } catch (e) {
            console.warn("Aviso ao conectar com Supabase Auth:", e);
        }
    }

    // 2. Verifica sessão local persistida (com validação estrita de schema e expiração TTL)
    try {
        const raw = localStorage.getItem(STORAGE_SESSION_KEY);
        if (!raw) return { session: null, user: null };

        const sessao = JSON.parse(raw);
        const isSessaoValida = sessao &&
            typeof sessao === 'object' &&
            sessao.user &&
            typeof sessao.user === 'object' &&
            typeof sessao.expiresAt === 'number';

        if (!isSessaoValida || Date.now() > sessao.expiresAt) {
            localStorage.removeItem(STORAGE_SESSION_KEY);
            return { session: null, user: null };
        }

        return { session: sessao, user: sessao.user };
    } catch (e) {
        console.error("Payload corrompido de sessão local, limpando:", e);
        try { localStorage.removeItem(STORAGE_SESSION_KEY); } catch (_) {}
    }

    return { session: null, user: null };
}

async function realizarLogoutSupabase() {
    try {
        localStorage.removeItem(STORAGE_SESSION_KEY);
    } catch (e) {
        console.error("Erro ao remover chave de sessão local:", e);
    }
    if (window.supabaseClient && window.supabaseClient.auth) {
        try {
            await window.supabaseClient.auth.signOut();
        } catch (e) {
            console.warn("Aviso ao efetuar signOut no Supabase:", e);
        }
    }
    return { success: true };
}

// Interface pública: getUsuariosLocais REMOVIDO para evitar extração de credenciais (CRIT-04)
window.authService = {
    verificarSessaoSupabase,
    realizarLoginSupabase: realizarLoginFlexivel,
    realizarLogoutSupabase,
    cadastrarNovoUsuario
};
