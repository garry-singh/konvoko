import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const event = req.body;

  if (event.type === "user.created" || event.type === "user.updated") {
    const user = event.data;
    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: [user.first_name, user.last_name].filter(Boolean).join(" "),
      avatar_url: user.image_url,
      username: user.username,
    });
  }

  if (event.type === "user.deleted") {
    const user = event.data;
    await supabase.from("profiles").delete().eq("id", user.id);
    // Optionally, you can also delete or anonymize related data in other tables
  }

  res.status(200).json({ received: true });
} 