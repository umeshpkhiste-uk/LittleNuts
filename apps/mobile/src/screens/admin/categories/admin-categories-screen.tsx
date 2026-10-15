import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { FormTextInput } from '@/components/form-text-input';
import { PrimaryButton } from '@/components/primary-button';
import { useCategories } from '@/hooks/catalog/use-categories';
import { useCreateCategory, useSetCategoryActive } from '@/hooks/admin/use-admin-categories';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

export function AdminCategoriesScreen() {
  const theme = useAppTheme();
  const categories = useCategories({ includeInactive: true });
  const createCategory = useCreateCategory();
  const setActive = useSetCategoryActive();
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setError(null);
    if (!newName.trim()) {
      setError('Category name is required.');
      return;
    }
    try {
      await createCategory.mutateAsync({
        name: newName.trim(),
        sortOrder: (categories.data?.length ?? 0) + 1,
      });
      setNewName('');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create category.');
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.title, { color: theme.textPrimary }]}>Categories</Text>

      {categories.isLoading ? (
        <ActivityIndicator color={theme.primary} />
      ) : (
        categories.data?.map((category) => (
          <View
            key={category.id}
            style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Text style={[styles.name, { color: theme.textPrimary }]}>{category.name}</Text>
            <Switch
              value={category.is_active}
              onValueChange={(value) => setActive.mutate({ id: category.id, isActive: value })}
            />
          </View>
        ))
      )}

      <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>Add Category</Text>
      <FormTextInput label="Name" value={newName} onChangeText={setNewName} />
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
      <PrimaryButton title="Add Category" loading={createCategory.isPending} onPress={handleCreate} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  name: {
    ...typography.bodyStrong,
  },
  sectionLabel: {
    ...typography.bodyStrong,
    marginTop: spacing.md,
  },
  error: {
    ...typography.caption,
  },
});
