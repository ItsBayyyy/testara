// Parser ekspor chat WhatsApp (Android dan iPhone, bahasa Indonesia dan Inggris).
// Fungsi murni: tidak menyentuh jaringan, dipakai di browser petugas dan di server.

export type ParsedMessage = {
  id: string;
  sender: string | null;
  /** Waktu lokal "YYYY-MM-DDTHH:mm", atau null jika format tidak dikenali. */
  sentAt: string | null;
  text: string;
};

export type ParseResult = {
  messages: ParsedMessage[];
  /** Pesan sistem, media, dan pesan dihapus yang dilewati. */
  skipped: number;
  format: "android" | "iphone" | "baris";
};

const INVISIBLE = /[​-‏‪-‮⁠﻿]/g;

// Android: "14/11/26 21.05 - Nama: pesan" atau "11/14/26, 9:05 PM - Name: msg"
const ANDROID =
  /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4}),?\s+(\d{1,2})[.:](\d{2})(?:[.:]\d{2})?(?:\s*([AaPp])\.?\s*[Mm]\.?)?\s+-\s+(.*)$/;
// iPhone: "[14/11/26 21.05.33] Nama: pesan" atau "[11/14/26, 9:05:33 PM] Name: msg"
const IPHONE =
  /^\[(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4}),?\s+(\d{1,2})[.:](\d{2})(?:[.:]\d{2})?(?:\s*([AaPp])\.?\s*[Mm]\.?)?\]\s+(.*)$/;

// Pesan yang bukan isi laporan, dalam bahasa Indonesia dan Inggris.
const SYSTEM_PATTERNS: RegExp[] = [
  /<?\s*media (tidak disertakan|omitted)\s*>?/i,
  /^(gambar|image|video|audio|stiker|sticker|gif|dokumen|document|kontak|contact|card)\s+(tidak disertakan|dihilangkan|omitted)$/i,
  /^<?(lampiran|attached):/i,
  /^(pesan ini (telah|sudah) dihapus|this message was deleted|anda menghapus pesan ini|you deleted this message)$/i,
  /^(null|<pesan ini diedit>|<this message was edited>)$/i,
  /terenkripsi secara end-to-end|end-to-end encrypted/i,
  /\b(bergabung menggunakan tautan undangan|joined using this group's invite link)\b/i,
  /\b(menambahkan|added|mengeluarkan|removed)\b.+$/i,
  /\b(keluar|left)$/i,
  /\b(mengubah (nama grup|subjek|deskripsi grup|ikon grup|foto grup)|changed (the group name|the subject|the group description|this group's icon))\b/i,
  /\b(membuat grup|created group)\b/i,
  /\b(sekarang menjadi admin|now an admin)\b/i,
  /\b(nomor telepon|changed their phone number|mengganti nomor)\b.*\b(baru|new number)\b/i,
];

const SENDER_SPLIT = /^([^:]{1,60}?):\s([\s\S]*)$/;

function toIsoLocal(
  a: number,
  b: number,
  year: number,
  hour: number,
  minute: number,
  ampm: string | undefined,
): string | null {
  // Hari/bulan: jika salah satu > 12 urutannya jelas; jika tidak, format AM/PM
  // (ekspor berbahasa Inggris AS) berarti bulan dulu, selain itu hari dulu.
  let day = a;
  let month = b;
  if (a > 12) {
    day = a;
    month = b;
  } else if (b > 12 || ampm) {
    day = b;
    month = a;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  let h = hour;
  if (ampm) {
    const pm = ampm.toLowerCase() === "p";
    if (h === 12) h = pm ? 12 : 0;
    else if (pm) h += 12;
  }
  if (h > 23 || minute > 59) return null;
  const y = year < 100 ? 2000 + year : year;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}-${pad(month)}-${pad(day)}T${pad(h)}:${pad(minute)}`;
}

type Header = { sentAt: string | null; rest: string };

function matchHeader(line: string, re: RegExp): Header | null {
  const m = re.exec(line);
  if (!m) return null;
  const [, a, b, y, hh, mm, ampm, rest] = m;
  return {
    sentAt: toIsoLocal(Number(a), Number(b), Number(y), Number(hh), Number(mm), ampm),
    rest: rest ?? "",
  };
}

export function isSystemText(text: string): boolean {
  const t = text.trim();
  if (t.length === 0) return true;
  return SYSTEM_PATTERNS.some((p) => p.test(t));
}

export function parseWhatsAppExport(input: string): ParseResult {
  const lines = input.replace(/\r\n?/g, "\n").replace(INVISIBLE, "").split("\n");

  const androidHits = lines.filter((l) => ANDROID.test(l)).length;
  const iphoneHits = lines.filter((l) => IPHONE.test(l)).length;

  if (androidHits === 0 && iphoneHits === 0) {
    const messages = lines
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !isSystemText(l))
      .map((text, i) => ({ id: `m${i + 1}`, sender: null, sentAt: null, text }));
    const skipped = lines.filter((l) => l.trim().length > 0).length - messages.length;
    return { messages, skipped, format: "baris" };
  }

  const format = iphoneHits > androidHits ? "iphone" : "android";
  const re = format === "iphone" ? IPHONE : ANDROID;

  type Draft = { sender: string | null; sentAt: string | null; text: string };
  const drafts: Draft[] = [];
  for (const line of lines) {
    const header = matchHeader(line, re);
    if (header) {
      const split = SENDER_SPLIT.exec(header.rest);
      // Baris tanpa "Nama:" adalah pesan sistem (mis. "Budi menambahkan Ani").
      drafts.push(
        split
          ? { sender: (split[1] ?? "").trim(), sentAt: header.sentAt, text: split[2] ?? "" }
          : { sender: null, sentAt: header.sentAt, text: `\u0000${header.rest}` },
      );
    } else if (drafts.length > 0) {
      const last = drafts[drafts.length - 1];
      if (last) last.text += `\n${line}`;
    }
  }

  const messages: ParsedMessage[] = [];
  let skipped = 0;
  for (const d of drafts) {
    const text = d.text.trim();
    if (d.sender === null || text.startsWith("\u0000") || isSystemText(text)) {
      skipped++;
      continue;
    }
    messages.push({ id: `m${messages.length + 1}`, sender: d.sender, sentAt: d.sentAt, text });
  }
  return { messages, skipped, format };
}

/** Bagi pesan menjadi batch agar satu panggilan AI tidak terlalu panjang. */
export function toBatches<T>(items: T[], size = 18): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
