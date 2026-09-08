export type TabState = 'home' | 'revision' | 'donate';
export type ScreenState = 'onboarding' | 'download' | 'main';
export type SubjectId = 'science' | 'math' | 'social' | 'nepali' | 'english' | 'opt_math' | 'computer';
export type QuizStatus = 'idle' | 'correct' | 'wrong';

export interface UserProfile {
  name: string;
  school: string;
}

export interface ModelFileStatus {
  found: boolean;
  sizeMb: number;
  path?: string;
}

export interface QuizQuestion {
  subject: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  isPending?: boolean;
  attachmentName?: string;
  attachmentImageUri?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export interface GenerationRef {
  requestId: string;
  sessionId?: string;
  messageId: string;
}

export interface SubjectItem {
  id: SubjectId;
  name: string;
  nameNe: string;
  unitsCount: number;
  pagesCount: number;
  hasDualMedium: boolean;
  englishAssetPdf?: string;
  nepaliAssetPdf?: string;
  englishTitle: string;
  nepaliTitle: string;
}

export interface QuizItem {
  subject: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ActivePdfState {
  assetPath: string;
  title: string;
  currentPage: number;
  totalPages: number;
  pageImageUri: string | null;
  isLoadingPage: boolean;
  zoomScale: number;
}

export interface PastPaperItem {
  province: string;
  assetPath: string;
  title: string;
}

export interface SubjectPastPapers {
  subject: string;
  code: string;
  iconName: string;
  papers: PastPaperItem[];
}

export interface ProSolutionItem {
  id: string;
  subject: string;
  year: string;
  title: string;
  description: string;
  assetPath: string;
  badge: string;
  iconColor: string;
}
