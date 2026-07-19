import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export type ChatItem = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  imageUri?: string | null;
};

export default function MessageBubble({ item }: { item: ChatItem }) {
  const isUser = item.role === 'user';
  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.image} resizeMode="cover" />
        ) : null}
        <Text style={isUser ? styles.textUser : styles.textAssistant}>{item.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 6, paddingHorizontal: 12 },
  rowUser: { justifyContent: 'flex-end' },
  rowAssistant: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', borderRadius: 14, padding: 10 },
  bubbleUser: { backgroundColor: '#2f6f4f' },
  bubbleAssistant: { backgroundColor: '#e8e6e1' },
  textUser: { color: '#fff', fontSize: 15 },
  textAssistant: { color: '#1c1c1c', fontSize: 15 },
  image: { width: 220, height: 220, borderRadius: 10, marginBottom: 8 },
});
