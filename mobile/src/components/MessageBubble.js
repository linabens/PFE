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
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>C</Text>
          <View style={styles.statusDot} />
        </View>
      )}

      <View style={styles.bubbleWrapper}>
        {isUser ? (
          <LinearGradient
            colors={['#5C3221', '#2C1810']}
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

        <View style={isUser ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }}>
          <Text style={styles.timestamp}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3D1C0C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#FAF3EB',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarText: {
    color: '#FAF3EB',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    borderWidth: 1.5,
    borderColor: '#FAF3EB',
  },
  bubbleWrapper: {
    maxWidth: '80%',
  },
  bubble: {
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#EAD9C9',
  },
  text: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#FAF3EB',
  },
  assistantText: {
    color: '#3D1C0C',
  },
  timestamp: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 9,
    color: '#A1887F',
    marginTop: 4,
    marginHorizontal: 4,
  },
});

export default MessageBubble;
