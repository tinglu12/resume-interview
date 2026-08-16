import { View, Text } from "@react-pdf/renderer";
import type { ProjectContent } from "@/types";
import { s } from "./styles";
import { SectionHeading } from "./SectionHeading";
import { formatDateRange } from "./formatDateRange";

// Row 1: bold name | italic technologies             date
// Bullets

export function ProjectEntry({
  title,
  content,
  showHeading,
}: {
  title: string;
  content: ProjectContent;
  showHeading: boolean;
}) {
  const dateStr = formatDateRange(
    content.start_date,
    content.end_date,
    content.is_current,
  );
  const techStr =
    content.technologies.length > 0 ? content.technologies.join(", ") : "";
  return (
    <View style={s.entryWrap}>
      {showHeading && <SectionHeading label="Projects" />}
      <View style={s.row}>
        <View style={{ flexDirection: "row", flex: 1, flexWrap: "wrap" }}>
          <Text style={s.entryTitle}>{content.name || title}</Text>
          {techStr ? <Text style={s.entrySubLeft}> | {techStr}</Text> : null}
        </View>
        <Text style={s.entryDate}>{dateStr}</Text>
      </View>
      {content.description ? (
        <Text
          style={{ fontFamily: "Times-Italic", fontSize: 11, marginTop: 1 }}
        >
          {content.description}
        </Text>
      ) : null}
      {content.bullets.map((b, i) => (
        <View key={i} style={s.bullet}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{b}</Text>
        </View>
      ))}
    </View>
  );
}
