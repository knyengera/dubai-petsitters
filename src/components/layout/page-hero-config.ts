export const DEFAULT_PAGE_HERO_IMAGE =
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1400&q=80";

export type PageHeroConfig = {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  imageAlt?: string;
};

const DEFAULT_ALT = "Pet care banner";

/** Exact path → hero metadata. All routes use the hosting image unless overridden. */
export const PAGE_HERO_BY_PATH: Record<string, PageHeroConfig> = {
  "/": {
    title: "Saudi Petsitters",
    subtitle: "Saudi Arabia's trusted pet care community",
    imageAlt: DEFAULT_ALT,
  },
  "/vets": {
    title: "Find a Vet",
    subtitle:
      "Browse veterinary clinics across Saudi Arabia. Find emergency services, specialists, and routine care near you.",
    imageAlt: DEFAULT_ALT,
  },
  "/adopt": {
    title: "Adopt a Pet",
    subtitle:
      "Give a loving home to one of our animals. Browse available pets and submit an adoption application.",
    imageAlt: DEFAULT_ALT,
  },
  "/hosting": {
    title: "Pet Hosting Services",
    subtitle:
      "Trusted pet care while you are away. Browse verified hosts or book a service.",
    imageAlt: "Dogs running",
  },
  "/hosts": {
    title: "Find a Pet Host",
    subtitle:
      "Browse trusted pet sitters and hosts across Saudi Arabia. Book the perfect care for your pet.",
    imageAlt: DEFAULT_ALT,
  },
  "/blog": {
    title: "Blog",
    subtitle: "Expert tips, guides, and stories about pet care in Saudi Arabia.",
    imageAlt: DEFAULT_ALT,
  },
  "/forum": {
    title: "Community Forum",
    subtitle:
      "Ask questions, share advice, and connect with fellow pet owners across Saudi Arabia.",
    imageAlt: DEFAULT_ALT,
  },
  "/about": {
    title: "About Saudi Petsitters",
    subtitle:
      "Saudi Arabia's trusted pet care community — connecting pet owners with trusted hosts, vets, and resources.",
    imageAlt: DEFAULT_ALT,
  },
  "/travel": {
    title: "Travel Compliance Wizard",
    subtitle: "Saudi pet import/export requirements",
    imageAlt: DEFAULT_ALT,
  },
  "/lost-pets": {
    title: "Lost & Found Pets",
    subtitle: "Report & find missing pets in Saudi Arabia",
    imageAlt: DEFAULT_ALT,
  },
  "/become-host": {
    title: "Become a Pet Host",
    subtitle:
      "Turn your love for animals into income. Register your profile and start welcoming pets into your care.",
    imageAlt: DEFAULT_ALT,
  },
  "/partners": {
    title: "Grow Your Pet Business",
    subtitle:
      "Advertise to Saudi Arabia's most engaged community of pet owners.",
    imageAlt: DEFAULT_ALT,
  },
  "/vet-advertise": {
    title: "Advertise Your Clinic",
    subtitle:
      "Reach thousands of pet owners across Saudi Arabia. List your clinic, post specials, and grow your practice.",
    imageAlt: DEFAULT_ALT,
  },
  "/terms": {
    title: "Terms & Conditions",
    subtitle: "Last updated: May 2026",
    imageAlt: DEFAULT_ALT,
  },
  "/privacy": {
    title: "Privacy Policy",
    subtitle: "Last updated: May 2026",
    imageAlt: DEFAULT_ALT,
  },
  "/disclaimer": {
    title: "Disclaimer",
    subtitle: "Last updated: May 2026",
    imageAlt: DEFAULT_ALT,
  },
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Your pet care hub at a glance",
    imageAlt: DEFAULT_ALT,
  },
  "/pets": {
    title: "My Pets",
    subtitle: "Health records & profiles",
    imageAlt: DEFAULT_ALT,
  },
  "/ai-chat": {
    title: "AI Pet Health Assistant",
    subtitle: "Online · Bilingual guidance for your pet",
    imageAlt: DEFAULT_ALT,
  },
  "/appointments": {
    title: "Appointments",
    subtitle: "Manage your vet visits",
    imageAlt: DEFAULT_ALT,
  },
  "/my-appointments": {
    title: "My Appointments",
    subtitle: "View and manage your vet appointment requests",
    imageAlt: DEFAULT_ALT,
  },
  "/messages": {
    title: "Messages",
    subtitle: "Chat with hosts, vets, and other pet owners",
    imageAlt: DEFAULT_ALT,
  },
  "/host-calendar": {
    title: "Calendar Management",
    subtitle: "Manage your availability and pricing",
    imageAlt: DEFAULT_ALT,
  },
  "/settings": {
    title: "Settings",
    subtitle: "Manage your account and preferences",
    imageAlt: DEFAULT_ALT,
  },
  "/admin/vets": {
    title: "Vet Clinic Management",
    subtitle: "Review and manage vet clinic listings",
    imageAlt: DEFAULT_ALT,
  },
};

const PAGE_HERO_PATTERNS: {
  pattern: RegExp;
  config: PageHeroConfig;
}[] = [
  {
    pattern: /^\/hosts\/[^/]+$/,
    config: {
      title: "Host Profile",
      subtitle: "View host details and book pet care",
      imageAlt: DEFAULT_ALT,
    },
  },
  {
    pattern: /^\/vets\/[^/]+$/,
    config: {
      title: "Vet Clinic",
      subtitle: "Clinic details, services, and appointments",
      imageAlt: DEFAULT_ALT,
    },
  },
  {
    pattern: /^\/blog\/[^/]+$/,
    config: {
      title: "Blog Article",
      subtitle: "Pet care tips and stories from Saudi Petsitters",
      imageAlt: DEFAULT_ALT,
    },
  },
  {
    pattern: /^\/forum\/[^/]+$/,
    config: {
      title: "Forum Thread",
      subtitle: "Join the conversation with fellow pet owners",
      imageAlt: DEFAULT_ALT,
    },
  },
  {
    pattern: /^\/pets\/[^/]+\/health$/,
    config: {
      title: "Pet Health",
      subtitle: "Vaccination records, notes, and health history",
      imageAlt: DEFAULT_ALT,
    },
  },
];

/** Routes that keep their own full-page hero (no shared banner). */
export const PAGE_HERO_EXCLUDED_PATHS = new Set(["/"]);

export function getPageHeroConfig(pathname: string): PageHeroConfig | null {
  if (PAGE_HERO_EXCLUDED_PATHS.has(pathname)) return null;

  const exact = PAGE_HERO_BY_PATH[pathname];
  if (exact) return exact;

  const matched = PAGE_HERO_PATTERNS.find(({ pattern }) =>
    pattern.test(pathname)
  );
  return matched?.config ?? null;
}

export function resolvePageHeroImage(config: PageHeroConfig): string {
  return config.imageUrl ?? DEFAULT_PAGE_HERO_IMAGE;
}
