import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';

/**
 * Returns the effective display name of the user, prioritizing cached custom name,
 * then user.displayName, then email prefix.
 */
export function getEffectiveDisplayName(user: { uid?: string; displayName?: string | null; email?: string | null } | null): string {
  if (!user) return 'Pengguna';
  
  if (user.uid) {
    try {
      const cached = localStorage.getItem(`rsud_user_display_name_${user.uid}`);
      if (cached && cached.trim()) {
        return cached.trim();
      }
    } catch (e) {
      console.warn('localStorage read error:', e);
    }
  }

  if (user.displayName && user.displayName.trim()) {
    return user.displayName.trim();
  }

  return user.email?.split('@')[0] || 'Pengguna';
}

/**
 * Returns the effective avatar URL for the user, prioritizing locally cached custom photo
 * (e.g. uploaded base64 image or storage URL), then user.photoURL, then UI Avatars fallback.
 */
export function getEffectiveUserAvatar(user: { uid?: string; photoURL?: string | null; displayName?: string | null; email?: string | null } | null): string {
  const fallbackName = getEffectiveDisplayName(user);
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=059669&color=fff&size=200&bold=true`;

  if (!user) return defaultAvatar;

  // 1. Check local storage cache (supports custom uploaded images/base64 without URL length limits)
  if (user.uid) {
    try {
      const cached = localStorage.getItem(`rsud_user_avatar_${user.uid}`);
      if (cached && cached.trim()) {
        return cached.trim();
      }
    } catch (e) {
      console.warn('localStorage read error:', e);
    }
  }

  // 2. Check user.photoURL if available
  if (user.photoURL && user.photoURL.trim()) {
    return user.photoURL.trim();
  }

  return defaultAvatar;
}

/**
 * Saves user profile data to localStorage for instant cache and offline access
 */
export function setLocalUserProfile(uid: string, data: { displayName?: string | null; photoURL?: string | null }) {
  if (!uid) return;
  try {
    if (data.photoURL !== undefined) {
      if (data.photoURL) {
        localStorage.setItem(`rsud_user_avatar_${uid}`, data.photoURL);
      } else {
        localStorage.removeItem(`rsud_user_avatar_${uid}`);
      }
    }

    if (data.displayName !== undefined) {
      if (data.displayName) {
        localStorage.setItem(`rsud_user_display_name_${uid}`, data.displayName);
      } else {
        localStorage.removeItem(`rsud_user_display_name_${uid}`);
      }
    }
  } catch (err) {
    console.warn('Failed to update local storage user profile:', err);
  }
}

/**
 * Custom React Hook to automatically re-render components when profile is updated
 */
export function useUserProfile(user: User | null) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => {
      setTick(t => t + 1);
    };
    window.addEventListener('user_profile_updated', handler);
    return () => window.removeEventListener('user_profile_updated', handler);
  }, []);

  return {
    displayName: getEffectiveDisplayName(user),
    photoURL: getEffectiveUserAvatar(user)
  };
}
