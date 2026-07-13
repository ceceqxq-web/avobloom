import { prepareImageForAnalysis } from "@/lib/image/prepareImage";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
