import type { NextConfig } from "next";

const repositoryName = "family_QT";
const isProductionBuild = process.env.NODE_ENV === "production";
const basePath = isProductionBuild ? `/${repositoryName}` : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
