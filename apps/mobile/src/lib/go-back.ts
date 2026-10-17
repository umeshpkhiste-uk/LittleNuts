import { router } from 'expo-router';

// router.back() throws/no-ops with a "GO_BACK was not handled" warning when
// there's no history to go back to — which happens whenever this screen was
// reached via router.replace() (e.g. the splash screen's launch routing, or
// onboarding's "Get Started") rather than pushed on top of another screen.
// Falls back to the welcome screen in that case instead of doing nothing.
export function goBack(fallbackHref: Parameters<typeof router.replace>[0] = '/onboarding'): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallbackHref);
  }
}
