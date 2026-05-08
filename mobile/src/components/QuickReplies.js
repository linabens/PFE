import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '../styles/theme';

/**
 * Suggestions de réponses rapides sous forme de chips
 */
const QuickReplies = ({ replies, onReply }) => {
  if (!replies || replies.length === 0) return null;

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {replies.map((reply, index) => (
        <TouchableOpacity 
          key={index} 
          style={styles.chip}
          onPress={() => onReply(reply)}
          activeOpacity={0.7}
        >
          <Text style={styles.text}>{reply}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 50,
    marginVertical: Spacing.sm,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: Colors.bgSection,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.latte + '40', // 40 is hex for 25% opacity
  },
  text: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
});

export default QuickReplies;
