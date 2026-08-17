import { View, Text } from "@react-pdf/renderer";
import type { PersonalInfoContent } from "@/types";
import { s } from "./styles";

// Renders as centered name + contact line, no section heading

export function PersonalInfoHeader({ content }: { content: PersonalInfoContent }) {
  const contactParts = [
    content.phone,
    content.email,
    content.linkedin ? `linkedin.com/in/${content.linkedin}` : "",
    content.github ? `github.com/${content.github}` : "",
    content.website,
    content.location,
  ].filter(Boolean);

  return (
    <View>
      {content.full_name ? (
        <Text style={s.name}>{content.full_name}</Text>
      ) : null}
      {contactParts.length > 0 && (
        <Text style={s.contactLine}>{contactParts.join(" | ")}</Text>
      )}
    </View>
  );
}
