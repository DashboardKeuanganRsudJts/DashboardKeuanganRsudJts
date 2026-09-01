/**
 * Helper utility to synchronize the browser tab favicon with the RSUD custom logo.
 * Supports dynamic real-time updates when user changes or resets the logo in Settings.
 */

const DEFAULT_FAVICON = '/favicon.svg';

/**
 * Generates an optimized square icon data URL from any image source (Base64 or URL).
 * Ensures proper aspect ratio and crisp rendering on browser tabs.
 */
function createFaviconFromImage(imageSrc: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Calculate aspect ratio fit
        const maxDim = Math.max(img.width, img.height);
        const scale = size / maxDim;
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        const offsetX = (size - drawWidth) / 2;
        const offsetY = (size - drawHeight) / 2;

        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (err) {
        console.warn('Canvas favicon conversion error, using raw source:', err);
        resolve(imageSrc);
      }
    };

    img.onerror = () => {
      resolve(imageSrc);
    };

    img.src = imageSrc;
  });
}

/**
 * Replaces all favicon link elements in document.head with the target icon URL.
 */
function applyFaviconToHead(iconUrl: string) {
  if (typeof document === 'undefined') return;

  // Select existing favicon and icon link tags
  const existingLinks = document.querySelectorAll<HTMLLinkElement>(
    "link[rel*='icon'], link[rel='apple-touch-icon']"
  );

  // Remove existing links to force browser to repaint tab icon
  existingLinks.forEach((el) => el.parentNode?.removeChild(el));

  // Create standard icon link
  const link = document.createElement('link');
  link.type = iconUrl.startsWith('data:image/svg') || iconUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
  link.rel = 'icon';
  link.href = iconUrl;
  document.head.appendChild(link);

  // Create shortcut icon link (for legacy / compatibility)
  const shortcutLink = document.createElement('link');
  shortcutLink.rel = 'shortcut icon';
  shortcutLink.href = iconUrl;
  document.head.appendChild(shortcutLink);

  // Create apple-touch-icon
  const appleLink = document.createElement('link');
  appleLink.rel = 'apple-touch-icon';
  appleLink.href = iconUrl;
  document.head.appendChild(appleLink);
}

/**
 * Updates the browser favicon dynamically based on custom logo or fallback.
 */
export async function updateAppFavicon(customLogoSrc?: string | null) {
  const logo = customLogoSrc !== undefined ? customLogoSrc : localStorage.getItem('rsud_custom_logo');

  if (logo && logo.trim()) {
    try {
      const optimizedFavicon = await createFaviconFromImage(logo);
      applyFaviconToHead(optimizedFavicon);
    } catch (e) {
      applyFaviconToHead(logo);
    }
  } else {
    applyFaviconToHead(DEFAULT_FAVICON);
  }
}

/**
 * Initializes automatic synchronization of the browser favicon across events and tabs.
 */
export function initFaviconSync(): () => void {
  // Initial sync
  updateAppFavicon();

  const handleCustomEvent = () => {
    updateAppFavicon();
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === 'rsud_custom_logo') {
      updateAppFavicon(e.newValue);
    }
  };

  window.addEventListener('rsud_logo_updated', handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener('rsud_logo_updated', handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}
