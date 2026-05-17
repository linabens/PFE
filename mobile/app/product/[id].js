import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  ScrollView, Dimensions, ActivityIndicator, Platform, Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Heart, Check, AlertCircle } from 'lucide-react-native';
import ProductImageFallback from '../../src/components/ui/ProductImageFallback';
import { useCartStore } from '../../src/store/useCartStore';
import { menuApi } from '../../src/api/menuApi';
import {
  getConfig, buildInitialState, computeExtras, buildOptionsArray,
} from '../../src/utils/customizationConfig';

const { height } = Dimensions.get('window');

const C = {
  bg:            '#FAF3EB',
  imgBg:         '#F0E4D6',
  border:        '#EAD9C9',
  primary:       '#5C3221',
  secondaryText: '#7A5C4D',
  mainText:      '#3D1C0C',
  cardBg:        '#FFFFFF',
  rosewood:      '#C09891',
};

const FONT = {
  playfair: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  poppins:  Platform.OS === 'ios' ? 'System'  : 'sans-serif',
};

// ─── Reusable sub-components ──────────────────────────────────────────────────

const SectionTitle = ({ label }) => (
  <Text style={styles.sectionTitle}>{label}</Text>
);

const RadioRow = ({ options, selected, onSelect, labelKey = 'name', extraKey = null }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}
    contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
    {options.map((opt) => {
      const label = typeof opt === 'string' ? opt : opt[labelKey];
      const isSelected = typeof opt === 'string' ? selected === opt : selected?.id === opt.id;
      const extra = extraKey && opt[extraKey] > 0 ? ` +${opt[extraKey].toFixed(2)}` : '';
      return (
        <TouchableOpacity
          key={typeof opt === 'string' ? opt : opt.id}
          style={[styles.radioPill, isSelected && styles.radioPillActive]}
          onPress={() => { Haptics.selectionAsync(); onSelect(opt); }}
          activeOpacity={0.75}
        >
          <Text style={[styles.radioPillTxt, isSelected && styles.radioPillTxtActive]}>
            {label}{extra}
          </Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

const SizePills = ({ sizes, selected, onSelect }) => (
  <View style={styles.sizeRow}>
    {sizes.map(s => {
      const isSelected = selected?.id === s.id;
      return (
        <TouchableOpacity
          key={s.id}
          style={[styles.sizePill, isSelected && styles.sizePillActive]}
          onPress={() => { Haptics.selectionAsync(); onSelect(s); }}
        >
          <Text style={[styles.sizeTxt, isSelected && styles.sizeTxtActive]}>{s.label}</Text>
          <Text style={[styles.sizeVolume, isSelected && styles.sizeTxtActive]}>{s.volume}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const CheckboxList = ({ items, selected, onToggle, priceKey = 'price' }) => (
  <View style={styles.checkList}>
    {items.map(item => {
      const isChecked = !!selected[item.id];
      return (
        <TouchableOpacity
          key={item.id}
          style={styles.checkboxRow}
          onPress={() => { Haptics.selectionAsync(); onToggle(item); }}
          activeOpacity={0.75}
        >
          <View style={[styles.checkboxSquare, isChecked && styles.checkboxSquareActive]}>
            {isChecked && <Check size={11} color={C.bg} strokeWidth={3} />}
          </View>
          <Text style={styles.checkboxLabel}>{item.name}</Text>
          {item[priceKey] > 0 && (
            <Text style={styles.checkboxPrice}>+{item[priceKey].toFixed(2)} DT</Text>
          )}
        </TouchableOpacity>
      );
    })}
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProductDetailScreen() {
  const { id, coffeeString } = useLocalSearchParams();
  const router = useRouter();
  const { addItem } = useCartStore();

  const [product,      setProduct]      = useState(null);
  const [isLoading,    setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [isFavorite,   setIsFavorite]   = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [custom,       setCustom]       = useState(null); // customization state
  const [config,       setConfig]       = useState(null);

  const toastY = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let p;
        if (coffeeString) {
          p = JSON.parse(coffeeString);
        } else {
          const res = await menuApi.getProductById(id);
          if (res.success) p = res.data;
          else { setError('Produit introuvable.'); return; }
        }
        setProduct(p);
        const cfg = getConfig(p.category_type ?? p.category?.type ?? 'coffee');
        setConfig(cfg);
        setCustom(buildInitialState(cfg));
      } catch {
        setError('Erreur réseau.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, coffeeString]);

  const showToast = (msg) => {
    setToastMessage(msg);
    Animated.sequence([
      Animated.spring(toastY, { toValue: 0, useNativeDriver: true, friction: 6 }),
      Animated.delay(1400),
      Animated.timing(toastY, { toValue: 100, duration: 280, useNativeDriver: true }),
    ]).start(() => setToastMessage(null));
  };

  const set = (key, val) => setCustom(prev => ({ ...prev, [key]: val }));

  const toggleMap = (key, item) => setCustom(prev => {
    const map = { ...prev[key] };
    if (map[item.id]) delete map[item.id];
    else map[item.id] = item;
    return { ...prev, [key]: map };
  });

  const handleAddToCart = () => {
    if (!product || !custom || !config) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const extras     = computeExtras(custom);
    const sizeMult   = custom.size?.mult ?? 1;
    const finalPrice = Number(product.price) * sizeMult + extras;
    const options    = buildOptionsArray(custom, config);
    addItem({ ...product, price: finalPrice }, 1, options);
    showToast('Ajouté au panier ✓');
  };

  // ── Loading / Error states ──────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }
  if (error || !product || !custom || !config) {
    return (
      <View style={[styles.container, styles.center]}>
        <AlertCircle size={48} color={C.rosewood} style={{ marginBottom: 16 }} />
        <Text style={styles.errorText}>{error || 'Produit introuvable'}</Text>
        <TouchableOpacity style={styles.backBtnFallback} onPress={() => router.back()}>
          <Text style={{ color: C.bg, fontFamily: FONT.poppins, fontWeight: 'bold' }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  // (custom and config are guaranteed non-null past this point)
  const extras     = computeExtras(custom);
  const sizeMult   = custom.size?.mult ?? 1;
  const finalPrice = Number(product.price) * sizeMult + extras;
  const volume     = custom.size?.volume ?? '';

  return (
    <View style={styles.container}>

      {/* ── Product image ── */}
      <View style={styles.imgWrapper}>
        {product.image_url
          ? <Image source={{ uri: product.image_url }} style={styles.headerImage} />
          : <View style={styles.emojiFallback}><ProductImageFallback size={72} color={C.rosewood} /></View>
        }
      </View>

      {/* ── Top bar ── */}
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={C.mainText} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsFavorite(v => !v);
        }}>
          <Heart size={20} color={isFavorite ? C.rosewood : C.mainText}
            fill={isFavorite ? C.rosewood : 'transparent'} />
        </TouchableOpacity>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={styles.sheetScroll}
        contentContainerStyle={styles.bottomSheet}
        showsVerticalScrollIndicator={false}
      >
        {/* Title + tags */}
        <Text style={styles.title}>{product.name}</Text>
        <View style={styles.tagsRow}>
          {volume ? <View style={styles.tagPill}><Text style={styles.tagText}>{volume}</Text></View> : null}
          {product.temperature && (
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>{product.temperature === 'iced' ? 'Froid ❄️' : 'Chaud ☕'}</Text>
            </View>
          )}
          {product.dietary_tags?.map(t => (
            <View key={t} style={[styles.tagPill, { backgroundColor: '#6B8E23' }]}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
        </View>

        {/* Description */}
        <TouchableOpacity onPress={() => setDescExpanded(v => !v)} activeOpacity={0.8}>
          <Text style={styles.description} numberOfLines={descExpanded ? undefined : 2}>
            {product.description || "Une création signature exquise finement préparée par nos baristas."}
          </Text>
          {!descExpanded && <Text style={styles.voirPlus}>voir plus</Text>}
        </TouchableOpacity>

        {/* ── PERSONNALISATION DYNAMIQUE ── */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Personnaliser</Text>

        {/* 1. Taille */}
        {config.sizes && (
          <>
            <SectionTitle label="Taille" />
            <SizePills sizes={config.sizes} selected={custom.size} onSelect={s => set('size', s)} />
          </>
        )}

        {/* 2. Type de lait — coffee */}
        {config.milkTypes && (
          <>
            <SectionTitle label="Type de lait" />
            <RadioRow
              options={config.milkTypes}
              selected={custom.milkType}
              onSelect={v => set('milkType', v)}
              extraKey="extra"
            />
          </>
        )}

        {/* 3. Base liquide — cold */}
        {config.bases && (
          <>
            <SectionTitle label="Base" />
            <RadioRow
              options={config.bases}
              selected={custom.base}
              onSelect={v => set('base', v)}
              extraKey="extra"
            />
          </>
        )}

        {/* 4. Type de pain — food */}
        {config.breadTypes && (
          <>
            <SectionTitle label="Type de pain" />
            <RadioRow
              options={config.breadTypes}
              selected={custom.breadType}
              onSelect={v => set('breadType', v)}
              extraKey="extra"
            />
          </>
        )}

        {/* 5. Température — coffee / drink / special */}
        {config.temperatures && (
          <>
            <SectionTitle label="Température" />
            <RadioRow
              options={config.temperatures}
              selected={custom.temperature}
              onSelect={v => set('temperature', v)}
            />
          </>
        )}

        {/* 6. Sucre — coffee / drink */}
        {config.sugarLevels && (
          <>
            <SectionTitle label="Sucre" />
            <RadioRow
              options={config.sugarLevels}
              selected={custom.sugar}
              onSelect={v => set('sugar', v)}
            />
          </>
        )}

        {/* 7. Force d'infusion — drink */}
        {config.steepingTimes && (
          <>
            <SectionTitle label="Force de l'infusion" />
            <RadioRow
              options={config.steepingTimes}
              selected={custom.steeping}
              onSelect={v => set('steeping', v)}
            />
          </>
        )}

        {/* 8. Niveau de glace — cold */}
        {config.iceLevels && (
          <>
            <SectionTitle label="Niveau de glace" />
            <RadioRow
              options={config.iceLevels}
              selected={custom.iceLevel}
              onSelect={v => set('iceLevel', v)}
            />
          </>
        )}

        {/* 9. Douceur — cold */}
        {config.sweetnessLevels && (
          <>
            <SectionTitle label="Douceur" />
            <RadioRow
              options={config.sweetnessLevels}
              selected={custom.sweetness}
              onSelect={v => set('sweetness', v)}
            />
          </>
        )}

        {/* 10. Grillé — food */}
        {config.toastedOptions && (
          <>
            <SectionTitle label="Cuisson" />
            <RadioRow
              options={config.toastedOptions}
              selected={custom.toasted}
              onSelect={v => set('toasted', v)}
            />
          </>
        )}

        {/* 11. Mode de service — dessert */}
        {config.servingStyles && (
          <>
            <SectionTitle label="Service" />
            <RadioRow
              options={config.servingStyles}
              selected={custom.serving}
              onSelect={v => set('serving', v)}
            />
          </>
        )}

        {/* 12. Réchauffage — dessert */}
        {config.warmingOptions && (
          <>
            <SectionTitle label="Température" />
            <RadioRow
              options={config.warmingOptions}
              selected={custom.warming}
              onSelect={v => set('warming', v)}
            />
          </>
        )}

        {/* 13. Suppléments (checkboxes) */}
        {config.supplements?.length > 0 && (
          <>
            <SectionTitle label="Suppléments" />
            <CheckboxList
              items={config.supplements}
              selected={custom.supplements}
              onToggle={item => toggleMap('supplements', item)}
            />
          </>
        )}

        {/* 14. Sauces (checkboxes) — food */}
        {config.sauces?.length > 0 && (
          <>
            <SectionTitle label="Sauces" />
            <CheckboxList
              items={config.sauces}
              selected={custom.sauces}
              onToggle={item => toggleMap('sauces', item)}
            />
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Floating footer ── */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerPrice}>{finalPrice.toFixed(3)} DT</Text>
          {extras > 0 && (
            <Text style={styles.footerExtras}>+{extras.toFixed(3)} suppléments</Text>
          )}
        </View>
        <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
          <Text style={styles.addText}>Ajouter au panier</Text>
        </TouchableOpacity>
      </View>

      {/* ── Toast ── */}
      {toastMessage && (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateY: toastY }] }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.imgBg },
  center:    { justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

  imgWrapper:  { position: 'absolute', top: 0, width: '100%', height: height * 0.45 },
  headerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  emojiFallback: { width: '100%', height: '100%', backgroundColor: C.imgBg, justifyContent: 'center', alignItems: 'center' },

  appBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40,
    position: 'absolute', width: '100%', zIndex: 10,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6,
  },

  sheetScroll:  { marginTop: height * 0.38, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: C.bg, overflow: 'hidden' },
  bottomSheet:  { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 28 },

  title:       { fontSize: 22, fontFamily: FONT.playfair, color: C.mainText, marginBottom: 10 },
  description: { fontFamily: FONT.poppins, fontSize: 12, color: C.secondaryText, lineHeight: 18 },
  voirPlus:    { fontFamily: FONT.poppins, fontSize: 12, color: C.primary, fontWeight: '700', marginTop: 4, marginBottom: 20 },
  errorText:   { fontSize: 16, fontFamily: FONT.poppins, color: C.mainText, marginBottom: 16 },

  tagsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  tagPill:  { backgroundColor: C.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  tagText:  { fontFamily: FONT.poppins, fontSize: 10, color: '#FFF8F0' },

  sectionTitle: { fontSize: 13, fontFamily: FONT.poppins, fontWeight: '600', color: C.secondaryText, marginBottom: 10, marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Size pills
  sizeRow:     { flexDirection: 'row', gap: 10, marginBottom: 20 },
  sizePill:    { flex: 1, paddingVertical: 12, borderRadius: 20, borderWidth: 1.5, borderColor: C.rosewood, alignItems: 'center' },
  sizePillActive: { backgroundColor: C.secondaryText, borderColor: C.secondaryText },
  sizeTxt:     { fontFamily: FONT.poppins, fontSize: 14, color: C.rosewood, fontWeight: '600' },
  sizeVolume:  { fontFamily: FONT.poppins, fontSize: 10, color: C.rosewood, marginTop: 2 },
  sizeTxtActive: { color: C.bg },

  // Radio pills
  radioPill:       { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.cardBg },
  radioPillActive: { backgroundColor: C.secondaryText, borderColor: C.secondaryText },
  radioPillTxt:    { fontFamily: FONT.poppins, fontSize: 12, color: C.secondaryText },
  radioPillTxtActive: { color: C.bg, fontWeight: '600' },

  // Checkboxes
  checkList:    { gap: 12, marginBottom: 20 },
  checkboxRow:  { flexDirection: 'row', alignItems: 'center' },
  checkboxSquare: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: C.rosewood, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  checkboxSquareActive: { backgroundColor: C.secondaryText, borderColor: C.secondaryText },
  checkboxLabel:  { flex: 1, fontFamily: FONT.poppins, fontSize: 13, color: C.mainText },
  checkboxPrice:  { fontFamily: FONT.poppins, fontSize: 12, color: C.secondaryText, fontWeight: '600' },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, width: '100%',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 38 : 18,
    backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border,
    gap: 16,
  },
  footerPrice:  { fontFamily: FONT.playfair, fontSize: 20, color: C.mainText },
  footerExtras: { fontFamily: FONT.poppins, fontSize: 10, color: C.rosewood, marginTop: 1 },
  addToCartBtn: { flex: 1, backgroundColor: C.primary, paddingVertical: 15, borderRadius: 24, alignItems: 'center' },
  addText:      { color: C.bg, fontSize: 13, fontFamily: FONT.poppins, fontWeight: 'bold' },

  backBtnFallback: { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 },

  toastContainer: { position: 'absolute', bottom: 108, alignSelf: 'center', backgroundColor: C.mainText, paddingHorizontal: 22, paddingVertical: 10, borderRadius: 24, zIndex: 60, elevation: 6 },
  toastText:      { color: C.bg, fontFamily: FONT.poppins, fontSize: 12, fontWeight: 'bold' },
});
