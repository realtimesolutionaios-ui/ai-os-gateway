const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function setCors(res) {
  // UIドメインを固定したいなら '*' をUIのURLに変更してOK
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
}

module.exports = async function handler(req, res) {
  setCors(res);

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    if (!token) {
      return res.status(401).json({ error: "Missing Bearer token" });
    }

    // ① tokenからユーザー確定（UUID）
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const userId = userData.user.id; // ← これが auth.users.id(UUID) ＝人格主キー

    // ② 入力
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const message = (body?.message || "").trim();
    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    // ③ 履歴保存（user）
    await supabaseAdmin.from("conversations").insert({
      user_id: userId,
      role: "user",
      content: message,
    });

    // ④ Dify呼び出し（あなたのDifyが “Chat App” 前提）
    // Difyの種類が「Workflow」等ならエンドポイントが違うので言って。そこだけ即合わせる。
    const difyBase = process.env.DIFY_BASE_URL;
    const difyKey = process.env.DIFY_API_KEY;

    const difyRes = await fetch(`${difyBase}/v1/chat-messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${difyKey}`,
      },
      body: JSON.stringify({
        inputs: {},             // 必要なら人格状態をここに入れる
        query: message,
        response_mode: "blocking",
        user: userId,           // ← 重要：DifyにUUIDを渡す（従）
      }),
    });

    if (!difyRes.ok) {
      const txt = await difyRes.text();
      return res.status(502).json({ error: "Dify error", detail: txt });
    }

    const difyJson = await difyRes.json();

    // Difyの返答フィールドは設定で多少変わる。代表的なのは answer。
    const answer =
      (difyJson && (difyJson.answer || difyJson.message || difyJson.output_text)) ||
      "（Difyの返答フィールドが取得できませんでした）";

    // ⑤ 履歴保存（ai）
    await supabaseAdmin.from("conversations").insert({
      user_id: userId,
      role: "ai",
      content: answer,
    });

    // ⑥ UIへ返す
    return res.status(200).json({ user_id: userId, answer });
  } catch (e) {
    return res.status(500).json({ error: "Internal error", detail: String(e) });
  }
};
