import type { CitySeo } from "@/lib/seo/cities";

type CityLandingIntroProps = {
  kind: "hosts" | "vets";
  city: CitySeo;
};

/**
 * Server-rendered heading and intro copy for city landing pages. This text is
 * present in the initial HTML (unlike the client-fetched listings below it),
 * giving crawlers keyword-rich, city-specific content to index.
 */
export default function CityLandingIntro({ kind, city }: CityLandingIntroProps) {
  const content =
    kind === "hosts"
      ? {
          h1: `Pet Sitters in ${city.name}`,
          paras: [
            `Looking for a trusted pet sitter in ${city.name}? Saudi Petsitters connects you with verified, background-checked hosts offering pet boarding, daycare, in-home pet sitting, and dog walking across ${city.name} and the surrounding areas. Whether you are travelling for work or going on holiday, you can find loving care for your dog, cat, or other pets with regular photo updates and complete peace of mind.`,
            `Browse local hosts in ${city.name} (${city.nameAr}), compare reviews and pricing, and book the service that fits your pet's needs. From overnight boarding to daily dog walking, every sitter on Saudi Petsitters is part of our trusted pet care community. استضافة وفندقة الحيوانات الأليفة في ${city.nameAr}.`,
          ],
        }
      : {
          h1: `Veterinary Clinics in ${city.name}`,
          paras: [
            `Find a vet in ${city.name} with Saudi Petsitters. Browse veterinary clinics offering vaccinations, routine check-ups, surgery, dental care, and 24/7 emergency services for dogs, cats, and exotic pets across ${city.name}. Compare clinics by location, services, and ratings to choose the right care for your pet.`,
            `Search trusted animal hospitals and vet clinics in ${city.name} (${city.nameAr}), view opening hours and contact details, and request an appointment online. عيادات بيطرية موثوقة في ${city.nameAr}.`,
          ],
        };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
      <h1 className="font-heading text-3xl lg:text-4xl font-extrabold text-foreground mb-4">
        {content.h1}
      </h1>
      <div className="space-y-3 text-muted-foreground max-w-3xl">
        {content.paras.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </section>
  );
}
