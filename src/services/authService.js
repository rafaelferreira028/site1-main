import { supabaseClient } from '../config/supabaseClient.js';

export async function verificarSessaoSupabase() {
    if (!supabaseClient) return { session: null };
    const { data: { session } } = await supabaseClient.auth.getSession();
    return { session };
}

export async function realizarLoginSupabase(email, password) {
    if (!supabaseClient) throw new Error("Supabase não configurado");
    return await supabaseClient.auth.signInWithPassword({
        email,
        password
    });
}

export async function realizarLogoutSupabase() {
    if (!supabaseClient) return;
    return await supabaseClient.auth.signOut();
}
