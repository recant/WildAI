import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import MessageBubble, { ChatItem } from '../components/MessageBubble';
import { sendMessage } from '../services/llm';

let nextId = 0;
const genId = () => String(nextId++);

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatItem>>(null);

  const scrollToEnd = () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);

  const pickImage = () => {
    Alert.alert('Attach a photo', undefined, [
      {
        text: 'Take Photo',
        onPress: () =>
          launchCamera({ mediaType: 'photo', quality: 0.8 }, response => {
            const uri = response.assets?.[0]?.uri;
            if (uri) setPendingImageUri(uri);
          }),
      },
      {
        text: 'Choose from Gallery',
        onPress: () =>
          launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, response => {
            const uri = response.assets?.[0]?.uri;
            if (uri) setPendingImageUri(uri);
          }),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const onSend = async () => {
    const text = inputText.trim();
    if (!text && !pendingImageUri) return;
    if (sending) return;

    const userItem: ChatItem = {
      id: genId(),
      role: 'user',
      text: text || '(photo)',
      imageUri: pendingImageUri,
    };
    const assistantId = genId();
    setMessages(prev => [...prev, userItem, { id: assistantId, role: 'assistant', text: '' }]);
    setInputText('');
    const imageForThisTurn = pendingImageUri;
    setPendingImageUri(null);
    setSending(true);
    scrollToEnd();

    try {
      await sendMessage(text, imageForThisTurn, partial => {
        setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, text: partial } : m)));
        scrollToEnd();
      });
    } catch (e: any) {
      setMessages(prev =>
        prev.map(m => (m.id === assistantId ? { ...m, text: `Error: ${e?.message ?? String(e)}` } : m)),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <MessageBubble item={item} />}
        contentContainerStyle={styles.list}
        onContentSizeChange={scrollToEnd}
      />

      {pendingImageUri ? (
        <View style={styles.previewRow}>
          <Image source={{ uri: pendingImageUri }} style={styles.previewImage} />
          <TouchableOpacity onPress={() => setPendingImageUri(null)}>
            <Text style={styles.removePreview}>Remove</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.attachButton} onPress={pickImage} disabled={sending}>
          <Text style={styles.attachButtonText}>+</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          placeholder="Ask about your gear…"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={onSend}
          disabled={sending}
        >
          <Text style={styles.sendButtonText}>{sending ? '…' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  list: { paddingVertical: 12 },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  previewImage: { width: 56, height: 56, borderRadius: 8, marginRight: 10 },
  removePreview: { color: '#b00020' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  attachButtonText: { fontSize: 22, color: '#2f6f4f' },
  textInput: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: '#f4f4f2',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#2f6f4f',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: '#fff', fontWeight: '600' },
});
