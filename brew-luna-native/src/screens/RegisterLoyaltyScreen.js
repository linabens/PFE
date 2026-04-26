/**
 * BREW LUNA — Écran d'inscription au programme de fidélité
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, ScrollView, TextInput,
  Animated, KeyboardAvoidingView, Platform, ActivityIndicator,
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
  success: '#166534',
  input:   '#FFFFFF',
};

// ─── Champ de formulaire réutilisable ─────────────────────────────────────────
const FormField = ({ label, icon, error, ...inputProps }) => (
  <View style={s.fieldWrap}>
    <Text style={s.fieldLabel}>{label}</Text>
    <View style={[s.inputRow, error && s.inputError]}>
      <Ionicons name={icon} size={18} color={error ? C.error : C.muted} style={s.inputIcon} />
      <TextInput style={s.input} placeholderTextColor={C.muted} {...inputProps} />
    </View>
    {error ? <Text style={s.errorTxt}>{error}</Text> : null}
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function RegisterLoyaltyScreen() {
  const router = useRouter();
  const { register } = useLoyalty();

  const [name, setName]               = useState('');
  const [phone, setPhone]             = useState('');
  const [errors, setErrors]           = useState({});
  const [isLoading, setIsLoading]     = useState(false);
  const [success, setSuccess]         = useState(false);

  // Animation succès
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  // ─── Validation ──────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!name.trim() || name.trim().length < 2)
      e.name = 'Le nom doit contenir au moins 2 caractères';
    if (!phone.trim() || !/^\d{8}$/.test(phone))
      e.phone = 'Le numéro doit contenir exactement 8 chiffres';
    return e;
  };

  // ─── Soumission ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setIsLoading(true);

    try {
      await register(name.trim(), phone.trim());
      setSuccess(true);

      // Animation du checkmark
      Animated.sequence([
        Animated.parallel([
          Animated.spring(successScale, { toValue: 1, useNativeDriver: true }),
          Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
        Animated.delay(1400),
      ]).start(() => {
        router.replace('/loyalty/dashboard');
      });
    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = name.trim().length >= 2 && /^\d{8}$/.test(phone);

  // ─── Écran de succès ──────────────────────────────────────────────────────
  if (success) {
    return (
      <SafeAreaView style={[s.safe, { alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <Animated.View style={[s.successCircle, {
          transform: [{ scale: successScale }],
          opacity: successOpacity,
        }]}>
          <Ionicons name="checkmark" size={60} color="#FFFFFF" />
        </Animated.View>
        <Animated.Text style={[s.successText, { opacity: successOpacity }]}>
          Bienvenue au Club !
        </Animated.Text>
        <Animated.Text style={[s.successSub, { opacity: successOpacity }]}>
          Redirection vers votre tableau de bord…
        </Animated.Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Créer un compte</Text>
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
          showsVerticalScrollIndicator={false}
        >
          {/* Info Card */}
          <View style={s.introRow}>
            <Ionicons name="sparkles" size={20} color={C.accent} />
            <Text style={s.introCopy}>
              Rejoignez le club BrewLuna et obtenez <Text style={{ fontWeight: '700' }}>100 points</Text> de bienvenue immédiatement !
            </Text>
          </View>

          {/* Erreur générale */}
          {errors.general && (
            <View style={s.generalError}>
              <Ionicons name="alert-circle-outline" size={16} color={C.error} />
              <Text style={s.generalErrorTxt}>{errors.general}</Text>
            </View>
          )}

          {/* ── Formulaire ── */}
          <View style={s.form}>
            <FormField
              label="Nom complet"
              icon="person-outline"
              placeholder="Ex. Sarra Ben Ali"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              error={errors.name}
            />

            <FormField
              label="Numéro de téléphone"
              icon="call-outline"
              placeholder="8 chiffres (ex: 55123456)"
              value={phone}
              onChangeText={(val) => setPhone(val.replace(/[^0-9]/g, '').slice(0, 8))}
              keyboardType="phone-pad"
              maxLength={8}
              error={errors.phone}
            />
          </View>

          {/* ── Bouton de soumission ── */}
          <TouchableOpacity
            style={[s.submitBtn, !isValid && s.submitDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || isLoading}
            activeOpacity={0.85}
          >
            {isLoading
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={s.submitText}>Créer mon compte</Text>
                </>
            }
          </TouchableOpacity>

          {/* ── Lien connexion ── */}
          <TouchableOpacity onPress={() => router.replace('/loyalty/login')} style={s.loginLink}>
            <Text style={s.loginLinkText}>
              Déjà un compte ?{' '}
              <Text style={{ color: C.accent, fontFamily: 'Poppins_600SemiBold' }}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    justifyContent: 'space-between',
  },
  backBtn:    { padding: 6 },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20, color: C.primary,
  },

  scroll:      { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 48 },

  introRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10,
    elevation: 2,
  },
  introCopy: {
    flex: 1, fontFamily: 'Poppins_400Regular',
    fontSize: 13, color: C.primary, lineHeight: 19,
  },

  generalError: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FDEDEC', borderRadius: 10,
    padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#E8A09A',
  },
  generalErrorTxt: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13, color: C.error, flex: 1,
  },

  form:      { gap: 18, marginBottom: 32 },
  fieldWrap: { gap: 6 },
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
  inputError: { borderColor: C.error },
  inputIcon:  { marginRight: 10 },
  input: {
    flex: 1, height: 54,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15, color: C.primary,
  },
  errorTxt: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12, color: C.error, marginTop: 2,
  },

  submitBtn: {
    backgroundColor: C.primary,
    borderRadius: 16, height: 56,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
    marginBottom: 24,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12,
    elevation: 6,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16, color: '#FFFFFF',
  },

  loginLink:     { alignItems: 'center' },
  loginLinkText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14, color: C.mocha,
  },

  // Succès
  successCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: C.success,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
    shadowColor: C.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16,
    elevation: 8,
  },
  successText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24, color: C.primary,
    textAlign: 'center', marginBottom: 8,
  },
  successSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14, color: C.muted, textAlign: 'center',
  },
});
