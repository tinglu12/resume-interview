import { StyleSheet } from "@react-pdf/renderer";

// ~0.5 in margins to match Jake Ryan template
export const M = 36;

export const s = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 11,
    paddingHorizontal: M,
    paddingTop: M,
    paddingBottom: M,
    color: "#000",
    lineHeight: 1.15,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  name: {
    fontFamily: "Times-Bold",
    fontSize: 20,
    textAlign: "center",
    marginBottom: 12,
  },
  contactLine: {
    fontSize: 10,
    textAlign: "center",
    marginBottom: 3,
  },

  // ── Section heading (small-caps approximation) ───────────────────────────
  sectionHeading: {
    fontSize: 11,
    fontFamily: "Times-Roman",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    borderBottomWidth: 0.75,
    borderBottomColor: "#000",
    paddingBottom: 1,
    marginTop: 10,
    marginBottom: 4,
  },

  // ── Entry rows ────────────────────────────────────────────────────────────
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  entryTitle: { fontFamily: "Times-Bold", fontSize: 11 },
  entryDate: { fontSize: 11 },
  entrySubLeft: { fontFamily: "Times-Italic", fontSize: 11 },
  entrySubRight: { fontFamily: "Times-Italic", fontSize: 11 },

  // ── Bullets ───────────────────────────────────────────────────────────────
  bullet: {
    flexDirection: "row",
    marginLeft: 12,
    marginTop: 1,
  },
  bulletDot: { width: 10, fontSize: 11 },
  bulletText: { flex: 1, fontSize: 11 },

  // ── Skills ────────────────────────────────────────────────────────────────
  skillRow: { fontSize: 11, marginBottom: 1 },

  entryWrap: { marginBottom: 3 },
});
