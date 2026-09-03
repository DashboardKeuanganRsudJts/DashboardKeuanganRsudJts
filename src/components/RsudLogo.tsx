import React, { useState, useEffect } from 'react';

interface RsudLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

const DEFAULT_LOGO = '/logo-rsud.png?v=2';

export const RsudLogo: React.FC<RsudLogoProps> = ({ className = 'w-11 h-11' }) => {
  const [logoSrc, setLogoSrc] = useState<string>(() => {
    return localStorage.getItem('rsud_custom_logo') || DEFAULT_LOGO;
  });

  useEffect(() => {
    // Check local storage for custom logo or fallback
    const checkCustomLogo = () => {
      const savedLogo = localStorage.getItem('rsud_custom_logo');
      setLogoSrc(savedLogo || DEFAULT_LOGO);
    };

    checkCustomLogo();

    // Listen to custom event for logo updates across components
    window.addEventListener('rsud_logo_updated', checkCustomLogo);
    return () => {
      window.removeEventListener('rsud_logo_updated', checkCustomLogo);
    };
  }, []);

  return (
    <div className={`inline-flex flex-col items-center justify-center shrink-0 ${className}`}>
      <img
        src={logoSrc}
        alt="Logo RSUD Jatisari"
        className="w-full h-full object-contain filter drop-shadow-sm"
        onError={(e) => {
          // Fallback to favicon.png if needed
          const target = e.currentTarget;
          if (!target.src.includes('favicon.png')) {
            target.src = '/favicon.png?v=2';
          }
        }}
      />
    </div>
  );
};
