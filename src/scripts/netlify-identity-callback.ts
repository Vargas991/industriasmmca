import { handleAuthCallback } from "@netlify/identity";

const callbackKeys = [
  "confirmation_token",
  "invite_token",
  "recovery_token",
  "token",
  "access_token",
];

function hasIdentityHash(hash: string): boolean {
  return callbackKeys.some((key) => hash.includes(`${key}=`));
}

async function processIdentityCallback(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  if (!hasIdentityHash(window.location.hash)) {
    return;
  }

  try {
    const result = await handleAuthCallback();

    if (!result) {
      return;
    }

    window.location.replace("/admin/");
  } catch (error) {
    console.error("Netlify Identity callback error", error);
  }
}

void processIdentityCallback();
