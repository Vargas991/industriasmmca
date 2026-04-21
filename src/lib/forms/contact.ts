export interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export function validateContactPayload(payload: ContactPayload): string[] {
  const errors: string[] = [];

  if (!payload.name.trim()) errors.push("El nombre es obligatorio.");
  if (!payload.email.includes("@")) errors.push("El correo no es valido.");
  if (!payload.message.trim()) errors.push("El mensaje es obligatorio.");

  return errors;
}
