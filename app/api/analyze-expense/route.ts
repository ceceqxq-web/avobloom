import { analyzeExpense } from "@/lib/ai/analyzeExpense";
import { prepareImageForAnalysis } from "@/lib/image/prepareImage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const image = formData.get("image");
      let imageBase64: string | undefined;
      let imageMimeType: string | undefined;

      if (image instanceof File) {
        const preparedImage = await prepareImageForAnalysis(image);
        imageBase64 = preparedImage.imageBase64;
        imageMimeType = preparedImage.imageMimeType;
      }

      const analysis = await analyzeExpense({
        rawText: String(formData.get("rawText") || ""),
        imageBase64,
        imageMimeType,
      });

      return Response.json({ analysis });
    }

    const body = await request.json();
    const analysis = await analyzeExpense({
      rawText: body.rawText,
      merchant: body.merchant,
      itemName: body.itemName,
      price: Number(body.price || 0),
      category: body.category,
      imageBase64: body.imageBase64,
      imageMimeType: body.imageMimeType,
    });

    return Response.json({ analysis });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Expense analysis failed. Please try again.",
      },
      { status: 400 },
    );
  }
}
