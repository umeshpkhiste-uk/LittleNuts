import { ScrollView, StyleSheet, Text } from 'react-native';

import { LegalSection } from '@/components/legal-section';
import { useAppTheme } from '@/theme/theme-provider';
import { spacing, typography } from '@/theme/tokens';

export function PrivacyPolicyScreen() {
  const theme = useAppTheme();

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.updated, { color: theme.textSecondary }]}>Last updated: October 2026</Text>

      <LegalSection
        title="1. Information We Collect"
        paragraphs={[
          'Account information: your name, email address, and phone number, collected when you create an account.',
          'Delivery addresses: the addresses you save for your own deliveries and for deliveries to other people, including recipient name and phone number.',
          'Order history: the products, quantities, and amounts of orders you place, and their delivery and payment status.',
          'Favorites: products you choose to save using the heart icon.',
          'We do not collect or store your card, UPI, or bank details — online payments are processed directly by Razorpay, our payment partner.',
        ]}
      />

      <LegalSection
        title="2. How We Use Your Information"
        paragraphs={[
          'To process and deliver your orders, including sharing your delivery address and phone number with our delivery staff for that specific order.',
          'To provide customer support when you contact us.',
          'To show you your own order history, saved addresses, and favorites within the app.',
          'To improve the app and catalog based on overall usage patterns — we do not sell your personal information to advertisers or data brokers.',
        ]}
      />

      <LegalSection
        title="3. Who We Share It With"
        paragraphs={[
          'Razorpay, to process online payments (UPI, card, net banking) — they receive only what’s needed to complete the transaction.',
          'Our delivery personnel, limited to the specific address, recipient name, and phone number needed to deliver a specific order.',
          'We do not share your information with any other third party except where required by law.',
        ]}
      />

      <LegalSection
        title="4. Data Storage & Security"
        paragraphs={[
          'Your data is stored with Supabase, our backend provider, behind row-level security rules that ensure only you (and, for order fulfillment purposes, store staff) can access your account’s data.',
          'All connections between the app and our servers are encrypted (HTTPS/TLS).',
        ]}
      />

      <LegalSection
        title="5. Your Rights"
        paragraphs={[
          'You can view and edit your saved addresses and favorites directly in the app at any time.',
          'You can request a copy of your data, or request that your account and associated data be deleted, by contacting support (see Help & Support). We honor deletion requests except where we’re required to retain order records for accounting or legal purposes.',
        ]}
      />

      <LegalSection
        title="6. Cookies & Tracking"
        paragraphs={[
          'The app does not use third-party advertising trackers. On the web version, we use only the minimum local storage needed to keep you signed in and remember your preferences (like your chosen theme).',
        ]}
      />

      <LegalSection
        title="7. Children's Privacy"
        paragraphs={[
          'LittleNuts is not directed at children under 13, and we do not knowingly collect personal information from them.',
        ]}
      />

      <LegalSection
        title="8. Changes to This Policy"
        paragraphs={[
          'We may update this policy from time to time. Material changes will be reflected here with an updated date at the top of this page.',
        ]}
      />

      <LegalSection
        title="9. Contact Us"
        paragraphs={[
          'Questions about this policy or your data can be sent to support@littlenuts.in.',
        ]}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  updated: {
    ...typography.caption,
  },
});
