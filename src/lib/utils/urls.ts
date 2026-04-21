import { siteConfig } from "@/config/site";

export function toAbsoluteUrl(path: string): string {
  if (path.startsWith("http")) {
    return path;
  }

  return new URL(path, siteConfig.url).toString();
}
