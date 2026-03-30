import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  /** Smaller Docker / VPS images: copy `.next/standalone` and `.next/static`. */
  output: "standalone",
};

export default nextConfig;
