import type { Metadata } from "next";
import MyAdoptions from "@/components/pages/MyAdoptions";

export const metadata: Metadata = {
  title: "My Adoption Listings",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <MyAdoptions />;
}
