import { prepareImageForAnalysis } from "@/lib/image/prepareImage";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File)) {
    return Response.json({ error: "Missing image" }, { status: 400 });
  }

  const preparedImage = await prepareImageForAnalysis(image);

  return Response.json({
    imageDataUrl: `data:${preparedImage.imageMimeType};base64,${preparedImage.imageBase64}`,
  });
}
