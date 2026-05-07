import type { SocialLink } from "@/types/common";
import { siteConfig } from "@/config/site";

export const socialLinks: SocialLink[] = [
  { label: "Instagram", href: "https://instagram.com/industriasmm" },
  { label: "Facebook", href: "https://facebook.com/industriasmm" },
  { label: "WhatsApp", href: `https://wa.me/${siteConfig.whatsappNumber}` },
];
