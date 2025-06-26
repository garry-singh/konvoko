import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { Webhook } from "svix";
import type { Readable } from "stream";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!;

export const config = {
  api: {
    bodyParser: false, // We need the raw body for signature verification
  },
};

function buffer(readable: Readable) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    readable.on("data", (chunk: Buffer) => chunks.push(chunk));
    readable.on("end", () => resolve(Buffer.concat(chunks)));
    readable.on("error", reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  // 1. Get the raw body
  const buf = await buffer(req);
  const payload = buf.toString("utf8");

  // 2. Get headers
  const svixId = req.headers["svix-id"] as string;
  const svixTimestamp = req.headers["svix-timestamp"] as string;
  const svixSignature = req.headers["svix-signature"] as string;

  // 3. Verify signature
  const wh = new Webhook(WEBHOOK_SECRET);
  let event: Record<string, unknown>;
  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as Record<string, unknown>;
  } catch {
    return res.status(400).json({ error: "Invalid signature" });
  }

  // 4. Now handle the event as before
  if (event.type === "user.created" || event.type === "user.updated") {
    const user = event.data as Record<string, unknown>;
    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: [user.first_name, user.last_name].filter(Boolean).join(" "),
      avatar_url: user.image_url,
      username: user.username,
    });
  }

  if (event.type === "user.deleted") {
    const user = event.data as Record<string, unknown>;
    await supabase.from("profiles").delete().eq("id", user.id);
    // Optionally, you can also delete or anonymize related data in other tables
  }

  res.status(200).json({ received: true });
} 