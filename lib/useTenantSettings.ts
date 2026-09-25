'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { WhatsAppConfig } from '@/lib/blockBackground';

export type PaymentConfig = { provider?: 'manual' | 'onvopay' };

export type TenantSettings = {
  tenantId: string | null;
  whatsapp_number: string;
  contact_email: string;
  address: string | null;
  business_hours: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  whatsapp_config: WhatsAppConfig;
  payment_config: PaymentConfig;
};

const FALLBACK: TenantSettings = {
  tenantId: null,
  whatsapp_number: '50672961548',
  contact_email: 'info@cireliastore.com',
  address: null,
  business_hours: null,
  instagram_url: null,
  facebook_url: null,
  tiktok_url: null,
  whatsapp_config: {},
  payment_config: {},
};

/**
 * Trae los datos de contacto del tenant (WhatsApp, correo, redes) desde
 * tenant_theme para que ningún componente cliente tenga que llevarlos
 * escritos a mano. Se resuelve por slug porque los componentes cliente
 * no reciben el header x-tenant-slug que arma el proxy para Server
 * Components. Si todavía no cargó o falla, devuelve los valores que
 * la tienda usaba antes de tener esta sección en Configuración.
 */
export function useTenantSettings() {
  const [settings, setSettings] = useState<TenantSettings>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const tenantSlug = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || 'cirelia';
      const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).maybeSingle();
      if (!tenant) {
        if (!cancelled) setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('tenant_theme')
        .select('whatsapp_number, contact_email, address, business_hours, instagram_url, facebook_url, tiktok_url, whatsapp_config, payment_config')
        .eq('tenant_id', tenant.id)
        .maybeSingle();
      if (!cancelled && data) {
        setSettings({
          tenantId: tenant.id,
          whatsapp_number: data.whatsapp_number || FALLBACK.whatsapp_number,
          contact_email: data.contact_email || FALLBACK.contact_email,
          address: data.address,
          business_hours: data.business_hours,
          instagram_url: data.instagram_url,
          facebook_url: data.facebook_url,
          tiktok_url: data.tiktok_url,
          whatsapp_config: (data.whatsapp_config as WhatsAppConfig) ?? {},
          payment_config: (data.payment_config as PaymentConfig) ?? {},
        });
      } else if (!cancelled) {
        setSettings((s) => ({ ...s, tenantId: tenant.id }));
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, loading };
}
