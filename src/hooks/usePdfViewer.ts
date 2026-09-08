import { useState, useCallback } from 'react';
import { Platform, NativeModules } from 'react-native';
import { ActivePdfState, SubjectItem } from '../types';

export function usePdfViewer(
  showToast: (msg: string) => void,
  onStreakActivity?: () => void
) {
  const [activePdf, setActivePdf] = useState<ActivePdfState | null>(null);
  const [mediumChooserSubject, setMediumChooserSubject] = useState<SubjectItem | null>(null);

  const loadPdfPage = useCallback(async (assetPath: string, pageIndex: number) => {
    if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.renderPdfPage) {
      try {
        const uri = await NativeModules.LLMInferenceModule.renderPdfPage(assetPath, pageIndex);
        setActivePdf((prev) =>
          prev ? { ...prev, currentPage: pageIndex, pageImageUri: uri, isLoadingPage: false } : null
        );
      } catch (err) {
        console.warn('Render PDF page error:', err);
        setActivePdf((prev) => (prev ? { ...prev, isLoadingPage: false } : null));
      }
    }
  }, []);

  const openInAppPdf = useCallback(
    async (assetPath?: string, title?: string) => {
      setMediumChooserSubject(null);
      if (!assetPath) {
        showToast('PDF file path not found');
        return;
      }

      try {
        let pageCount = 240;
        if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.getPdfPageCount) {
          try {
            pageCount = await NativeModules.LLMInferenceModule.getPdfPageCount(assetPath);
          } catch (_) {}
        }

        setActivePdf({
          assetPath,
          title: title || 'Textbook',
          currentPage: 0,
          totalPages: pageCount,
          pageImageUri: null,
          isLoadingPage: true,
          zoomScale: 1,
        });

        if (onStreakActivity) {
          onStreakActivity();
        }

        await loadPdfPage(assetPath, 0);
      } catch (err) {
        console.warn('Error opening PDF:', err);
        showToast('Could not load PDF. Please ensure file exists in assets.');
      }
    },
    [loadPdfPage, onStreakActivity, showToast]
  );

  const nextPdfPage = useCallback(() => {
    if (!activePdf || activePdf.currentPage >= activePdf.totalPages - 1) return;
    const nextIdx = activePdf.currentPage + 1;
    setActivePdf({ ...activePdf, currentPage: nextIdx, isLoadingPage: true });
    loadPdfPage(activePdf.assetPath, nextIdx);
  }, [activePdf, loadPdfPage]);

  const prevPdfPage = useCallback(() => {
    if (!activePdf || activePdf.currentPage <= 0) return;
    const prevIdx = activePdf.currentPage - 1;
    setActivePdf({ ...activePdf, currentPage: prevIdx, isLoadingPage: true });
    loadPdfPage(activePdf.assetPath, prevIdx);
  }, [activePdf, loadPdfPage]);

  const zoomIn = useCallback(() => {
    setActivePdf((prev) =>
      prev ? { ...prev, zoomScale: Math.min(2.5, prev.zoomScale + 0.25) } : null
    );
  }, []);

  const zoomOut = useCallback(() => {
    setActivePdf((prev) =>
      prev ? { ...prev, zoomScale: Math.max(1, prev.zoomScale - 0.25) } : null
    );
  }, []);

  const handleSubjectClick = useCallback(
    (subject: SubjectItem) => {
      // Only Science, Compulsory Math, and Optional Math have dual medium (English & Nepali)
      if (subject.id === 'science' || subject.id === 'math' || subject.id === 'opt_math') {
        setMediumChooserSubject(subject);
      } else {
        const targetPdf =
          subject.id === 'nepali' || subject.id === 'social'
            ? subject.nepaliAssetPdf || subject.englishAssetPdf
            : subject.englishAssetPdf || subject.nepaliAssetPdf;
        openInAppPdf(targetPdf, subject.name);
      }
    },
    [openInAppPdf]
  );

  return {
    activePdf,
    setActivePdf,
    mediumChooserSubject,
    setMediumChooserSubject,
    openInAppPdf,
    loadPdfPage,
    nextPdfPage,
    prevPdfPage,
    zoomIn,
    zoomOut,
    handleSubjectClick,
  };
}

export default usePdfViewer;
