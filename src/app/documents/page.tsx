"use client";

import { useEffect, useRef, useState } from "react";
import { Card, SectionTitle, Badge, Callout, nf } from "@/components/ui";
import {
  firebaseConfigured,
  uploadDocument,
  listDocuments,
  addComment,
  listComments,
  type DocumentRecord,
  type CommentRecord,
} from "@/lib/firebase";

const categories = [
  "RFQ and clarifications",
  "Design basis",
  "Vendor quotations",
  "Datasheets",
  "Drawings and 3D model",
  "Calculations",
  "Inspection and test plans",
  "Correspondence",
];

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [category, setCategory] = useState(categories[0]);
  const [note, setNote] = useState("");
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    setDocs(await listDocuments());
    setComments(await listComments());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onUpload(file: File) {
    setBusy(true);
    setError(null);
    try {
      await uploadDocument(file, category, note);
      setNote("");
      if (fileRef.current) fileRef.current.value = "";
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onComment() {
    if (!body.trim()) return;
    setBusy(true);
    try {
      await addComment("documents", author.trim() || "Engineer", body.trim());
      setBody("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the comment.");
    } finally {
      setBusy(false);
    }
  }

  const totalSize = docs.reduce((a, d) => a + d.size, 0);

  return (
    <div className="space-y-5">
      <SectionTitle eyebrow="Section 10" title="Project document store">
        Firebase Storage holds the files and Firestore holds the metadata and the review comments. Until the
        Firebase project is configured, the same interface runs against browser storage so nothing blocks the
        engineering work — but that fallback is per-browser and not a shared record.
      </SectionTitle>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={firebaseConfigured ? "green" : "amber"}>
          {firebaseConfigured ? "Firebase connected" : "Local fallback mode"}
        </Badge>
        <Badge tone="slate">{docs.length} files</Badge>
        <Badge tone="slate">{nf(totalSize / 1_048_576, 1)} MB</Badge>
        <Badge tone="slate">{comments.length} comments</Badge>
      </div>

      {!firebaseConfigured && (
        <Callout title="Firebase is not configured" tone="amber">
          Create a Firebase project, enable Firestore and Storage, then paste the web app config into the
          environment as <span className="font-mono text-mist-300">NEXT_PUBLIC_FIREBASE_API_KEY</span>,{" "}
          <span className="font-mono text-mist-300">NEXT_PUBLIC_FIREBASE_PROJECT_ID</span>,{" "}
          <span className="font-mono text-mist-300">NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</span> and the remaining
          config values listed in <span className="font-mono">.env.example</span>. Deploy the rules in{" "}
          <span className="font-mono">firestore.rules</span> and <span className="font-mono">storage.rules</span>{" "}
          before going live. The web config is public by design — the rules are what protect the data, so do not
          rely on obscurity.
        </Callout>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="p-4">
          <h3 className="text-[12.5px] font-semibold text-mist-200">Upload a document</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-mist-400">
            Files are stored under{" "}
            <span className="font-mono text-mist-300">projects/B047/&lt;category&gt;/&lt;timestamp&gt;-&lt;name&gt;</span>{" "}
            so the folder structure mirrors the document register.
          </p>
          <div className="mt-3 space-y-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 text-[11.5px] text-mist-200"
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional) — revision, transmittal number, scope"
              className="w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 text-[11.5px] text-mist-200 placeholder:text-mist-400/60"
            />
            <input
              ref={fileRef}
              type="file"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
              }}
              className="w-full cursor-pointer rounded border border-dashed border-ink-600 bg-ink-900/50 px-2 py-3 text-[11px] text-mist-400 file:mr-3 file:rounded file:border-0 file:bg-teal-500 file:px-2.5 file:py-1 file:text-[11px] file:font-semibold file:text-ink-950"
            />
            {busy && <div className="text-[11px] text-teal-300">Working…</div>}
            {error && <div className="text-[11px] text-rust">{error}</div>}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-[12.5px] font-semibold text-mist-200">Review comments</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-mist-400">
            Comments are written to the <span className="font-mono text-mist-300">b047_comments</span> collection
            with a server timestamp, so the review trail is chronological and cannot be back-dated by the client.
          </p>
          <div className="mt-3 space-y-2">
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Your name"
              className="w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 text-[11.5px] text-mist-200 placeholder:text-mist-400/60"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="Review comment on the dossier…"
              className="w-full resize-none rounded border border-ink-600 bg-ink-850 px-2 py-1.5 text-[11.5px] text-mist-200 placeholder:text-mist-400/60"
            />
            <button
              onClick={onComment}
              disabled={busy || !body.trim()}
              className="rounded bg-teal-500 px-3 py-1.5 text-[11.5px] font-semibold text-ink-950 disabled:bg-ink-700 disabled:text-mist-400"
            >
              Add comment
            </button>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-line px-4 py-2.5">
          <h3 className="text-[12.5px] font-semibold text-mist-200">Files</h3>
        </div>
        {docs.length === 0 ? (
          <div className="px-4 py-8 text-center text-[11.5px] text-mist-400">
            No files yet. The five issued documents are already summarised on the design basis page; upload the
            native PDFs here to keep the transmittals together.
          </div>
        ) : (
          <table className="grid-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Category</th>
                <th className="text-right">Size</th>
                <th>Uploaded</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id ?? d.name + d.uploadedAt}>
                  <td>
                    <a href={d.url} target="_blank" rel="noreferrer" className="text-teal-300 hover:underline">
                      {d.name}
                    </a>
                  </td>
                  <td>
                    <Badge tone="slate">{d.category}</Badge>
                  </td>
                  <td className="num">{nf(d.size / 1024, 0)} kB</td>
                  <td className="text-[10.5px] text-mist-400">{new Date(d.uploadedAt).toLocaleString()}</td>
                  <td className="text-[10.5px] text-mist-400">{d.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-line px-4 py-2.5">
          <h3 className="text-[12.5px] font-semibold text-mist-200">Comment trail</h3>
        </div>
        {comments.length === 0 ? (
          <div className="px-4 py-8 text-center text-[11.5px] text-mist-400">No comments recorded yet.</div>
        ) : (
          <div className="divide-y divide-line/70">
            {comments.map((c, i) => (
              <div key={c.id ?? i} className="px-4 py-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[11.5px] font-semibold text-mist-200">{c.author}</span>
                  <span className="font-mono text-[10px] text-mist-400">{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-mist-300">{c.body}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
