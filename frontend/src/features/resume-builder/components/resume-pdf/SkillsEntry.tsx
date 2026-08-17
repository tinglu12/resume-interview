import { View, Text } from "@react-pdf/renderer";
import type { SkillsContent } from "@/types";
import { s } from "./styles";
import { SectionHeading } from "./SectionHeading";

// Bold label: item, item, item

export function SkillsEntry({
  content,
  showHeading,
}: {
  content: SkillsContent;
  showHeading: boolean;
}) {
  if (!content.groups.length) return null;
  return (
    <View style={s.entryWrap}>
      {showHeading && <SectionHeading label="Technical Skills" />}
      {content.groups.map((group, i) => (
        <Text key={i} style={s.skillRow}>
          <Text style={{ fontFamily: "Times-Bold" }}>{group.label}</Text>
          {": "}
          <Text>{group.items.join(", ")}</Text>
        </Text>
      ))}
    </View>
  );
}
