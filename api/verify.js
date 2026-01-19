import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { licenseKey } = req.body;

    if (!licenseKey) {
      return res.status(400).json({ valid: false, error: 'No license key' });
    }

    const { data, error } = await supabase
      .from('licenses')
      .select('id')
      .eq('license_key', licenseKey)
      .single();

    if (error || !data) {
      return res.status(401).json({ valid: false });
    }

    return res.status(200).json({ valid: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ valid: false });
  }
}
