import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Category } from '@littlenuts/shared';

import { FormTextInput } from '@/components/form-text-input';
import { PrimaryButton } from '@/components/primary-button';
import { useCategories } from '@/hooks/catalog/use-categories';
import {
  useCreateCategory,
  useDeleteCategory,
  useSetCategoryActive,
  useUpdateCategory,
} from '@/hooks/admin/use-admin-categories';
import { confirmAction } from '@/lib/confirm-action';
import { showAlert } from '@/lib/show-alert';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

export function AdminCategoriesScreen() {
  const theme = useAppTheme();
  const categories = useCategories({ includeInactive: true });
  const createCategory = useCreateCategory();
  const setActive = useSetCategoryActive();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

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
      setNewDescription('');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create category.');
    }
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditName(category.name);
    setEditDescription(category.description ?? '');
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function saveEdit(id: string) {
    setEditError(null);
    if (!editName.trim()) {
      setEditError('Category name is required.');
      return;
    }
    try {
      await updateCategory.mutateAsync({ id, name: editName.trim(), description: editDescription });
      setEditingId(null);
    } catch (saveError) {
      setEditError(saveError instanceof Error ? saveError.message : 'Could not save category.');
    }
  }

  async function handleDelete(category: Category) {
    const confirmed = await confirmAction(
      'Delete category?',
      `This permanently deletes "${category.name}". This can't be undone.`,
    );
    if (!confirmed) return;
    try {
      await deleteCategory.mutateAsync(category.id);
    } catch (deleteError) {
      showAlert(
        'Could not delete category',
        deleteError instanceof Error ? deleteError.message : 'Something went wrong.',
      );
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
        categories.data?.map((category) => {
          const isEditing = editingId === category.id;
          return (
            <View
              key={category.id}
              style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              {isEditing ? (
                <>
                  <FormTextInput label="Name" value={editName} onChangeText={setEditName} />
                  <FormTextInput
                    label="Description"
                    value={editDescription}
                    onChangeText={setEditDescription}
                    multiline
                  />
                  {editError ? (
                    <Text style={[styles.error, { color: theme.danger }]}>{editError}</Text>
                  ) : null}
                  <View style={styles.editActions}>
                    <Pressable onPress={cancelEdit} style={styles.editActionButton}>
                      <Text style={[styles.editActionText, { color: theme.textSecondary }]}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => saveEdit(category.id)}
                      disabled={updateCategory.isPending}
                      style={styles.editActionButton}
                    >
                      <Text style={[styles.editActionText, { color: theme.primary }]}>Save</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.rowHeader}>
                    <View style={styles.rowHeaderText}>
                      <Text style={[styles.name, { color: theme.textPrimary }]}>{category.name}</Text>
                      {category.description ? (
                        <Text numberOfLines={2} style={[styles.description, { color: theme.textSecondary }]}>
                          {category.description}
                        </Text>
                      ) : null}
                    </View>
                    <Switch
                      value={category.is_active}
                      onValueChange={(value) => setActive.mutate({ id: category.id, isActive: value })}
                    />
                  </View>
                  <View style={styles.rowActions}>
                    <Pressable onPress={() => startEdit(category)} style={styles.iconButton} hitSlop={8}>
                      <Ionicons name="create-outline" size={18} color={theme.textSecondary} />
                      <Text style={[styles.iconButtonText, { color: theme.textSecondary }]}>Edit</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(category)}
                      disabled={deleteCategory.isPending}
                      style={styles.iconButton}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={18} color={theme.danger} />
                      <Text style={[styles.iconButtonText, { color: theme.danger }]}>Delete</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          );
        })
      )}

      <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>Add Category</Text>
      <FormTextInput label="Name" value={newName} onChangeText={setNewName} />
      <FormTextInput
        label="Description (optional)"
        value={newDescription}
        onChangeText={setNewDescription}
        multiline
      />
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
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowHeaderText: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.bodyStrong,
  },
  description: {
    ...typography.caption,
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButtonText: {
    ...typography.caption,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.lg,
  },
  editActionButton: {
    paddingVertical: spacing.xs,
  },
  editActionText: {
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
