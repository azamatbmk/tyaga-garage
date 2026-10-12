import { parsePassportText, type PassportDraft } from "./parse-passport";

const MAX_BYTES = 12 * 1024 * 1024;

function assertScanFile(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Выберите изображение техпаспорта (JPG, PNG, HEIC…)");
  }
  if (file.size <= 0) {
    throw new Error("Пустой файл");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Файл больше 12 МБ — сделайте фото меньшего размера");
  }
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException("Сканирование отменено", "AbortError");
  }
}

async function tryBarcodeDetector(file: File, signal?: AbortSignal): Promise<string | null> {
  type Detector = {
    detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
  };
  const DetectorCtor = (
    globalThis as unknown as {
      BarcodeDetector?: new (options?: { formats: string[] }) => Detector;
    }
  ).BarcodeDetector;
  if (!DetectorCtor) return null;

  try {
    throwIfAborted(signal);
    const detector = new DetectorCtor({ formats: ["qr_code", "pdf417", "data_matrix"] });
    const bitmap = await createImageBitmap(file);
    throwIfAborted(signal);
    const codes = await detector.detect(bitmap);
    bitmap.close?.();
    const value = codes.map((item) => item.rawValue).filter(Boolean).join("\n");
    return value || null;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    return null;
  }
}

/** Скан техпаспорта: QR/штрихкод при наличии, иначе OCR (tesseract rus+eng). */
export async function scanPassportImage(
  file: File,
  onProgress?: (message: string) => void,
  signal?: AbortSignal,
): Promise<PassportDraft> {
  assertScanFile(file);
  throwIfAborted(signal);

  onProgress?.("Ищем QR / штрихкод…");
  const barcodeText = await tryBarcodeDetector(file, signal);
  if (barcodeText && barcodeText.length > 8) {
    return parsePassportText(barcodeText);
  }

  throwIfAborted(signal);
  onProgress?.("Распознаём текст паспорта…");
  const { createWorker } = await import("tesseract.js");
  throwIfAborted(signal);

  const worker = await createWorker("rus+eng", 1, {
    logger: (message) => {
      if (message.status === "recognizing text" && typeof message.progress === "number") {
        onProgress?.(`Распознавание ${Math.round(message.progress * 100)}%`);
      }
    },
  });

  const onAbort = () => {
    void worker.terminate();
  };
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    throwIfAborted(signal);
    const result = await worker.recognize(file);
    throwIfAborted(signal);
    return parsePassportText(result.data.text || "");
  } finally {
    signal?.removeEventListener("abort", onAbort);
    await worker.terminate().catch(() => undefined);
  }
}
