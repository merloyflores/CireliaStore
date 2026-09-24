'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

/**
 * Única fuente de sesión del lado del cliente. Reemplaza al provider
 * viejo (que leía supabase.auth desde el singleton de lib/supabase.ts)
 * y a next-auth/react (useSession/signIn/signOut), que ya no se usan en
 * ningún lado. Guarda también el perfil de public.users (role,
 * tenant_id, dni) porque casi toda la UI (Navbar, gating de /admin,
 * onboarding) necesita esos datos, no solo el usuario de Auth.
 */

type Role = 'customer' | 'admin' | 'moderator' | 'super_admin' | 'delivery' | string;

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: Role;
  dni: string | null;
  tenant_id: string | null;
  status: string | null;
  role_id: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isStaff: boolean;
  isPlatformAdmin: boolean;
  // Permisos del rol personalizado (Equipo → Roles personalizados).
  // null cuando profile.role_id es null, que significa "sin rol
  // personalizado" → acceso completo (ver lib/permissions.ts).
  rolePermissions: Record<string, boolean> | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isStaff: false,
  isPlatformAdmin: false,
  rolePermissions: null,
  refreshProfile: async () => {},
});

export default function Providers({ children }: { children: ReactNode }) {
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, boolean> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('id, name, email, image, role, dni, tenant_id, status, role_id')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data ?? null);

    if (data?.role_id) {
      const { data: roleData } = await supabase
        .from('staff_roles')
        .select('permissions')
        .eq('id', data.role_id)
        .maybeSingle();
      setRolePermissions((roleData?.permissions as Record<string, boolean>) ?? null);
    } else {
      setRolePermissions(null);
    }
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  useEffect(() => {
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) await loadProfile(session.user.id);
      setIsLoading(false);
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, currentSession: Session | null) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          await loadProfile(currentSession.user.id);
        } else {
          setProfile(null);
          setRolePermissions(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const role = profile?.role;
  const isStaff = role === 'admin' || role === 'moderator';
  const isPlatformAdmin = role === 'super_admin';

  return (
    <AuthContext.Provider
      value={{ user, session, profile, isLoading, isStaff, isPlatformAdmin, rolePermissions, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
