import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 🔐 Authorization ヘッダー取得
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token" });
    }

    const token = auth.replace("Bearer ", "");

    // 🔑 Supabase Admin クライアント（検証用）
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 🔍 JWT 検証
    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // 💬 メッセージ取得
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    // 🤖 OpenAI 呼び出し
    const openaiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "あなたはAI-OSです。" },
            { role: "user", content: message }
          ],
        }),
      }
    );

    const json = await openaiRes.json();

    return res.status(200).json({
      answer: json.choices?.[0]?.message?.content ?? "No response",
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({
      error: "Server error",
      detail: e.message,
    });
  }
}
