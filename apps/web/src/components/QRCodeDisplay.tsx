"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  level?: "L" | "M" | "Q" | "H";
  className?: string;
  showDownloadBtn?: boolean;
  downloadFilename?: string;
  centerBadgeText?: string;
}

export default function QRCodeDisplay({
  value,
  size = 220,
  fgColor = "#000000",
  bgColor = "#FFFFFF",
  level = "M",
  className = "",
  showDownloadBtn = false,
  downloadFilename = "clinicos-qr-code",
  centerBadgeText
}: QRCodeDisplayProps) {
  const [svgMarkup, setSvgMarkup] = useState<string>("");
  const [dataUrl, setDataUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value) return;

    // Generate SVG string for razor-sharp vector rendering
    QRCode.toString(value, {
      type: "svg",
      width: size,
      margin: 1,
      errorCorrectionLevel: level,
      color: {
        dark: fgColor,
        light: bgColor
      }
    })
      .then((svg) => {
        setSvgMarkup(svg);
        setError(null);
      })
      .catch((err) => {
        console.error("QR SVG generation error:", err);
        setError("Failed to generate QR code");
      });

    // Also generate high-res DataURL (PNG) for instant 1-click download at 300 DPI
    QRCode.toDataURL(value, {
      width: size * 4, // 4x supersampling for ultra crisp print quality
      margin: 2,
      errorCorrectionLevel: level,
      color: {
        dark: fgColor,
        light: bgColor
      }
    })
      .then((url) => {
        setDataUrl(url);
      })
      .catch((err) => {
        console.error("QR DataURL generation error:", err);
      });
  }, [value, size, fgColor, bgColor, level]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${downloadFilename}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (error) {
    return (
      <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-red-50 p-4 text-center text-xs text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {svgMarkup ? (
        <div className="relative inline-block overflow-hidden rounded-xl bg-white p-2.5 shadow-sm">
          <div
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
            style={{ width: size, height: size }}
            className="flex items-center justify-center [&>svg]:h-full [&>svg]:w-full"
          />
          {centerBadgeText && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="rounded-md border border-black/[0.08] bg-white px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#1D1D1F] shadow-sm">
                {centerBadgeText}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{ width: size, height: size }}
          className="flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse text-xs text-slate-400 font-mono"
        >
          Generating QR...
        </div>
      )}

      {showDownloadBtn && dataUrl && (
        <button
          type="button"
          onClick={handleDownload}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] px-3.5 py-1 text-[11px] font-semibold text-[#1D1D1F] dark:text-white shadow-sm hover:bg-black/[0.02] dark:hover:bg-white/[0.06] transition active:scale-95"
        >
          <span>📥 Download High-Res PNG</span>
        </button>
      )}
    </div>
  );
}
