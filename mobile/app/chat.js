import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, StatusBar,
  ScrollView, ActivityIndicator, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadows } from '../src/styles/theme';
import { useChat } from '../src/context/ChatContext';
import MessageBubble from '../src/components/MessageBubble';
import TypingIndicator from '../src/components/TypingIndicator';

// ─── Source chips shown below assistant messages ──────────────────────────────
const SourceChips = ({ sources }) => {
  if (!sources || sources.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.sourcesRow}
      contentContainerStyle={styles.sourcesContent}
    >
      {sources.slice(0, 4).map((s) => (
        <View key={s.product_id} style={styles.sourceChip}>
          <Ionicons name="cafe-outline" size={10} color={Colors.mocha} />
          <Text style={styles.sourceChipText} numberOfLines={1}>
            {s.name}
          </Text>
          <Text style={styles.sourcePrice}>{parseFloat(s.price).toFixed(3)} TND</Text>
        </View>
      ))}
    </ScrollView>
  );
};

// ─── Quick reply chips ────────────────────────────────────────────────────────
const QuickReplyBar = ({ replies, onSelect, disabled }) => {
  if (!replies || replies.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.qrBar}
      contentContainerStyle={styles.qrContent}
      keyboardShouldPersistTaps="handled"
    >
      {replies.map((r, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.qrChip, disabled && styles.qrChipDisabled]}
          onPress={() => !disabled && onSelect(r)}
          activeOpacity={0.7}
        >
          <Text style={styles.qrText}>{r}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const flatList = useRef(null);
  const inputRef = useRef(null);
  const [inputText, setInputText] = useState('');

  const { messages, isTyping, quickReplies, sendMessage, clearChat } = useChat();

  // Scroll to bottom whenever messages or typing state changes
  useEffect(() => {
    const id = setTimeout(() => {
      flatList.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(id);
  }, [messages, isTyping]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isTyping) return;
    setInputText('');
    await sendMessage(text);
  }, [inputText, isTyping, sendMessage]);

  const handleQuickReply = useCallback((text) => {
    sendMessage(text);
  }, [sendMessage]);

  const handleClear = useCallback(async () => {
    await clearChat();
  }, [clearChat]);

  const renderItem = useCallback(({ item }) => (
    <View>
      <MessageBubble message={item} />
      {item.role === 'assistant' && item.sources?.length > 0 && (
        <SourceChips sources={item.sources} />
      )}
    </View>
  ), []);

  const renderFooter = useCallback(() => {
    if (!isTyping) return null;
    return (
      <View style={styles.typingWrapper}>
        <TypingIndicator />
      </View>
    );
  }, [isTyping]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#2C1810" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#3D1C0C', '#2C1810']}
          style={StyleSheet.absoluteFill}
        />
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-down" size={26} color="#FAF3EB" />
        </TouchableOpacity>

        <View style={styles.headerProfile}>
          <View style={styles.headerAvatar}>
            <Text style={styles.avatarLetter}>C</Text>
            <View style={styles.activeIndicator} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Coffee Time</Text>
            <Text style={styles.headerStatus}>Barista virtuelle • En ligne</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
          <Ionicons name="trash-outline" size={20} color="#FAF3EB" />
        </TouchableOpacity>
      </View>

      {/* ── Messages ── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatList}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListFooterComponent={renderFooter}
          contentContainerStyle={[styles.messageList, { paddingBottom: insets.bottom + 8 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => flatList.current?.scrollToEnd({ animated: false })}
        />

        {/* ── Quick replies ── */}
        <View style={styles.quickReplyContainer}>
          <QuickReplyBar
            replies={quickReplies}
            onSelect={handleQuickReply}
            disabled={isTyping}
          />
        </View>

        {/* ── Input bar ── */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 20 }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Posez votre question à Coffee Time..."
              placeholderTextColor="#A1887F"
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              editable={!isTyping}
            />
            
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || isTyping) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || isTyping}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={inputText.trim() && !isTyping ? ['#5C3221', '#3D1C0C'] : ['#EAD9C9', '#EAD9C9']}
                style={styles.sendIconWrapper}
              >
                {isTyping ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF3EB', // Warm Cream background
  },
  flex: {
    flex: 1,
  },
  header: {
    height: 90,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FAF3EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarLetter: {
    color: '#3D1C0C',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#3D1C0C',
  },
  headerInfo: {
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FAF3EB',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  headerStatus: {
    color: '#A1887F',
    fontSize: 11,
    fontFamily: 'sans-serif',
  },
  clearBtn: {
    width: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  // Messages
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  typingWrapper: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  quickReplyContainer: {
    backgroundColor: 'rgba(250, 243, 235, 0.9)',
  },
  qrBar: {
    paddingVertical: 12,
  },
  qrContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  qrChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAD9C9',
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  qrText: {
    color: '#7A5C4D',
    fontSize: 12,
    fontWeight: '500',
  },

  inputContainer: {
    backgroundColor: '#FAF3EB',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#EAD9C9',
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#3D1C0C',
    maxHeight: 100,
    paddingTop: Platform.OS === 'ios' ? 10 : 0,
    paddingBottom: Platform.OS === 'ios' ? 10 : 0,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendIconWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sourcesRow: {
    marginBottom: 16,
    marginLeft: 40,
  },
  sourcesContent: {
    gap: 8,
  },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAD9C9',
    gap: 6,
  },
  sourceChipText: {
    fontSize: 11,
    color: '#7A5C4D',
  },
  sourcePrice: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#5C3221',
  },
});
