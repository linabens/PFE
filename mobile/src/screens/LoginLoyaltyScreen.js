/**
 * BREW LUNA — Écran de connexion au programme de fidélité
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, ScrollView, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLoyalty } from '../context/LoyaltyContext';

const C = {
  bg:      '#FAF3EB',   // Home Match
  cream:   '#F5E6D3',
  card:    '#FFFFFF',
  primary: '#5C3221',   // espresso
  accent:  '#C09891',   // rosewood
  muted:   '#B89A87',
  mocha:   '#7A5C4D',
  border:  '#EAD9C9',
  error:   '#C0392B',
  input:   '#FFFFFF',
};

export default function LoginLoyaltyScreen() {
  const router = useRouter();
  const { login, reconnect } = useLoyalty();

  const [phone, setPhone]         = useState('');
  const [error, setError]         = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !/^\d{8}$/.test(phone)) {
      setError('Veuillez entrer un numéro valide de 8 chiffres.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await login(phone.trim());
      reconnect(); // Annule le "logout" si l'utilisateur s'était déconnecté
      router.replace('/loyalty/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = /^\d{8}$/.test(phone);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Bienvenue</Text>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Icône et sous-titre */}
          <View style={s.hero}>
            <View style={s.heroIconWrap}>
              <Ionicons name="cafe" size={40} color={C.primary} />
            </View>
            <Text style={s.heroTitle}>Connectez-vous</Text>
            <Text style={s.heroCopy}>Accédez à votre compte rewards avec votre numéro</Text>
          </View>

          {/* Erreur */}
          {error ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={C.error} />
              <Text style={s.errorTxt}>{error}</Text>
            </View>
          ) : null}

          {/* ── Formulaire ── */}
          <View style={s.form}>
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Numéro de téléphone</Text>
              <View style={[s.inputRow, error && s.inputErrBorder]}>
                <Ionicons name="call-outline" size={18} color={C.muted} style={s.icon} />
                <TextInput
                  style={s.input}
                  placeholder="8 chiffres (ex: 55123456)"
                  placeholderTextColor={C.muted}
                  value={phone}
                  onChangeText={(val) => setPhone(val.replace(/[^0-9]/g, '').slice(0, 8))}
                  keyboardType="phone-pad"
                  maxLength={8}
                />
              </View>
            </View>
          </View>

          {/* ── Bouton login ── */}
          <TouchableOpacity
            style={[s.submitBtn, !isValid && s.submitDisabled]}
            onPress={handleLogin}
            disabled={!isValid || isLoading}
            activeOpacity={0.85}
          >
            {isLoading
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <>
                  <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
                  <Text style={s.submitText}>Se connecter</Text>
                </>
            }
          </TouchableOpacity>

          {/* ── Lien inscription ── */}
          <TouchableOpacity onPress={() => router.replace('/loyalty/register')} style={s.registerLink}>
            <Text style={s.registerLinkText}>
              Nouveau ici ?{' '}
              <Text style={{ color: C.accent, fontFamily: 'Poppins_600SemiBold' }}>Créer un compte</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    justifyContent: 'space-between',
  },
  backBtn:     { padding: 6 },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20, color: C.primary,
  },
  scroll:        { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 48 },

  hero:       { alignItems: 'center', marginBottom: 32 },
  heroIconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    borderWidth: 1, borderColor: C.border,
  },
  heroTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26, color: C.primary, marginBottom: 8,
  },
  heroCopy: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14, color: C.mocha, textAlign: 'center',
  },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FDEDEC', borderRadius: 10,
    padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#E8A09A',
  },
  errorTxt: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13, color: C.error, flex: 1,
  },

  form:          { gap: 18, marginBottom: 32 },
  fieldWrap:     { gap: 6 },
  fieldLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14, color: C.primary,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 16,
  },
  inputErrBorder: { borderColor: C.error },
  icon:    { marginRight: 10 },
  input: {
    flex: 1, height: 54,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15, color: C.primary,
  },

  submitBtn: {
    backgroundColor: C.primary,
    borderRadius: 16, height: 56,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
    marginBottom: 24,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16, color: '#FFFFFF',
  },

  registerLink:     { alignItems: 'center' },
  registerLinkText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14, color: C.mocha,
  },
});
