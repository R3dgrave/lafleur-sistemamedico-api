// src/config/supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: Las variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están configuradas.');
  // En un entorno de producción, podrías querer salir del proceso o manejar el error de otra manera.
}

// Inicializa el cliente de Supabase con la clave de rol de servicio (para operaciones de backend)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
      headers: {
        'Authorization': `Bearer ${customJwt}`,
      },
    },
});

module.exports = supabase;
