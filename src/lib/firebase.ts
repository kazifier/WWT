/**
 * Firebase integration. The web config is public by design — protection comes
 * from the security rules in firestore.rules and storage.rules, not secrecy.
 * Every function degrades to local browser storage when the project is not
 * configured, so the site is fully usable before Firebase is provisioned.
 */
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, listAll, type FirebaseStorage } from "firebase/storage";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(config.apiKey && config.projectId);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

function init() {
  if (!firebaseConfigured) return null;
  if (!app) {
    app = getApps().length ? getApps()[0] : initializeApp(config);
    db = getFirestore(app);
    storage = getStorage(app);
  }
  return { db: db!, storage: storage! };
}

export interface DocumentRecord {
  id?: string;
  name: string;
  category: string;
  size: number;
  url: string;
  uploadedAt: string;
  note?: string;
}

export interface CommentRecord {
  id?: string;
  target: string;
  author: string;
  body: string;
  createdAt: string;
}

const LS_DOCS = "ramsis.wwt.docs";
const LS_COMMENTS = "ramsis.wwt.comments";
const LS_SCENARIO = "ramsis.wwt.scenario";

function localGet<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "[]") as T[];
  } catch {
    return [];
  }
}

function localSet<T>(key: string, rows: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(rows));
}

/** Upload a project document to Firebase Storage and record its metadata. */
export async function uploadDocument(file: File, category: string, note = ""): Promise<DocumentRecord> {
  const conn = init();
  if (!conn) {
    // Local fallback: keep the metadata and a data URL so the UI still works.
    const url = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
    const record: DocumentRecord = {
      name: file.name,
      category,
      size: file.size,
      url,
      uploadedAt: new Date().toISOString(),
      note,
    };
    localSet(LS_DOCS, [record, ...localGet<DocumentRecord>(LS_DOCS)]);
    return record;
  }
  const path = `projects/B047/${category}/${Date.now()}-${file.name}`;
  const storageRef = ref(conn.storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  const record: DocumentRecord = {
    name: file.name,
    category,
    size: file.size,
    url,
    uploadedAt: new Date().toISOString(),
    note,
  };
  await addDoc(collection(conn.db, "b047_documents"), { ...record, createdAt: serverTimestamp() });
  return record;
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  const conn = init();
  if (!conn) return localGet<DocumentRecord>(LS_DOCS);
  try {
    const snap = await getDocs(query(collection(conn.db, "b047_documents"), orderBy("uploadedAt", "desc"), limit(100)));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DocumentRecord, "id">) }));
  } catch {
    return [];
  }
}

export async function addComment(target: string, author: string, body: string): Promise<CommentRecord> {
  const conn = init();
  const record: CommentRecord = { target, author, body, createdAt: new Date().toISOString() };
  if (!conn) {
    localSet(LS_COMMENTS, [record, ...localGet<CommentRecord>(LS_COMMENTS)]);
    return record;
  }
  const doc = await addDoc(collection(conn.db, "b047_comments"), { ...record, createdAt: serverTimestamp() });
  return { id: doc.id, ...record };
}

export async function listComments(target?: string): Promise<CommentRecord[]> {
  const conn = init();
  if (!conn) {
    const rows = localGet<CommentRecord>(LS_COMMENTS);
    return target ? rows.filter((r) => r.target === target) : rows;
  }
  try {
    const snap = await getDocs(query(collection(conn.db, "b047_comments"), orderBy("createdAt", "desc"), limit(200)));
    const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CommentRecord, "id">) }));
    return target ? rows.filter((r) => r.target === target) : rows;
  } catch {
    return [];
  }
}

/** Persist the selected discharge option and any user overrides. */
export async function saveScenario(scenario: Record<string, unknown>) {
  const conn = init();
  if (!conn) {
    if (typeof window !== "undefined") window.localStorage.setItem(LS_SCENARIO, JSON.stringify(scenario));
    return;
  }
  await addDoc(collection(conn.db, "b047_scenarios"), { ...scenario, createdAt: serverTimestamp() });
}
