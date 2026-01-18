import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { license_key } = req.body;

  if (!license_key) {
    return res.status(400).json({ error: 'license_key required' });
  }

  const { data, error } = await supabase
    .from('licenses')
    .select('id, status')
    .eq('license_key', license_key)
    .single();

  if (error || !data) {
    return res.status(401).json({ valid: false });
  }

  if (data.status !== 'active') {
    return res.status(403).json({ valid: false });
  }

  return res.status(200).json({
    valid: true,
    license_id: data.id
  });
}
