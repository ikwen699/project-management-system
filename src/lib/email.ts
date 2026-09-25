import { Resend } from "resend";
import { appBaseUrl } from "./payments";

export const INVITE_FROM = "Xora <invites@getxora.com>";

interface InviteEmailParams {
  to: string;
  token: string;
  organizationName: string;
  teamName?: string | null;
  inviterName: string;
}

export async function sendInviteEmail({
  to,
  token,
  organizationName,
  teamName,
  inviterName,
}: InviteEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not configured; invite email not sent");
    return false;
  }

  const inviteUrl = `${appBaseUrl()}/invite?token=${encodeURIComponent(token)}`;
  const teamLine = teamName ? ` into the <strong>${teamName}</strong> team` : "";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#2563eb;margin:0 0 12px">You're invited to join Xora!</h2>
      <p style="color:#334155;font-size:15px;line-height:1.6">
        ${inviterName} has invited you to join the
        <strong>${organizationName}</strong> organisation${teamLine}.
      </p>
      <a href="${inviteUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;margin:16px 0">
        Accept invitation
      </a>
      <p style="color:#64748b;font-size:13px;line-height:1.6">
        If you don't have an account yet, you'll be guided to create one, then
        you'll automatically join the organisation.
      </p>
      <p style="color:#94a3b8;font-size:12px">
        If the button doesn't work, copy and paste this link: ${inviteUrl}
      </p>
    </div>
  `;

  try {
    const resend = new Resend(apiKey);
    const res = await resend.emails.send({
      from: INVITE_FROM,
      to,
      subject: `Invitation to join ${organizationName}`,
      html,
    });
    return !res.error;
  } catch (error) {
    console.error("sendInviteEmail error:", error);
    return false;
  }
}