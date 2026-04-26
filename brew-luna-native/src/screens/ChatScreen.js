import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../styles/theme';
import { useChat } from '../context/ChatContext';
import MessageBubble from '../components/MessageBubble';
import TypingIndicator from '../components/TypingIndicator';
import QuickReplies from '../components/QuickReplies';

/**
 * BREW LUNA — Modernized Chat Screen
 * A premium, immersive assistant interface.
 */
const ChatScreen = () => {
  const router = useRouter();
  const { messages, isTyping, quickReplies, sendMessage } = useChat();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);

  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleQuickReply = (reply) => {
    sendMessage(reply);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Modern Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.closeButton}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="chevron-down" size={22} color={Colors.textPrimary} />
            </View>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Luna Assistant</Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <Text style={styles.subtitle}>En ligne • Prête à vous aider</Text>
            </View>
          </View>

          <LinearGradient
            colors={[Colors.mocha, Colors.espresso]}
            style={styles.avatarContainer}
          >
            <Text style={styles.avatarEmoji}>☽</Text>
          </LinearGradient>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={[...messages].reverse()}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.listContent}
          inverted={true}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={isTyping ? <TypingIndicator /> : null}
          ListFooterComponent={<View style={{ height: 10 }} />}
        />

        {/* Action Area */}
        <View style={styles.footer}>
          {!isTyping && (
            <View style={styles.quickRepliesContainer}>
              <QuickReplies 
                replies={quickReplies} 
                onReply={handleQuickReply} 
              />
            </View>
          )}

          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Message Luna..."
                placeholderTextColor={Colors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
              />
              
              <TouchableOpacity
                onPress={handleSend}
                disabled={!inputText.trim()}
                style={styles.sendButton}
              >
                <LinearGradient
                  colors={inputText.trim() ? [Colors.mocha, Colors.espresso] : [Colors.bgSection, Colors.bgSection]}
                  style={styles.sendGradient}
                >
                  <Ionicons 
                    name="arrow-up" 
                    size={20} 
                    color={inputText.trim() ? Colors.cream : Colors.textMuted} 
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgPage,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: '6%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.bgPage,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  closeButton: {
    width: 40,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgSection,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  avatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  avatarEmoji: {
    fontSize: 22,
    color: Colors.cream,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  footer: {
    backgroundColor: Colors.bgPage,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
  },
  quickRepliesContainer: {
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    paddingHorizontal: Spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 28,
    paddingLeft: Spacing.lg,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendButton: {
    marginLeft: Spacing.sm,
  },
  sendGradient: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen;
