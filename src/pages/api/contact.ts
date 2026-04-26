import type { APIRoute } from "astro";
import { validateContactPayload } from "@/lib/forms/contact";

export const POST: APIRoute = async ({ request }) => {
  const recipient = import.meta.env.CONTACT_FORM_RECIPIENT ?? import.meta.env.CONTACT_EMAIL;
  const form = await request.formData();
  const payload = {
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    phone: String(form.get("phone") ?? ""),
    message: String(form.get("message") ?? ""),
  };

  const errors = validateContactPayload(payload);

  if (errors.length > 0) {
    return new Response(JSON.stringify({ ok: false, errors }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!recipient) {
    return new Response(JSON.stringify({ ok: false, errors: ["Falta configurar CONTACT_FORM_RECIPIENT o CONTACT_EMAIL."] }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      message: `Solicitud recibida. Te responderemos desde ${recipient}.`,
      recipient,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
};
