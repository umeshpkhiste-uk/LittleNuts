import AsyncStorage from '@react-native-async-storage/async-storage';

const HAS_ACCOUNT_KEY = 'littlenuts:has-account';

// Tracks whether this device has ever successfully logged in or registered,
// so a logged-out user can be routed to sign-in (they've had an account
// before) rather than sign-up (they've never had one) — a plain "no
// session" check can't tell those two cases apart on its own.
export async function getHasAccount(): Promise<boolean> {
  const value = await AsyncStorage.getItem(HAS_ACCOUNT_KEY);
  return value === 'true';
}

export async function setHasAccount(): Promise<void> {
  await AsyncStorage.setItem(HAS_ACCOUNT_KEY, 'true');
}
