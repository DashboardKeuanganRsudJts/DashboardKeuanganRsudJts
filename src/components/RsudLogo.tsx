import React, { useState, useEffect } from 'react';

interface RsudLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const RsudLogo: React.FC<RsudLogoProps> = ({ className = 'w-11 h-11', size = 44, showText = false }) => {
  const [customLogo, setCustomLogo] = useState<string | null>(null);

  useEffect(() => {
    // Check local storage for custom logo
    const checkCustomLogo = () => {
      const savedLogo = localStorage.getItem('rsud_custom_logo');
      setCustomLogo(savedLogo);
    };

    checkCustomLogo();

    // Listen to custom event for logo updates across components
    window.addEventListener('rsud_logo_updated', checkCustomLogo);
    return () => {
      window.removeEventListener('rsud_logo_updated', checkCustomLogo);
    };
  }, []);

  if (customLogo) {
    return (
      <div className={`inline-flex flex-col items-center justify-center shrink-0 ${className}`}>
        <img src={customLogo} alt="Logo Custom RSUD" className="w-full h-full object-contain filter drop-shadow-sm" />
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center justify-center shrink-0 ${className}`}>
      <svg
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain filter drop-shadow-sm"
        aria-label="Logo RSUD Jatisari"
      >
        <defs>
          <path
            id="textPathTop"
            d="M 65 240 A 185 185 0 0 1 435 240"
            fill="none"
          />
        </defs>

        <text fill="#006CB5" fontSize="54" fontWeight="900" letterSpacing="3.5" fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif">
          <textPath href="#textPathTop" startOffset="50%" textAnchor="middle">
            RSUD JATISARI
          </textPath>
        </text>

        <g transform="translate(0, 10)">
          {/* MEDICAL CROSS - Green Top & Left Arms */}
          <path d="
            M 205 125 
            C 205 112 215 102 228 102 
            L 272 102 
            C 285 102 295 112 295 125 
            L 295 200 
            L 375 200 
            C 388 200 398 210 398 223 
            L 398 277 
            C 398 290 388 300 375 300 
            L 295 300 
            L 295 375 
            C 295 388 285 398 272 398 
            L 228 398 
            C 215 398 205 388 205 375 
            L 205 300 
            L 125 300 
            C 112 300 102 290 102 277 
            L 102 223 
            C 102 210 112 200 125 200 
            L 205 200 
            Z" fill="#4EA832" />

          {/* MEDICAL CROSS - Blue Right & Bottom Arms */}
          <path d="
            M 205 300
            C 205 240 240 200 300 200
            L 375 200 
            C 388 200 398 210 398 223 
            L 398 277 
            C 398 290 388 300 375 300 
            L 295 300 
            L 295 375 
            C 295 388 285 398 272 398 
            L 228 398 
            C 215 398 205 388 205 375 
            Z" fill="#006CB5" />

          {/* White Gap Separator */}
          <path d="M 197 305 C 197 232 238 192 305 192" fill="none" stroke="#FFFFFF" strokeWidth="15" strokeLinecap="round" />

          {/* Blue Background for Lungs */}
          <path d="
            M 205 275 
            C 205 220 225 200 250 200 
            C 275 200 295 220 295 275 
            L 295 300 
            L 205 300 
            Z" fill="#006CB5" />

          {/* White Lungs */}
          <path d="M 247 212 L 253 212 L 253 232 L 250 236 L 247 232 Z" fill="#FFFFFF" />
          <path d="
            M 245 233
            C 230 225 212 240 216 265
            C 219 278 232 278 240 268
            C 246 260 245 242 245 233
            Z" fill="#FFFFFF" />
          <path d="
            M 255 233
            C 270 225 288 240 284 265
            C 281 278 268 278 260 268
            C 254 260 255 242 255 233
            Z" fill="#FFFFFF" />
        </g>

        {/* Hands */}
        <g transform="translate(0, 10)">
          {/* Left Hand Green */}
          <path d="
            M 250 455
            C 180 455 125 425 98 385
            C 85 365 85 335 88 310
            C 89 300 97 296 102 308
            C 112 334 130 358 158 370
            C 134 350 120 326 128 308
            C 133 296 142 300 148 312
            C 158 335 180 360 210 375
            C 185 355 175 330 185 320
            C 192 312 200 320 205 330
            C 220 360 245 385 275 398
            C 240 435 210 455 250 455
            Z" fill="#4EA832" />

          {/* Right Hand Blue with white stroke for gap */}
          <path d="
            M 245 455
            C 320 455 375 425 402 385
            C 415 365 415 335 412 310
            C 411 300 403 296 398 308
            C 388 334 370 358 342 370
            C 366 350 380 326 372 308
            C 367 296 358 300 352 312
            C 342 335 320 360 290 375
            C 315 355 325 330 315 320
            C 308 312 300 320 295 330
            C 280 360 255 385 225 398
            C 260 435 290 455 245 455
            Z" fill="#006CB5" stroke="#FFFFFF" strokeWidth="8" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
};
