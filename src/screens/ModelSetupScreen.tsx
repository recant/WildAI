import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ensureModelDownloaded } from '../services/modelManager';
import { initContext } from '../services/llm';

export default function ModelSetupScreen({ onReady }: { onReady: () => void }) {
  const [label, setLabel] = useState('Preparing…');
  const [fraction, setFraction] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    (async () => {
      try {
        await ensureModelDownloaded(progress => {
          if (cancelled) return;
          setLabel(progress.label);
          setFraction(progress.fraction);
        });
        if (cancelled) return;
        setLabel('Loading model into memory…');
        await initContext();
        if (cancelled) return;
        onReady();
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WildAI</Text>
      {error ? (
        <>
          <Text style={styles.error}>Setup failed: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => setRetryCount(c => c + 1)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color="#2f6f4f" />
          <Text style={styles.label}>{label}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${Math.round(fraction * 100)}%` }]} />
          </View>
          <Text style={styles.pct}>{Math.round(fraction * 100)}%</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24, color: '#2f6f4f' },
  label: { marginTop: 16, fontSize: 15, color: '#444', textAlign: 'center' },
  barTrack: { width: '100%', height: 8, backgroundColor: '#eee', borderRadius: 4, marginTop: 16, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: '#2f6f4f' },
  pct: { marginTop: 8, color: '#888' },
  error: { color: '#b00020', textAlign: 'center' },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#2f6f4f',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryButtonText: { color: '#fff', fontWeight: '600' },
});
