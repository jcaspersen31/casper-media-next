import React from "react";
import { Document, Page, View, Text, Link, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  h1: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  sub: { fontSize: 10, color: "#666", marginBottom: 20, textTransform: "uppercase" },
  section: { marginBottom: 18 },
  h2: { fontSize: 14, fontWeight: 700, marginBottom: 8, borderBottom: "1 solid #ccc", paddingBottom: 4 },
  row: { flexDirection: "row", borderBottom: "0.5 solid #eee", paddingVertical: 4 },
  headerRow: { flexDirection: "row", borderBottom: "1 solid #333", paddingVertical: 4, fontWeight: 700 },
  colMetric: { width: "25%" },
  colValue: { width: "15%" },
  colBand: { width: "15%" },
  colRec: { width: "45%" },
  narrative: { lineHeight: 1.5 },
  introText: { lineHeight: 1.5, color: "#444", marginBottom: 8 },
  sampleLabel: { fontWeight: 700, marginTop: 8, marginBottom: 4 },
  productCard: { marginBottom: 8 },
  productName: { fontWeight: 700 },
  productLink: { color: "#2a6f2a" },
  bandVery_Low: { color: "#b3261e" },
  bandLow: { color: "#b3261e" },
  bandMedium: { color: "#8a6d1f" },
  bandHigh: { color: "#2a6f2a" },
  bandVery_High: { color: "#2a6f2a" },
  bandUnrated: { color: "#666" },
});

function bandStyle(band) {
  return styles[`band${band.replace(/\s+/g, "_")}`] || {};
}

function MetricTable({ evaluations }) {
  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.colMetric}>Metric</Text>
        <Text style={styles.colValue}>Value</Text>
        <Text style={styles.colBand}>Rating</Text>
        <Text style={styles.colRec}>Recommendation</Text>
      </View>
      {evaluations.map((e) => (
        <View style={styles.row} key={e.metricKey}>
          <Text style={styles.colMetric}>{e.displayName}</Text>
          <Text style={styles.colValue}>
            {e.value}
            {e.unit ? ` ${e.unit}` : ""}
          </Text>
          <Text style={[styles.colBand, bandStyle(e.band)]}>{e.band}</Text>
          <Text style={styles.colRec}>
            {e.recommendation || ""}
            {e.product ? `  (${e.product.name})` : ""}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function SoilReportDocument({ sectionViewModels, usageName, reportId }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.h1}>Soil Deficiency Report</Text>
        <Text style={styles.sub}>{usageName} · Report #{reportId}</Text>

        {sectionViewModels.map((section) => (
          <View key={section.key} style={styles.section} wrap={false}>
            <Text style={styles.h2}>{section.title}</Text>
            {section.introText && <Text style={styles.introText}>{section.introText}</Text>}

            {section.type === "product_list" && (
              <View>
                {section.products.length === 0 && <Text>No products in this category yet.</Text>}
                {section.products.map((p) => (
                  <View key={p.id} style={styles.productCard}>
                    <Text style={styles.productName}>{p.name}</Text>
                    <Link src={p.store_url} style={styles.productLink}>
                      {p.store_url}
                    </Link>
                  </View>
                ))}
              </View>
            )}

            {(section.type === "metric_table" || section.type === "narrative") &&
              section.perSample.map((s) => (
                <View key={s.sampleId}>
                  {section.perSample.length > 1 && <Text style={styles.sampleLabel}>{s.sampleId}</Text>}
                  {section.type === "narrative" ? (
                    <Text style={styles.narrative}>{s.narrative}</Text>
                  ) : (
                    <MetricTable evaluations={s.evaluations} />
                  )}
                </View>
              ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}
