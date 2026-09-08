import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { ActivePdfState } from '../types';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../styles/theme';

interface PdfViewerModalProps {
  activePdf: ActivePdfState | null;
  onClose: () => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  activePdf,
  onClose,
  onNextPage,
  onPrevPage,
  onZoomIn,
  onZoomOut,
}) => {
  if (!activePdf) return null;

  return (
    <View style={styles.fullModalOverlay}>
      <SafeAreaView style={styles.darkContainer}>
        {/* PDF Header Bar */}
        <View style={styles.pdfHeaderBar}>
          <TouchableOpacity style={styles.pdfCloseButton} onPress={onClose}>
            <X size={22} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.pdfHeaderCenter}>
            <Text style={styles.pdfHeaderTitle} numberOfLines={1}>
              {activePdf.title}
            </Text>
            <Text style={styles.pdfHeaderPageInfo}>
              {`Page ${activePdf.currentPage + 1} of ${activePdf.totalPages}`}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity style={styles.pdfZoomButton} onPress={onZoomOut}>
              <ZoomOut size={16} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.pdfZoomButton} onPress={onZoomIn}>
              <ZoomIn size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* In-App PDF Page Canvas */}
        <View style={styles.pdfCanvasContainer}>
          {activePdf.isLoadingPage ? (
            <View style={styles.pdfLoadingBox}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.pdfLoadingText}>{`Loading Page ${activePdf.currentPage + 1}...`}</Text>
            </View>
          ) : activePdf.pageImageUri ? (
            <ScrollView
              contentContainerStyle={styles.pdfPageScrollContent}
              maximumZoomScale={3}
              minimumZoomScale={1}
            >
              <Image
                source={{ uri: activePdf.pageImageUri }}
                style={[
                  styles.pdfRenderedImage,
                  { transform: [{ scale: activePdf.zoomScale }] },
                ]}
                resizeMode="contain"
              />
            </ScrollView>
          ) : (
            <View style={styles.pdfLoadingBox}>
              <Text style={styles.pdfLoadingText}>Could not render page</Text>
            </View>
          )}
        </View>

        {/* In-App PDF Navigation Footer Bar */}
        <View style={styles.pdfBottomBar}>
          <TouchableOpacity
            style={[styles.pdfNavButton, activePdf.currentPage <= 0 && styles.pdfNavButtonDisabled]}
            disabled={activePdf.currentPage <= 0 || activePdf.isLoadingPage}
            onPress={onPrevPage}
          >
            <ChevronLeft size={18} color={activePdf.currentPage <= 0 ? '#52525b' : '#ffffff'} />
            <Text
              style={[
                styles.pdfNavButtonText,
                activePdf.currentPage <= 0 && { color: '#52525b' },
              ]}
            >
              Previous
            </Text>
          </TouchableOpacity>

          <Text style={styles.pdfFooterPageIndicator}>
            {`${activePdf.currentPage + 1} / ${activePdf.totalPages}`}
          </Text>

          <TouchableOpacity
            style={[
              styles.pdfNavButton,
              activePdf.currentPage >= activePdf.totalPages - 1 && styles.pdfNavButtonDisabled,
            ]}
            disabled={activePdf.currentPage >= activePdf.totalPages - 1 || activePdf.isLoadingPage}
            onPress={onNextPage}
          >
            <Text
              style={[
                styles.pdfNavButtonText,
                activePdf.currentPage >= activePdf.totalPages - 1 && { color: '#52525b' },
              ]}
            >
              Next
            </Text>
            <ChevronRight
              size={18}
              color={activePdf.currentPage >= activePdf.totalPages - 1 ? '#52525b' : '#ffffff'}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  fullModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 200,
  },
  darkContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  pdfHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 8 : 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
    backgroundColor: '#09090b',
  },
  pdfCloseButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfHeaderCenter: {
    flex: 1,
    marginHorizontal: 8,
  },
  pdfHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  pdfHeaderPageInfo: {
    fontSize: 10.5,
    color: '#a1a1aa',
  },
  pdfZoomButton: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfCanvasContainer: {
    flex: 1,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfLoadingBox: {
    alignItems: 'center',
    gap: 8,
  },
  pdfLoadingText: {
    fontSize: 12.5,
    color: '#ffffff',
  },
  pdfPageScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfRenderedImage: {
    width: SCREEN_WIDTH - 16,
    height: SCREEN_HEIGHT * 0.76,
    backgroundColor: '#ffffff',
    borderRadius: 6,
  },
  pdfBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 36 : 14,
    backgroundColor: '#09090b',
    borderTopWidth: 1,
    borderTopColor: '#18181b',
  },
  pdfNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pdfNavButtonDisabled: {
    opacity: 0.4,
  },
  pdfNavButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginHorizontal: 3,
  },
  pdfFooterPageIndicator: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default PdfViewerModal;
