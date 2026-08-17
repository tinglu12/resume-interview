import { createContext } from "react";
import type { Rect } from "@embedpdf/models";

export type HighlightsByPage = ReadonlyMap<number, readonly Rect[]>;

export const HighlightContext = createContext<HighlightsByPage | null>(null);
