// Shared by the desk, the evidence board and the admin editor (client-safe: no database here; see lib/credentials.ts).
export type Credential = {
  id: string; name: string; year: string; location: string; place: string; role: string; number: string;
  color: string; darkColor: string; note: string; images: string[];
};

export const MAX_PHOTOS = 2; // the evidence board has two polaroids
export const photoUrl = (id: number) => `/api/credenciais/foto/${id}`;
export const isUpload = (src: string) => src.startsWith("/api/credenciais/foto/");
