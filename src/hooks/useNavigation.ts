import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

/**
 * Returns a navigate function that respects the user's "open in new tab" preference
 * from Settings > Appearance > Navigation Behavior.
 *
 * Usage:
 *   const nav = useNavigation();
 *   nav('/quotes/new');  // opens in new tab or same tab per preference
 */
export function useNavigation() {
  const navigate = useNavigate();
  const { companySettings } = useStore();
  const openInNewTab = companySettings?.openLinksInNewTab ?? true;

  return (path: string, forceNewTab = false) => {
    if (forceNewTab || openInNewTab) {
      window.open(path, '_blank');
    } else {
      navigate(path);
    }
  };
}
