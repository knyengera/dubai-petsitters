import Link from "next/link";
import { PawPrint, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <PawPrint className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-heading text-lg font-bold text-background">
                  Saudi
                </span>
                <span className="font-heading text-lg font-bold text-primary ml-1">
                  Petsitters
                </span>
              </div>
            </div>
            <p className="text-background/60 text-sm leading-relaxed">
              Saudi Arabia&apos;s trusted pet care community.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-background mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { label: "Adopt a Pet", path: "/adopt" },
                { label: "Pet Hosting", path: "/hosting" },
                { label: "Find a Vet", path: "/vets" },
                { label: "Blog", path: "/blog" },
                { label: "Forum", path: "/forum" },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className="text-sm text-background/60 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-background mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-background/60">
              <li className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                Khobar, Saudi Arabia
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                hello@saudipetsitters.com
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-background/10 mt-12 pt-6 text-sm text-background/40">
          © {new Date().getFullYear()} Saudi Petsitters. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
