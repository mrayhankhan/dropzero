/** @type {import('next').NextConfig} */
const nextConfig = {
  // `pg` and the AWS SDK are server-only; keep them out of the client bundle
  // and let Next trace their native/optional deps for the Node runtime.
  experimental: {
    serverComponentsExternalPackages: ["pg", "@aws-sdk/dsql-signer"],
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
