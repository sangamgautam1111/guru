import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Award, GraduationCap, Crown, BookOpen } from 'lucide-react-native';
import { SupporterBadgeInfo } from '../hooks/useDakshina';

interface SupporterBadgeProps {
  badge: SupporterBadgeInfo;
  count: number;
  compact?: boolean;
  onPress?: () => void;
}

const FONT_FAMILY = Platform.select({ ios: 'Inter', android: 'Inter, sans-serif' });

/**
 * Visual badge indicating donor status and student impact.
 * Designed with 100% white icons, white typography, and clean Inter font.
 */
export const SupporterBadge: React.FC<SupporterBadgeProps> = ({
  badge,
  count,
  compact = false,
  onPress,
}) => {
  if (compact && badge.tier === 'none') {
    return null;
  }

  const renderIcon = (size: number) => {
    switch (badge.iconName) {
      case 'Crown':
        return <Crown size={size} color="#FFFFFF" strokeWidth={2.2} />;
      case 'GraduationCap':
        return <GraduationCap size={size} color="#FFFFFF" strokeWidth={2.2} />;
      case 'Award':
        return <Award size={size} color="#FFFFFF" strokeWidth={2.2} />;
      case 'BookOpen':
      default:
        return <BookOpen size={size} color="#FFFFFF" strokeWidth={2.2} />;
    }
  };

  // Compact Top Bar Pill
  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.compactIconWrapper}>{renderIcon(13)}</View>
        <Text style={styles.compactTitle} numberOfLines={1} ellipsizeMode="tail">
          {badge.title}
        </Text>
        <View style={styles.compactCountBadge}>
          <Text style={styles.compactCountText}>{count}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Full Expanded Card for Dakshina Hub (100% Responsive, Zero Text Collision)
  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardTopRow}>
        <View style={styles.iconCircle}>
          {renderIcon(22)}
        </View>
        <View style={styles.tierImpactBadge}>
          <Text style={styles.tierImpactCount}>{count}</Text>
          <Text style={styles.tierImpactLabel}>
            {count === 1 ? 'Student Sponsored' : 'Students Sponsored'}
          </Text>
        </View>
      </View>

      <Text style={styles.cardTitle}>{badge.title}</Text>
      <Text style={styles.cardTagline}>{badge.tagline}</Text>
      <Text style={styles.cardDescription}>{badge.description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: '#0C1424',
    marginRight: 6,
    maxWidth: 175,
    flexShrink: 1,
  },
  compactIconWrapper: {
    marginRight: 5,
    flexShrink: 0,
  },
  compactTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  compactCountBadge: {
    marginLeft: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  compactCountText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#000000',
    fontFamily: FONT_FAMILY,
  },
  cardContainer: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#172A45',
    backgroundColor: '#08101D',
    marginBottom: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierImpactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0F172A',
  },
  tierImpactCount: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
    marginRight: 4,
  },
  tierImpactLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CBD5E1',
    fontFamily: FONT_FAMILY,
  },
  cardTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  cardTagline: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#94A3B8',
    fontFamily: FONT_FAMILY,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: '#CBD5E1',
    fontFamily: FONT_FAMILY,
  },
});

export default SupporterBadge;
