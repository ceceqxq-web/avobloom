import { revalidatePath } from "next/cache";

export async function POST() {
  revalidatePath("/");
  revalidatePath("/expenses");
  revalidatePath("/reports");

  return Response.json({ ok: true });
}
