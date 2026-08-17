import { View, Text } from "@react-pdf/renderer";
import type { SummaryContent } from "@/types";
import { s } from "./styles";
import { SectionHeading } from "./SectionHeading";

export function SummaryEntry({
  content,
  showHeading,
}: {
  content: SummaryContent;
  showHeading: boolean;
}) {
  if (!content.text) return null;
  return (
    <View style={s.entryWrap}>
      {showHeading && <SectionHeading label="Summary" />}
      <Text>{content.text}</Text>
    </View>
  );
}
