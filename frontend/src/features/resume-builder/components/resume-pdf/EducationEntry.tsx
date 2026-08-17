import { View, Text } from "@react-pdf/renderer";
import type { EducationContent } from "@/types";
import { s } from "./styles";
import { SectionHeading } from "./SectionHeading";
import { formatDateRange } from "./formatDateRange";

// Row 1: bold institution                location
// Row 2: italic degree + field           italic date range

export function EducationEntry({
  content,
  showHeading,
}: {
  content: EducationContent;
  showHeading: boolean;
}) {
  const dateStr = formatDateRange(content.start_date, content.end_date, false);
  const degreeStr = [content.degree, content.field_of_study]
    .filter(Boolean)
    .join(", ");
  return (
    <View style={s.entryWrap}>
      {showHeading && <SectionHeading label="Education" />}
      <View style={s.row}>
        <Text style={s.entryTitle}>{content.institution}</Text>
        <Text style={s.entryDate}>{content.location}</Text>
      </View>
      <View style={s.row}>
        <Text style={s.entrySubLeft}>
          {degreeStr}
          {content.gpa ? `, GPA: ${content.gpa}` : ""}
        </Text>
        <Text style={s.entrySubRight}>{dateStr}</Text>
      </View>
      {content.honors.length > 0 && (
        <Text style={{ fontSize: 10, color: "#444" }}>
          {content.honors.join(" · ")}
        </Text>
      )}
    </View>
  );
}
