import type { APIRoute } from "astro";
import nodemailer from "nodemailer";
import { validateContactPayload } from "@/lib/forms/contact";
import { siteConfig } from "@/config/site";

const Logo = `https://res.cloudinary.com/df9taulat/image/upload/q_auto/f_auto/v1779162804/logo_fk5bey.webp`;
const logoAttachment = {
  filename: "logo.svg",
  content: Logo,
  contentType: "image/svg+xml",
  cid: "mm-logo",
};

function buildContactNotificationHtml(payload: { name: string; email: string; phone: string; message: string }) {
  return `
    <div style="font-family: Inter, system-ui, sans-serif; color: #111827; padding: 24px; background: #f3f4f6;">
      <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 80px rgba(15, 23, 42, 0.1);">
        <div style="background: #0f766e; padding: 32px; text-align: center; color: white;">
          <img src="${Logo}" alt="${siteConfig.name}" width="200" style="display:block; margin:0 auto 16px;" />
          <h1 style="margin: 0; font-size: 1.9rem;">Nuevo contacto desde el formulario</h1>
        </div>
        <div style="padding: 32px;">
          <p style="margin: 0 0 20px; font-size: 1rem; line-height: 1.75;">Has recibido un nuevo mensaje desde el sitio web.</p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr><td style="padding: 10px 0; font-weight: 700; width: 120px;">Nombre</td><td style="padding: 10px 0;">${payload.name}</td></tr>
            <tr><td style="padding: 10px 0; font-weight: 700;">Email</td><td style="padding: 10px 0;">${payload.email}</td></tr>
            <tr><td style="padding: 10px 0; font-weight: 700;">Teléfono</td><td style="padding: 10px 0;">${payload.phone || 'No proporcionado'}</td></tr>
          </table>
          <div style="background: #f8fafc; border-radius: 16px; padding: 18px; color: #334155;">
            <p style="margin: 0 0 8px; font-weight: 700;">Mensaje</p>
            <p style="margin: 0; white-space: pre-wrap;">${payload.message}</p>
          </div>
        </div>
        <div style="background: #f8fafc; padding: 24px; color: #475569; font-size: 0.95rem;">
          <p style="margin: 0 0 6px;"><strong>${siteConfig.name}</strong></p>
          <p style="margin: 0;">${siteConfig.address}</p>
          <p style="margin: 0;">Tel: ${siteConfig.phone}</p>
          <p style="margin: 0;">Email: ${siteConfig.email}</p>
        </div>
      </div>
    </div>
  `;
}

function buildClientConfirmationHtml(payload: { name: string; email: string; phone: string; message: string }) {
  return `
    <div style="font-family: Inter, system-ui, sans-serif; color: #111827; padding: 24px; background: #eef2ff;">
      <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 80px rgba(15, 23, 42, 0.08);">
        <div style="background: #deba43; padding: 32px; text-align: center; color: white;">
          <img src="${Logo}" alt="${siteConfig.name}" width="200" style="display:block; margin:0 auto 16px;" />
          <h1 style="margin: 0; font-size: 2rem;">¡Gracias por escribirnos!</h1>
          <p style="margin: 12px 0 0; font-size: 1rem; line-height: 1.7;">Hemos recibido tu mensaje y pronto uno de nuestros asesores te contactará.</p>
        </div>
        <div style="padding: 32px; color: #1f2937;">
          <p style="margin: 0 0 18px;">Hola ${payload.name},</p>
          <p style="margin: 0 0 18px; line-height: 1.8;">Gracias por contactarte con <strong>${siteConfig.name}</strong>. Este es un acuse de recibo de tu solicitud.</p>
          <div style="background: #f8fafc; border-radius: 18px; padding: 20px; margin-bottom: 24px; color: #334155;">
            <p style="margin: 0 0 10px; font-weight: 700;">Tu mensaje</p>
            <p style="margin: 0; white-space: pre-wrap;">${payload.message}</p>
          </div>
          <p style="margin: 0 0 12px;">Si deseas, también te podemos contactar por teléfono:</p>
          <p style="margin: 0 0 8px;"><strong>Teléfono:</strong> ${siteConfig.phone}</p>
          <p style="margin: 0 0 22px;"><strong>Email:</strong> ${siteConfig.email}</p>
          <p style="margin: 0;">Gracias nuevamente por confiar en ${siteConfig.legalName}. Estamos a tu disposición.</p>
        </div>
        <div style="background: #f3f4f6; padding: 24px; color: #475569; font-size: 0.95rem; text-align: center;">
          <p style="margin: 0; font-weight: 700;">${siteConfig.name}</p>
          <p style="margin: 8px 0 0;">${siteConfig.address}</p>
          <p style="margin: 8px 0 0;">Visita: <a href="${siteConfig.url}" style="color: #dc2626; text-decoration: none;">${siteConfig.url}</a></p>
        </div>
      </div>
    </div>
  `;
}

export const POST: APIRoute = async ({ request }) => {
  const recipient = import.meta.env.CONTACT_FORM_RECIPIENT ?? import.meta.env.CONTACT_EMAIL;
  const sender = import.meta.env.CONTACT_EMAIL;
  const emailPassword = import.meta.env.EMAIL_PASSWORD;
  const smtpHost = import.meta.env.SMTP_HOST ?? "smtp.gmail.com";
  const smtpPort = Number(import.meta.env.SMTP_PORT ?? 465);
  const smtpSecure = import.meta.env.SMTP_SECURE ? import.meta.env.SMTP_SECURE === "true" : true;

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

  if (!recipient || !sender) {
    return new Response(
      JSON.stringify({ ok: false, errors: ["Falta configurar CONTACT_FORM_RECIPIENT o CONTACT_EMAIL."] }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  if (!emailPassword) {
    return new Response(
      JSON.stringify({ ok: false, errors: ["Falta configurar EMAIL_PASSWORD para el envío de correos."] }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: sender,
        pass: emailPassword,
      },
    });

    await transporter.sendMail({
      from: `${siteConfig.name} <${sender}>`,
      to: recipient,
      replyTo: payload.email,
      subject: "Nuevo mensaje desde el formulario de contacto",
      text: `Nombre: ${payload.name}\nEmail: ${payload.email}\nTeléfono: ${payload.phone}\n\nMensaje:\n${payload.message}`,
      html: buildContactNotificationHtml(payload),
      // attachments: [logoAttachment],
    });

    if (payload.email) {
      await transporter.sendMail({
        from: `${siteConfig.name} <${sender}>`,
        to: payload.email,
        subject: `Gracias por contactarnos, ${payload.name}`,
        text: `Hola ${payload.name},\n\nGracias por contactarte con ${siteConfig.name}. Hemos recibido tu mensaje y pronto nos comunicaremos contigo.\n\nMensaje recibido:\n${payload.message}\n\n${siteConfig.name}\n${siteConfig.phone}\n${siteConfig.email}`,
        html: buildClientConfirmationHtml(payload),
        // attachments: [logoAttachment],
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
  } catch (error) {
    console.error("Error enviando correo de contacto:", error);
    return new Response(
      JSON.stringify({ ok: false, errors: ["Error interno al enviar el correo. Intenta de nuevo más tarde."] }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
