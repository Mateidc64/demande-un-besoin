// E-mails automatiques (service Resend, clé RESEND_API_KEY dans Vercel).
// Chaque e-mail n'est envoyé qu'une fois : la base le « réserve » avec claim_booking_email().
// Si la clé manque ou si Resend échoue, on ne bloque jamais la page : on l'écrit dans les journaux.
import "server-only";
import { formatDateTime } from "@/lib/dates";
import { OFFERS, type OfferType } from "@/lib/offres";
import { createAdminClient } from "@/lib/supabase/admin";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://demande-un-besoin.vercel.app";
// Tant qu'on n'a pas de nom de domaine vérifié chez Resend, on envoie depuis l'adresse de test de Resend.
const FROM = process.env.EMAIL_FROM ?? "Demande à un voisin <onboarding@resend.dev>";

// Questions à poser, rappelées au chercheur dans l'e-mail de confirmation.
const CHECKLIST = [
  "Le bruit : la rue, les voisins, les bars, la circulation le soir et le week-end ?",
  "L'immeuble : état des parties communes, ambiance de la copropriété, gros travaux prévus ?",
  "Le logement : humidité, isolation, chauffage, exposition ?",
  "La sécurité : te sens-tu tranquille le soir dans le quartier ?",
  "Le quotidien : commerces, transports, écoles, stationnement ?",
  "Ce que l'annonce ne dit pas : ce qui t'a surpris en arrivant ?",
];

type BookingEmailInfo = {
  booking_id: string;
  seeker_id: string;
  seeker_first_name: string | null;
  resident_profile_id: string;
  resident_first_name: string | null;
  offer_type: OfferType;
  duration_minutes: number;
  starts_at: string;
  target_address: string;
  message: string | null;
  status: string;
  amount_cents: number;
  commission_cents: number;
  contact_info: string | null;
  refunded: boolean;
};

export type EmailKind = "paye" | "confirme" | "annule" | "rappel" | "avis";

function escapeHtml(text: string | null | undefined) {
  return (text ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function layout(title: string, body: string, cta = { href: "/mes-reservations", label: "Voir mes réservations" }) {
  return `<div style="font-family:Arial,sans-serif;background:#fbf7f2;padding:24px;color:#1b2733">
  <div style="max-width:560px;margin:auto;background:#ffffff;border-radius:16px;padding:24px">
    <p style="color:#f26a21;font-weight:bold;margin:0 0 16px">Demande à un voisin</p>
    <h1 style="color:#15364f;font-size:20px;margin:0 0 16px">${title}</h1>
    ${body}
    <p style="margin-top:24px"><a href="${SITE_URL}${cta.href}" style="background:#c94a0a;color:#ffffff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:bold">${cta.label}</a></p>
    <p style="color:#556372;font-size:12px;margin-top:24px">« Avant de signer, parle à quelqu'un qui habite déjà là. »</p>
  </div>
</div>`;
}

function p(text: string) {
  return `<p style="margin:0 0 12px;line-height:1.5">${text}</p>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("E-mail non envoyé (RESEND_API_KEY manquante) :", subject);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  if (!res.ok) console.error("Resend :", res.status, await res.text());
}

async function emailOf(userId: string) {
  const { data } = await createAdminClient().auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

function describe(b: BookingEmailInfo) {
  const offer = escapeHtml(OFFERS[b.offer_type].label);
  return b.offer_type === "question_ecrite" ? offer : `${offer}, ${escapeHtml(formatDateTime(b.starts_at))}`;
}

// Prépare les e-mails (destinataire + contenu) d'un événement sur une réservation.
function buildEmails(kind: EmailKind, b: BookingEmailInfo) {
  const seeker = escapeHtml(b.seeker_first_name ?? "");
  const resident = escapeHtml(b.resident_first_name ?? "");
  const what = describe(b);
  const share = (b.amount_cents - b.commission_cents) / 100;
  const list: { to: "chercheur" | "habitant"; subject: string; html: string }[] = [];

  if (kind === "paye") {
    list.push({
      to: "chercheur",
      subject: `Paiement reçu : ta demande est envoyée à ${b.resident_first_name ?? "l'habitant"}`,
      html: layout(
        "Paiement reçu ✅",
        p(`Ta demande (${what}) est envoyée à ${resident}. Tu recevras un e-mail dès qu'il ou elle l'accepte.`) +
          p("S'il refuse, tu es remboursé en totalité."),
      ),
    });
    list.push({
      to: "habitant",
      subject: `Nouvelle demande de ${b.seeker_first_name ?? "un chercheur"}`,
      html: layout(
        "Tu as une nouvelle demande",
        p(`${seeker} souhaite : ${what}.`) +
          p(`Logement qui l'intéresse : ${escapeHtml(b.target_address)}`) +
          (b.message ? p(`Son message : « ${escapeHtml(b.message)} »`) : "") +
          p(`Tu recevras <strong>${share} €</strong> une fois l'échange réalisé. Accepte ou refuse la demande depuis le site.`),
      ),
    });
  }

  if (kind === "confirme") {
    const checklist = `<ul style="margin:0 0 12px;padding-left:20px;line-height:1.6">${CHECKLIST.map((q) => `<li>${q}</li>`).join("")}</ul>`;
    list.push({
      to: "chercheur",
      subject: `C'est confirmé avec ${b.resident_first_name ?? "ton voisin"} !`,
      html: layout(
        "Ta réservation est confirmée 🎉",
        p(`${resident} a accepté : ${what}.`) +
          p(`Contact de ${resident} : <strong>${escapeHtml(b.contact_info)}</strong>`) +
          p("Quelques questions à poser pendant l'échange :") +
          checklist +
          p("Après l'échange, clique sur « L'échange a bien eu lieu » puis laisse un avis."),
      ),
    });
  }

  if (kind === "annule") {
    const refund = b.refunded ? "Tu es remboursé en totalité (le délai dépend de ta banque)." : "Annulation à moins de 24 h : pas de remboursement.";
    list.push({
      to: "chercheur",
      subject: "Ta réservation est annulée",
      html: layout("Réservation annulée", p(`La réservation (${what}) avec ${resident} est annulée.`) + p(refund)),
    });
    list.push({
      to: "habitant",
      subject: "Une réservation est annulée",
      html: layout(
        "Réservation annulée",
        p(`La réservation (${what}) avec ${seeker} est annulée.`) +
          p(b.refunded ? "Le chercheur est remboursé." : `Annulation tardive : tu reçois quand même ${share} €.`),
      ),
    });
  }

  if (kind === "rappel") {
    list.push({
      to: "chercheur",
      subject: `Rappel : ton échange avec ${b.resident_first_name ?? "ton voisin"}`,
      html: layout(
        "C'est bientôt !",
        p(`Rappel : ${what} avec ${resident}.`) + p(`Contact : <strong>${escapeHtml(b.contact_info)}</strong>`),
      ),
    });
    list.push({
      to: "habitant",
      subject: `Rappel : ton échange avec ${b.seeker_first_name ?? "un chercheur"}`,
      html: layout(
        "C'est bientôt !",
        p(`Rappel : ${what} avec ${seeker}.`) + p(`Logement qui l'intéresse : ${escapeHtml(b.target_address)}`),
      ),
    });
  }

  if (kind === "avis") {
    list.push({
      to: "chercheur",
      subject: `Comment s'est passé ton échange avec ${b.resident_first_name ?? "ton voisin"} ?`,
      html: layout("Laisse un avis", p(`Ton avis aide les prochains chercheurs à choisir. Note ${resident} en un clic.`)),
    });
    list.push({
      to: "habitant",
      subject: `Comment s'est passé ton échange avec ${b.seeker_first_name ?? "un chercheur"} ?`,
      html: layout("Laisse un avis", p(`Note ${seeker} : ça aide toute la communauté.`)),
    });
  }
  return list;
}

// Envoie les e-mails d'un événement, une seule fois par réservation et par type.
export async function sendBookingEmails(bookingId: string, kind: EmailKind) {
  try {
    const admin = createAdminClient();
    const { data: claimed, error } = await admin.rpc("claim_booking_email", {
      p_booking_id: bookingId,
      p_kind: kind,
    });
    if (error) throw new Error(error.message);
    if (!claimed) return;

    const { data } = await admin.rpc("booking_email_info", { p_booking_id: bookingId });
    const info = (data as BookingEmailInfo[] | null)?.[0];
    if (!info) return;

    for (const email of buildEmails(kind, info)) {
      const to = await emailOf(email.to === "chercheur" ? info.seeker_id : info.resident_profile_id);
      if (to) await sendEmail(to, email.subject, email.html);
    }
  } catch (e) {
    console.error("sendBookingEmails", kind, bookingId, e);
  }
}

// Tâche quotidienne : rappels de la veille et demandes d'avis.
export async function sendDueEmails() {
  const { data, error } = await createAdminClient().rpc("bookings_due_emails");
  if (error) throw new Error(error.message);
  const tasks = (data ?? []) as { booking_id: string; kind: EmailKind }[];
  for (const t of tasks) await sendBookingEmails(t.booking_id, t.kind);
  return tasks.length;
}

// Nouveau message dans une conversation : on prévient l'autre participant,
// au plus une fois toutes les 30 minutes par conversation (pour ne pas spammer).
export async function sendMessageEmail(conversationId: string, authorId: string, body: string) {
  try {
    const admin = createAdminClient();
    const { data: claimed, error } = await admin.rpc("claim_conversation_email", { p_conversation_id: conversationId });
    if (error) throw new Error(error.message);
    if (!claimed) return;

    const { data } = await admin.rpc("conversation_email_info", { p_conversation_id: conversationId });
    const info = (
      data as { seeker_id: string; seeker_first_name: string | null; resident_profile_id: string; resident_first_name: string | null }[] | null
    )?.[0];
    if (!info) return;

    const authorIsSeeker = authorId === info.seeker_id;
    const authorName = (authorIsSeeker ? info.seeker_first_name : info.resident_first_name) ?? "Quelqu'un";
    const to = await emailOf(authorIsSeeker ? info.resident_profile_id : info.seeker_id);
    if (!to) return;
    const preview = body.length > 300 ? `${body.slice(0, 300)}…` : body;
    await sendEmail(
      to,
      `Nouveau message de ${authorName}`,
      layout(
        `${escapeHtml(authorName)} t'a écrit`,
        p(`<em style="white-space:pre-line">« ${escapeHtml(preview)} »</em>`) + p("Réponds directement sur le site."),
        { href: `/messages/${conversationId}`, label: "Répondre" },
      ),
    );
  } catch (e) {
    console.error("sendMessageEmail", conversationId, e);
  }
}
