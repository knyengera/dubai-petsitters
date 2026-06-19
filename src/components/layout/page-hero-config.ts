import { getCityBySlug } from "@/lib/seo/cities";

export const DEFAULT_PAGE_HERO_IMAGE = "/breadcrumb.webp";

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
  "/my-adoptions": {
    title: "My Adoption Listings",
    subtitle:
      "Track the pets you have listed for adoption and respond to adoption requests.",
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
    title: "Our Partners",
    subtitle:
      "Discover trusted pet shops, groomers, trainers, breeders, and more across Saudi Arabia.",
    imageAlt: DEFAULT_ALT,
  },
  "/deals": {
    title: "Deals & Discounts",
    subtitle:
      "Exclusive offers and promo codes from our trusted partner network. Sign in to reveal member codes.",
    imageAlt: DEFAULT_ALT,
  },
  "/become-partner": {
    title: "Grow Your Pet Business",
    subtitle:
      "Advertise to Saudi Arabia's most engaged community of pet owners.",
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
  "/liability-waiver": {
    title: "Liability Waiver",
    subtitle: "Last updated: June 2026",
    imageAlt: DEFAULT_ALT,
  },
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Your pet care and hosting hub at a glance",
    imageAlt: DEFAULT_ALT,
  },
  "/pets": {
    title: "My Pets",
    subtitle: "Health records & profiles",
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
  "/notifications": {
    title: "Notifications",
    subtitle: "Stay up to date with your pet care activity",
    imageAlt: DEFAULT_ALT,
  },
  "/host-calendar": {
    title: "Calendar Management",
    subtitle: "Manage your availability and pricing",
    imageAlt: DEFAULT_ALT,
  },
  "/host-earnings": {
    title: "Earnings & Payouts",
    subtitle: "View your balance, set your payout method, and request withdrawals",
    imageAlt: DEFAULT_ALT,
  },
  "/settings": {
    title: "Settings",
    subtitle: "Manage your account and preferences",
    imageAlt: DEFAULT_ALT,
  },
  "/admin": {
    title: "Admin Console",
    subtitle: "Platform overview and management tools",
    imageAlt: DEFAULT_ALT,
  },
  "/admin/partners": {
    title: "Partner Management",
    subtitle: "Manage vet clinics, shops, groomers and other partner listings",
    imageAlt: DEFAULT_ALT,
  },
  "/admin/users": {
    title: "User Management",
    subtitle: "Manage profiles and roles",
    imageAlt: DEFAULT_ALT,
  },
  "/admin/hosts": {
    title: "Host Management",
    subtitle: "Manage pet host listings",
    imageAlt: DEFAULT_ALT,
  },
  "/admin/bookings": {
    title: "Booking Management",
    subtitle: "Review hosting bookings",
    imageAlt: DEFAULT_ALT,
  },
  "/admin/appointments": {
    title: "Appointment Management",
    subtitle: "Manage vet appointments",
    imageAlt: DEFAULT_ALT,
  },
  "/admin/pets": {
    title: "Adoption Pets",
    subtitle: "Manage adoption catalog",
    imageAlt: DEFAULT_ALT,
  },
  "/admin/adoption-requests": {
    title: "Adoption Requests",
    subtitle: "Review adoption applications",
    imageAlt: DEFAULT_ALT,
  },
  "/admin/lost-pets": {
    title: "Lost Pets",
    subtitle: "Moderate lost and found reports",
    imageAlt: DEFAULT_ALT,
  },
  "/admin/blog": {
    title: "Blog Management",
    subtitle: "Publish and manage articles",
    imageAlt: DEFAULT_ALT,
  },
  "/admin/forum": {
    title: "Forum Moderation",
    subtitle: "Moderate community threads",
    imageAlt: DEFAULT_ALT,
  },
  "/admin/partner-deals": {
    title: "Partner Deals",
    subtitle: "Manage partner promotions",
    imageAlt: DEFAULT_ALT,
  },
  "/admin/subscriptions": {
    title: "Subscriptions",
    subtitle: "Manage vet subscriptions",
    imageAlt: DEFAULT_ALT,
  },
  "/admin/payments": {
    title: "Payments",
    subtitle: "View payment records",
    imageAlt: DEFAULT_ALT,
  },
  "/admin/reviews": {
    title: "Reviews",
    subtitle: "Moderate user reviews",
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
    pattern: /^\/adopt\/[^/]+$/,
    config: {
      title: "Adopt a Pet",
      subtitle:
        "Give a loving home to one of our animals. Browse available pets and submit an adoption application.",
      imageAlt: DEFAULT_ALT,
    },
  },
  {
    pattern: /^\/lost-pets\/[^/]+$/,
    config: {
      title: "Lost & Found Pets",
      subtitle: "Report & find missing pets in Saudi Arabia",
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
    pattern: /^\/forum\/[^/]+\/[^/]+$/,
    config: {
      title: "Forum Topic",
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
export const PAGE_HERO_EXCLUDED_PATHS = new Set(["/", "/forum"]);

/** Resolves city landing routes (e.g. /vets/city/riyadh) to a city-specific hero. */
function getCityPageHeroConfig(pathname: string): PageHeroConfig | null {
  const vetsMatch = pathname.match(/^\/vets\/city\/([^/]+)$/);
  if (vetsMatch) {
    const city = getCityBySlug(vetsMatch[1]);
    if (city) {
      return {
        title: `Veterinary Clinics in ${city.name}`,
        subtitle: `Find a vet in ${city.name} (${city.nameAr}). Browse clinics for vaccinations, surgery, dental, and 24/7 emergency care for dogs, cats, and exotic pets. Compare ratings and book online.`,
        imageAlt: DEFAULT_ALT,
      };
    }
  }

  const hostsMatch = pathname.match(/^\/hosts\/city\/([^/]+)$/);
  if (hostsMatch) {
    const city = getCityBySlug(hostsMatch[1]);
    if (city) {
      return {
        title: `Pet Sitters in ${city.name}`,
        subtitle: `Find trusted pet sitters in ${city.name} (${city.nameAr}) for boarding, daycare, dog walking, and in-home pet care. Compare verified hosts, reviews, and prices.`,
        imageAlt: DEFAULT_ALT,
      };
    }
  }

  return null;
}

export function getPageHeroConfig(pathname: string): PageHeroConfig | null {
  if (PAGE_HERO_EXCLUDED_PATHS.has(pathname)) return null;
  // Forum board pages render their own hero with board-specific content.
  if (/^\/forum\/[^/]+$/.test(pathname)) return null;

  const cityHero = getCityPageHeroConfig(pathname);
  if (cityHero) return cityHero;

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
