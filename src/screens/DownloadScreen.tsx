import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  ArrowRight,
  HardDrive,
  Cpu,
  Mic,
  Check,
  Download,
} from 'lucide-react-native';
import { UserProfile, ModelFileStatus } from '../types';
import { logoSource } from '../constants/storage';

interface DownloadScreenProps {
  user: UserProfile | null;
  gemmaStatus: ModelFileStatus;
  whisperStatus: ModelFileStatus;
  isAllModelsReady: boolean;
  isModelReady?: boolean;
  isInitializingModel?: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  downloadSpeed: string;
  downloadEta: string;
  downloadedTotalMb: number;
  totalAllMb: number;
  currentDownloadModel: string;
  showHfTokenInput: boolean;
  hfToken: string;
  setHfToken: (token: string) => void;
  onBackToApp: () => void;
  onStartDownload: (replaceExisting?: boolean) => void;
  onCancelDownload: () => void;
  onEnterChat: () => void;
}

export const DownloadScreen: React.FC<DownloadScreenProps> = ({
  user,
  gemmaStatus,
  whisperStatus,
  isAllModelsReady,
  isModelReady = false,
  isInitializingModel = false,
  isDownloading,
  downloadProgress,
  downloadSpeed,
  downloadEta,
  downloadedTotalMb,
  totalAllMb,
  currentDownloadModel,
  showHfTokenInput,
  hfToken,
  setHfToken,
  onBackToApp,
  onStartDownload,
  onCancelDownload,
  onEnterChat,
}) => {
  const isAllReady = isAllModelsReady || gemmaStatus.found;

  return (
    <SafeAreaView style={styles.darkContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <ScrollView contentContainerStyle={styles.downloadScrollContent} showsVerticalScrollIndicator={false}>
        {/* TOP NAVIGATION: RETURN TO STUDY RESOURCES */}
        <View style={{ width: '100%', marginBottom: 14 }}>
          <TouchableOpacity
            style={styles.editProfileBackBtn}
            activeOpacity={0.8}
            onPress={onBackToApp}
          >
            <ArrowLeft size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.editProfileBackText}>Back to Study Resources</Text>
          </TouchableOpacity>
        </View>

        {/* TOP HERO */}
        <View style={styles.downloadHeroSection}>
          <Image source={logoSource} style={styles.downloadLogoHero} resizeMode="contain" />
          <Text style={styles.downloadHeroTitle}>Managing On-Device AI Models</Text>
          <Text style={styles.downloadHeroSub}>
            Downloading and permanently binding offline neural models directly to your phone.
          </Text>
          <View style={styles.downloadStudentTag}>
            <Text style={styles.downloadStudentTagText}>
              {`Student: ${user?.name || 'Scholar'} • ${user?.school || 'Community School'}`}
            </Text>
          </View>
        </View>

        {/* OVERALL PROGRESS CARD */}
        <View style={styles.overallProgressCard}>
          <View style={styles.progressHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <HardDrive size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.progressCardTitle}>Local Phone Storage Status</Text>
            </View>
            <Text style={styles.progressPercentageText}>{`${isAllReady ? 100 : downloadProgress}%`}</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${isAllReady ? 100 : Math.max(6, downloadProgress)}%` },
              ]}
            />
          </View>

          <View style={styles.progressStatsRow}>
            <Text style={styles.progressStatItem}>
              {isAllReady
                ? 'Status: 100% Offline Ready'
                : isDownloading
                ? `Speed: ${downloadSpeed}`
                : 'Status: Ready for Setup'}
            </Text>
            <Text style={styles.progressStatItem}>
              {isAllReady
                ? `${gemmaStatus.sizeMb || 2590} MB Verified`
                : isDownloading
                ? `${downloadedTotalMb} MB / ${totalAllMb} MB (ETA: ${downloadEta})`
                : `Total: ${totalAllMb} MB (Gemma & Whisper)`}
            </Text>
          </View>
        </View>

        {/* CORE ON-DEVICE NEURAL AI ENGINES */}
        <View style={styles.checklistContainer}>
          <Text style={styles.checklistSectionHeader}>On-Device Neural AI Engines</Text>

          {/* MODEL 1: GOOGLE GEMMA 4 E2B AI BRAIN */}
          <View style={styles.checklistItemCard}>
            <View style={styles.checklistIconBox}>
              <Cpu size={20} color="#ffffff" />
            </View>
            <View style={styles.checklistContent}>
              <Text style={styles.checklistItemTitle}>Google Gemma 4 E2B AI Brain</Text>
              <Text style={styles.checklistItemSub}>
                LiteRT-LM On-Device Neural Tutor • Zero Internet Required (2.59 GB)
              </Text>
              <View style={styles.itemBadgeRow}>
                {gemmaStatus.found ? (
                  <View style={styles.readyBadge}>
                    <Check size={12} color="#ffffff" style={{ marginRight: 4 }} />
                    <Text style={styles.readyBadgeText}>
                      {gemmaStatus.sizeMb > 0 ? `Ready (${gemmaStatus.sizeMb} MB)` : 'Ready on Device'}
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={{
                      fontSize: 11.5,
                      color: isDownloading && currentDownloadModel.includes('Gemma') ? '#ffffff' : '#71717a',
                    }}
                  >
                    {isDownloading && currentDownloadModel.includes('Gemma')
                      ? `Downloading: ${downloadProgress}% (${downloadSpeed})`
                      : 'Pending Download'}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* MODEL 2: OPENAI WHISPER SPEECH RECOGNITION */}
          <View style={styles.checklistItemCard}>
            <View style={styles.checklistIconBox}>
              <Mic size={20} color="#ffffff" />
            </View>
            <View style={styles.checklistContent}>
              <Text style={styles.checklistItemTitle}>OpenAI Whisper Speech Recognition</Text>
              <Text style={styles.checklistItemSub}>
                On-Device Voice Transcription for Student Questions (75 MB)
              </Text>
              <View style={styles.itemBadgeRow}>
                {whisperStatus.found ? (
                  <View style={styles.readyBadge}>
                    <Check size={12} color="#ffffff" style={{ marginRight: 4 }} />
                    <Text style={styles.readyBadgeText}>Speech-to-Text Active</Text>
                  </View>
                ) : (
                  <Text
                    style={{
                      fontSize: 11.5,
                      color: isDownloading && currentDownloadModel.includes('Whisper') ? '#ffffff' : '#71717a',
                    }}
                  >
                    {isDownloading && currentDownloadModel.includes('Whisper')
                      ? `Downloading: ${downloadProgress}% (${downloadSpeed})`
                      : 'Pending Download'}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Optional HuggingFace Token Input */}
        {showHfTokenInput && (
          <View style={[styles.overallProgressCard, { marginTop: 12 }]}>
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#ffffff', marginBottom: 6 }}>
              Hugging Face Token (Optional)
            </Text>
            <TextInput
              style={styles.darkInput}
              value={hfToken}
              onChangeText={setHfToken}
              placeholder="hf_..."
              placeholderTextColor="#71717a"
              autoCapitalize="none"
            />
          </View>
        )}

        {/* SINGLE PRIMARY ACTION BUTTON */}
        <View style={styles.downloadBottomActions}>
          {isDownloading ? (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <View style={[styles.startLearningPrimaryBtn, styles.downloadingButtonBox]}>
                <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 10 }} />
                <Text style={[styles.startLearningPrimaryBtnText, { color: '#ffffff' }]}>
                  {`Downloading Models... (${downloadProgress}%)`}
                </Text>
              </View>

              <TouchableOpacity
                style={{ alignSelf: 'center', marginTop: 14, padding: 8 }}
                onPress={onCancelDownload}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 13, color: '#ef4444', fontWeight: '700' }}>
                  Cancel Active Download
                </Text>
              </TouchableOpacity>
            </View>
          ) : (isInitializingModel || (gemmaStatus.found && !isModelReady)) ? (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <View style={[styles.startLearningPrimaryBtn, styles.downloadingButtonBox]}>
                <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 10 }} />
                <Text style={[styles.startLearningPrimaryBtnText, { color: '#ffffff' }]}>
                  Binding AI Brain to Phone RAM...
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: '#a1a1aa', marginTop: 8, textAlign: 'center' }}>
                Pre-warming neural weights into memory for instant first answer
              </Text>
            </View>
          ) : isAllReady ? (
            <TouchableOpacity
              style={styles.startLearningPrimaryBtn}
              onPress={onEnterChat}
              activeOpacity={0.85}
            >
              <Check size={19} color="#000000" style={{ marginRight: 8 }} />
              <Text style={styles.startLearningPrimaryBtnText}>Enter Guru</Text>
              <ArrowRight size={18} color="#000000" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.startLearningPrimaryBtn}
              onPress={() => onStartDownload(true)}
              activeOpacity={0.85}
            >
              <Download size={19} color="#000000" style={{ marginRight: 8 }} />
              <Text style={styles.startLearningPrimaryBtnText}>Download AI Models</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  darkContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  downloadScrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 16 : 24,
    paddingBottom: 40,
  },
  editProfileBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  editProfileBackText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#e4e4e7',
  },
  downloadHeroSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  downloadLogoHero: {
    width: 68,
    height: 68,
    marginBottom: 12,
  },
  downloadHeroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  downloadHeroSub: {
    fontSize: 13,
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 10,
  },
  downloadStudentTag: {
    backgroundColor: '#18181b',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  downloadStudentTagText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#e4e4e7',
  },
  overallProgressCard: {
    backgroundColor: '#111113',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
    marginBottom: 20,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  progressPercentageText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  progressBarBackground: {
    height: 9,
    backgroundColor: '#27272a',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 5,
  },
  progressStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressStatItem: {
    fontSize: 11,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  checklistContainer: {
    gap: 12,
    marginBottom: 24,
  },
  checklistSectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  checklistItemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#111113',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 14,
  },
  checklistIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checklistContent: {
    flex: 1,
  },
  checklistItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 3,
  },
  checklistItemSub: {
    fontSize: 11.5,
    color: '#a1a1aa',
    lineHeight: 16,
    marginBottom: 8,
  },
  itemBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  readyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  darkInput: {
    height: 50,
    backgroundColor: '#18181b',
    borderWidth: 1.5,
    borderColor: '#27272a',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#ffffff',
  },
  downloadBottomActions: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  startLearningPrimaryBtn: {
    width: '100%',
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 20,
    shadowColor: '#ffffff',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  downloadingButtonBox: {
    backgroundColor: '#18181b',
    borderWidth: 1.5,
    borderColor: '#27272a',
    shadowOpacity: 0,
    elevation: 0,
  },
  startLearningPrimaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
  },
});

export default DownloadScreen;
