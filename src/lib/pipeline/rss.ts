import Parser from "rss-parser";
import { config } from "@/lib/config";
import type { CategoryId, RssArticle } from "./types";

const parser = new Parser<Record<string, unknown>, Record<string, unknown>>();

/**
 * Ambil artikel RSS ≤48 jam untuk satu kategori.
 * Error per-feed terisolasi — satu feed gagal tidak menggagalkan seluruh kategori.
 * Acuan: TRD-02 §4
 */
export async function ingestCategory(
  category: CategoryId,
): Promise<RssArticle[]> {
  const feeds = config.pipeline.rssFeeds[category];
  if (!feeds || feeds.length === 0) return [];

  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const articles: RssArticle[] = [];

  for (const url of feeds) {
    try {
      const feed = await parser.parseURL(url);
      for (const item of feed.items ?? []) {
        const published = item.pubDate ? new Date(item.pubDate) : null;
        if (!published || published.getTime() < cutoff) continue;

        articles.push({
          title: item.title ?? "",
          url: item.link ?? "",
          published,
          summary: item.contentSnippet ?? item.summary ?? "",
        });
      }
    } catch (err) {
      console.warn(`[rss] Failed to parse feed for ${category}: ${url}`, err);
    }
  }

  return articles;
}

export function hashSourceId(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const chr = url.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return `src_${Math.abs(hash).toString(16)}`;
}
