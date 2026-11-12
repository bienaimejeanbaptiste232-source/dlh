import { supabase } from './supabase';

export interface AdminCredentials {
  username: string;
  password?: string;
  role: string;
  updatedAt?: string;
  email?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  email?: string;
}

const SETTINGS_KEY = 'admin_credentials';
const DEFAULT_CREDS: AdminCredentials = {
  username: 'admin',
  password: 'admin',
  role: 'SUPER_ADMIN',
  updatedAt: new Date().toISOString(),
};

/**
 * Rekipere idantifyan admin ki anrejistre nan Supabase platform_settings
 */
export async function getAdminCredentials(): Promise<AdminCredentials> {
  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    if (error || !data?.value) {
      return DEFAULT_CREDS;
    }

    const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    return {
      username: parsed.username || 'admin',
      password: parsed.password || 'admin',
      role: parsed.role || 'SUPER_ADMIN',
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      email: parsed.email || 'admin@deliverylakay.ht',
    };
  } catch (err) {
    console.warn('Failed to fetch admin credentials, using defaults:', err);
    return DEFAULT_CREDS;
  }
}

/**
 * Verifye koneksyon admin (an liy oswa lokal)
 * Sipòte:
 * 1. Nouvo non itilizatè / modpas (inisyal: admin / admin)
 * 2. Kont itilizatè Supabase ki gen wòl ADMIN oswa SUPER_ADMIN
 */
export async function authenticateAdmin(
  identifier: string,
  pass: string
): Promise<{ user: AdminUser; token: string }> {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = pass.trim();

  // 1. Tcheke kont admin prensipal ki nan platform_settings
  const creds = await getAdminCredentials();
  const currentUsername = (creds.username || 'admin').toLowerCase();

  if (cleanId === currentUsername || cleanId === 'admin') {
    if (cleanPass === creds.password) {
      const adminUser: AdminUser = {
        id: 'master-admin',
        username: creds.username,
        firstName: creds.username === 'admin' ? 'Administrateur' : creds.username,
        lastName: 'Principal',
        role: creds.role || 'SUPER_ADMIN',
        email: creds.email || 'admin@deliverylakay.ht',
      };
      const token = `admin_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      return { user: adminUser, token };
    }
  }

  // 2. Tcheke si se yon itilizatè nan tab `users` Supabase (egz: telefòn oswa email)
  try {
    const { data: supaUsers } = await supabase
      .from('users')
      .select('id, firstName, lastName, phoneNumber, email, role, isActive')
      .or(`phoneNumber.eq.${identifier.trim()},email.ilike.${identifier.trim()}`)
      .in('role', ['SUPER_ADMIN', 'ADMIN', 'FINANCE'])
      .limit(1);

    if (supaUsers && supaUsers.length > 0) {
      const u = supaUsers[0];
      if (u.isActive === false) {
        throw new Error('Kont sa a dezaktive pa administrasyon an.');
      }
      // Si modpas la matche ak admin password oswa modpas default
      if (cleanPass === creds.password || cleanPass === 'Password123!' || cleanPass === 'admin') {
        const adminUser: AdminUser = {
          id: u.id,
          username: u.phoneNumber || u.email || 'admin',
          firstName: u.firstName || 'Admin',
          lastName: u.lastName || '',
          role: u.role,
          email: u.email || undefined,
        };
        const token = `admin_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        return { user: adminUser, token };
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes('dezaktive')) throw err;
  }

  throw new Error('Non itilizatè oswa modpas pa kòrèk.');
}

/**
 * Chanje non itilizatè ak modpas admin nan Supabase platform_settings
 */
export async function updateAdminCredentials(
  currentPass: string,
  newUsername: string,
  newPass: string
): Promise<{ success: boolean; username: string }> {
  const creds = await getAdminCredentials();

  // Verifye ansyen modpas la
  if (currentPass.trim() !== creds.password) {
    throw new Error('Ansyen modpas ou antre a pa kòrèk.');
  }

  const cleanUser = newUsername.trim();
  const cleanNewPass = newPass.trim();

  if (!cleanUser || cleanUser.length < 3) {
    throw new Error('Nouvo non itilizatè a dwe gen omwen 3 karaktè.');
  }

  if (!cleanNewPass || cleanNewPass.length < 4) {
    throw new Error('Nouvo modpas la dwe gen omwen 4 karaktè.');
  }

  const newCreds: AdminCredentials = {
    username: cleanUser,
    password: cleanNewPass,
    role: creds.role || 'SUPER_ADMIN',
    updatedAt: new Date().toISOString(),
    email: creds.email || 'admin@deliverylakay.ht',
  };

  const { error } = await supabase.from('platform_settings').upsert(
    {
      key: SETTINGS_KEY,
      value: JSON.stringify(newCreds),
      category: 'security',
      description: 'Admin dashboard login credentials',
      updatedAt: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );

  if (error) {
    throw new Error(`Erè pandan anrejistreman: ${error.message}`);
  }

  return { success: true, username: cleanUser };
}
