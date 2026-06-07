import type { Bilingual } from "@/lib/i18n/helpers";

export const blogStrings = {
  heroTitle: {
    en: "Blog",
    ar: "المدونة",
  },
  heroSubtitle: {
    en: "Expert tips, guides, and stories about pet care in Saudi Arabia.",
    ar: "نصائح وإرشادات وقصص متخصصة عن رعاية الحيوانات الأليفة في المملكة.",
  },
  articleHeroSubtitle: {
    en: "Pet care tips and stories from Saudi Petsitters",
    ar: "نصائح وقصص عن رعاية الحيوانات من Saudi Petsitters",
  },
  filterArticles: {
    en: "Filter articles",
    ar: "تصفية المقالات",
  },
  resultsCount: {
    en: "{result} of {total} article{plural}",
    ar: "{result} من {total} مقال{pluralAr}",
  },
  searchPlaceholder: {
    en: "Search by title, excerpt, author, or tag...",
    ar: "ابحث بالعنوان أو الملخص أو الكاتب أو الوسم...",
  },
  category: {
    en: "Category",
    ar: "الفئة",
  },
  tag: {
    en: "Tag",
    ar: "الوسم",
  },
  author: {
    en: "Author",
    ar: "الكاتب",
  },
  sortBy: {
    en: "Sort by",
    ar: "ترتيب حسب",
  },
  allCategories: {
    en: "All categories",
    ar: "جميع الفئات",
  },
  allTags: {
    en: "All tags",
    ar: "جميع الوسوم",
  },
  allAuthors: {
    en: "All authors",
    ar: "جميع الكتّاب",
  },
  sortNewest: {
    en: "Newest first",
    ar: "الأحدث أولاً",
  },
  sortOldest: {
    en: "Oldest first",
    ar: "الأقدم أولاً",
  },
  sortTitleAsc: {
    en: "Title A–Z",
    ar: "العنوان أ–ي",
  },
  sortTitleDesc: {
    en: "Title Z–A",
    ar: "العنوان ي–أ",
  },
  searchChip: {
    en: 'Search: "{query}"',
    ar: 'بحث: "{query}"',
  },
  clearAll: {
    en: "Clear all",
    ar: "مسح الكل",
  },
  featured: {
    en: "Featured",
    ar: "مميز",
  },
  readArticle: {
    en: "Read article",
    ar: "اقرأ المقال",
  },
  loadErrorTitle: {
    en: "Could not load articles",
    ar: "تعذّر تحميل المقالات",
  },
  tryAgain: {
    en: "Try again",
    ar: "حاول مجدداً",
  },
  noMatching: {
    en: "No matching articles",
    ar: "لا توجد مقالات مطابقة",
  },
  noArticles: {
    en: "No articles yet",
    ar: "لا توجد مقالات بعد",
  },
  adjustFilters: {
    en: "Try adjusting your search or filters.",
    ar: "جرّب تعديل البحث أو عوامل التصفية.",
  },
  checkBackSoon: {
    en: "Check back soon for new content!",
    ar: "عد قريباً لمزيد من المحتوى!",
  },
  postNotFound: {
    en: "Post Not Found",
    ar: "المقال غير موجود",
  },
  backToBlog: {
    en: "Back to Blog",
    ar: "العودة إلى المدونة",
  },
  comments: {
    en: "Comments",
    ar: "التعليقات",
  },
  commentsCount: {
    en: "Comments ({count})",
    ar: "التعليقات ({count})",
  },
  leaveComment: {
    en: "Leave a comment",
    ar: "اترك تعليقاً",
  },
  name: {
    en: "Name",
    ar: "الاسم",
  },
  email: {
    en: "Email",
    ar: "البريد الإلكتروني",
  },
  comment: {
    en: "Comment",
    ar: "التعليق",
  },
  commentPlaceholder: {
    en: "Share your thoughts...",
    ar: "شارك أفكارك...",
  },
  commentModerationNote: {
    en: "Comments are moderated before they appear publicly.",
    ar: "تُراجع التعليقات قبل نشرها علناً.",
  },
  postComment: {
    en: "Post Comment",
    ar: "نشر التعليق",
  },
  commentFailed: {
    en: "Comment failed",
    ar: "فشل إرسال التعليق",
  },
  commentSubmitted: {
    en: "Comment submitted",
    ar: "تم إرسال التعليق",
  },
  commentPendingDesc: {
    en: "Your comment is pending moderation.",
    ar: "تعليقك قيد المراجعة.",
  },
  noComments: {
    en: "No comments yet. Be the first to share your thoughts.",
    ar: "لا توجد تعليقات بعد. كن أول من يشارك أفكاره.",
  },
  readMore: {
    en: "Read more",
    ar: "اقرأ المزيد",
  },
} as const satisfies Record<string, Bilingual>;

export const blogCategoryI18n: Record<string, Bilingual> = {
  pet_care: { en: "Pet Care", ar: "رعاية الحيوانات" },
  health: { en: "Health", ar: "الصحة" },
  training: { en: "Training", ar: "التدريب" },
  nutrition: { en: "Nutrition", ar: "التغذية" },
  lifestyle: { en: "Lifestyle", ar: "أسلوب الحياة" },
  news: { en: "News", ar: "الأخبار" },
};

export function interpolate(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}

export function pluralSuffix(count: number, lang: string) {
  if (lang === "ar") return count === 1 ? "" : "ات";
  return count === 1 ? "" : "s";
}
