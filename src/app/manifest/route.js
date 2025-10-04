import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    name: "Token Website",
    short_name: "TokenApp",
    description: "A modern token management platform with secure authentication",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3b82f6",
    orientation: "portrait-primary",
    scope: "/",
    lang: "en",
    categories: ["finance", "productivity", "utilities"],
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable any"
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable any"
      },
      {
        src: "/icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon-96x96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any"
      }
    ],
    screenshots: [
      {
        src: "/screenshot-desktop.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide"
      },
      {
        src: "/screenshot-mobile.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow"
      }
    ],
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "Go to your dashboard",
        url: "/user/dashboard",
        icons: [
          {
            src: "/icon-96x96.png",
            sizes: "96x96"
          }
        ]
      },
      {
        name: "Sign In",
        short_name: "Sign In",
        description: "Sign in to your account",
        url: "/auth/signin",
        icons: [
          {
            src: "/icon-96x96.png",
            sizes: "96x96"
          }
        ]
      }
    ],
    related_applications: [],
    prefer_related_applications: false,
    edge_side_panel: {
      preferred_width: 400
    }
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
