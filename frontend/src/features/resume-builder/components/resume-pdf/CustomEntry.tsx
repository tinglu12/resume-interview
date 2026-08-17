import { View, Text } from "@react-pdf/renderer";
import type { CustomContent } from "@/types";
import { s } from "./styles";
import { SectionHeading } from "./SectionHeading";

export function CustomEntry({
  content,
  showHeading,
}: {
  content: CustomContent;
  showHeading: boolean;
}) {
  if (!content.heading && !content.body) return null;
  return (
    <View style={s.entryWrap}>
      {showHeading && content.heading && (
        <SectionHeading label={content.heading} />
      )}
      {content.body ? (
        <Text style={{ fontSize: 11 }}>{content.body}</Text>
      ) : null}
    </View>
  );
}
