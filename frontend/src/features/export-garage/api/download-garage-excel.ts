type ApiErrorBody = {
  message?: string | string[];
};

function filenameFromDisposition(header: string | null) {
  let raw = "tyaga-smena.xlsx";

  if (header) {
    const encoded = header.match(/filename\*=UTF-8''([^;]+)/i);
    if (encoded?.[1]) {
      try {
        raw = decodeURIComponent(encoded[1]);
      } catch {
        raw = encoded[1];
      }
    } else {
      const plain = header.match(/filename="?([^";]+)"?/i);
      if (plain?.[1]) raw = plain[1];
    }
  }

  const base = raw.replace(/^.*[/\\]/, "").replace(/[^\w.\-]+/g, "");
  return base.toLowerCase().endsWith(".xlsx") && base.length <= 80 ? base : "tyaga-smena.xlsx";
}

async function readError(response: Response) {
  const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
  const message = Array.isArray(body.message) ? body.message.join(". ") : body.message;
  return message || "Не удалось выгрузить смену";
}

export async function downloadGarageExcel() {
  const response = await fetch("/api/garage/export");
  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const blob = await response.blob();
  if (blob.size < 4) {
    throw new Error("Сервер вернул пустой файл");
  }

  const magic = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
  if (magic[0] !== 0x50 || magic[1] !== 0x4b) {
    throw new Error("Сервер вернул не Excel-файл");
  }

  const filename = filenameFromDisposition(response.headers.get("Content-Disposition"));
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return filename;
}
