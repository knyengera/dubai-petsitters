import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site";
import { SEO_CITIES } from "@/lib/seo/cities";
import {
  getPublicForumTopicUrls,
  getPublicHostRows,
  getPublicVetRows,
} from "@/lib/seo/queries";
import { getPublicBlogPosts } from "@/lib/blog/actions";

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/hosts", priority: 0.9, changeFrequency: "daily" },
  { path: "/hosting", priority: 0.9, changeFrequency: "weekly" },
  { path: "/vets", priority: 0.9, changeFrequency: "daily" },
  { path: "/adopt", priority: 0.8, changeFrequency: "daily" },
  { path: "/lost-pets", priority: 0.7, changeFrequency: "daily" },
  { path: "/travel", priority: 0.7, changeFrequency: "monthly" },
  { path: "/forum", priority: 0.7, changeFrequency: "daily" },
  { path: "/blog", priority: 0.8, changeFrequency: "daily" },
  { path: "/partners", priority: 0.7, changeFrequency: "monthly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/disclaimer", priority: 0.3, changeFrequency: "yearly" },
  { path: "/liability-waiver", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const cityEntries: MetadataRoute.Sitemap = SEO_CITIES.flatMap((city) => [
    {
      url: absoluteUrl(`/hosts/city/${city.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    },
    {
      url: absoluteUrl(`/vets/city/${city.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    },
  ]);

  const [hosts, vets, topics, blog] = await Promise.all([
    getPublicHostRows(),
    getPublicVetRows(),
    getPublicForumTopicUrls(),
    getPublicBlogPosts(),
  ]);

  const hostEntries: MetadataRoute.Sitemap = hosts.map((row) => ({
    url: absoluteUrl(`/hosts/${row.id}`),
    lastModified: row.updated_at ? new Date(row.updated_at) : now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const vetEntries: MetadataRoute.Sitemap = vets.map((row) => ({
    url: absoluteUrl(`/vets/${row.id}`),
    lastModified: row.updated_at ? new Date(row.updated_at) : now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const forumEntries: MetadataRoute.Sitemap = topics.map((topic) => ({
    url: absoluteUrl(`/forum/${topic.boardSlug}/${topic.topicSlug}`),
    lastModified: topic.updated_at ? new Date(topic.updated_at) : now,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const blogEntries: MetadataRoute.Sitemap =
    blog.ok === true
      ? blog.data
          .filter((post) => post.slug)
          .map((post) => ({
            url: absoluteUrl(`/blog/${post.slug}`),
            lastModified: new Date(
              post.updated_at ?? post.published_at ?? post.created_at
            ),
            changeFrequency: "weekly" as const,
            priority: 0.6,
          }))
      : [];

  return [
    ...staticEntries,
    ...cityEntries,
    ...hostEntries,
    ...vetEntries,
    ...forumEntries,
    ...blogEntries,
  ];
}
