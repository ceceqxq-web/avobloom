import Foundation
import Vision
import ImageIO

struct TextItem: Codable { let text: String; let confidence: Float; let x: Double; let y: Double; let height: Double }
struct Result: Codable { let text: String; let items: [TextItem]; let engine: String }
do {
    guard CommandLine.arguments.count == 2 else { throw NSError(domain: "OCR", code: 1, userInfo: [NSLocalizedDescriptionKey: "Missing image"]) }
    let url = URL(fileURLWithPath: CommandLine.arguments[1])
    guard let source = CGImageSourceCreateWithURL(url as CFURL, nil), CGImageSourceGetCount(source) > 0 else {
        throw NSError(domain: "OCR", code: 2, userInfo: [NSLocalizedDescriptionKey: "Invalid image"])
    }
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = false
    let supported = try request.supportedRecognitionLanguages()
    request.recognitionLanguages = ["en-US", "zh-Hans"].filter { supported.contains($0) }
    request.customWords = ["kJ", "kcal", "crackers", "Serving", "Carbohydrate", "100g", "100mL"]
    try VNImageRequestHandler(url: url, options: [:]).perform([request])
    let items: [TextItem] = (request.results ?? []).compactMap { observation in
        guard let candidate = observation.topCandidates(1).first else { return nil }
        let b = observation.boundingBox
        return TextItem(text: candidate.string, confidence: candidate.confidence, x: b.minX, y: b.midY, height: b.height)
    }.sorted { $0.y > $1.y }
    // Reconstruct horizontal table rows rather than reading columns top-to-bottom.
    var rows: [[TextItem]] = []
    for item in items {
        if let index = rows.firstIndex(where: { row in abs(row[0].y - item.y) < min(row[0].height, item.height) * 0.55 }) {
            rows[index].append(item)
        } else { rows.append([item]) }
    }
    let text = rows.map { $0.sorted { $0.x < $1.x }.map { $0.text }.joined(separator: "\t") }.joined(separator: "\n")
    let result = Result(text: text, items: items, engine: "Apple Vision · 本机文字识别")
    let data = try JSONEncoder().encode(result)
    FileHandle.standardOutput.write(data)
} catch {
    FileHandle.standardError.write(Data(error.localizedDescription.utf8))
    exit(1)
}
