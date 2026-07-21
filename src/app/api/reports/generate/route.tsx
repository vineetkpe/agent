import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { Site, Audit, AuditItem } from "@prisma/client";
import React from "react";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

// Define PDF styles
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", backgroundColor: "#FFFFFF" },
  header: { borderBottomWidth: 2, borderBottomColor: "#111827", paddingBottom: 15, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "bold", color: "#111827" },
  subtitle: { fontSize: 10, color: "#6B7280", marginTop: 4, textTransform: "uppercase", letterSpacing: 1 },
  section: { marginBottom: 20, padding: 12, border: "1px solid #E5E7EB", borderRadius: 8 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", color: "#4F46E5", marginBottom: 8, textTransform: "uppercase" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { fontSize: 9, color: "#6B7280", fontWeight: "bold" },
  value: { fontSize: 9, color: "#111827" },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#111827", paddingBottom: 4, marginBottom: 6 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#E5E7EB", paddingVertical: 5 },
  cellType: { width: "25%", fontSize: 8, color: "#374151" },
  cellUrl: { width: "45%", fontSize: 8, color: "#374151" },
  cellPriority: { width: "15%", fontSize: 8, color: "#374151", textAlign: "center" },
  cellStatus: { width: "15%", fontSize: 8, color: "#374151", textAlign: "right" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: "#E5E7EB", paddingTop: 10, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: "#9CA3AF" },
});

// PDF Document Component
function renderSeoReportPdf(site: Site, audit: Audit | null, items: AuditItem[], reportType: string, range: string) {
  const score = audit?.scoreSeo ?? "N/A";
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>HEYDRONA SEO PERFORMANCE REPORT</Text>
          <Text style={styles.subtitle}>Site: {site.url} | Date: {dateStr} | Range: {range}</Text>
        </View>

        {/* Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. EXECUTIVE SUMMARY</Text>
          <View style={styles.row}>
            <Text style={styles.label}>SEO Health Score:</Text>
            <Text style={styles.value}>{score}%</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Crawl Status:</Text>
            <Text style={styles.value}>{audit ? "Scan Completed" : "No active scans"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>CMS WordPress Connection:</Text>
            <Text style={styles.value}>{site.wpConnectedAt ? "CONNECTED" : "NOT CONNECTED"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Google Search Console Connection:</Text>
            <Text style={styles.value}>{site.gscConnected ? "CONNECTED" : "NOT CONNECTED"}</Text>
          </View>
        </View>

        {/* Integration Status Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. INTEGRATION AND CONTEXT DETAILS</Text>
          <Text style={styles.value}>
            {!site.gscConnected 
              ? "• Google Search Console is NOT connected. Connect Search Console to unlock keyword performance stats." 
              : "• Google Search Console is connected. Core search query performance metrics are integrated."}
          </Text>
          <Text style={styles.value}>
            {!site.wpConnectedAt 
              ? "• WordPress is NOT connected. Configure credentials in Settings to enable direct 1-click publishing rollbacks." 
              : "• WordPress is connected. Live CMS sync capability is fully active."}
          </Text>
        </View>

        {/* Audit Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. CRITICAL AUDIT RECOMMENDATIONS ({items.length})</Text>
          
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.cellType, fontWeight: "bold" }}>Issue Type</Text>
            <Text style={{ ...styles.cellUrl, fontWeight: "bold" }}>Target URL</Text>
            <Text style={{ ...styles.cellPriority, fontWeight: "bold", textAlign: "center" }}>Priority</Text>
            <Text style={{ ...styles.cellStatus, fontWeight: "bold", textAlign: "right" }}>Status</Text>
          </View>

          {items.slice(0, 15).map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.cellType}>{item.type.replace("_", " ")}</Text>
              <Text style={styles.cellUrl}>{item.targetUrl.replace(/^https?:\/\//i, "").substring(0, 32)}</Text>
              <Text style={styles.cellPriority}>{item.priority || "medium"}</Text>
              <Text style={styles.cellStatus}>{item.status}</Text>
            </View>
          ))}

          {items.length > 15 && (
            <Text style={{ fontSize: 8, color: "#9CA3AF", marginTop: 8, textAlign: "center" }}>
              Showing first 15 tasks. Download CSV for the full audit list.
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>HeyDrona Auto-Prioritization System</Text>
          <Text style={styles.footerText}>Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { siteId, reportType, range, format } = await req.json();
    if (!siteId || !reportType || !range || !format) {
      return NextResponse.json({ error: "Missing required parameters (siteId, reportType, range, format)." }, { status: 400 });
    }

    // 1. Fetch site and latest audit
    const site = await prisma.site.findFirst({
      where: { id: siteId, deletedAt: null },
    });

    if (!site || site.userId !== currentUser.id) {
      return NextResponse.json({ error: "Site not found or access denied." }, { status: 404 });
    }

    const latestAudit = await prisma.audit.findFirst({
      where: { siteId, status: "completed" },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });

    const items = latestAudit?.items || [];

    // Create Report Log entry
    await prisma.reportLog.create({
      data: {
        userId: currentUser.id,
        siteId: site.id,
        reportType,
        format,
      },
    });

    // 2. Export based on format
    if (format === "csv") {
      let csvContent = "Type,Target URL,Priority,Impact Score,Difficulty Score,Status,Created At\n";
      for (const item of items) {
        csvContent += `"${item.type}","${item.targetUrl}","${item.priority || "low"}",${item.impactScore || 0},${item.difficultyScore || 0},"${item.status}","${item.createdAt.toISOString()}"\n`;
      }
      
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="heydrona-seo-report-${site.id}.csv"`,
        },
      });
    }

    // Format is PDF
    const pdfDoc = renderSeoReportPdf(
      site,
      latestAudit,
      items,
      reportType,
      range
    );

    const pdfBuffer = await pdf(pdfDoc).toBuffer();

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="heydrona-seo-report-${site.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[Report API Error]:", error);
    return NextResponse.json({ error: (error as Error).message || "Failed to generate report" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const sites = await prisma.site.findMany({
      where: { userId: currentUser.id, deletedAt: null },
      select: { id: true, url: true },
    });

    const siteIds = sites.map(s => s.id);

    const logs = await prisma.reportLog.findMany({
      where: {
        userId: currentUser.id,
        siteId: { in: siteIds },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const formattedLogs = logs.map(l => {
      const site = sites.find(s => s.id === l.siteId);
      return {
        ...l,
        siteUrl: site?.url || "Unknown Site",
      };
    });

    return NextResponse.json({ success: true, logs: formattedLogs });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Failed to load report history" }, { status: 500 });
  }
}

