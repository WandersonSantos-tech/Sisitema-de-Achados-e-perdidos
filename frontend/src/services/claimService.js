
import { apiRequest } from "./api";

const BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api/v1"
).replace(/\/+$/, "");

async function obterPdf(id, assinado = false) {
  const token = localStorage.getItem("access_token");
  const tipo = assinado ? "pdf" : "preview";

  const response = await fetch(
    `${BASE_URL}/claims/claims/${id}/signature/${tipo}`,
    {
      method: "GET",
      headers: {
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    let mensagem = "Não foi possível carregar o PDF.";

    try {
      const data = await response.json();
      mensagem = data.detail || mensagem;
    } catch {
      // Mantém a mensagem padrão.
    }

    throw new Error(mensagem);
  }

  const blob = await response.blob();

  return URL.createObjectURL(blob);
}

export const claimService = {
  create: (itemId, data) =>
    apiRequest(`/claims/items/${itemId}/claims`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listByItem: (itemId) =>
    apiRequest(`/claims/items/${itemId}/claims`),

  myClaims: (page = 1) =>
    apiRequest(`/claims/my-claims?page=${page}`),

  updateStatus: (claimId, data) =>
    apiRequest(`/claims/claims/${claimId}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  startNegotiation: (id) =>
    apiRequest(`/claims/claims/${id}/start-negotiation`, {
      method: "POST",
    }),

  schedule: (id, pickup_at) =>
    apiRequest(`/claims/claims/${id}/pickup`, {
      method: "PATCH",
      body: JSON.stringify({ pickup_at }),
    }),

  requestSignature: (id) =>
    apiRequest(`/claims/claims/${id}/signature`, {
      method: "POST",
    }),

  signatureStatus: (id) =>
    apiRequest(`/claims/claims/${id}/signature`),

  acceptSignature: (id) =>
    apiRequest(`/claims/claims/${id}/signature/accept`, {
      method: "POST",
    }),

  rejectSignature: (id, reason) =>
    apiRequest(`/claims/claims/${id}/signature/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  signSignature: (id, image) =>
    apiRequest(`/claims/claims/${id}/signature/sign`, {
      method: "POST",
      body: JSON.stringify({
        consent: true,
        image,
      }),
    }),

  completeReturn: (id) =>
    apiRequest(`/claims/claims/${id}/return`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  signedDocuments: () =>
    apiRequest("/claims/signed-documents"),

  openReturnPdf: obterPdf,

  downloadSignedPdf: async (id) => {
    const url = await obterPdf(id, true);

    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = `termo-devolucao-${id}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    }
  },
};
