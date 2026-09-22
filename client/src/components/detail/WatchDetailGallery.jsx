import React, { useState } from "react";
import { ShieldCheck, Sparkles, ZoomIn } from "lucide-react";

export const WatchDetailGallery = ({ watch }) => {
  const defaultImages = [
    {
      id: "dial",
      label: "Dial & Hands",
      url:
        watch?.image_urls?.[0] ||
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "caliber",
      label: "Caliber Movement",
      url:
        watch?.image_urls?.[1] ||
        "https://images.unsplash.com/photo-1547996160-71dfabbce5ed?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "case",
      label: "Case Profile & Crown",
      url:
        watch?.image_urls?.[2] ||
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "clasp",
      label: "Oyster Clasp",
      url:
        watch?.image_urls?.[3] ||
        "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "box",
      label: "Box & Guarantee Papers",
      url:
        watch?.image_urls?.[4] ||
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
    },
  ];

  const [selectedAngle, setSelectedAngle] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const activeImage = defaultImages[selectedAngle] || defaultImages[0];

  return (
    <div className="space-y-4">
      {/* Main Inspection Viewport */}
      <div className="relative bg-[#0A0B0E] rounded-xl border border-[#232733] p-6 flex items-center justify-center min-h-[460px] overflow-hidden group">
        <img
          src={activeImage.url}
          alt={activeImage.label}
          className={`max-h-[420px] w-auto object-contain transition-all duration-500 ${
            isZoomed ? "scale-150 cursor-zoom-out" : "scale-100 cursor-zoom-in"
          }`}
          onClick={() => setIsZoomed(!isZoomed)}
        />

        {/* Top Left Certificate Badge */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span className="bg-[#12141A]/90 backdrop-blur border border-[#D4AF37] text-[#F2CA50] text-xs uppercase font-bold px-3 py-1 rounded-md flex items-center gap-1.5 shadow-lg">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            Certified Authentic #{watch?.certificate_number || "CERT-99281"}
          </span>
          <span className="bg-[#181B22]/90 backdrop-blur border border-[#232733] text-[#9EACB9] text-[10px] font-mono px-2.5 py-0.5 rounded flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#D4AF37]" /> Argon Vault
            Micro-Sealed
          </span>
        </div>

        {/* Top Right: 1-of-1 Vault Status */}
        <div className="absolute top-4 right-4">
          <span className="bg-[#1F1F23]/90 backdrop-blur border border-[#4D4635] text-[#E3E2E6] text-xs font-mono font-bold px-3 py-1 rounded-md shadow-lg">
            1-OF-1 PIECE IN GENEVA VAULT
          </span>
        </div>

        {/* Bottom Bar: Angle Label & Zoom Prompt */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-xs text-[#9EACB9] bg-[#12141A]/80 backdrop-blur px-3 py-1.5 rounded-lg border border-[#232733]">
          <span className="font-mono text-[#F8F9FA]">
            {activeImage.label} (Angle {selectedAngle + 1} of{" "}
            {defaultImages.length})
          </span>
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="flex items-center gap-1 text-[#D4AF37] hover:text-[#E5C158]"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>
              {isZoomed ? "Click to reset" : "Click image for 2x macro loupe"}
            </span>
          </button>
        </div>
      </div>

      {/* Multi-angle Macro Thumbnails */}
      <div className="grid grid-cols-5 gap-3">
        {defaultImages.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => {
              setSelectedAngle(idx);
              setIsZoomed(false);
            }}
            className={`border rounded-lg p-2 bg-[#12141A] transition-all flex flex-col items-center gap-1.5 text-center ${
              selectedAngle === idx
                ? "border-[#D4AF37] shadow-md shadow-[#D4AF37]/20 ring-1 ring-[#D4AF37]"
                : "border-[#232733] hover:border-[#4D4635] opacity-70 hover:opacity-100"
            }`}
          >
            <div className="h-12 w-full flex items-center justify-center bg-[#0A0B0E] rounded overflow-hidden">
              <img
                src={img.url}
                alt={img.label}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-[11px] font-medium text-[#F8F9FA] line-clamp-1">
              {img.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WatchDetailGallery;
