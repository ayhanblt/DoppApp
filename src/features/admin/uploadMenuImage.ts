import { supabase } from "@/shared/api/supabase";

export type UploadMenuImageResult = {
  url: string;
  filename: string;
};

export async function uploadMenuImage(file: File): Promise<UploadMenuImageResult> {
  const ext = file.name.split('.').pop() || "jpg";
  const filename = `upload-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  
  const { data, error } = await supabase.storage
    .from('menu-images')
    .upload(filename, file, { upsert: false });

  if (error) {
    console.error(error);
    throw new Error("upload_failed");
  }

  const { data: urlData } = supabase.storage
    .from('menu-images')
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    filename: filename
  };
}
