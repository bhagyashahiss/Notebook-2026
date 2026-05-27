type SendTemplateMessageArgs = {
  to: string;
  templateName: string;
  bodyParameters: string[];
};

type SendResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

function normalizeIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.startsWith("91") && digits.length === 12) {
    return digits;
  }
  return digits;
}

export async function sendTemplateMessage({
  to,
  templateName,
  bodyParameters,
}: SendTemplateMessageArgs): Promise<SendResult> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION ?? "v25.0";
  const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "en_US";

  if (!token || !phoneNumberId) {
    return { ok: false, error: "Missing WhatsApp configuration" };
  }

  const payload = {
    messaging_product: "whatsapp",
    to: normalizeIndianPhone(to),
    type: "template",
    template: {
      name: templateName,
      language: { code: templateLanguage },
      components: [
        {
          type: "body",
          parameters: bodyParameters.map((text) => ({ type: "text", text })),
        },
      ],
    },
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const data = (await response.json()) as {
      error?: { message?: string };
      messages?: Array<{ id: string }>;
    };

    if (!response.ok) {
      return {
        ok: false,
        error: data.error?.message ?? "WhatsApp API request failed",
      };
    }

    return { ok: true, messageId: data.messages?.[0]?.id ?? "unknown" };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown network error",
    };
  }
}
