"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { createScheduledPost, type ScheduledPostType } from "@/lib/db/social-scheduled";

interface CreatePayload {
  account_id: number;
  type: ScheduledPostType;
  caption: string;
  hashtags: string[];
  media_urls: string[];
  scheduled_at: string;
  cover_url?: string | null;
  location_id?: string | null;
}

const VALID_TYPES: ReadonlySet<ScheduledPostType> = new Set<ScheduledPostType>([
  "feed_image", "feed_video", "reel", "carousel",
  "story_image", "story_video",
  "linkedin_text", "linkedin_image", "linkedin_video",
]);

export async function createScheduledAction(
  input: CreatePayload,
): Promise<{ ok: boolean; id?: number; error?: string }> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "unauthorized" };

  if (!Number.isFinite(input.account_id)) return { ok: false, error: "account_required" };
  if (!VALID_TYPES.has(input.type)) return { ok: false, error: "invalid_type" };
  if (!input.media_urls || input.media_urls.length === 0) {
    if (input.type !== "linkedin_text") {
      return { ok: false, error: "media_required" };
    }
  }
  if (input.type === "carousel" && (input.media_urls.length < 2 || input.media_urls.length > 10)) {
    return { ok: false, error: "carousel_needs_2_to_10_items" };
  }
  const when = new Date(input.scheduled_at);
  if (isNaN(when.getTime())) return { ok: false, error: "invalid_scheduled_at" };
  // Permite agendar até 1 minuto no passado (gracioso para "publicar agora")
  if (when.getTime() < Date.now() - 60_000) {
    return { ok: false, error: "scheduled_in_past" };
  }

  const id = createScheduledPost({
    account_id: input.account_id,
    type: input.type,
    caption: input.caption?.slice(0, 2200) || null, // limite IG = 2200 chars
    hashtags: input.hashtags?.filter(Boolean) ?? null,
    media_urls: input.media_urls,
    cover_url: input.cover_url ?? null,
    location_id: input.location_id ?? null,
    scheduled_at: when.toISOString().slice(0, 19).replace("T", " "),
    status: "agendado",
  });

  revalidatePath("/admin/social", "layout");
  return { ok: true, id };
}
