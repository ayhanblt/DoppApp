export type UploadMenuImageResult = {
  url: string;
  filename: string;
};

export async function uploadMenuImage(file: File): Promise<UploadMenuImageResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/admin/upload-image", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "upload_failed");
  }

  return response.json() as Promise<UploadMenuImageResult>;
}
