import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import { useSession } from "@/entities/session";
import { routes } from "@/shared/config/routes";
import { Button, Input } from "@/shared/ui";

type ConversationRow = {
  id: number;
  applicationId: number;
  companyUserId: number;
  talentUserId: number;
  jobTitle: string;
  candidateName: string | null;
  candidateEmail: string;
  lastMessageAt: string | null;
};

type MessageRow = {
  id: number;
  conversationId: number;
  senderUserId: number;
  body: string;
  attachmentName: string | null;
  attachmentUrl: string | null;
  scheduledInterviewAt: string | null;
  createdAt: string;
};

function formatDateTime(value: string | null) {
  if (!value) return "Sin actividad";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "Sin actividad";
  return parsed.toLocaleString("es-CR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function getApiErrorMessage(status: number, data: any, fallback: string) {
  if (typeof data?.error?.message === "string" && data.error.message) return data.error.message;
  return `${fallback} (${status}).`;
}

export function TalentMessagesPage() {
  const session = useSession();
  const token = useMemo(() => localStorage.getItem("firststep.api.accessToken") ?? "", []);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);

  const [messageBody, setMessageBody] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null;

  async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      let data: any = null;
      try {
        data = await res.json();
      } catch {}
      throw new Error(getApiErrorMessage(res.status, data, "La operación no se pudo completar"));
    }
    return (await res.json()) as T;
  }

  function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
      reader.readAsDataURL(file);
    });
  }

  async function uploadConversationFile(conversationId: number, file: File) {
    const dataBase64 = await readFileAsDataUrl(file);
    return await fetchJson<{ url: string; file: { id: number; fileName: string; mimeType: string; sizeBytes: number } }>(
      `/api/conversations/${conversationId}/files`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type || null,
          dataBase64,
        }),
      },
    );
  }

  async function loadConversations() {
    const out = await fetchJson<{ conversations: ConversationRow[] }>("/api/talent/conversations");
    setConversations(out.conversations ?? []);
    if (!activeConversationId && out.conversations?.[0]) setActiveConversationId(out.conversations[0].id);
  }

  async function loadMessages(conversationId: number) {
    const out = await fetchJson<{ messages: MessageRow[] }>(`/api/talent/conversations/${conversationId}/messages`);
    setMessages(out.messages ?? []);
  }

  useEffect(() => {
    if (!token) {
      setError("No hay sesión válida. Vuelve a iniciar sesión.");
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        setError(null);
        await loadConversations();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!token || !activeConversationId) return;
    void loadMessages(activeConversationId).catch((e) => {
      setError(e instanceof Error ? e.message : String(e));
    });
  }, [activeConversationId, token]);

  async function handleSend() {
    const hasBody = Boolean(messageBody.trim());
    const hasAttachment = Boolean(attachmentUrl.trim() || attachmentFile);
    if (!token || !activeConversationId || (!hasBody && !hasAttachment) || isSending || isUploadingAttachment) return;
    setIsSending(true);
    setError(null);
    try {
      let finalAttachmentUrl = attachmentUrl.trim() || null;
      let finalAttachmentName = attachmentName.trim() || null;
      if (attachmentFile && !finalAttachmentUrl) {
        setIsUploadingAttachment(true);
        const uploaded = await uploadConversationFile(activeConversationId, attachmentFile);
        finalAttachmentUrl = uploaded.url;
        finalAttachmentName = finalAttachmentName || uploaded.file.fileName;
      }
      await fetchJson(`/api/talent/conversations/${activeConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: messageBody.trim() || "Adjunto",
          attachmentName: finalAttachmentName,
          attachmentUrl: finalAttachmentUrl,
        }),
      });
      setMessageBody("");
      setAttachmentName("");
      setAttachmentUrl("");
      setAttachmentFile(null);
      await Promise.all([loadMessages(activeConversationId), loadConversations()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSending(false);
      setIsUploadingAttachment(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#294266]">Mensajes</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Tus conversaciones</h1>
            <p className="mt-1 text-sm text-slate-500">
              Solo tú y la empresa que te contactó pueden ver estos mensajes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to={routes.opportunities}>
              <Button variant="secondary">Volver a oportunidades</Button>
            </Link>
            <Link to={routes.dashboard}>
              <Button variant="outline">Dashboard talento</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        {!token ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-900">No hay sesión válida</p>
            <p className="mt-2 text-sm text-slate-500">Inicia sesión para ver tus mensajes.</p>
          </div>
        ) : isLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            Cargando conversaciones...
          </div>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[320px,1fr]">
            <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Empresas</p>
              <div className="mt-3 space-y-3">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setActiveConversationId(conv.id)}
                    className={[
                      "w-full rounded-2xl border px-4 py-3 text-left transition",
                      activeConversationId === conv.id
                        ? "border-[#294266] bg-blue-50"
                        : "border-slate-200 bg-white hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <p className="text-sm font-semibold text-slate-900">{conv.candidateName || conv.candidateEmail}</p>
                    <p className="mt-1 text-xs text-slate-500">{conv.jobTitle}</p>
                    <p className="mt-2 text-[11px] text-slate-400">{formatDateTime(conv.lastMessageAt)}</p>
                  </button>
                ))}
                {!conversations.length ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    Aún no tienes conversaciones. Cuando una empresa te contacte, aparecerán aquí.
                  </div>
                ) : null}
              </div>
            </aside>

            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              {activeConversation ? (
                <>
                  <div className="border-b border-slate-100 px-6 py-4">
                    <h2 className="text-lg font-bold text-slate-900">{activeConversation.candidateName || activeConversation.candidateEmail}</h2>
                    <p className="mt-1 text-sm text-slate-500">{activeConversation.jobTitle}</p>
                  </div>
                  <div className="max-h-[460px] space-y-3 overflow-y-auto px-6 py-5">
                    {messages.map((msg) => (
                      <article
                        key={msg.id}
                        className={[
                          "max-w-xl rounded-2xl px-4 py-3 text-sm",
                          msg.senderUserId === activeConversation.companyUserId ? "bg-slate-100" : "bg-blue-50",
                        ].join(" ")}
                      >
                        <p className="text-slate-700">{msg.body}</p>
                        {msg.attachmentUrl ? (
                          <a
                            className="mt-2 inline-block text-xs font-semibold text-blue-700 underline"
                            href={msg.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {msg.attachmentName || "Adjunto"}
                          </a>
                        ) : null}
                        {msg.scheduledInterviewAt ? (
                          <p className="mt-2 text-xs text-emerald-700">
                            Entrevista programada: {formatDateTime(msg.scheduledInterviewAt)}
                          </p>
                        ) : null}
                        <p className="mt-2 text-[11px] text-slate-400">{formatDateTime(msg.createdAt)}</p>
                      </article>
                    ))}
                    {!messages.length ? <p className="text-sm text-slate-500">Aún no hay mensajes en esta conversación.</p> : null}
                  </div>
                  <div className="border-t border-slate-100 px-6 py-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      <Input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setAttachmentFile(file);
                          if (file) {
                            setAttachmentName((prev) => prev.trim() || file.name);
                            setAttachmentUrl("");
                          }
                        }}
                      />
                      <Input value={attachmentName} onChange={(e) => setAttachmentName(e.target.value)} placeholder="Nombre del archivo adjunto" />
                      <Input value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} placeholder="URL segura del archivo" />
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-[1fr,140px]">
                      <Input value={messageBody} onChange={(e) => setMessageBody(e.target.value)} placeholder="Escribe un mensaje" />
                      <Button onClick={() => void handleSend()} disabled={(!messageBody.trim() && !attachmentUrl.trim() && !attachmentFile) || isSending || isUploadingAttachment}>
                        {isUploadingAttachment ? "Subiendo..." : isSending ? "Enviando..." : "Enviar"}
                      </Button>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      Sesión: {session.userName ?? "Usuario"} · La plataforma solo expone estos mensajes a los participantes.
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex min-h-[420px] items-center justify-center px-6 text-center text-sm text-slate-500">
                  Selecciona una conversación para ver mensajes.
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
