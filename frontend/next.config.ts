import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@embedpdf/core",
    "@embedpdf/engines",
    "@embedpdf/models",
    "@embedpdf/pdfium",
    "@embedpdf/plugin-document-manager",
    "@embedpdf/plugin-render",
    "@embedpdf/plugin-scroll",
    "@embedpdf/plugin-viewport",
    "@embedpdf/plugin-selection",
  ],
};

export default nextConfig;
