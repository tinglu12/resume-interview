import { Text } from "@react-pdf/renderer";
import { s } from "./styles";

export function SectionHeading({ label }: { label: string }) {
  return <Text style={s.sectionHeading}>{label}</Text>;
}
