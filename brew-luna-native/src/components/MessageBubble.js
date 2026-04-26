import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius } from '../styles/theme';

/**
 * BREW LUNA — Modernized Message Bubble
 */
const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[
      styles.container,
      isUser ? styles.userContainer : styles.assistantContainer
    ]}>
      {!isUser && (
        <View style={styles.avatarSmall}>
          <Text style={styles.avatarEmoji}>☽</Text>
        </View>
      )}
      
      <View style={styles.bubbleWrapper}>
        {isUser ? (
          <LinearGradient
            colors={[Colors.mocha, Colors.espresso]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.bubble, styles.userBubble]}
          >
            <Text style={[styles.text, styles.userText]}>
              {message.content}
            </Text>
          </LinearGradient>
        ) : (
          <View style={[styles.bubble, styles.assistantBubble]}>
            <Text style={[styles.text, styles.assistantText]}>
              {message.content}
            </Text>
          </View>
        )}
        
        <Text style={[
          styles.timestamp,
          isUser ? styles.userTimestamp : styles.assistantTimestamp
        ]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    alignItems: 'flex-end',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.espresso,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarEmoji: {
    fontSize: 14,
    color: Colors.cream,
  },
  bubbleWrapper: {
    maxWidth: '82%',
  },
  bubble: {
    padding: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: Colors.bgCard,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  text: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 22,
  },
  userText: {
    color: Colors.cream,
  },
  assistantText: {
    color: Colors.textPrimary,
  },
  timestamp: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 4,
    opacity: 0.7,
  },
  userTimestamp: {
    textAlign: 'right',
    marginRight: 4,
  },
  assistantTimestamp: {
    textAlign: 'left',
    marginLeft: 4,
  },
});

export default MessageBubble;
