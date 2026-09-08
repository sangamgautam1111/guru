import React, { useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  X,
  RotateCcw,
  Volume2,
  VolumeX,
  ClipboardCopy,
  Plus,
  Mic,
  MicOff,
  Send,
  Square,
  Camera,
  Image as ImageIcon,
  FileText,
  AlertCircle,
} from 'lucide-react-native';
import { Message } from '../types';
import { MathMarkdownRenderer } from '../../MathMarkdownRenderer';
import { logoSource } from '../constants/storage';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  prompt: string;
  setPrompt: (text: string) => void;
  isGenerating: boolean;
  isListening: boolean;
  playingMessageId: string | null;
  attachedImageUri: string | null;
  setAttachedImageUri: (uri: string | null) => void;
  attachedFileName: string | null;
  setAttachedFileName: (name: string | null) => void;
  showAttachModal: boolean;
  setShowAttachModal: (show: boolean) => void;
  onSendPrompt: (forcedPrompt?: string) => void;
  onClearChat: () => void;
  onStopGeneration: () => void;
  onToggleSpeech: (messageId: string, text: string) => void;
  onCopyMessage: (text: string) => void;
  onStartVoiceRecording: () => void;
  onStopVoiceRecording: () => void;
  onPickCamera: () => void;
  onPickGallery: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  messages,
  prompt,
  setPrompt,
  isGenerating,
  isListening,
  playingMessageId,
  attachedImageUri,
  setAttachedImageUri,
  attachedFileName,
  setAttachedFileName,
  showAttachModal,
  setShowAttachModal,
  onSendPrompt,
  onClearChat,
  onStopGeneration,
  onToggleSpeech,
  onCopyMessage,
  onStartVoiceRecording,
  onStopVoiceRecording,
  onPickCamera,
  onPickGallery,
}) => {
  const chatListRef = useRef<FlatList>(null);

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.darkContainer, { backgroundColor: '#000000' }]}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.chatTopBar}>
          <TouchableOpacity style={styles.chatCloseButton} onPress={onClose}>
            <X size={22} color="#ffffff" />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image source={logoSource} style={styles.chatModalLogoIcon} resizeMode="contain" />
              <Text style={styles.chatModalHeaderTitle}>Guru AI Tutor</Text>
            </View>
            <Text style={{ fontSize: 10.5, color: '#71717a', fontWeight: '500', marginTop: 1 }}>
              Class 10 Offline Brain
            </Text>
          </View>

          <TouchableOpacity
            style={styles.chatBotIconHeader}
            onPress={onClearChat}
            activeOpacity={0.7}
            accessibilityLabel="Clear Chat"
          >
            <RotateCcw size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Top Warning Banner */}
        <View style={styles.topWarningBanner}>
          <AlertCircle size={10} color="#ffffff" style={{ marginRight: 5 }} />
          <Text style={styles.topWarningText}>
            Model can be inaccurate sometimes. Please verify important answers.
          </Text>
        </View>

        <KeyboardAvoidingView
          style={styles.chatBody}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          {messages.length === 0 ? (
            <View style={styles.chatEmptyView}>
              <Image source={logoSource} style={styles.chatEmptyLogo} resizeMode="contain" />
              <Text style={styles.chatEmptyTitle}>How can I help you learn?</Text>
              <Text style={styles.chatEmptySub}>
                Ask any question or snap a photo from your textbooks. All calculations and responses run on-device.
              </Text>
            </View>
          ) : (
            <FlatList
              ref={chatListRef}
              data={messages}
              keyExtractor={(m) => m.id}
              contentContainerStyle={styles.chatMessageList}
              initialNumToRender={10}
              maxToRenderPerBatch={6}
              windowSize={5}
              removeClippedSubviews={Platform.OS === 'android'}
              onContentSizeChange={() => chatListRef.current?.scrollToEnd({ animated: false })}
              renderItem={({ item }) => (
                <View style={item.isUser ? styles.userMsgRow : styles.botMsgRow}>
                  {!item.isUser && (
                    <View style={styles.botAvatarBox}>
                      <Image source={logoSource} style={styles.botAvatarImage} resizeMode="contain" />
                    </View>
                  )}
                  <View style={item.isUser ? styles.userBubble : styles.botBubble}>
                    {item.attachmentImageUri && (
                      <Image source={{ uri: item.attachmentImageUri }} style={styles.chatAttachedPreviewImage} />
                    )}
                    {item.attachmentName && (
                      <View style={styles.chatAttachmentPill}>
                        <Text style={styles.chatAttachmentText}>{item.attachmentName}</Text>
                      </View>
                    )}
                    {item.isPending ? (
                      item.text ? (
                        <View>
                          <MathMarkdownRenderer content={item.text} isUser={false} />
                          <View style={[styles.loadingBubbleRow, { marginTop: 6 }]}>
                            <ActivityIndicator size="small" color="#38bdf8" />
                            <Text style={styles.loadingBubbleText}>Generating...</Text>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.loadingBubbleRow}>
                          <ActivityIndicator size="small" color="#38bdf8" />
                          <Text style={styles.loadingBubbleText}>Guru is solving & thinking...</Text>
                        </View>
                      )
                    ) : (
                      <View>
                        <MathMarkdownRenderer content={item.text} isUser={item.isUser} />
                        {!item.isUser && (
                          <View style={styles.botActionButtonsRow}>
                            <TouchableOpacity
                              style={styles.chatActionButton}
                              onPress={() => onToggleSpeech(item.id, item.text)}
                            >
                              {playingMessageId === item.id ? (
                                <VolumeX size={13} color="#ffffff" style={{ marginRight: 4 }} />
                              ) : (
                                <Volume2 size={13} color="#a1a1aa" style={{ marginRight: 4 }} />
                              )}
                              <Text
                                style={[
                                  styles.chatActionButtonText,
                                  playingMessageId === item.id && { color: '#ffffff' },
                                ]}
                              >
                                {playingMessageId === item.id ? 'Stop' : 'Listen'}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.chatActionButton}
                              onPress={() => onCopyMessage(item.text)}
                            >
                              <ClipboardCopy size={13} color="#a1a1aa" style={{ marginRight: 4 }} />
                              <Text style={styles.chatActionButtonText}>Copy</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              )}
            />
          )}

          {/* Thumbnail Preview for Attached Image or Document */}
          {attachedImageUri ? (
            <View style={styles.attachedImageThumbnailContainer}>
              <Image source={{ uri: attachedImageUri }} style={styles.attachedThumbImage} />
              <Text style={styles.attachedThumbText} numberOfLines={1}>
                {attachedFileName || 'Attached Photo'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setAttachedImageUri(null);
                  setAttachedFileName(null);
                }}
                style={{ padding: 4 }}
              >
                <X size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ) : attachedFileName ? (
            <View style={styles.attachedImageThumbnailContainer}>
              <FileText size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.attachedThumbText} numberOfLines={1}>
                {attachedFileName}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setAttachedFileName(null);
                }}
                style={{ padding: 4 }}
              >
                <X size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Stop Generating Banner Pill */}
          {isGenerating && (
            <View style={styles.generatingStopContainer}>
              <TouchableOpacity
                style={styles.generatingStopPill}
                onPress={onStopGeneration}
                activeOpacity={0.8}
              >
                <Square size={11} color="#ef4444" fill="#ef4444" style={{ marginRight: 6 }} />
                <Text style={styles.generatingStopText}>Stop generating</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Chat Input Bar */}
          <View style={styles.chatInputBarContainer}>
            <View style={styles.chatInputPillWrapper}>
              <TouchableOpacity
                style={styles.chatAttachIconButton}
                onPress={() => setShowAttachModal(true)}
              >
                <Plus size={19} color="#ffffff" />
              </TouchableOpacity>

              <TextInput
                style={styles.chatPillInput}
                value={prompt}
                onChangeText={setPrompt}
                placeholder={
                  isListening
                    ? 'Listening to voice...'
                    : isGenerating
                    ? 'Guru is thinking...'
                    : 'Ask Guru anything or snap a photo...'
                }
                placeholderTextColor={isListening ? '#38bdf8' : '#71717a'}
                multiline
              />

              {isGenerating ? (
                <TouchableOpacity style={styles.chatStopIconButton} onPress={onStopGeneration}>
                  <Square size={12} color="#ffffff" fill="#ffffff" />
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.chatMicIconButton, isListening && styles.chatMicIconButtonActive]}
                    onPress={isListening ? onStopVoiceRecording : onStartVoiceRecording}
                  >
                    {isListening ? (
                      <MicOff size={18} color="#ef4444" />
                    ) : (
                      <Mic size={18} color="#a1a1aa" />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.chatSendIconButton}
                    disabled={!prompt.trim() && !attachedImageUri}
                    onPress={() => onSendPrompt()}
                  >
                    <Send
                      size={17}
                      color={prompt.trim() || attachedImageUri ? '#ffffff' : '#52525b'}
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* ATTACHMENT ACTION SHEET INSIDE MODAL */}
        {showAttachModal && (
          <View style={styles.attachModalBackdrop}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setShowAttachModal(false)}
            />
            <View style={styles.attachModalSheet}>
              <Text style={styles.attachModalTitle}>Add attachment</Text>

              <TouchableOpacity style={styles.attachOptionRow} onPress={onPickCamera}>
                <View style={[styles.attachOptionIcon, { backgroundColor: '#27272a' }]}>
                  <Camera size={20} color="#ffffff" />
                </View>
                <View style={styles.attachOptionTextGroup}>
                  <Text style={styles.attachOptionLabel}>Take photo</Text>
                  <Text style={styles.attachOptionSub}>Attach image from camera for OCR</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.attachOptionRow} onPress={onPickGallery}>
                <View style={[styles.attachOptionIcon, { backgroundColor: '#27272a' }]}>
                  <ImageIcon size={20} color="#ffffff" />
                </View>
                <View style={styles.attachOptionTextGroup}>
                  <Text style={styles.attachOptionLabel}>Upload from gallery</Text>
                  <Text style={styles.attachOptionSub}>Attach question photo from device</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachCancelButton}
                onPress={() => setShowAttachModal(false)}
              >
                <Text style={styles.attachCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  darkContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  chatTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 10 : 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  chatModalLogoIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  chatModalHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  chatCloseButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBotIconHeader: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBody: {
    flex: 1,
  },
  chatEmptyView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  chatEmptyLogo: {
    width: 52,
    height: 52,
    marginBottom: 10,
  },
  chatEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  chatEmptySub: {
    fontSize: 12,
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 16,
  },
  chatMessageList: {
    padding: 12,
  },
  userMsgRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 9,
  },
  botMsgRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 11,
  },
  botAvatarBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
    marginTop: 2,
    overflow: 'hidden',
  },
  botAvatarImage: {
    width: 18,
    height: 18,
  },
  userBubble: {
    maxWidth: '82%',
    backgroundColor: '#27272a',
    borderRadius: 13,
    borderBottomRightRadius: 3,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  botBubble: {
    maxWidth: '84%',
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#24242a',
    borderRadius: 13,
    borderBottomLeftRadius: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  botActionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 6,
  },
  chatActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: '#1c1c22',
    borderRadius: 5,
  },
  chatActionButtonText: {
    fontSize: 10.5,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  chatAttachedPreviewImage: {
    width: 160,
    height: 110,
    borderRadius: 8,
    marginBottom: 6,
  },
  chatAttachmentPill: {
    backgroundColor: '#1f1f23',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginBottom: 3,
  },
  chatAttachmentText: {
    fontSize: 10,
    color: '#a1a1aa',
  },
  attachedImageThumbnailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    padding: 8,
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  attachedThumbImage: {
    width: 36,
    height: 36,
    borderRadius: 4,
    marginRight: 8,
  },
  attachedThumbText: {
    flex: 1,
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '500',
  },
  loadingBubbleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingBubbleText: {
    fontSize: 12,
    color: '#a1a1aa',
    marginLeft: 7,
  },
  chatInputBarContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'android' ? 38 : 14,
    backgroundColor: '#000000',
  },
  chatInputPillWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  chatAttachIconButton: {
    marginRight: 7,
  },
  chatPillInput: {
    flex: 1,
    minHeight: 24,
    maxHeight: 85,
    fontSize: 13,
    color: '#ffffff',
    paddingVertical: 0,
  },
  chatSendIconButton: {
    marginLeft: 7,
  },
  chatMicIconButton: {
    padding: 4,
    marginRight: 2,
  },
  chatMicIconButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
  },
  chatStopIconButton: {
    marginLeft: 7,
    backgroundColor: '#dc2626',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatingStopContainer: {
    alignItems: 'center',
    marginBottom: 6,
  },
  generatingStopPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#3f3f46',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  generatingStopText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  attachModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 250,
    justifyContent: 'flex-end',
  },
  attachModalSheet: {
    backgroundColor: '#121214',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: '#27272a',
    padding: 20,
    gap: 12,
  },
  attachModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  attachOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    padding: 12,
  },
  attachOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  attachOptionTextGroup: {
    flex: 1,
  },
  attachOptionLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  attachOptionSub: {
    fontSize: 11,
    color: '#a1a1aa',
    marginTop: 1,
  },
  attachCancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  attachCancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717a',
  },
  topWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0c0c0e',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  topWarningText: {
    fontSize: 10,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '400',
  },
});

export default ChatModal;
