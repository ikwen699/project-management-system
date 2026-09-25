"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CheckCircle2,
  Clock,
  LinkIcon,
  PartyPopper,
  UserPlus,
  XCircle,
} from "lucide-react";

interface InviteInfo {
  email: string;
  role: string;
  teamRole: string;
  status: string;
  expiresAt: string | null;
  organizationName: string | null;
  teamName: string | null;
  inviterName: string | null;
}

function InvitePageInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const { data: session, status } = useSession();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [inviteExpired, setInviteExpired] = useState(false);
  const [state, setState] = useState<
    "loading" | "notfound" | "ready" | "accepting" | "accepted" | "error"
  >("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setState("notfound");
      return;
    }
    fetch(`/api/invites/${token}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("not_found");
        const data = await res.json();
        setInvite(data.invite);
        setInviteExpired(
          data.invite?.status === "EXPIRED" ||
            (!!data.invite?.expiresAt &&
              new Date(data.invite.expiresAt).getTime() < Date.now())
        );
        setState("ready");
      })
      .catch(() => setState("notfound"));
  }, [token]);

  // Auto-accept when the signed-in email matches the invite.
  useEffect(() => {
    if (
      state === "ready" &&
      invite &&
      status === "authenticated" &&
      session?.user?.email &&
      invite.status === "PENDING"
    ) {
      const signedEmail = session.user.email.trim().toLowerCase();
      const invitedEmail = invite.email.trim().toLowerCase();
      if (signedEmail === invitedEmail) {
        setState("accepting");
        fetch(`/api/invites/${token}/accept`, { method: "POST" })
          .then(async (res) => {
            if (!res.ok) {
              const body = await res.json();
              throw new Error(body.error || "Could not accept");
            }
            setState("accepted");
          })
          .catch((e) => {
            setError(e.message);
            setState("error");
          });
      }
    }
  }, [state, invite, status, session, token]);

  const expired =
    inviteExpired || invite?.status === "EXPIRED";

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Xora</h1>
        </div>

        <div className="bg-white rounded-xl border border-border p-6 text-center">
          {state === "loading" && <p className="text-muted-foreground">Loading invitation…</p>}

          {state === "notfound" && (
            <>
              <XCircle className="h-10 w-10 mx-auto text-destructive mb-3" />
              <h2 className="text-lg font-semibold">Invitation not found</h2>
              <p className="text-sm text-muted-foreground mt-1">
                This link is invalid or has already been removed.
              </p>
            </>
          )}

          {state === "ready" && invite && invite.status !== "PENDING" && (
            <>
              <Clock className="h-10 w-10 mx-auto text-amber-500 mb-3" />
              <h2 className="text-lg font-semibold">
                {invite.status === "ACCEPTED"
                  ? "Invitation already accepted"
                  : invite.status === "DECLINED"
                    ? "Invitation declined"
                    : "Invitation expired"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Ask the sender to send you a new invite.
              </p>
            </>
          )}

          {state === "ready" && expired && invite?.status === "PENDING" && (
            <>
              <Clock className="h-10 w-10 mx-auto text-amber-500 mb-3" />
              <h2 className="text-lg font-semibold">Invitation expired</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Ask the sender to send you a new invite.
              </p>
            </>
          )}

          {state === "accepted" && (
            <>
              <PartyPopper className="h-10 w-10 mx-auto text-green-600 mb-3" />
              <h2 className="text-lg font-semibold">You&apos;re in!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                You joined <strong>{invite?.organizationName}</strong>
                {invite?.teamName ? ` in the ${invite.teamName} team` : ""}.
              </p>
              <Link
                href="/dashboard"
                className="inline-block mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
              >
                Go to dashboard
              </Link>
            </>
          )}

          {state === "error" && (
            <>
              <XCircle className="h-10 w-10 mx-auto text-destructive mb-3" />
              <h2 className="text-lg font-semibold">Couldn&apos;t accept</h2>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </>
          )}

          {state === "ready" && invite && invite.status === "PENDING" && !expired && (
            <>
              <UserPlus className="h-10 w-10 mx-auto text-primary mb-3" />
              <h2 className="text-lg font-semibold">
                Invitation to {invite.organizationName ?? "an organisation"}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                {invite.inviterName ?? "Someone"} invited you
                {invite.teamName ? ` to join the ${invite.teamName} team` : ""}.
                <br />
                The invite was sent to{" "}
                <span className="font-medium text-foreground">{invite.email}</span>.
              </p>

              {status === "loading" && (
                <p className="mt-4 text-sm text-muted-foreground">Checking your session…</p>
              )}

              {status === "authenticated" &&
                session?.user?.email &&
                session.user.email.trim().toLowerCase() !==
                  invite.email.trim().toLowerCase() && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                    You&apos;re signed in as {session.user.email}, but this
                    invite is for {invite.email}. Sign out and sign in with the
                    invited email, then open this link again.
                  </div>
                )}

              {status === "unauthenticated" && (
                <div className="flex flex-col gap-2 mt-5">
                  <Link
                    href={`/login?redirect=${encodeURIComponent(`/invite?token=${token}`)}`}
                    className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90"
                  >
                    Sign in to accept
                  </Link>
                  <Link
                    href={`/register?redirect=${encodeURIComponent(`/invite?token=${token}`)}`}
                    className="w-full border border-border py-2.5 rounded-lg text-sm font-medium hover:bg-muted"
                  >
                    Create an account first
                  </Link>
                </div>
              )}
            </>
          )}

          {state === "accepting" && (
            <>
              <div className="h-10 w-10 mx-auto mb-3 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-primary animate-pulse" />
              </div>
              <h2 className="text-lg font-semibold">Joining…</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Setting you up as a member.
              </p>
            </>
          )}
        </div>

        <div className="mt-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
          <LinkIcon className="h-3 w-3" /> Invite links are private — don&apos;t
          share them.
        </div>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={null}>
      <InvitePageInner />
    </Suspense>
  );
}