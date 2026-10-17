import { Alert, Platform } from 'react-native';

// Alert.alert is a no-op on web (react-native-web ships an empty stub),
// so this falls back to window.alert there to still give the user feedback.
export function showAlert(title: string, message: string): void {
  if (Platform.OS === 'web') {
    window.alert(message);
  } else {
    Alert.alert(title, message);
  }
}
