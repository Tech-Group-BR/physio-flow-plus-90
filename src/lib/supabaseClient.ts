// Em src/lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js'

// Pega a URL do seu arquivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

// Pega a Chave Pública do seu arquivo .env com o nome que você definiu
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Adiciona uma verificação para garantir que as variáveis foram carregadas
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("As variáveis de ambiente do Supabase (URL e Chave) não foram encontradas. Verifique seu arquivo .env.");
}

// Cria e exporta o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)