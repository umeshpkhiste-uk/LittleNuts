import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const SAVED_CREDENTIALS_KEY = 'littlenuts-saved-credentials';

type SavedCredentials = {
  email: string;
  password: string;
};

// SecureStore (the device keychain/keystore) has no web implementation, so
// "save password" is a native-only convenience — on web these are no-ops
// and the checkbox simply has no persisted effect.
const isSupported = Platform.OS !== 'web';

export async function getSavedCredentials(): Promise<SavedCredentials | null> {
  if (!isSupported) return null;
  const raw = await SecureStore.getItemAsync(SAVED_CREDENTIALS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SavedCredentials;
  } catch {
    return null;
  }
}

export async function setSavedCredentials(credentials: SavedCredentials): Promise<void> {
  if (!isSupported) return;
  await SecureStore.setItemAsync(SAVED_CREDENTIALS_KEY, JSON.stringify(credentials));
}

export async function clearSavedCredentials(): Promise<void> {
  if (!isSupported) return;
  await SecureStore.deleteItemAsync(SAVED_CREDENTIALS_KEY);
}
