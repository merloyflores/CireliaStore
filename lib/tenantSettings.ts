import { createClient } from '@/lib/supabase/server';

export type TenantSettings = {
  whatsapp_number: string;
  contact_email: string;
  address: string | null;
  business_hours: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
};

const FALLBACK: TenantSettings = {
  whatsapp_number: '50672961548',
  contact_email: 'info@cireliastore.com',
  address: null,
  business_hours: null,
  instagram_url: null,
  facebook_url: null,
  tiktok_url: null,
};

/** Versión Server Component de useTenantSettings: recibe el tenantId ya resuelto. */
export async function getTenantSettings(tenantId: string): Promise<TenantSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('tenant_theme')
    .select('whatsapp_number, contact_email, address, business_hours, instagram_url, facebook_url, tiktok_url')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (!data) return FALLBACK;

  return {
    whatsapp_number: data.whatsapp_number || FALLBACK.whatsapp_number,
    contact_email: data.contact_email || FALLBACK.contact_email,
    address: data.address,
    business_hours: data.business_hours,
    instagram_url: data.instagram_url,
    facebook_url: data.facebook_url,
    tiktok_url: data.tiktok_url,
  };
}
