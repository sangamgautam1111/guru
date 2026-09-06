import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  Users,
  Plus,
  Minus,
  RotateCcw,
  ShieldCheck,
  HeartHandshake,
  Check,
  User,
  ChevronRight,
  Smartphone,
  CheckCircle2,
} from 'lucide-react-native';
import { SupporterBadgeInfo } from '../hooks/useDakshina';
import SupporterBadge from './SupporterBadge';

interface GuruDakshinaHubProps {
  isPatron: boolean;
  badge: SupporterBadgeInfo;
  sponsorCount: number;
  setSponsorCount: (count: number | ((prev: number) => number)) => void;
  lifetimeSponsorCount: number;
  isPurchasing: boolean;
  donationSuccessMsg: string | null;
  onSponsor: (count: number, tierTitle?: string) => Promise<boolean>;
  onRestore: () => Promise<void>;
  userName?: string;
  onEditProfile?: () => void;
}

const FONT_FAMILY = Platform.select({ ios: 'Inter', android: 'Inter, sans-serif' });

const TIER_DELIVERABLES = [
  'Installed directly on parent phone with zero data usage',
  'Class 10 Science, Math, Social, English & Nepali',
  'All 7 provinces 2081 board papers & solutions',
  '100% offline Gemma 2B AI tutor',
];

export const GuruDakshinaHub: React.FC<GuruDakshinaHubProps> = ({
  isPatron,
  badge,
  sponsorCount,
  setSponsorCount,
  lifetimeSponsorCount,
  isPurchasing,
  donationSuccessMsg,
  onSponsor,
  onRestore,
  userName = 'Student',
  onEditProfile,
}) => {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Header Block */}
      <View style={styles.headerContainer}>
        <View style={styles.headerBadgeRow}>
          <HeartHandshake size={15} color="#FFFFFF" style={{ marginRight: 6 }} strokeWidth={2} />
          <Text style={styles.headerEyebrow}>GURU DAKSHINA</Text>
        </View>
        <Text style={styles.headerMainTitle}>COMMUNITY SPONSORSHIP HUB</Text>
        <Text style={styles.headerSub}>
          Guru is 100% free for students in rural Nepal. Community sponsors fund offline digital
          learning kits so no student is left behind due to lack of internet.
        </Text>
      </View>

      {/* Active Supporter Status Card */}
      {lifetimeSponsorCount > 0 && (
        <SupporterBadge badge={badge} count={lifetimeSponsorCount} />
      )}

      {/* Success Notification Banner */}
      {donationSuccessMsg && (
        <View style={styles.successBanner}>
          <CheckCircle2 size={16} color="#FFFFFF" style={{ marginRight: 10 }} />
          <Text style={styles.successBannerText}>{donationSuccessMsg}</Text>
        </View>
      )}

      {/* Section Header */}
      <Text style={styles.sectionHeading}>OFFLINE LEARNING KIT SPONSORSHIP</Text>

      {/* Sponsorship Focus Card ($1 Student Kit) */}
      <View style={styles.tierCard}>
        <View style={styles.tierTopRow}>
          <View style={styles.tierIconBox}>
            <User size={22} color="#FFFFFF" strokeWidth={2} />
          </View>
          <View style={styles.tierPriceBox}>
            <Text style={styles.tierPriceText}>$1</Text>
            <Text style={styles.tierPriceSub}>USD / Student</Text>
          </View>
        </View>

        {/* Parent's Phone Chip */}
        <View style={styles.tierBadgeLabelPill}>
          <Smartphone size={12} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.tierBadgeLabelText}>Parent's Phone → Zero Internet</Text>
        </View>

        <Text style={styles.tierTitle}>Student Kit (Parent's Phone)</Text>
        <Text style={styles.tierTagline}>$1 Sponsors 1 Student's Offline Kit</Text>
        <Text style={styles.tierDesc}>
          We install Guru directly on a parent's phone for students who have a family phone but zero
          home internet or data. Gives the student full offline Class 10 CDC textbooks, SEE past
          papers, and local Gemma 2B AI.
        </Text>

        {/* Deliverables Checklist */}
        <View style={styles.deliverablesList}>
          {TIER_DELIVERABLES.map((item, idx) => (
            <View key={`deliv-${idx}`} style={styles.deliverableRow}>
              <Check size={14} color="#FFFFFF" style={{ marginRight: 8 }} strokeWidth={2.4} />
              <Text style={styles.deliverableText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Custom Sponsor Quantity Box */}
      <View style={styles.customBox}>
        <View style={styles.customHeaderRow}>
          <Users size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.customHeaderTitle}>Custom Student Count</Text>
        </View>
        <Text style={styles.customDesc}>
          Every $1 sponsors 1 student with full offline textbooks, model questions, and local AI access.
        </Text>

        <View style={styles.counterRow}>
          <View style={styles.counterControl}>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => setSponsorCount((prev: number) => Math.max(1, prev - 1))}
              activeOpacity={0.7}
            >
              <Minus size={16} color="#FFFFFF" strokeWidth={2.2} />
            </TouchableOpacity>

            <View style={styles.counterDisplay}>
              <Text style={styles.counterNumber}>{sponsorCount}</Text>
              <Text style={styles.counterLabel}>{sponsorCount === 1 ? 'Student' : 'Students'}</Text>
            </View>

            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => setSponsorCount((prev: number) => Math.min(100, prev + 1))}
              activeOpacity={0.7}
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          <View style={styles.totalPriceCard}>
            <Text style={styles.totalPriceAmount}>{`$${(sponsorCount * 1.0).toFixed(2)}`}</Text>
            <Text style={styles.totalPriceCurrency}>USD Total</Text>
          </View>
        </View>

        {/* Quick Selection Chips */}
        <View style={styles.chipsRow}>
          {[1, 3, 5, 10, 20].map((num) => {
            const isSelected = sponsorCount === num;
            return (
              <TouchableOpacity
                key={`quick-chip-${num}`}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => setSponsorCount(num)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {`${num} St.`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Primary Action Button - Solid White with Black Text */}
        <TouchableOpacity
          style={[styles.sponsorButton, isPurchasing && styles.sponsorButtonDisabled]}
          onPress={() => onSponsor(sponsorCount)}
          activeOpacity={0.85}
          disabled={isPurchasing}
        >
          {isPurchasing ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <Text
              style={styles.sponsorButtonText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {`SPONSOR ${sponsorCount} STUDENT${sponsorCount > 1 ? 'S' : ''} NOW ($${(sponsorCount * 1.0).toFixed(2)})`}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* What Students Receive Transparency Card */}
      <View style={styles.transparencyCard}>
        <View style={styles.transparencyHeaderRow}>
          <ShieldCheck size={16} color="#FFFFFF" style={{ marginRight: 8 }} strokeWidth={2} />
          <Text style={styles.transparencyTitle}>What Every Sponsored Student Receives</Text>
        </View>

        <View style={styles.checkItem}>
          <CheckCircle2 size={15} color="#FFFFFF" style={{ marginRight: 10, marginTop: 1 }} strokeWidth={2} />
          <Text style={styles.checkText}>
            <Text style={styles.checkBold}>100% Offline Gemma AI:</Text> No cloud APIs, zero server charges.
          </Text>
        </View>

        <View style={styles.checkItem}>
          <CheckCircle2 size={15} color="#FFFFFF" style={{ marginRight: 10, marginTop: 1 }} strokeWidth={2} />
          <Text style={styles.checkText}>
            <Text style={styles.checkBold}>Complete CDC Textbooks:</Text> Science, Math, English, Nepali, Social.
          </Text>
        </View>

        <View style={styles.checkItem}>
          <CheckCircle2 size={15} color="#FFFFFF" style={{ marginRight: 10, marginTop: 1 }} strokeWidth={2} />
          <Text style={styles.checkText}>
            <Text style={styles.checkBold}>Past Papers & Model Solutions:</Text> All 7 provinces, Grade 10 SEE.
          </Text>
        </View>

        <View style={styles.checkItem}>
          <CheckCircle2 size={15} color="#FFFFFF" style={{ marginRight: 10, marginTop: 1 }} strokeWidth={2} />
          <Text style={styles.checkText}>
            <Text style={styles.checkBold}>Zero Data Requirement:</Text> Works entirely in Airplane mode once loaded.
          </Text>
        </View>
      </View>

      {/* Restore Purchases Footer Link */}
      <TouchableOpacity style={styles.restoreLink} onPress={onRestore} activeOpacity={0.7}>
        <RotateCcw size={13} color="#94A3B8" style={{ marginRight: 6 }} />
        <Text style={styles.restoreText}>Restore Previous Sponsorship</Text>
      </TouchableOpacity>

      {/* Profile Edit Footer Button */}
      {onEditProfile && (
        <TouchableOpacity style={styles.profileEditBtn} onPress={onEditProfile} activeOpacity={0.75}>
          <User size={13} color="#94A3B8" style={{ marginRight: 6 }} />
          <Text style={styles.profileEditText}>{`${userName} | Edit Profile`}</Text>
          <ChevronRight size={13} color="#94A3B8" />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#000000',
  },
  headerContainer: {
    marginBottom: 20,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
    letterSpacing: 1.2,
  },
  headerMainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  headerSub: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#94A3B8',
    fontFamily: FONT_FAMILY,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  successBannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#CBD5E1',
    fontFamily: FONT_FAMILY,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  tierCard: {
    backgroundColor: '#08101D',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#172A45',
    padding: 16,
    marginBottom: 16,
  },
  tierTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tierIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierPriceBox: {
    alignItems: 'flex-end',
  },
  tierPriceText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
  },
  tierPriceSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#94A3B8',
    fontFamily: FONT_FAMILY,
  },
  tierBadgeLabelPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0F172A',
    marginBottom: 10,
  },
  tierBadgeLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
    letterSpacing: 0.2,
  },
  tierTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
    marginBottom: 3,
  },
  tierTagline: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#CBD5E1',
    fontFamily: FONT_FAMILY,
    marginBottom: 6,
  },
  tierDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: '#94A3B8',
    fontFamily: FONT_FAMILY,
    marginBottom: 10,
  },
  deliverablesList: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#172A45',
  },
  deliverableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  deliverableText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
    lineHeight: 16,
    fontWeight: '500',
  },
  customBox: {
    backgroundColor: '#08101D',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#172A45',
    padding: 16,
    marginBottom: 16,
  },
  customHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  customHeaderTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
  },
  customDesc: {
    fontSize: 12,
    lineHeight: 16,
    color: '#94A3B8',
    fontFamily: FONT_FAMILY,
    marginBottom: 16,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  counterControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 4,
  },
  counterButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  counterDisplay: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  counterNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
  },
  counterLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    fontFamily: FONT_FAMILY,
  },
  totalPriceCard: {
    alignItems: 'flex-end',
  },
  totalPriceAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
  },
  totalPriceCurrency: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#94A3B8',
    fontFamily: FONT_FAMILY,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#0F172A',
    alignItems: 'center',
  },
  chipActive: {
    borderColor: '#FFFFFF',
    backgroundColor: '#1E293B',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    fontFamily: FONT_FAMILY,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  sponsorButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  sponsorButtonDisabled: {
    opacity: 0.6,
  },
  sponsorButtonText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#000000',
    fontFamily: FONT_FAMILY,
    letterSpacing: 0.3,
  },
  transparencyCard: {
    backgroundColor: '#08101D',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#172A45',
    padding: 16,
    marginBottom: 16,
  },
  transparencyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  transparencyTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  checkText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: '#94A3B8',
    fontFamily: FONT_FAMILY,
  },
  checkBold: {
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
  },
  restoreLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 4,
  },
  restoreText: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  profileEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  profileEditText: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
});

export default GuruDakshinaHub;
