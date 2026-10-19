import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { FormTextInput } from '@/components/form-text-input';
import { PrimaryButton } from '@/components/primary-button';
import { useCreateAddress, type RecipientType } from '@/hooks/addresses/use-addresses';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

export function NewAddressScreen() {
  const theme = useAppTheme();
  const createAddress = useCreateAddress();
  const params = useLocalSearchParams<{ type?: string }>();

  const [recipientType, setRecipientType] = useState<RecipientType>(
    params.type === 'other' ? 'other' : 'own',
  );
  const [recipientName, setRecipientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (
      !recipientName.trim() ||
      !phoneNumber.trim() ||
      !addressLine1.trim() ||
      !city.trim() ||
      !state.trim() ||
      !postalCode.trim()
    ) {
      setError('Please fill in all required fields.');
      return;
    }
    try {
      await createAddress.mutateAsync({
        recipient_name: recipientName.trim(),
        phone_number: phoneNumber.trim(),
        address_line_1: addressLine1.trim(),
        address_line_2: addressLine2.trim() || null,
        area: area.trim() || null,
        city: city.trim(),
        state: state.trim(),
        postal_code: postalCode.trim(),
        delivery_instructions: deliveryInstructions.trim() || null,
        recipient_type: recipientType,
        is_default: isDefault,
      });
      router.back();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not save address.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.typeRow}>
          <Pressable
            onPress={() => setRecipientType('own')}
            style={[
              styles.typeChip,
              { borderColor: theme.border },
              recipientType === 'own' && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
          >
            <Text
              style={[
                styles.typeChipText,
                { color: recipientType === 'own' ? theme.primaryText : theme.textPrimary },
              ]}
            >
              Own Address
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setRecipientType('other')}
            style={[
              styles.typeChip,
              { borderColor: theme.border },
              recipientType === 'other' && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
          >
            <Text
              style={[
                styles.typeChipText,
                { color: recipientType === 'other' ? theme.primaryText : theme.textPrimary },
              ]}
            >
              Other&apos;s Address
            </Text>
          </Pressable>
        </View>

        <FormTextInput label="Recipient name" value={recipientName} onChangeText={setRecipientName} />
        <FormTextInput
          label="Phone number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
        <FormTextInput
          label="Address line 1"
          value={addressLine1}
          onChangeText={setAddressLine1}
        />
        <FormTextInput
          label="Address line 2 (optional)"
          value={addressLine2}
          onChangeText={setAddressLine2}
        />
        <FormTextInput label="Area (optional)" value={area} onChangeText={setArea} />
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <FormTextInput label="City" value={city} onChangeText={setCity} />
          </View>
          <View style={styles.rowItem}>
            <FormTextInput label="State" value={state} onChangeText={setState} />
          </View>
        </View>
        <FormTextInput
          label="Postal code"
          value={postalCode}
          onChangeText={setPostalCode}
          keyboardType="number-pad"
        />
        <FormTextInput
          label="Delivery instructions (optional)"
          value={deliveryInstructions}
          onChangeText={setDeliveryInstructions}
        />

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: theme.textPrimary }]}>
            Set as default address
          </Text>
          <Switch value={isDefault} onValueChange={setIsDefault} />
        </View>

        {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

        <PrimaryButton
          title="Save Address"
          loading={createAddress.isPending}
          onPress={handleSubmit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  typeChipText: {
    ...typography.bodyStrong,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    ...typography.bodyStrong,
  },
  error: {
    ...typography.body,
  },
});
