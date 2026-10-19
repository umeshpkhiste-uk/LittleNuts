import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { LegalSection } from '@/components/legal-section';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

const FAQS: { question: string; answer: string }[] = [
  {
    question: 'How do I track my order?',
    answer:
      'Open the My Orders tab from the bottom navigation. Every order shows its current status — accepted, being prepared, out for delivery, or delivered.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'Cash on Delivery, and online payment via UPI, debit/credit card, or net banking through Razorpay. We never see or store your card details.',
  },
  {
    question: 'Can I cancel or change an order after placing it?',
    answer:
      'You can cancel an order from My Orders as long as the store hasn’t started preparing it yet. Once it’s accepted, please contact support and we’ll do our best to help.',
  },
  {
    question: 'What if an item arrives damaged, stale, or incorrect?',
    answer:
      'Contact support within 48 hours of delivery with a photo of the item. We’ll replace it or refund that item’s cost — your call.',
  },
  {
    question: 'How do I change my delivery address?',
    answer:
      'Go to Profile → Address to add, edit, or set a default address, separately for your own deliveries and for ones you’re sending to someone else.',
  },
  {
    question: 'How fresh are the dry fruits and seeds?',
    answer:
      'Every batch is sourced and packed to order where possible. Each product page lists its origin and any handling notes (for example, which nuts are best refrigerated).',
  },
  {
    question: 'How do I delete my account?',
    answer:
      'Go to Profile and scroll to "Delete My Account". Note that account deletion currently requires contacting support directly to complete.',
  },
];

export function HelpSupportScreen() {
  const theme = useAppTheme();

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <LegalSection
        title="We're here to help"
        paragraphs={[
          'Most questions about orders, delivery, and your account are answered below. If you need a person, reach us using the options below and we’ll get back to you as soon as we can.',
        ]}
      />

      <Pressable
        style={[styles.contactRow, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => Linking.openURL('mailto:support@littlenuts.in')}
      >
        <Ionicons name="mail-outline" size={18} color={theme.textPrimary} />
        <View style={styles.contactTextWrap}>
          <Text style={[styles.contactLabel, { color: theme.textPrimary }]}>Email Support</Text>
          <Text style={[styles.contactValue, { color: theme.textSecondary }]}>support@littlenuts.in</Text>
        </View>
      </Pressable>
      <Pressable
        style={[styles.contactRow, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => Linking.openURL('tel:+911234567890')}
      >
        <Ionicons name="call-outline" size={18} color={theme.textPrimary} />
        <View style={styles.contactTextWrap}>
          <Text style={[styles.contactLabel, { color: theme.textPrimary }]}>Call Support</Text>
          <Text style={[styles.contactValue, { color: theme.textSecondary }]}>
            +91 12345 67890 · 9am–7pm, every day
          </Text>
        </View>
      </Pressable>

      <Text style={[styles.faqHeading, { color: theme.textPrimary }]}>Frequently Asked Questions</Text>
      {FAQS.map((faq) => (
        <View key={faq.question} style={[styles.faqCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.faqQuestion, { color: theme.textPrimary }]}>{faq.question}</Text>
          <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>{faq.answer}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  contactTextWrap: {
    gap: 2,
  },
  contactLabel: {
    ...typography.bodyStrong,
  },
  contactValue: {
    ...typography.caption,
  },
  faqHeading: {
    ...typography.h2,
    marginTop: spacing.sm,
  },
  faqCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  faqQuestion: {
    ...typography.bodyStrong,
  },
  faqAnswer: {
    ...typography.caption,
    lineHeight: 18,
  },
});
