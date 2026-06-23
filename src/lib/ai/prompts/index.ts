import type { AssistantTopic } from "@/lib/ai/types";
import { BASE_SYSTEM_PROMPT } from "./base";
import { FEEDING_PROMPT } from "./feeding";
import { getTravelPrompt } from "./travel";
import { HEAT_SAFETY_PROMPT } from "./heat-safety";
import { BASIC_CARE_PROMPT } from "./basic-care";
import { HEALTH_PROMPT } from "./health";

const TOPIC_PROMPTS: Partial<Record<AssistantTopic, string | (() => string)>> = {
  feeding: FEEDING_PROMPT,
  travel: getTravelPrompt,
  heat_safety: HEAT_SAFETY_PROMPT,
  basic_care: BASIC_CARE_PROMPT,
  health: HEALTH_PROMPT,
};

export function buildSystemPrompt(
  topic: AssistantTopic = "general",
  petContext?: string
): string {
  const parts = [BASE_SYSTEM_PROMPT];

  const topicPrompt = TOPIC_PROMPTS[topic];
  if (topicPrompt) {
    parts.push(typeof topicPrompt === "function" ? topicPrompt() : topicPrompt);
  }

  if (petContext) {
    parts.push(`User's registered pets (personalize advice when relevant):\n${petContext}`);
  }

  return parts.join("\n\n");
}

export const TOPIC_QUICK_PROMPTS: Record<
  AssistantTopic,
  { en: string[]; ar: string[] }
> = {
  general: {
    en: [
      "How often should I feed my adult cat?",
      "What do I need to travel with my dog to the UK?",
      "Is it safe to walk my dog at noon in Dubai?",
      "How do I introduce a new kitten to my home?",
    ],
    ar: [
      "كم مرة يجب أن أطعم قطتي البالغة؟",
      "ماذا أحتاج للسفر مع كلبي إلى المملكة المتحدة؟",
      "هل من الآمن تمشية كلبي ظهراً في الرياض؟",
      "كيف أُعرف قطّاً جديداً على منزلي؟",
    ],
  },
  feeding: {
    en: [
      "How much should I feed my 6-month-old puppy?",
      "What human foods are toxic to cats?",
      "My dog won't eat — should I be worried?",
      "Best feeding schedule for an indoor cat?",
    ],
    ar: [
      "كم يجب أن أطعم جرواً عمره 6 أشهر؟",
      "ما الأطعمة البشرية السامة للقطط؟",
      "كلبي لا يأكل — هل يجب أن أقلق؟",
      "ما أفضل جدول تغذية لقطة منزلية؟",
    ],
  },
  travel: {
    en: [
      "What do I need to export my cat to the UK?",
      "How do I import a dog into the UAE?",
      "Does my pet need a microchip for international travel?",
      "How far in advance should I plan pet travel?",
    ],
    ar: [
      "ماذا أحتاج لتصدير قطتي إلى المملكة المتحدة؟",
      "كيف أستورد كلباً إلى الإمارات العربية المتحدة؟",
      "هل يحتاج حيواني الأليف إلى شريحة إلكترونية للسفر الدولي؟",
      "متى يجب أن أبدأ التخطيط لسفر الحيوانات الأليفة؟",
    ],
  },
  heat_safety: {
    en: [
      "Is it safe to walk my dog at noon in Dubai?",
      "Signs of heat stroke in dogs",
      "How to keep my cat cool in summer",
      "Can I leave my pet in the car for 5 minutes?",
    ],
    ar: [
      "هل من الآمن تمشية كلبي ظهراً في الرياض؟",
      "علامات ضربة الشمس عند الكلاب",
      "كيف أُبقي قطتي باردة في الصيف؟",
      "هل يمكنني ترك حيواني في السيارة لمدة 5 دقائق؟",
    ],
  },
  basic_care: {
    en: [
      "How often should I groom my long-haired cat?",
      "Exercise needs for an apartment dog",
      "How to set up a litter box properly",
      "Tips for socializing a new puppy",
    ],
    ar: [
      "كم مرة يجب أن أُنظف قطتي ذات الشعر الطويل؟",
      "احتياجات التمارين لكلب في شقة",
      "كيف أُعد صندوق الفضلات بشكل صحيح؟",
      "نصائح لتأهيل جرو جديد اجتماعياً",
    ],
  },
  health: {
    en: [
      "My cat is vomiting, what should I do?",
      "Dog not eating for 2 days",
      "Bird feathers falling out",
      "Vaccination schedule for a puppy",
    ],
    ar: [
      "قطتي تتقيأ، ماذا أفعل؟",
      "كلبي لا يأكل منذ يومين",
      "ريش طائري يتساقط",
      "جدول تطعيم الجرو",
    ],
  },
};

export const TOPIC_LABELS: Record<
  AssistantTopic,
  { en: string; ar: string }
> = {
  general: { en: "General", ar: "عام" },
  feeding: { en: "Feeding", ar: "التغذية" },
  travel: { en: "Travel", ar: "السفر" },
  heat_safety: { en: "Heat Safety", ar: "الحرارة" },
  basic_care: { en: "Basic Care", ar: "الرعاية" },
  health: { en: "Health", ar: "الصحة" },
};
