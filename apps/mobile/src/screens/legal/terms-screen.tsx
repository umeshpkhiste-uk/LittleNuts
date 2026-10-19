import { ScrollView, StyleSheet, Text } from 'react-native';

import { LegalSection } from '@/components/legal-section';
import { useAppTheme } from '@/theme/theme-provider';
import { spacing, typography } from '@/theme/tokens';

export function TermsScreen() {
  const theme = useAppTheme();

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.updated, { color: theme.textSecondary }]}>Last updated: October 2026</Text>

      <LegalSection
        title="1. Acceptance of Terms"
        paragraphs={[
          'By creating an account or placing an order on LittleNuts, you agree to these Terms & Conditions and to our Privacy Policy.',
        ]}
      />

      <LegalSection
        title="2. Your Account"
        paragraphs={[
          'You’re responsible for keeping your account credentials secure and for all activity under your account.',
          'You must provide accurate recipient and delivery details — we’re not responsible for failed deliveries caused by incorrect address or contact information.',
        ]}
      />

      <LegalSection
        title="3. Orders & Pricing"
        paragraphs={[
          'All prices are listed in Indian Rupees (₹) and include applicable taxes shown at checkout unless stated otherwise.',
          'Prices, weights, and product availability can change without prior notice. The price and quantity confirmed at the time you place an order is what you’ll be charged.',
          'We reserve the right to decline or cancel an order — for example if an item goes out of stock after ordering — in which case any payment already made will be refunded.',
        ]}
      />

      <LegalSection
        title="4. Payments"
        paragraphs={[
          'We accept Cash on Delivery and online payment (UPI, card, net banking) via Razorpay. Online payments are subject to Razorpay’s own terms and security checks.',
        ]}
      />

      <LegalSection
        title="5. Delivery"
        paragraphs={[
          'Delivery times shown in the app are estimates, not guarantees. Delays can occur due to weather, logistics, or circumstances outside our control.',
        ]}
      />

      <LegalSection
        title="6. Cancellations, Returns & Refunds"
        paragraphs={[
          'Orders can be cancelled free of charge any time before the store has started preparing them.',
          'Because most of our products are perishable dry fruits and seeds, we don’t accept returns for change of mind once an order has been dispatched. Damaged, stale, or incorrect items are eligible for a replacement or refund — contact support within 48 hours of delivery with a photo of the issue.',
          'Approved refunds are issued to the original payment method and may take several business days to reflect, depending on your bank or payment provider.',
        ]}
      />

      <LegalSection
        title="7. Acceptable Use"
        paragraphs={[
          'You agree not to misuse the app — including placing fraudulent orders, attempting to access another user’s account or data, or interfering with the app’s normal operation.',
        ]}
      />

      <LegalSection
        title="8. Intellectual Property"
        paragraphs={[
          'The LittleNuts name, logo, and all app content (other than your own account data) belong to LittleNuts and may not be copied or reused without permission.',
        ]}
      />

      <LegalSection
        title="9. Limitation of Liability"
        paragraphs={[
          'To the extent permitted by law, LittleNuts’s liability for any issue with an order is limited to the value of that order. We’re not liable for indirect or consequential losses.',
        ]}
      />

      <LegalSection
        title="10. Governing Law"
        paragraphs={[
          'These terms are governed by the laws of India, and any disputes will be subject to the jurisdiction of the courts of India.',
        ]}
      />

      <LegalSection
        title="11. Changes to These Terms"
        paragraphs={[
          'We may update these terms from time to time. Continuing to use the app after a change means you accept the updated terms.',
        ]}
      />

      <LegalSection
        title="12. Contact Us"
        paragraphs={[
          'Questions about these terms can be sent to support@littlenuts.in.',
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
