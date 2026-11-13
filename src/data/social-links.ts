import type { SocialLink } from "@/types/common";
import { siteConfig } from "@/config/site";

export const socialLinks: SocialLink[] = [
  { label: "Instagram", href: "https://instagram.com/industriasmm" },
  { label: "Facebook", href: "https://facebook.com/industriasmm" },
  { label: "WhatsApp", href: `https://wa.me/${siteConfig.whatsappNumber}?text=Hola%2C%20te%20escribo%20desde%20la%20p%C3%A1gina%20web%20y%20me%20gustar%C3%ADa%20conocer%20el%20precio%20de%20algunos%20de%20sus%20productos.%20%C2%BFPodr%C3%ADan%20brindarme%20m%C3%A1s%20informaci%C3%B3n%3F%20%C2%A1Gracias!` },
];
