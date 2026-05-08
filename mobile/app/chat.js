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
      <StatusBar barStyle="light-content" backgroundColor={Colors.espresso} />

      {/* ── Header ── */}
      <LinearGradient colors={[Colors.espresso, Colors.roast]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="chevron-down" size={24} color={Colors.cream} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.onlineDot} />
          <Text style={styles.headerTitle}>Luna</Text>
          <Text style={styles.headerSub}>Barista virtuelle BrewLuna ☕</Text>
        </View>

        <TouchableOpacity onPress={handleClear} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="trash-outline" size={20} color={Colors.latte} />
        </TouchableOpacity>
      </LinearGradient>

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
        <QuickReplyBar
          replies={quickReplies}
          onSelect={handleQuickReply}
          disabled={isTyping}
        />

        {/* ── Input bar ── */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : Spacing.md }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Posez votre question à Luna..."
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              editable={!isTyping}
            />
          </View>

          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || isTyping) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isTyping}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={inputText.trim() && !isTyping
                ? [Colors.mocha, Colors.espresso]
                : [Colors.textMuted, Colors.textMuted]}
              style={styles.sendGradient}
            >
              {isTyping
                ? <ActivityIndicator size="small" color={Colors.cream} />
                : <Ionicons name="send" size={18} color={Colors.cream} />}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgPage,
  },
  flex: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 18,
    color: Colors.cream,
    letterSpacing: 0.5,
  },
  headerSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: Colors.latte,
    opacity: 0.85,
  },

  // Messages
  messageList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    flexGrow: 1,
  },
  typingWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },

  // Source chips
  sourcesRow: {
    marginBottom: Spacing.md,
    marginLeft: 36,
  },
  sourcesContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bgSection,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.latte + '40',
  },
  sourceChipText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    maxWidth: 100,
  },
  sourcePrice: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: Colors.mocha,
  },

  // Quick replies
  qrBar: {
    maxHeight: 48,
    borderTopWidth: 1,
    borderTopColor: Colors.bgSection,
  },
  qrContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  qrChip: {
    backgroundColor: Colors.bgSection,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.latte + '50',
  },
  qrChipDisabled: {
    opacity: 0.4,
  },
  qrText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: Colors.bgSection,
    gap: Spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: Colors.bgPage,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.latte + '60',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? Spacing.md : 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  input: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.textPrimary,
    maxHeight: 100,
    lineHeight: 20,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 1,
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
