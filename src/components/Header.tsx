import React from 'react';
import { Phone, ChevronLeft, ShieldCheck, SlidersHorizontal } from 'lucide-react';

interface HeaderProps {
  currentStep: number;
  onBack?: () => void;
  isAdminOpen: boolean;
  onToggleAdmin: () => void;
  phone?: string;
  siteUrl?: string;
}

/**
 * Where the back arrow goes when there is no step to go back to.
 *
 * TEMPORARY: the rebuilt site, not the live one. Anyone reviewing this quote
 * came from the rebuild, and sending them back to portabox.au would drop them
 * on a different site mid-review. Change this to https://portabox.au/ — or
 * set VITE_SITE_URL in Vercel, which wins over it — once the rebuild is the
 * site people actually arrive from.
 */
const SITE_URL = (import.meta.env.VITE_SITE_URL as string) || 'https://portabox-website.vercel.app/';

/* One shape for the arrow whether it steps back through the quote or leaves
   it, so the corner does not change under people as they move through. */
const BACK_BUTTON_CLASS =
  'w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-xs border border-slate-200 ' +
  'flex items-center justify-center text-slate-700 hover:text-slate-950 ' +
  'hover:border-slate-300 transition-all cursor-pointer active:scale-95';

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  onBack,
  isAdminOpen,
  onToggleAdmin,
  phone = '1800 467 637',
  siteUrl = SITE_URL,
}) => {
  /* The quote is a separate deployment from the website, so on the first step
     there is no step to go back to — but there is a site to go back to, and
     the corner is where people look for it.

     This app has no router, so nothing in the tab's history belongs to it:
     if they arrived from a link, going back returns them to the page and the
     scroll position they left, which is better than dropping them on the home
     page. Typed straight in, or arrived with no referrer, they get the site. */
  const leaveToSite = (e: React.MouseEvent<HTMLAnchorElement>) => {
    let cameFromElsewhere = false;
    try {
      cameFromElsewhere =
        Boolean(document.referrer) &&
        new URL(document.referrer).origin !== window.location.origin;
    } catch {
      cameFromElsewhere = false;   // a referrer we cannot parse is no referrer
    }
    if (cameFromElsewhere && window.history.length > 1) {
      e.preventDefault();
      window.history.back();
    }
    // otherwise the anchor's own href takes them to the site
  };

  return (
    <header className="w-full bg-[#f0f4f8] border-b border-slate-200/80 sticky top-0 z-30 backdrop-blur-md bg-opacity-95">
      <div className="max-w-6xl mx-auto py-3 sm:py-4 px-3 sm:px-8 flex items-center justify-between">
        {/* Left: back a step, or back to the website from the first one */}
        <div className="w-16 sm:w-28 flex items-center">
          {isAdminOpen ? (
            <div className="w-9 sm:w-10" />
          ) : currentStep > 1 ? (
            <button
              onClick={onBack}
              aria-label="Previous step"
              title="Previous step"
              className={BACK_BUTTON_CLASS}
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
          ) : (
            <a
              href={siteUrl}
              onClick={leaveToSite}
              aria-label="Back to the Portabox website"
              title="Back to the Portabox website"
              className={BACK_BUTTON_CLASS}
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </a>
          )}
        </div>

        {/* Center: Portabox Logo */}
        <div className="flex flex-col items-center select-none">
          <div className="bg-[#00c0f3] text-white px-4 sm:px-5 py-1 sm:py-1.5 rounded-lg shadow-xs flex flex-col items-center justify-center transition-transform hover:scale-[1.02]">
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight leading-none text-white font-['Cabinet_Grotesk',sans-serif]">
              portabox
            </span>
            <span className="text-[6.5px] sm:text-[7.5px] font-bold tracking-wider text-sky-100 uppercase mt-0.5 whitespace-nowrap">
              MOVING AND STORAGE CONTAINERS
            </span>
          </div>
        </div>

        {/* Right: Phone number & Admin button */}
        <div className="w-auto flex items-center gap-1.5 sm:gap-2.5 justify-end">
          <button
            onClick={onToggleAdmin}
            className={`hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
              isAdminOpen
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Configure pricing, promotions, and view customer leads"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{isAdminOpen ? 'Close Admin' : 'Admin & Pricing'}</span>
          </button>

          <a
            href={`tel:${phone.replace(/\s+/g, '')}`}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-[#0b2942] hover:bg-[#081e30] text-white rounded-full font-bold text-xs sm:text-sm tracking-wide shadow-xs transition-colors cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white shrink-0" />
            <span className="hidden xs:inline sm:inline whitespace-nowrap font-mono font-bold">{phone}</span>
            <span className="xs:hidden text-[11px] font-bold">Call</span>
          </a>
        </div>
      </div>

      {/* Progress Bar Across the Top */}
      {!isAdminOpen && (
        <div className="w-full bg-slate-200/90 h-1.5 relative overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#00c0f3] to-[#0096c0] transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.round((currentStep / 6) * 100))}%` }}
          />
        </div>
      )}
    </header>
  );
};
