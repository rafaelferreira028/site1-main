// Configuração e Inicialização do Cliente Supabase
// Permite injeção de credenciais rotacionadas via window.__ENV__
const SUPABASE_URL = (window.__ENV__ && window.__ENV__.SUPABASE_URL) || "https://bevvvsghutwpnexuczda.supabase.co";
const SUPABASE_ANON_KEY = (window.__ENV__ && window.__ENV__.SUPABASE_ANON_KEY) || "sb_publishable_CaMU6q53y-n9p0PXW4F1Ow_bgYrD9Mm";

window.supabaseClient = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

