import React, { useState } from 'react';
import { Megaphone, X } from 'lucide-react';

interface BannerAnnouncementProps {
  message: string;
  isActive: boolean;
}

export const BannerAnnouncement: React.FC<BannerAnnouncementProps> = ({ message, isActive }) => {
  const [dismissed, setDismissed] = useState(false);

  if (!isActive || !message || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-blue-700 via-sky-600 to-indigo-700 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8 flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="p-1 rounded-md bg-white/20 text-white flex-shrink-0">
            <Megaphone className="w-3.5 h-3.5" />
          </span>
          <p className="font-medium truncate leading-tight">
            {message}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
          aria-label="ปิดประกาศ"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
