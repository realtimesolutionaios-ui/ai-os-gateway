import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { licenseKey } = req.body;

    if (!licenseKey) {
      return res.status(400).json({ valid: false });
    }

    const { data, error } = await supabase
      .from('licenses')
      .select('license_key')
      .eq('license_key', licenseKey)
      .maybeSingle();

    if (error) {
      console.error(error);
      return res.status(500).json({ valid: false });
    }

    if (data) {
      return res.status(200).json({ valid: true });
    } else {
      return res.status(401).json({ valid: false });
    }

  } catch (e) {
    console.error(e);
    return res.status(500).json({ valid: false });
  }
}
