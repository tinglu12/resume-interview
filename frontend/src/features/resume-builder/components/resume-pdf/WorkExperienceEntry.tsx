import { View, Text } from "@react-pdf/renderer";
import type { WorkExperienceContent } from "@/types";
import { s } from "./styles";
import { SectionHeading } from "./SectionHeading";
import { formatDateRange } from "./formatDateRange";

// Row 1: bold role                        date
// Row 2: italic company                   italic location
// Bullets

export function WorkExperienceEntry({
  content,
  showHeading,
}: {
  content: WorkExperienceContent;
  showHeading: boolean;
}) {
  const dateStr = formatDateRange(
    content.start_date,
    content.end_date,
    content.is_current,
  );
  return (
    <View style={s.entryWrap}>
      {showHeading && <SectionHeading label="Experience" />}
      <View style={s.row}>
        <Text style={s.entryTitle}>{content.role}</Text>
        <Text style={s.entryDate}>{dateStr}</Text>
      </View>
      {(content.company || content.location) && (
        <View style={s.row}>
          <Text style={s.entrySubLeft}>{content.company}</Text>
          <Text style={s.entrySubRight}>{content.location}</Text>
        </View>
      )}
      {content.bullets.map((b, i) => (
        <View key={i} style={s.bullet}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{b}</Text>
        </View>
      ))}
    </View>
  );
}
