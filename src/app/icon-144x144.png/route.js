import { NextResponse } from 'next/server';

export async function GET() {
  const svgIcon = `<svg width="144" height="144" viewBox="0 0 144 144" xmlns="http://www.w3.org/2000/svg"><rect width="144" height="144" fill="#3B82F6"/><circle cx="72" cy="72" r="45" fill="white"/><text x="72" y="85" text-anchor="middle" fill="#3B82F6" font-family="Arial, sans-serif" font-size="54" font-weight="bold">T</text></svg>`;

  return new NextResponse(svgIcon, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000',
    },
  });
}
