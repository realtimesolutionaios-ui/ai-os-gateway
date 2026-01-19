import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req, res) {
  // ===== CORS対応 =====
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ===== OPTIONS対応（超重要）=====
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ===== POST以外拒否 =====
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { licenseKey } = req.body || {};

    if (!licenseKey) {
      return res.status(400).json({ valid: false, error: 'No license key' });
    }

    const { data, error } = await supabase
      .from('licenses')
      .select('license_key')
      .eq('license_key', licenseKey)
      .single();

    if (error || !data) {
      return res.status(401).json({ valid: false });
    }

    return res.status(200).json({ valid: true });

  } catch (err) {
    console.error('VERIFY ERROR:', err);
    return res.status(500).json({ valid: false });
  }
}
