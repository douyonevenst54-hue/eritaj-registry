// Sends mail through Resend's HTTP API (no extra package needed).
// In development without RESEND_API_KEY, the login link prints to the terminal.

export async function sendLoginEmail(to: string, url: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not set");
    }
    console.log(`\n[dev] Login link for ${to}:\n${url}\n`);
    return;
  }

  const from = process.env.EMAIL_FROM ?? "Eritaj Registry <onboarding@resend.dev>";

  const text = [
    "Bonjou,",
    "",
    "Klike sou lyen sa a pou w konekte nan Eritaj Registry:",
    url,
    "",
    "Lyen an bon pou 15 minit, epi li sèvi yon sèl fwa.",
    "Si se pa ou ki te mande l, ou pa bezwen fè anyen.",
    "",
    "Click the link above to sign in. It expires in 15 minutes.",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#1d2451">
      <p>Bonjou,</p>
      <p>Klike sou bouton sa a pou w konekte nan Eritaj Registry:</p>
      <p><a href="${url}" style="display:inline-block;background:#1d2451;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none">Konekte</a></p>
      <p>Lyen an bon pou 15 minit, epi li sèvi yon sèl fwa. Si se pa ou ki te mande l, ou pa bezwen fè anyen.</p>
      <p style="color:#5a607d;font-size:14px">Click the button to sign in. The link expires in 15 minutes.</p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Lyen pou konekte nan Eritaj Registry",
      text,
      html,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend error ${res.status}: ${await res.text()}`);
  }
}
