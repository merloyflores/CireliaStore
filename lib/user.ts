import { supabase } from './supabase';

export async function getCurrentUserProfile() {
  // 1. Obtener la sesión activa desde la autenticación de Supabase (Google)
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session) {
    return null; // No hay usuario logeado
  }

  const userAuth = session.user;

  // 2. Buscar el perfil extendido en tu tabla 'users' usando el ID de la autenticación
  const { data: profile, error: dbError } = await supabase
    .from('users') // Asegúrate de si es 'users' o 'user'
    .select('*')
    .eq('id', userAuth.id)
    .single();

  if (dbError) {
    console.error('Error al obtener perfil de la base de datos:', dbError);
    // Si no existe en tu tabla aún, podemos usar los datos por defecto que vienen de Google
    return {
      id: userAuth.id,
      name: userAuth.user_metadata.full_name || 'Usuario',
      avatar_url: userAuth.user_metadata.avatar_url || ''
    };
  }

  return profile;
}