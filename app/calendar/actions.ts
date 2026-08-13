"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { getRoster, releaseShift, requestShift, type TradeOutcome } from "@/lib/store";
import { resolveCurrentStaff } from "@/lib/roster";

async function currentStaffId() {
  const user = await getCurrentUser();
  if (!user) return null;
  return resolveCurrentStaff(getRoster(), user.email).id;
}

/** "I want it" — raises a claim for an admin to approve. */
export async function claimShift(shiftId: string): Promise<TradeOutcome> {
  const staffId = await currentStaffId();
  if (!staffId) return { ok: false, message: "Your session has expired." };

  const outcome = requestShift(shiftId, staffId);
  if (outcome.ok) {
    revalidatePath("/calendar");
    revalidatePath("/admin");
  }
  return outcome;
}

/** "Open for taking" — hands your own shift back to the open pool. */
export async function openShiftForTaking(shiftId: string): Promise<TradeOutcome> {
  const staffId = await currentStaffId();
  if (!staffId) return { ok: false, message: "Your session has expired." };

  const outcome = releaseShift(shiftId, staffId);
  if (outcome.ok) {
    revalidatePath("/calendar");
    revalidatePath("/admin");
  }
  return outcome;
}
