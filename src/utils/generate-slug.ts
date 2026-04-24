export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // spasi jadi "-"
    .replace(/[^\w-]+/g, "") // hapus karakter aneh
    .replace(/--+/g, "-"); // replace multiple "-" jadi satu
}