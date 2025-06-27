import type { NextApiRequest, NextApiResponse } from "next";
import type { Readable } from "stream";
import { Webhook } from "svix";
import { createClient } from "@supabase/supabase-js";

// Supabase client (using service role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!;

export const config = {
  api: {
    bodyParser: false,
  },
};

// Util: Get raw request body
const getRawBody = async (readable: Readable): Promise<Buffer> => {
  const chunks: Uint8Array[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
};

// Types from Clerk API
type ClerkUserObject = {
  id: string;
  email_addresses: { email_address: string }[];
  username?: string;
  image_url?: string;
  first_name?: string;
  last_name?: string;
};

type ClerkWebhookEvent =
  | {
      type: "user.created" | "user.updated";
      data: ClerkUserObject;
    }
  | {
      type: "user.deleted";
      data: { id: string };
    };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("Webhook received:", req.method, req.url);
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const svixId = req.headers["svix-id"] as string;
  const svixTimestamp = req.headers["svix-timestamp"] as string;
  const svixSignature = req.headers["svix-signature"] as string;

  console.log("Webhook headers:", { svixId, svixTimestamp, svixSignature: svixSignature ? "present" : "missing" });

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("Missing svix headers");
    return res.status(400).json({ error: "Missing svix headers" });
  }

  const payloadBuffer = await getRawBody(req);
  const payloadString = payloadBuffer.toString("utf8");

  console.log("Webhook payload received, length:", payloadString.length);

  let event: ClerkWebhookEvent;

  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    event = wh.verify(payloadString, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
    console.log("Webhook verified successfully, event type:", event.type);
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return res.status(400).json({ error: "Invalid signature" });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const user = event.data;
    const email = user.email_addresses?.[0]?.email_address ?? null;

    console.log("Processing user event:", { userId: user.id, email, eventType: event.type });

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      email,
      username: user.username ?? null,
      avatar_url: user.image_url ?? null,
      first_name: user.first_name ?? null,
      last_name: user.last_name ?? null,
      full_name: [user.first_name, user.last_name].filter(Boolean).join(" "),
    });

    if (error) {
      console.error("Supabase upsert error:", error);
      return res.status(500).json({ error: "Database error" });
    }

    console.log("User profile upserted successfully");
  } else if (event.type === "user.deleted") {
    console.log("Processing user deletion:", event.data.id);
    
    const { error } = await supabase.from("profiles").delete().eq("id", event.data.id);
    
    if (error) {
      console.error("Supabase delete error:", error);
      return res.status(500).json({ error: "Database error" });
    }

    console.log("User profile deleted successfully");
  } else {
    console.warn("Unhandled event type:", event.type);
  }

  return res.status(200).json({ received: true });
}