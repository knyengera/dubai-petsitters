export const DESTINATIONS = [
  { code: "US", en: "United States", ar: "الولايات المتحدة", rabies: true, daysNotice: 30 },
  { code: "GB", en: "United Kingdom", ar: "المملكة المتحدة", rabies: true, daysNotice: 21 },
  { code: "AE", en: "UAE", ar: "الإمارات العربية المتحدة", rabies: false, daysNotice: 7 },
  { code: "EG", en: "Egypt", ar: "مصر", rabies: false, daysNotice: 14 },
  { code: "FR", en: "France", ar: "فرنسا", rabies: true, daysNotice: 21 },
  { code: "DE", en: "Germany", ar: "ألمانيا", rabies: true, daysNotice: 21 },
  { code: "JO", en: "Jordan", ar: "الأردن", rabies: false, daysNotice: 7 },
  { code: "KW", en: "Kuwait", ar: "الكويت", rabies: false, daysNotice: 7 },
] as const;

export const SPECIES_REQS: Record<string, string[]> = {
  dog: [
    "Rabies vaccination",
    "Health certificate (within 10 days)",
    "Microchip (ISO 11784/11785)",
    "MEWA export permit",
    "Vet-signed health declaration",
  ],
  cat: [
    "Rabies vaccination (if required)",
    "Health certificate (within 10 days)",
    "Microchip recommended",
    "MEWA export permit",
  ],
  bird: [
    "CITES permit (if applicable)",
    "Avian influenza clearance",
    "Health certificate",
    "Import permit from destination country",
  ],
};

export const SAUDI_IMPORT_CHECKLIST = [
  { en: "Original health certificate from country of origin", ar: "شهادة صحة أصلية من بلد المنشأ" },
  { en: "Rabies vaccination certificate", ar: "شهادة تطعيم ضد داء الكلب" },
  { en: "Valid microchip (ISO standard)", ar: "رقاقة إلكترونية سارية المفعول (معيار ISO)" },
  { en: "MEWA import permit", ar: "تصريح استيراد من وزارة البيئة (مياه وزراعة)" },
  { en: "Nafath digital identity verification", ar: "التحقق من الهوية الرقمية عبر نفاذ" },
  { en: "Pet must not be on Saudi banned species list", ar: "يجب ألا يكون الحيوان ضمن القائمة المحظورة" },
  { en: "Pet must be at least 3 months old", ar: "يجب ألا يقل عمر الحيوان عن 3 أشهر" },
  { en: "Owner must be Saudi national or resident", ar: "يجب أن يكون المالك مواطناً سعودياً أو مقيماً" },
] as const;

export function formatTravelKnowledgeForPrompt(): string {
  const destinations = DESTINATIONS.map(
    (d) =>
      `- ${d.en} (${d.code}): rabies titer ${d.rabies ? "required" : "not required"}, ${d.daysNotice} days advance notice`
  ).join("\n");

  const exportReqs = Object.entries(SPECIES_REQS)
    .map(([species, reqs]) => `${species}: ${reqs.join("; ")}`)
    .join("\n");

  const importChecklist = SAUDI_IMPORT_CHECKLIST.map((item) => `- ${item.en}`).join("\n");

  return `Known destination rules (verify with authorities — regulations change):
${destinations}

Saudi export requirements by species:
${exportReqs}

Saudi import checklist:
${importChecklist}`;
}
