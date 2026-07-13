export function isHeicFile(file: File) {
  const name = file.name.toLowerCase();

  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

export async function prepareImageForAnalysis(file: File) {
  const inputBuffer = Buffer.from(await file.arrayBuffer());

  if (!isHeicFile(file)) {
    return {
      imageBase64: inputBuffer.toString("base64"),
      imageMimeType: file.type || "image/jpeg",
    };
  }

  const heicConvert = (await import("heic-convert")).default;
  const jpegBuffer = Buffer.from(
    await heicConvert({
      buffer: inputBuffer,
      format: "JPEG",
      quality: 0.92,
    }),
  );

  return {
    imageBase64: jpegBuffer.toString("base64"),
    imageMimeType: "image/jpeg",
  };
}
