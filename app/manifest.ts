import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Avobloom — Daily Wellbeing",
    short_name: "Avobloom",
    description: "Grow healthier habits, one day at a time. Track nutrition, movement and wellbeing.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f0e2",
    theme_color: "#927357",
    orientation: "portrait",
    categories: ["health", "lifestyle"],
    icons: [
      {
        src: "/brand/avobloom-icon-v2.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
