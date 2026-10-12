import { REQUEST_CATEGORIES } from "@/entities/vehicle";

export type PassportDraft = {
  name?: string;
  category?: string;
  plate?: string;
  capacity?: string;
  rawText: string;
};

const CYR_PLATE =
  /([АВЕКМНОРСТУХABEKMHOPCTYX])\s*(\d{3})\s*([АВЕКМНОРСТУХABEKMHOPCTYX]{2})\s*(\d{2,3})/i;

const LATIN_TO_CYR: Record<string, string> = {
  A: "А",
  B: "В",
  E: "Е",
  K: "К",
  M: "М",
  H: "Н",
  O: "О",
  P: "Р",
  C: "С",
  T: "Т",
  Y: "У",
  X: "Х",
};

function toCyrPlateChar(char: string) {
  const upper = char.toUpperCase();
  return LATIN_TO_CYR[upper] ?? upper;
}

function normalizePlate(match: RegExpMatchArray) {
  const letter1 = toCyrPlateChar(match[1] ?? "");
  const digits = match[2] ?? "";
  const letters2 = [...(match[3] ?? "")].map(toCyrPlateChar).join("");
  const region = match[4] ?? "";
  return `${letter1} ${digits} ${letters2} · ${region}`;
}

function pickAfterLabel(text: string, labels: string[]) {
  for (const label of labels) {
    const re = new RegExp(`${label}\\s*[:.]?\\s*([^\\n\\r]{2,60})`, "i");
    const match = text.match(re);
    const value = match?.[1]?.trim();
    if (value) return value.replace(/\s{2,}/g, " ");
  }
  return undefined;
}

function detectCategory(text: string): string | undefined {
  const lower = text.toLowerCase();
  const hints: { needle: string; category: (typeof REQUEST_CATEGORIES)[number] }[] = [
    { needle: "экскаватор-погрузчик", category: "Экскаватор-погрузчик" },
    { needle: "мини-погрузчик", category: "Мини-погрузчик" },
    { needle: "погрузчик", category: "Погрузчик" },
    { needle: "экскаватор", category: "Экскаватор" },
    { needle: "самосвал", category: "Самосвал" },
    { needle: "автокран", category: "Автокран" },
    { needle: "кран", category: "Автокран" },
    { needle: "бульдозер", category: "Бульдозер" },
    { needle: "автогрейдер", category: "Автогрейдер" },
    { needle: "грейдер", category: "Автогрейдер" },
    { needle: "каток", category: "Каток" },
  ];
  for (const hint of hints) {
    if (lower.includes(hint.needle)) return hint.category;
  }
  return undefined;
}

/** Разбор текста с фото/скана ПТС/СТС: госномер, марка, тип. */
export function parsePassportText(rawText: string): PassportDraft {
  const text = rawText.replace(/\u00a0/g, " ").trim();
  const plateMatch = text.match(CYR_PLATE);
  const plate = plateMatch ? normalizePlate(plateMatch) : undefined;

  const brand = pickAfterLabel(text, ["МАРКА", "МАРКА \\(МОДЕЛЬ\\)", "BRAND"]);
  const model = pickAfterLabel(text, ["МОДЕЛЬ", "MODEL"]);
  let name: string | undefined;
  if (brand && model && !model.toLowerCase().includes(brand.toLowerCase())) {
    name = `${brand} ${model}`;
  } else {
    name = brand || model || pickAfterLabel(text, ["НАИМЕНОВАНИЕ", "ТРАНСПОРТНОЕ СРЕДСТВО"]);
  }

  const capacity =
    pickAfterLabel(text, ["РАБОЧИЙ ОБЪЕМ", "МАССА", "ГРУЗОПОДЪЕМНОСТЬ", "КОВШ"]) ??
    undefined;

  return {
    plate,
    name: name?.slice(0, 80),
    category: detectCategory(text),
    capacity: capacity?.slice(0, 80),
    rawText: text,
  };
}
