import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { licenseKey } = req.body || {};
    if (!licenseKey) {
      return res.status(400).json({ error: 'licenseKey required' });
    }

    const { data, error } = await supabase
      .from('licenses')
      .select('license_key')
      .eq('license_key', licenseKey)
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'DB error' });
    }

    if (!data) {
      return res.status(401).json({ valid: false });
    }

    return res.status(200).json({ valid: true });
  } catch (e) {
    console.error('Fatal error:', e);
    return res.status(500).json({ error: 'Internal error' });
  }
}
