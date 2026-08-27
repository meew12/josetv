// Helper para subir archivos multipart al endpoint /api/upload (admin)
import { useAuth } from "./auth-store";

export async function uploadFile(file: File): Promise<string> {
  const token = useAuth.getState().user?.token;
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "Error al subir archivo");
  }
  return data.url as string;
}
