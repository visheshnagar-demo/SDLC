import React from "react";
import { ShieldCheck, Lock, Award, Package } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-[#232733] bg-[#0A0B0E] text-[#9EACB9] text-xs py-12 px-6 mt-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#F2CA50]" />
            <span className="font-serif text-[#F2CA50] font-bold text-base tracking-wider">
              CHRONO CERTIFIED
            </span>
          </div>
          <p className="text-xs leading-relaxed text-[#9EACB9]">
            The global authority for certified pre-owned luxury horology. Every
            timepiece inspected, verified by master watchmakers, and backed by a
            2-year atelier warranty.
          </p>
        </div>

        <div>
          <h4 className="font-serif text-[#F8F9FA] font-semibold text-sm mb-3">
            Guaranteed Standards
          </h4>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>100% Authentic Certification</span>
            </li>
            <li className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>15-Minute Concurrency Vault Lock</span>
            </li>
            <li className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Armed Armored Courier Transit</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-[#F8F9FA] font-semibold text-sm mb-3">
            Atelier Brands
          </h4>
          <div className="grid grid-cols-2 gap-1.5 text-[#9EACB9]">
            <span>Rolex</span>
            <span>Patek Philippe</span>
            <span>Audemars Piguet</span>
            <span>Omega</span>
            <span>Vacheron Constantin</span>
            <span>Cartier</span>
            <span>IWC Schaffhausen</span>
            <span>Jaeger-LeCoultre</span>
          </div>
        </div>

        <div>
          <h4 className="font-serif text-[#F8F9FA] font-semibold text-sm mb-3">
            Escrow & Security
          </h4>
          <p className="text-xs leading-relaxed text-[#9EACB9]">
            Funds held in Swiss banking escrow until buyer inspection and
            handover PIN verification are fulfilled.
          </p>
          <div className="mt-3 text-[11px] font-mono text-[#D4AF37]">
            Geneva · London · New York · Singapore
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-[#232733] pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px]">
        <div>
          © {new Date().getFullYear()} CHRONO CERTIFIED GENÈVE S.A. All rights
          reserved.
        </div>
        <div className="flex gap-6">
          <span className="hover:text-[#F8F9FA] cursor-pointer">
            Terms of Escrow
          </span>
          <span className="hover:text-[#F8F9FA] cursor-pointer">
            Privacy Policy
          </span>
          <span className="hover:text-[#F8F9FA] cursor-pointer">
            Verification Protocols
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
