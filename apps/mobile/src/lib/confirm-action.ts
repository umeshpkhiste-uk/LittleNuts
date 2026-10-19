import { Alert, Platform } from 'react-native';

// Alert.alert's multi-button form (Cancel/Delete) is a no-op on web (see
// show-alert.ts), so this uses window.confirm there instead to still get a
// real yes/no decision out of the user before a destructive action.
export function confirmAction(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
