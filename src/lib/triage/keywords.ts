// Kata kunci bahaya yang membuat laporan minimal berurgensi tinggi.
// Pola dicocokkan pada teks yang sudah dinormalisasi (huruf kecil, spasi rapi),
// dan mencakup singkatan serta salah ketik yang umum di pesan WhatsApp.

export type DangerKeyword = { label: string; pattern: RegExp };

const NOT = "(?:tidak|tdk|tak|gak|ga|gk|nggak|ngga|nggk|enggak|engga|g)";
const CAN = "(?:bisa|bs|bsa|dapat|dpt|mampu)";

export const DANGER_KEYWORDS: DangerKeyword[] = [
  {
    label: "terjebak",
    pattern: /\b(?:terjebak|trjebak|terjbak|terjebk|trjbk|kejebak|kjebak|terperangkap|terkurung)\b/,
  },
  {
    label: "tidak bisa keluar",
    pattern: new RegExp(
      `\\b${NOT}\\s*${CAN}\\s*(?:keluar|kluar|klr|kaluar|turun|mengungsi|ngungsi)\\b`,
    ),
  },
  { label: "hanyut", pattern: /\b(?:hanyut|hanyot|terbawa arus|terseret(?: arus)?)\b/ },
  { label: "tertimbun", pattern: /\b(?:tertimbun|ketimbun|tertimbon|tertimpa|ketimpa)\b/ },
  { label: "sesak napas", pattern: /\b(?:sesak|ssk)\s*(?:napas|nafas|nfs|nps)\b/ },
  {
    label: "pingsan",
    pattern: /\b(?:pingsan|pinsan|tidak sadarkan diri|tdk sadarkan diri|tak sadarkan diri)\b/,
  },
  { label: "luka parah", pattern: /\bluka\s*(?:parah|berat|serius)\b/ },
  {
    label: "pendarahan",
    pattern: /\b(?:pendarahan|perdarahan|pndarahan|berdarah banyak|darah banyak)\b/,
  },
  { label: "tenggelam", pattern: /\b(?:tenggelam|tnggelam|kelelep)\b/ },
  { label: "kejang", pattern: /\bkejang\b/ },
  {
    label: "air sampai atap",
    pattern: /\b(?:sampai|sampe|smp)\s*(?:ke\s*)?(?:atap|plafon|loteng)\b/,
  },
];
