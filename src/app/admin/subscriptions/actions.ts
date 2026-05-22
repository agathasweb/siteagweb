"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { deleteSubscription } from "@/lib/db/subscriptions";
import { deleteLeadsBySubscriptionId } from "@/lib/db/leads";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado.");
}

export async function deleteSubscriptionAction(id: number): Promise<void> {
  await requireAdmin();
  // Remove o lead "cliente agweb" vinculado antes de apagar a assinatura.
  deleteLeadsBySubscriptionId(id);
  deleteSubscription(id);
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/leads");
}
