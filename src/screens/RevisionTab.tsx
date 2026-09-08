import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Award, BookOpen, Sparkles, FileText, Folder, ChevronRight } from 'lucide-react-native';
import { PRO_SOLUTIONS_2082, PRO_SOLUTIONS_2081 } from '../data/proSolutions';

interface RevisionTabProps {
  onOpenPdf: (assetPath: string, title: string) => void;
  onOpen2081Modal: () => void;
}

export const RevisionTab: React.FC<RevisionTabProps> = ({ onOpenPdf, onOpen2081Modal }) => {
  return (
    <ScrollView contentContainerStyle={styles.mainScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeaderRow}>
        <Award size={18} color="#ffffff" style={{ marginRight: 8 }} />
        <Text style={styles.sectionTitleText}>Exam Revision & Past Papers</Text>
      </View>
      <Text style={styles.greetingSub}>
        Access official SEE question papers, comprehensive province collections, and quick-reference formula sheets.
      </Text>

      {/* DEDICATED FORMULA SHEETS FOR SEE */}
      <View style={{ marginTop: 14, marginBottom: 8 }}>
        <Text style={[styles.sectionTitleText, { fontSize: 13, color: '#e4e4e7', marginBottom: 8 }]}>
          SEE Quick Formula Sheets
        </Text>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          {/* Compulsory Maths Formula Sheet */}
          <TouchableOpacity
            style={[
              styles.mockExamBannerCard,
              { flex: 1, flexDirection: 'column', alignItems: 'flex-start', padding: 12, marginVertical: 0 },
            ]}
            onPress={() => onOpenPdf('formula_sheets/guru_comp_math.pdf', 'Compulsory Maths Formula Sheet (SEE)')}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <BookOpen size={15} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={[styles.mockBannerTitle, { fontSize: 13 }]}>Compulsory Maths</Text>
            </View>
            <Text style={[styles.mockBannerSub, { fontSize: 11, marginBottom: 10 }]}>
              All-chapter SEE formula & theorem summary.
            </Text>
            <View
              style={[
                styles.mockBannerButton,
                { alignSelf: 'stretch', justifyContent: 'center', backgroundColor: '#ffffff', borderRadius: 8, paddingVertical: 8 },
              ]}
            >
              <Text style={[styles.mockBannerButtonText, { color: '#000000', fontWeight: '800', fontSize: 11.5 }]}>
                Open Formula Sheet
              </Text>
            </View>
          </TouchableOpacity>

          {/* Optional Maths Formula Sheet */}
          <TouchableOpacity
            style={[
              styles.mockExamBannerCard,
              { flex: 1, flexDirection: 'column', alignItems: 'flex-start', padding: 12, marginVertical: 0 },
            ]}
            onPress={() => onOpenPdf('formula_sheets/guru_opt_math_v3.pdf', 'Optional Maths Formula Sheet (SEE)')}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Sparkles size={15} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={[styles.mockBannerTitle, { fontSize: 13 }]}>Optional Maths</Text>
            </View>
            <Text style={[styles.mockBannerSub, { fontSize: 11, marginBottom: 10 }]}>
              Vectors, Trig, Matrices & Coordinate Geometry.
            </Text>
            <View
              style={[
                styles.mockBannerButton,
                { alignSelf: 'stretch', justifyContent: 'center', backgroundColor: '#ffffff', borderRadius: 8, paddingVertical: 8 },
              ]}
            >
              <Text style={[styles.mockBannerButtonText, { color: '#000000', fontWeight: '800', fontSize: 11.5 }]}>
                Open Formula Sheet
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* PAST PAPERS & MODEL SETS SECTION */}
      <View style={{ marginTop: 6, marginBottom: 14 }}>
        <Text style={[styles.sectionTitleText, { fontSize: 13, color: '#e4e4e7', marginBottom: 8 }]}>
          SEE Question Papers & Model Sets
        </Text>

        {/* 2082 PAST PAPERS / MODEL QUESTION BUTTON */}
        <TouchableOpacity
          style={styles.pastPaperBigCard}
          onPress={() =>
            onOpenPdf(
              'past_papers/SEE_2082_All_Subjects_Combined.pdf',
              'SEE 2082 All Subjects Combined Model Question'
            )
          }
          activeOpacity={0.8}
        >
          <View style={styles.pastPaperBigCardLeft}>
            <View style={[styles.attachOptionIcon, { backgroundColor: '#18181b', marginRight: 12 }]}>
              <FileText size={22} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.pastPaperBigTitle}>2082 SEE Past & Model Papers</Text>
                <View style={styles.unitCountPill}>
                  <Text style={styles.unitCountText}>All Subjects</Text>
                </View>
              </View>
              <Text style={styles.pastPaperBigSub}>
                Official combined 2082 SEE model question paper for all subjects.
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color="#ffffff" />
        </TouchableOpacity>

        {/* 2081 PAST PAPERS BUTTON (OPENS SUBJECT & PROVINCE CHOOSER) */}
        <TouchableOpacity
          style={[styles.pastPaperBigCard, { marginTop: 10 }]}
          onPress={onOpen2081Modal}
          activeOpacity={0.8}
        >
          <View style={styles.pastPaperBigCardLeft}>
            <View style={[styles.attachOptionIcon, { backgroundColor: '#18181b', marginRight: 12 }]}>
              <Folder size={22} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.pastPaperBigTitle}>2081 SEE Past Papers</Text>
                <View style={styles.unitCountPill}>
                  <Text style={styles.unitCountText}>7 Provinces</Text>
                </View>
              </View>
              <Text style={styles.pastPaperBigSub}>
                Subject-wise question papers from Bagmati, Gandaki, Koshi, Lumbini, Madhesh, Karnali & Sudurpaschim.
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* STEP-BY-STEP MODEL SOLUTIONS SECTION */}
      <View style={{ marginTop: 8, marginBottom: 20 }}>
        <View style={styles.proSolutionsHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Sparkles size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={[styles.sectionTitleText, { fontSize: 13.5, color: '#e4e4e7' }]}>
              Step-by-Step Model Solutions
            </Text>
          </View>
        </View>

        {/* 2082 MODEL SOLUTIONS LIST */}
        <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#a1a1aa', marginBottom: 8, marginTop: 10 }}>
          2082 Full Model Exam Solutions
        </Text>
        {PRO_SOLUTIONS_2082.map((sol) => (
          <TouchableOpacity
            key={sol.id}
            style={styles.proSolutionCard}
            activeOpacity={0.8}
            onPress={() => onOpenPdf(sol.assetPath, sol.title)}
          >
            <View style={styles.proSolutionCardLeft}>
              <View style={[styles.proSolutionIconBox, { backgroundColor: '#18181b' }]}>
                <FileText size={18} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.proSolutionTitle} numberOfLines={1}>
                  {sol.title}
                </Text>
                <Text style={styles.proSolutionSub} numberOfLines={1}>
                  {sol.description}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.proSolutionRightPill,
                { backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
              ]}
            >
              <Text style={{ color: '#000000', fontWeight: '800', fontSize: 11.5 }}>Open</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* 2081 MODEL SOLUTIONS LIST */}
        <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#a1a1aa', marginBottom: 8, marginTop: 14 }}>
          2081 Past Board Solutions
        </Text>
        {PRO_SOLUTIONS_2081.map((sol) => (
          <TouchableOpacity
            key={sol.id}
            style={styles.proSolutionCard}
            activeOpacity={0.8}
            onPress={() => onOpenPdf(sol.assetPath, sol.title)}
          >
            <View style={styles.proSolutionCardLeft}>
              <View style={[styles.proSolutionIconBox, { backgroundColor: '#18181b' }]}>
                <FileText size={18} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.proSolutionTitle} numberOfLines={1}>
                  {sol.title}
                </Text>
                <Text style={styles.proSolutionSub} numberOfLines={1}>
                  {sol.description}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.proSolutionRightPill,
                { backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
              ]}
            >
              <Text style={{ color: '#000000', fontWeight: '800', fontSize: 11.5 }}>Open</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  mainScroll: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 220,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  greetingSub: {
    fontSize: 12,
    color: '#a1a1aa',
    lineHeight: 16,
    marginBottom: 10,
  },
  mockExamBannerCard: {
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  mockBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  mockBannerSub: {
    fontSize: 11,
    color: '#a1a1aa',
    lineHeight: 15,
  },
  mockBannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mockBannerButtonText: {
    fontSize: 12,
  },
  pastPaperBigCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    padding: 14,
  },
  pastPaperBigCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  attachOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastPaperBigTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 3,
  },
  unitCountPill: {
    backgroundColor: '#27272a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  unitCountText: {
    fontSize: 9.5,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  pastPaperBigSub: {
    fontSize: 11.5,
    color: '#a1a1aa',
    lineHeight: 16,
    marginTop: 2,
  },
  proSolutionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  proSolutionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  proSolutionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  proSolutionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  proSolutionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  proSolutionSub: {
    fontSize: 11,
    color: '#a1a1aa',
    lineHeight: 15,
  },
  proSolutionRightPill: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});

export default RevisionTab;
