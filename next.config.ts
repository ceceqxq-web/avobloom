import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env:{NEXT_PUBLIC_WELLGROVE_CLOUD:process.env.VERCEL==="1"||process.env.WELLGROVE_STORAGE==="supabase"?"1":"0"},
  allowedDevOrigins: ["127.0.0.1"],
  async headers(){return[
    {source:"/sw.js",headers:[{key:"Cache-Control",value:"no-store, max-age=0"},{key:"Service-Worker-Allowed",value:"/"}]},
    {source:"/manifest.webmanifest",headers:[{key:"Cache-Control",value:"no-cache, max-age=0, must-revalidate"}]},
  ]},
};

export default nextConfig;
