import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useAddFavorite, useIsFavorite, useRemoveFavorite } from '@/hooks/favorites/use-favorites';
import { useAuthStore } from '@/stores/auth-store';

type FavoriteButtonProps = {
  productId: string;
  size?: number;
  activeColor: string;
  inactiveColor: string;
  style?: StyleProp<ViewStyle>;
};

// Shared across Home/Categories/Product Details so the heart icon is one
// real, persisted favorite (backed by the favorites table) instead of each
// screen keeping its own local, reset-on-reload "liked" state.
export function FavoriteButton({
  productId,
  size = 16,
  activeColor,
  inactiveColor,
  style,
}: FavoriteButtonProps) {
  const session = useAuthStore((state) => state.session);
  const isFavorite = useIsFavorite(productId);
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  function handlePress(event: { stopPropagation: () => void }) {
    event.stopPropagation();
    if (!session) {
      router.push('/auth/login');
      return;
    }
    if (isFavorite) {
      removeFavorite.mutate(productId);
    } else {
      addFavorite.mutate(productId);
    }
  }

  return (
    <Pressable onPress={handlePress} hitSlop={8} style={style}>
      <Ionicons
        name={isFavorite ? 'heart' : 'heart-outline'}
        size={size}
        color={isFavorite ? activeColor : inactiveColor}
      />
    </Pressable>
  );
}
