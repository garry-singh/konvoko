import { Webhook } from "svix";
import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!;

// Define the shape of Clerk user
type ClerkUser = {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
};

// Define shape of event payload
type ClerkWebhookEvent = {
  type: "user.created" | "user.updated" | "user.deleted";
  data: {
    object: ClerkUser;
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payloadBuffer = await req.arrayBuffer();
  const payloadString = Buffer.from(payloadBuffer).toString("utf8");

  let event: ClerkWebhookEvent;

  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    event = wh.verify(payloadString, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const user = event.data.object;

  switch (event.type) {
    case "user.created":
    case "user.updated":
      await supabase.from("profiles").upsert({
        id: user.id,
        full_name: [user.first_name, user.last_name].filter(Boolean).join(" "),
        avatar_url: user.avatar_url ?? null,
        username: user.username ?? null,
        email: user.email ?? null,
        first_name: user.first_name ?? null,
        last_name: user.last_name ?? null,
      });
      break;

    case "user.deleted":
      await supabase.from("profiles").delete().eq("id", user.id);
      break;

    default:
      console.warn("Unhandled webhook type:", event.type);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}