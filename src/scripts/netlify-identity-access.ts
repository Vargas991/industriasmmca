import { acceptInvite, updateUser } from "@netlify/identity";

const form = document.querySelector<HTMLFormElement>("[data-identity-form]");
const message = document.querySelector<HTMLElement>("[data-identity-message]");
const title = document.querySelector<HTMLElement>("[data-identity-title]");
const submitButton = document.querySelector<HTMLButtonElement>("[data-identity-submit]");

const mode = window.sessionStorage.getItem("netlify-identity-mode");
const inviteToken = window.sessionStorage.getItem("netlify-identity-invite-token");

function setMessage(text: string, tone: "error" | "success" | "info" = "info"): void {
  if (!message) return;
  message.textContent = text;
  message.dataset.tone = tone;
}

if (title) {
  title.textContent =
    mode === "invite" ? "Crea tu clave de acceso" : "Define una nueva contrasena";
}

if (submitButton) {
  submitButton.textContent = mode === "invite" ? "Activar cuenta" : "Guardar nueva contrasena";
}

if (!form || !mode) {
  setMessage("No se encontro un proceso de acceso activo. Solicita un nuevo enlace.", "error");
} else {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const password = String(data.get("password") ?? "");
    const passwordConfirm = String(data.get("passwordConfirm") ?? "");

    if (!password || password.length < 8) {
      setMessage("La contrasena debe tener al menos 8 caracteres.", "error");
      return;
    }

    if (password !== passwordConfirm) {
      setMessage("Las contrasenas no coinciden.", "error");
      return;
    }

    setMessage("Procesando...", "info");
    if (submitButton) submitButton.disabled = true;

    try {
      if (mode === "invite") {
        if (!inviteToken) {
          throw new Error("No se encontro el token de invitacion.");
        }

        await acceptInvite(inviteToken, password);
      } else {
        await updateUser({ password });
      }

      window.sessionStorage.removeItem("netlify-identity-mode");
      window.sessionStorage.removeItem("netlify-identity-invite-token");
      setMessage("Acceso actualizado. Redirigiendo al CMS...", "success");
      window.location.replace("/admin/");
    } catch (error) {
      console.error("Netlify Identity access error", error);
      setMessage("No se pudo completar el proceso. Solicita un nuevo enlace e intenta otra vez.", "error");
      if (submitButton) submitButton.disabled = false;
    }
  });
}
