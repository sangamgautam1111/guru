import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { X, FileText, ChevronRight } from 'lucide-react-native';
import { PAST_PAPERS_2081_DATA } from '../data/pastPapers2081';

interface PastPapersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPaper: (assetPath: string, title: string) => void;
}

export const PastPapersModal: React.FC<PastPapersModalProps> = ({
  isOpen,
  onClose,
  onSelectPaper,
}) => {
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState(0);

  if (!isOpen) return null;

  return (
    <View style={styles.modalBackdropOverlay}>
      <View style={[styles.mediumSelectorCard, { maxHeight: '82%', width: '92%' }]}>
        <View style={styles.mediumSelectorHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.mediumSelectorTitle}>2081 SEE Past Papers</Text>
            <Text style={styles.mediumSelectorSub}>Select subject & province to open in-app PDF</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <X size={20} color="#a1a1aa" />
          </TouchableOpacity>
        </View>

        {/* Subject Selector Horizontal Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12, maxHeight: 42 }}>
          {PAST_PAPERS_2081_DATA.map((item, sIdx) => {
            const isSelected = selectedSubjectIndex === sIdx;
            return (
              <TouchableOpacity
                key={item.code}
                style={[
                  styles.gradePill,
                  { marginRight: 8, paddingHorizontal: 12, paddingVertical: 6, height: 36 },
                  isSelected && styles.gradePillActive,
                ]}
                onPress={() => setSelectedSubjectIndex(sIdx)}
              >
                <Text
                  style={[
                    styles.gradePillText,
                    isSelected && styles.gradePillTextActive,
                    { fontSize: 12 },
                  ]}
                >
                  {item.subject}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Province Papers List for Selected Subject */}
        <ScrollView style={{ flexGrow: 0, maxHeight: 380 }} showsVerticalScrollIndicator={false}>
          {PAST_PAPERS_2081_DATA[selectedSubjectIndex]?.papers.map((p, pIdx) => (
            <TouchableOpacity
              key={`${p.province}-${pIdx}`}
              style={[styles.mediumChoiceItem, { paddingVertical: 12 }]}
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                onSelectPaper(p.assetPath, p.title);
              }}
            >
              <FileText size={18} color="#ffffff" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.mediumChoiceTitle}>{p.province}</Text>
                <Text style={[styles.mediumChoiceDesc, { fontSize: 11 }]}>{p.title}</Text>
              </View>
              <ChevronRight size={16} color="#71717a" />
            </TouchableOpacity>
          ))}
        </ScrollView>
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
    marginBottom: 8,
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
  gradePill: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradePillActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  gradePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  gradePillTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
});

export default PastPapersModal;
