async function verificarSessaoSupabase() {
    if (!window.supabaseClient) return { session: null };
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    return { session };
}

async function realizarLoginSupabase(email, password) {
    if (!window.supabaseClient) throw new Error("Supabase não configurado");
    return await window.supabaseClient.auth.signInWithPassword({
        email,
        password
    });
}

async function realizarLogoutSupabase() {
    if (!window.supabaseClient) return;
    return await window.supabaseClient.auth.signOut();
}

window.authService = {
    verificarSessaoSupabase,
    realizarLoginSupabase,
    realizarLogoutSupabase
};
