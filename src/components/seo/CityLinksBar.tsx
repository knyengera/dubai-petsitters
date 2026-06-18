import Link from "next/link";
import { SEO_CITIES } from "@/lib/seo/cities";

type CityLinksBarProps = {
  kind: "hosts" | "vets";
  activeCity?: string;
};

/** Internal links to city landing pages, surfacing local SEO routes to crawlers. */
export default function CityLinksBar({ kind, activeCity }: CityLinksBarProps) {
  const label = kind === "hosts" ? "Pet sitters by city" : "Vets by city";
  return (
    <nav aria-label={label} className="mb-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground mr-1">
          {label}:
        </span>
        {SEO_CITIES.map((c) => {
          const isActive = activeCity === c.name;
          return (
            <Link
              key={c.slug}
              href={`/${kind}/city/${c.slug}`}
              aria-current={isActive ? "page" : undefined}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {c.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
