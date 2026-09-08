import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { X, FileText, ChevronRight } from 'lucide-react-native';
import { SubjectItem } from '../types';

interface MediumChooserModalProps {
  subject: SubjectItem | null;
  onClose: () => void;
  onSelectMedium: (assetPdf?: string, title?: string) => void;
}

export const MediumChooserModal: React.FC<MediumChooserModalProps> = ({
  subject,
  onClose,
  onSelectMedium,
}) => {
  if (!subject) return null;

  return (
    <View style={styles.modalBackdropOverlay}>
      <View style={styles.mediumSelectorCard}>
        <View style={styles.mediumSelectorHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.mediumSelectorTitle}>{subject.name}</Text>
            <Text style={styles.mediumSelectorSub}>Select textbook medium to open in-app</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <X size={20} color="#a1a1aa" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.mediumChoiceItem}
          activeOpacity={0.8}
          onPress={() => onSelectMedium(subject.englishAssetPdf, subject.englishTitle)}
        >
          <FileText size={20} color="#ffffff" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.mediumChoiceTitle}>English Medium PDF</Text>
            <Text style={styles.mediumChoiceDesc}>{subject.englishTitle}</Text>
          </View>
          <ChevronRight size={17} color="#a1a1aa" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mediumChoiceItem}
          activeOpacity={0.8}
          onPress={() => onSelectMedium(subject.nepaliAssetPdf, subject.nepaliTitle)}
        >
          <FileText size={20} color="#ffffff" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.mediumChoiceTitle}>नेपाली माध्यम PDF</Text>
            <Text style={styles.mediumChoiceDesc}>{subject.nepaliTitle}</Text>
          </View>
          <ChevronRight size={17} color="#a1a1aa" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalBackdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 150,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  mediumSelectorCard: {
    width: '100%',
    backgroundColor: '#121214',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
    gap: 10,
  },
  mediumSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  mediumSelectorTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  mediumSelectorSub: {
    fontSize: 11,
    color: '#a1a1aa',
  },
  mediumChoiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 11,
    padding: 12,
  },
  mediumChoiceTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  mediumChoiceDesc: {
    fontSize: 10.5,
    color: '#a1a1aa',
  },
});

export default MediumChooserModal;
