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

    if (result.type === "recovery") {
      window.sessionStorage.setItem("netlify-identity-mode", "recovery");
      window.location.replace("/acceso/");
      return;
    }

    if (result.type === "invite" && result.token) {
      window.sessionStorage.setItem("netlify-identity-mode", "invite");
      window.sessionStorage.setItem("netlify-identity-invite-token", result.token);
      window.location.replace("/acceso/");
      return;
    }

    window.location.replace("/admin/");
  } catch (error) {
    console.error("Netlify Identity callback error", error);
  }
}

void processIdentityCallback();
