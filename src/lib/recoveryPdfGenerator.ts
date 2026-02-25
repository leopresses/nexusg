import jsPDF from "jspdf";
import type { ClientEvidence } from "@/hooks/useClientEvidences";

export interface RecoveryClientData {
  name: string;
  business_type: string;
  address: string | null;
  avatarSignedUrl?: string | null;
  placeSnapshot?: {
    rating?: number;
    user_ratings_total?: number;
    formatted_phone_number?: string;
    website?: string;
    url?: string;
  } | null;
}

export interface RecoveryPdfData {
  client: RecoveryClientData;
  evidences: { evidence: ClientEvidence; signedUrl: string | null }[];
  agencyName: string;
}

function translateType(type: string): string {
  const map: Record<string, string> = {
    cnpj: "CNPJ / Registro",
    licenca: "Licença / Alvará",
    conta_luz: "Conta de Luz",
    conta_agua: "Conta de Água",
    fachada: "Foto da Fachada",
    interior: "Foto Interior",
    outros: "Outros",
  };
  return map[type] || type;
}

export async function generateRecoveryPdf(data: RecoveryPdfData): Promise<jsPDF> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 0;

  // ===== COVER =====
  doc.setFillColor(220, 38, 38); // red-600
  doc.rect(0, 0, pageWidth, 50, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Pacote de Evidências", margin, 25);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Recuperação — Google Business Profile", margin, 36);

  doc.setFontSize(9);
  doc.text(data.agencyName, pageWidth - margin, 36, { align: "right" });

  // ===== CLIENT DATA =====
  y = 65;
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(data.client.name, margin, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(data.client.address || "Endereço não informado", margin, y);

  const snap = data.client.placeSnapshot;
  if (snap) {
    y += 7;
    const items: string[] = [];
    if (snap.formatted_phone_number) items.push(`Tel: ${snap.formatted_phone_number}`);
    if (snap.website) items.push(`Site: ${snap.website.substring(0, 50)}`);
    if (snap.rating) items.push(`Nota: ${snap.rating}/5`);
    if (items.length) doc.text(items.join("  •  "), margin, y);
    if (snap.url) {
      y += 6;
      doc.setTextColor(66, 133, 244);
      doc.text(`Google Maps: ${snap.url.substring(0, 70)}`, margin, y);
    }
  }

  // ===== EVIDENCES LIST =====
  y += 16;
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Evidências Anexadas", margin, y);
  y += 3;
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin + 50, y);
  y += 10;

  if (data.evidences.length === 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150, 150, 150);
    doc.text("Nenhuma evidência anexada.", margin, y);
    y += 10;
  } else {
    data.evidences.forEach((ev, i) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 18, 3, 3, "F");

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 40);
      doc.text(`${i + 1}. ${ev.evidence.title}`, margin + 4, y + 7);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(translateType(ev.evidence.type), margin + 4, y + 14);

      if (ev.evidence.notes) {
        doc.text(ev.evidence.notes.substring(0, 60), pageWidth / 2, y + 14);
      }

      y += 22;
    });

    // Try to embed images
    for (const ev of data.evidences) {
      if (!ev.signedUrl) continue;
      const isImage = /\.(jpg|jpeg|png|webp)$/i.test(ev.evidence.file_url || "");
      if (!isImage) continue;

      try {
        doc.addPage();
        y = 20;
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 40);
        doc.text(`${ev.evidence.title} (${translateType(ev.evidence.type)})`, margin, y);
        y += 8;
        doc.addImage(ev.signedUrl, "JPEG", margin, y, pageWidth - margin * 2, 180);
      } catch {
        // skip if image fails to load
      }
    }
  }

  // ===== DECLARATION =====
  if (y > 220) {
    doc.addPage();
    y = 20;
  } else {
    y += 10;
  }

  doc.setFillColor(255, 251, 235);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 40, 3, 3, "F");
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 40, 3, 3, "S");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(146, 64, 14);
  doc.text("Declaração", margin + 4, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 60, 20);
  const declText = `Declaro que a empresa "${data.client.name}" é um negócio legítimo, operando no endereço informado. As evidências anexadas comprovam a existência e regularidade do estabelecimento. Solicito a revisão do perfil e remoção da restrição.`;
  const lines = doc.splitTextToSize(declText, pageWidth - margin * 2 - 8);
  doc.text(lines, margin + 4, y + 16);

  // ===== FOOTER =====
  const ph = doc.internal.pageSize.getHeight();
  doc.setFillColor(30, 41, 59);
  doc.rect(0, ph - 16, pageWidth, 16, "F");
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(8);
  doc.text(
    `Gerado por ${data.agencyName} — ${new Date().toLocaleDateString("pt-BR")}`,
    pageWidth / 2,
    ph - 6,
    { align: "center" }
  );

  return doc;
}
