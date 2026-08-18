import { supabase } from "./supabase";

const BUCKET_NAME = "task-attachments";

export async function uploadFile(
  taskId: string,
  file: File
): Promise<{ fileUrl: string; fileName: string; fileType: string; fileSize: number }> {
  const path = `${taskId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, { contentType: file.type });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return {
    fileUrl: urlData.publicUrl,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  };
}

export async function deleteFile(fileUrl: string): Promise<void> {
  const url = new URL(fileUrl);
  const pathStart = url.pathname.indexOf(`${BUCKET_NAME}/`);
  if (pathStart === -1) return;

  const filePath = url.pathname.slice(pathStart + BUCKET_NAME.length + 1);
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);
  if (error) throw error;
}
