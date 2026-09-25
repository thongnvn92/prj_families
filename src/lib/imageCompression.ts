export const MAX_IMAGE_BASE64_BYTES = 10 * 1024 * 1024;
const MAX_SOURCE_FILE_BYTES = 25 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;

export function getBase64ByteLength(value: string): number {
  const base64 = value.includes(",") ? value.slice(value.indexOf(",") + 1) : value;
  return Math.ceil((base64.length * 3) / 4);
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Không thể đọc tệp ảnh."));
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Tệp ảnh không hợp lệ."));
    image.src = source;
  });
}

export async function compressImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Vui lòng chọn đúng định dạng ảnh.");
  if (file.size > MAX_SOURCE_FILE_BYTES) throw new Error("Ảnh gốc vượt quá 25MB. Vui lòng chọn ảnh nhỏ hơn.");
  const source = await readFile(file);
  const image = await loadImage(source);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Trình duyệt không hỗ trợ nén ảnh.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  for (const quality of [0.82, 0.72, 0.62, 0.52, 0.42, 0.32]) {
    const compressed = canvas.toDataURL("image/jpeg", quality);
    if (getBase64ByteLength(compressed) < MAX_IMAGE_BASE64_BYTES) return compressed;
  }
  throw new Error("Ảnh sau khi nén vẫn lớn hơn 10MB.");
}
