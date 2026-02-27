import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { safeText, safeNumber, safeUrl } from "./textSanitizer";

export interface BrandSettings {
  companyName: string;
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  reportFooter: string;
  supportWhatsapp?: string | null;
}

export interface ClientData {
  id: string;
  name: string;
  business_type: string;
  address: string | null;
  is_active: boolean;
  avatarSignedUrl?: string | null;
  placeSnapshot?: {
    rating?: number;
    user_ratings_total?: number;
    formatted_phone_number?: string;
    website?: string;
    url?: string;
    opening_hours?: { weekday_text?: string[] };
  } | null;
}

export interface TaskData {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed";
  completed_at: string | null;
  client_id: string;
}

export interface GoogleMetrics {
  views: number;
  calls: number;
  directions: number;
  websiteClicks: number;
  messages: number;
}

export interface ReportData {
  client: ClientData;
  tasks: TaskData[];
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    completionRate: number;
  };
  googleMetrics?: GoogleMetrics;
  agencyLogoUrl?: string | null;
}

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

// Format date to PT-BR
function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Translate status to Portuguese
function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    pending: "Pendente",
    in_progress: "Em Progresso",
    completed: "Concluído",
  };
  return translations[status] || status;
}

// Translate business type to Portuguese
function translateBusinessType(type: string): string {
  const translations: Record<string, string> = {
    restaurant: "Restaurante",
    store: "Loja",
    service: "Serviço",
    other: "Outro",
  };
  return translations[type] || type;
}

export async function generateClientReport(brandSettings: BrandSettings, reportData: ReportData): Promise<jsPDF> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  const primaryRgb = hexToRgb(brandSettings.primaryColor);
  const secondaryRgb = hexToRgb(brandSettings.secondaryColor);

  // ===== HEADER =====
  doc.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  doc.rect(0, 0, pageWidth, 40, "F");

  // Logo - prefer agency signed URL, fall back to brandSettings.logo
  const logoUrl = reportData.agencyLogoUrl || brandSettings.logo;
  if (logoUrl) {
    try {
      doc.addImage(logoUrl, "PNG", margin, 8, 24, 24);
    } catch {
      // If logo fails, draw initial
      doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.roundedRect(margin, 8, 24, 24, 4, 4, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(brandSettings.companyName.charAt(0), margin + 12, 24, { align: "center" });
    }
  } else {
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.roundedRect(margin, 8, 24, 24, 4, 4, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(brandSettings.companyName.charAt(0), margin + 12, 24, { align: "center" });
  }

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(brandSettings.companyName, margin + 32, 22);

  // Report type
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 200);
  doc.text("Relatório de Desempenho", pageWidth - margin, 22, { align: "right" });

  // ===== CLIENT INFO (with photo) =====
  let yPos = 55;

  const clientInfoX = margin;

  // Client photo (if available)
  if (reportData.client.avatarSignedUrl) {
    try {
      doc.addImage(reportData.client.avatarSignedUrl, "JPEG", margin, yPos - 5, 20, 20);
      // Shift text to the right of the photo
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(reportData.client.name, margin + 26, yPos + 4);

      yPos += 12;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(
        `${translateBusinessType(reportData.client.business_type)} • ${reportData.client.address || "Endereço não informado"}`,
        margin + 26,
        yPos,
      );
    } catch {
      // If image fails, render text only
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(reportData.client.name, margin, yPos);

      yPos += 8;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(
        `${translateBusinessType(reportData.client.business_type)} • ${reportData.client.address || "Endereço não informado"}`,
        margin,
        yPos,
      );
    }
  } else {
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(reportData.client.name, margin, yPos);

    yPos += 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(
      `${translateBusinessType(reportData.client.business_type)} • ${reportData.client.address || "Endereço não informado"}`,
      margin,
      yPos,
    );
  }

  yPos += 8;
  doc.setFontSize(10);
  doc.text(`Período: ${formatDate(reportData.period.start)} a ${formatDate(reportData.period.end)}`, margin, yPos);

  // ===== GOOGLE PLACES SNAPSHOT (public data) =====
  const snapshot = reportData.client.placeSnapshot as Record<string, unknown> | null | undefined;
  if (snapshot && typeof snapshot === "object") {
    yPos += 12;

    const lines: string[] = [];

    // Nome (ONLY)
    const placeName = safeText(snapshot.name, "");
    if (placeName) lines.push(`Nome: ${placeName}`);

    // Endereço (ONLY)
    const addr = safeText(snapshot.formatted_address, "");
    if (addr) lines.push(`Endereço: ${addr}`);

    // Horário (ONLY)
    const oh = snapshot.opening_hours as Record<string, unknown> | undefined;
    if (oh && Array.isArray(oh.weekday_text)) {
      const safeHours = oh.weekday_text
        .slice(0, 4)
        .map((h: unknown) => safeText(h, ""))
        .filter(Boolean);
      if (safeHours.length > 0) {
        lines.push(`Horário: ${safeHours.join(" | ")}`);
      }
    }

    // Site (ONLY)
    const website = safeUrl(snapshot.website, "");
    if (website) {
      const short = website.length > 70 ? website.substring(0, 70) + "..." : website;
      lines.push(`Site: ${short}`);
    }

    if (lines.length === 0) {
      lines.push("Dados públicos do negócio não disponíveis para este cliente.");
    }

    // Calculate dynamic height
    const lineHeight = 8;
    const headerHeight = 14;
    const snapshotHeight = headerHeight + lines.length * lineHeight + 4;

    // Background
    doc.setFillColor(235, 243, 254);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, snapshotHeight, 3, 3, "F");
    doc.setDrawColor(66, 133, 244);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, snapshotHeight, 3, 3, "S");

    // Title
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 175);
    doc.text("Dados públicos do negócio (Google)", margin + 4, yPos + 10);

    // Content lines
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8);

    let lineY = yPos + headerHeight + 4;
    for (const line of lines) {
      doc.text(line, margin + 4, lineY);
      lineY += lineHeight;
    }

    yPos += snapshotHeight;
  }

  // ===== METRICS CARDS =====
  yPos += 20;

  const hasGoogleMetrics =
    reportData.googleMetrics &&
    (reportData.googleMetrics.views > 0 ||
      reportData.googleMetrics.calls > 0 ||
      reportData.googleMetrics.directions > 0 ||
      reportData.googleMetrics.websiteClicks > 0);

  // Task Metrics Cards
  const taskCardWidth = (pageWidth - margin * 2 - 15) / 4;
  const cardHeight = 35;

  const taskMetrics = [
    { label: "Total de Tarefas", value: reportData.metrics.totalTasks.toString() },
    { label: "Concluídas", value: reportData.metrics.completedTasks.toString() },
    { label: "Em Progresso", value: reportData.metrics.inProgressTasks.toString() },
    { label: "Taxa de Conclusão", value: `${reportData.metrics.completionRate}%` },
  ];

  taskMetrics.forEach((metric, index) => {
    const xPos = margin + index * (taskCardWidth + 5);

    // Card background with light tint
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(xPos, yPos, taskCardWidth, cardHeight, 4, 4, "F");

    // Card border
    doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.setLineWidth(0.5);
    doc.roundedRect(xPos, yPos, taskCardWidth, cardHeight, 4, 4, "S");

    // Value
    doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(metric.value, xPos + taskCardWidth / 2, yPos + 16, { align: "center" });

    // Label
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(metric.label, xPos + taskCardWidth / 2, yPos + 26, { align: "center" });
  });

  // ===== GOOGLE PLACES METRICS (if available) =====
  if (hasGoogleMetrics) {
    yPos += cardHeight + 15;

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Dados do Google Places", margin, yPos);

    yPos += 10;

    const googleCardWidth = (pageWidth - margin * 2 - 20) / 5;
    const googleCardHeight = 30;

    const googleMetrics = [
      { label: "Visualizações", value: reportData.googleMetrics!.views.toString() },
      { label: "Ligações", value: reportData.googleMetrics!.calls.toString() },
      { label: "Rotas", value: reportData.googleMetrics!.directions.toString() },
      { label: "Cliques Site", value: reportData.googleMetrics!.websiteClicks.toString() },
      { label: "Mensagens", value: reportData.googleMetrics!.messages.toString() },
    ];

    // Blue color for Google metrics
    const googleBlue = { r: 66, g: 133, b: 244 };

    googleMetrics.forEach((metric, index) => {
      const xPos = margin + index * (googleCardWidth + 5);

      // Card background
      doc.setFillColor(235, 243, 254);
      doc.roundedRect(xPos, yPos, googleCardWidth, googleCardHeight, 3, 3, "F");

      // Card border
      doc.setDrawColor(googleBlue.r, googleBlue.g, googleBlue.b);
      doc.setLineWidth(0.3);
      doc.roundedRect(xPos, yPos, googleCardWidth, googleCardHeight, 3, 3, "S");

      // Value
      doc.setTextColor(googleBlue.r, googleBlue.g, googleBlue.b);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(metric.value, xPos + googleCardWidth / 2, yPos + 12, { align: "center" });

      // Label
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(metric.label, xPos + googleCardWidth / 2, yPos + 22, { align: "center" });
    });

    yPos += googleCardHeight;
  }

  // ===== TASKS TABLE =====
  yPos += cardHeight + 20;

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Detalhamento de Tarefas", margin, yPos);

  yPos += 10;

  const tableData = reportData.tasks.map((task) => [
    task.title,
    translateStatus(task.status),
    task.completed_at ? formatDate(new Date(task.completed_at)) : "-",
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Tarefa", "Status", "Data de Conclusão"]],
    body: tableData,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [secondaryRgb.r, secondaryRgb.g, secondaryRgb.b],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [60, 60, 60],
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 40, halign: "center" },
      2: { cellWidth: 40, halign: "center" },
    },
  });

  // ===== FOOTER =====
  doc.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  doc.rect(0, pageHeight - 20, pageWidth, 20, "F");

  doc.setTextColor(200, 200, 200);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const whatsapp = brandSettings.supportWhatsapp?.trim();
  const footerLine = whatsapp ? `${brandSettings.reportFooter} • WhatsApp: ${whatsapp}` : brandSettings.reportFooter;
  doc.text(footerLine, pageWidth / 2, pageHeight - 8, { align: "center" });

  return doc;
}

export function downloadPdf(doc: jsPDF, filename: string): void {
  doc.save(filename);
}
