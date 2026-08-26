// Configuração e Inicialização do Cliente Supabase
export const SUPABASE_URL = "https://bevvvsghutwpnexuczda.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_CaMU6q53y-n9p0PXW4F1Ow_bgYrD9Mm";

// Utiliza o objeto global window.supabase exposto pela CDN do SDK Supabase
export const supabaseClient = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;
