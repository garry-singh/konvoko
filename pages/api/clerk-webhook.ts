import type { NextApiRequest, NextApiResponse } from "next";
import type { Readable } from "stream";
import { Webhook } from "svix";

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!;

// Svix webhook IP ranges (as of 2025)
const SVIX_IP_RANGES = [
  {
    "us": [
      "44.228.126.217",
      "50.112.21.217",
      "52.24.126.164",
      "54.148.139.208",
      "2600:1f24:64:8000::/56"
    ],
    "us-east": [
      "54.164.207.221",
      "54.90.7.123",
      "2600:1f28:37:4000::/56"
    ],
    "eu": [
      "52.215.16.239",
      "54.216.8.72",
      "63.33.109.123",
      "2a05:d028:17:8000::/56"
    ],
    "in": [
      "13.126.41.108",
      "15.207.218.84",
      "65.2.133.31"
    ],
    "au": [ 
      "13.239.204.236",
      "54.66.246.217",
      "54.252.65.96",
      "2406:da2c:13:4000::/56"
    ],
    "ca": [ 
      "52.60.44.49",
      "3.98.68.230",
      "3.96.105.27",
      "2600:1f21:1c:4000::/56"
    ]
  }
];

// Flatten the IP ranges for easier checking
const FLATTENED_SVIX_IPS = Object.values(SVIX_IP_RANGES[0]).flat();

// Helper function to check if IP is in Svix ranges
function isSvixIP(ip: string): boolean {
  // Remove port if present
  const cleanIP = ip.split(':')[0];
  
  // Check against known Svix IPs
  return FLATTENED_SVIX_IPS.includes(cleanIP);
}

// Helper function to get client IP
function getClientIP(req: NextApiRequest): string {
  // Check various headers for the real IP
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const cfConnectingIP = req.headers['cf-connecting-ip'];
  
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  
  if (typeof realIP === 'string') {
    return realIP;
  }
  
  if (typeof cfConnectingIP === 'string') {
    return cfConnectingIP;
  }
  
  // Fallback to connection remote address
  return req.socket.remoteAddress || 'unknown';
}

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

// TODO: Replace with Convex functions when backend is migrated
async function upsertUserProfile(user: ClerkUserObject) {
  console.log("TODO: Implement user profile upsert with Convex for user:", user.id);
  // This will be replaced with Convex mutation
}

async function deleteUserProfile(userId: string) {
  console.log("TODO: Implement user profile deletion with Convex for user:", userId);
  // This will be replaced with Convex mutation
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("Webhook received:", req.method, req.url);
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Validate IP address
  const clientIP = getClientIP(req);
  console.log("Client IP:", clientIP);
  
  if (!isSvixIP(clientIP)) {
    console.error("Request rejected: IP not in Svix range:", clientIP);
    return res.status(403).json({ error: "Forbidden: Invalid IP address" });
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
    console.log("Processing user event:", { userId: user.id, eventType: event.type });

    try {
      await upsertUserProfile(user);
      console.log("User profile upserted successfully");
    } catch (error) {
      console.error("Error upserting user profile:", error);
      return res.status(500).json({ error: "Database error" });
    }
  } else if (event.type === "user.deleted") {
    console.log("Processing user deletion:", event.data.id);
    
    try {
      await deleteUserProfile(event.data.id);
      console.log("User profile deleted successfully");
    } catch (error) {
      console.error("Error deleting user profile:", error);
      return res.status(500).json({ error: "Database error" });
    }
  } else {
    console.warn("Unhandled event type:", event.type);
  }

  return res.status(200).json({ received: true });
}