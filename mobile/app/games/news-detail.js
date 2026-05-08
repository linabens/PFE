import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  StatusBar, ScrollView, Image, Linking, Share,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const C = {
  bg: '#FAF3EB', card: '#FFFFFF', primary: '#5C3221', accent: '#C09891',
  muted: '#B89A87', mocha: '#7A5C4D', border: '#EAD9C9', cream: '#F5E6D3',
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

export default function NewsDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  let article = null;
  try {
    article = params.article ? JSON.parse(params.article) : null;
  } catch {}

  if (!article) return (
    <SafeAreaView style={s.safe}>
      <TouchableOpacity style={s.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={C.primary} />
        <Text style={s.backTxt}>Back</Text>
      </TouchableOpacity>
      <View style={s.center}>
        <Text style={s.notFound}>Article not found.</Text>
      </View>
    </SafeAreaView>
  );

  const openArticle = async () => {
    if (article.link) {
      try { await Linking.openURL(article.link); } catch {}
    }
  };

  const shareArticle = async () => {
    try {
      await Share.share({ message: `${article.title}\n${article.link}` });
    } catch {}
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={C.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={s.shareBtn} onPress={shareArticle}>
          <Ionicons name="share-outline" size={22} color={C.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {article.image ? (
          <Image source={{ uri: article.image }} style={s.hero} resizeMode="cover" />
        ) : (
          <View style={s.heroPlaceholder}>
            <MaterialCommunityIcons name="newspaper-variant-outline" size={56} color={C.accent} />
          </View>
        )}

        <View style={s.content}>
          <View style={s.metaRow}>
            <View style={[s.sourceBadge, article.category === 'sports' && s.sportsBadge]}>
              <Text style={s.sourceText}>{article.source}</Text>
            </View>
            <Text style={s.timeText}>{timeAgo(article.pubDate)}</Text>
          </View>

          <Text style={s.articleTitle}>{article.title}</Text>

          {article.description ? (
            <Text style={s.articleBody}>{article.description}</Text>
          ) : null}

          <View style={s.divider} />

          {article.link ? (
            <TouchableOpacity style={s.readBtn} onPress={openArticle} activeOpacity={0.85}>
              <Ionicons name="globe-outline" size={18} color="#fff" />
              <Text style={s.readBtnTxt}>Read Full Article</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={s.shareFullBtn} onPress={shareArticle} activeOpacity={0.85}>
            <Ionicons name="share-social-outline" size={18} color={C.primary} />
            <Text style={s.shareFullTxt}>Share</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: C.primary },
  shareBtn: { padding: 4 },
  hero: { width: '100%', height: 220, backgroundColor: C.cream },
  heroPlaceholder: { width: '100%', height: 180, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sourceBadge: { backgroundColor: C.cream, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  sportsBadge: { backgroundColor: '#FEF3C7', borderColor: '#D97706' },
  sourceText: { fontFamily: 'Poppins_600SemiBold', fontSize: 11, color: C.primary },
  timeText: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: C.muted },
  articleTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: C.primary, lineHeight: 32 },
  articleBody: { fontFamily: 'Poppins_400Regular', fontSize: 15, color: C.mocha, lineHeight: 24 },
  divider: { height: 1, backgroundColor: C.border },
  readBtn: { backgroundColor: C.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  readBtnTxt: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  shareFullBtn: { backgroundColor: C.card, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', borderWidth: 1.5, borderColor: C.border },
  shareFullTxt: { color: C.primary, fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontFamily: 'Poppins_400Regular', fontSize: 16, color: C.muted },
});
