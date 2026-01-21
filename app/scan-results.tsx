/**
 * Scan Results Screen - Shows Photo AI or Barcode lookup results
 * Handles both modes: 'photo' for AI meal analysis, 'barcode' for product lookup
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';
import { Card } from '@/src/ui/Card';
import { Button } from '@/src/ui/Button';
import { QuantityStepper } from '@/src/components/QuantityStepper';
import { SuccessModal } from '@/src/components/SuccessModal';
import { useDailyTracking } from '@/src/store/DailyTrackingContext';
import { haptics } from '@/src/utils/haptics';
import { AppIcon } from '@/src/components/AppIcon';
import {
  scanService,
  FoodAIItem,
  FoodAIResponse,
  BarcodeProduct,
  BarcodeLookupResponse,
  getScanApiStatus,
} from '@/src/services/scanService';
import { logService } from '@/src/services/logService';

// Route params
type ScanResultsParams = {
  mode?: string;
  photoUri?: string;
  barcode?: string;
};

// Editable food item with quantity
interface EditableFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servings: number;
  servingSize: string;
  confidence?: number; // Only for photo AI
}

// Confidence badge component
const ConfidenceBadge: React.FC<{ confidence: number }> = ({ confidence }) => {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];

  const pct = Math.round(confidence * 100);
  let badgeColor: string = themeColors.success;
  let label = 'High';

  if (pct < 50) {
    badgeColor = themeColors.error;
    label = 'Low';
  } else if (pct < 75) {
    badgeColor = themeColors.warning;
    label = 'Medium';
  }

  return (
    <View style={[styles.confidenceBadge, { backgroundColor: `${badgeColor}20` }]}>
      <View style={[styles.confidenceDot, { backgroundColor: badgeColor }]} />
      <Text variant="caption" style={{ color: badgeColor }}>
        {label} ({pct}%)
      </Text>
    </View>
  );
};

// AI Disclaimer banner for low confidence
const AIDisclaimerBanner: React.FC<{ visible: boolean }> = ({ visible }) => {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];

  if (!visible) return null;

  return (
    <View style={[styles.disclaimerBanner, { backgroundColor: `${themeColors.warning}15` }]}>
      <AppIcon type="warning" size={20} />
      <Text variant="bodySmall" style={styles.disclaimerText}>
        Some items have low confidence. Please verify nutrition values before logging.
      </Text>
    </View>
  );
};

export default function ScanResultsScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];
  const router = useRouter();
  const params = useLocalSearchParams<ScanResultsParams>();
  const { addMeal } = useDailyTracking();

  // Determine mode
  const mode = params.mode === 'barcode' ? 'barcode' : 'photo';
  const photoUri = params.photoUri;
  const barcode = params.barcode;

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editableItems, setEditableItems] = useState<EditableFood[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(photoUri);
  const [productInfo, setProductInfo] = useState<{
    brand?: string;
    imageUrl?: string;
  } | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [successModal, setSuccessModal] = useState<{ visible: boolean; calories: number }>({
    visible: false,
    calories: 0,
  });

  // Determine meal type based on Pacific time
  const getMealType = (): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: '2-digit',
      hour12: false,
    });
    const hour = parseInt(formatter.formatToParts(new Date()).find(p => p.type === 'hour')?.value || '12', 10);
    if (hour >= 5 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 16) return 'lunch';
    if (hour >= 16 && hour < 21) return 'dinner';
    return 'snack';
  };

  // Check if any item has low confidence
  const hasLowConfidence = useMemo(() => {
    return editableItems.some((item) => item.confidence && item.confidence < 0.5);
  }, [editableItems]);

  // Calculate totals
  const totals = useMemo(() => {
    return editableItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories * item.servings,
        protein: acc.protein + item.protein * item.servings,
        carbs: acc.carbs + item.carbs * item.servings,
        fat: acc.fat + item.fat * item.servings,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [editableItems]);

  // Fetch results on mount
  useEffect(() => {
    if (mode === 'photo' && photoUri) {
      analyzePhoto(photoUri);
    } else if (mode === 'barcode' && barcode) {
      lookupBarcode(barcode);
    } else {
      setError('Invalid scan parameters');
      setIsLoading(false);
    }
  }, [mode, photoUri, barcode]);

  // Photo AI analysis
  const analyzePhoto = async (uri: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response: FoodAIResponse = await scanService.analyzePhoto(uri);

      // Check if using fallback data
      const status = getScanApiStatus();
      setIsUsingFallback(status.usingFallback);

      if (!response.success) {
        setError(response.error || 'Failed to analyze photo');
        return;
      }

      if (response.items.length === 0) {
        setError('No food items detected. Try a clearer photo.');
        return;
      }

      // Convert to editable items
      const items: EditableFood[] = response.items.map((item, idx) => ({
        id: `photo-${Date.now()}-${idx}`,
        name: item.name,
        calories: item.calories,
        protein: item.protein_g,
        carbs: item.carbs_g,
        fat: item.fat_g,
        servings: 1,
        servingSize: item.serving_size,
        confidence: item.confidence,
      }));

      setEditableItems(items);
      if (response.photo_url) {
        setPhotoUrl(response.photo_url);
      }
    } catch (err) {
      console.error('Photo analysis error:', err);
      setError('Failed to analyze photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Barcode lookup
  const lookupBarcode = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response: BarcodeLookupResponse = await scanService.lookupBarcode(code);

      // Check if using fallback data
      const status = getScanApiStatus();
      setIsUsingFallback(status.usingFallback);

      if (!response.success || !response.product) {
        setError(response.error || 'Product not found. Try manual entry.');
        return;
      }

      const product = response.product;

      // Convert to editable item
      const item: EditableFood = {
        id: `barcode-${code}`,
        name: product.name,
        calories: product.calories,
        protein: product.protein_g,
        carbs: product.carbs_g,
        fat: product.fat_g,
        servings: 1,
        servingSize: product.serving_size,
      };

      setEditableItems([item]);
      setProductInfo({
        brand: product.brand,
        imageUrl: product.image_url,
      });
    } catch (err) {
      console.error('Barcode lookup error:', err);
      setError('Failed to lookup product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update quantity for an item
  const updateQuantity = (itemId: string, servings: number) => {
    setEditableItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, servings } : item))
    );
  };

  // Remove item
  const removeItem = (itemId: string) => {
    haptics.warning();
    setEditableItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Log meal
  const handleLogMeal = async () => {
    if (editableItems.length === 0) {
      return;
    }

    setIsLogging(true);
    haptics.success();

    const mealType = getMealType();

    // Format items for API
    const logItems = editableItems.map((item) => ({
      name: item.name,
      servings: item.servings,
      calories: Math.round(item.calories * item.servings),
      protein_g: Math.round(item.protein * item.servings),
      carbs_g: Math.round(item.carbs * item.servings),
      fat_g: Math.round(item.fat * item.servings),
    }));

    // Try to log to backend
    // Backend source values: 'photo_ai' for photo scanning, 'barcode' for barcode
    const source = mode === 'photo' ? 'photo_ai' : 'barcode';
    await logService.logMeal(logItems, mealType, source);

    // Update local tracking context
    editableItems.forEach((item) => {
      addMeal({
        name: item.name,
        mealType: mealType,
        calories: Math.round(item.calories * item.servings),
        protein: Math.round(item.protein * item.servings),
        carbs: Math.round(item.carbs * item.servings),
        fats: Math.round(item.fat * item.servings),
        quantity: item.servings,
      });
    });

    setIsLogging(false);
    setSuccessModal({ visible: true, calories: Math.round(totals.calories) });
  };

  // Handle success modal close
  const handleSuccessClose = () => {
    setSuccessModal({ visible: false, calories: 0 });
    router.back();
  };

  // Retry handler
  const handleRetry = () => {
    if (mode === 'photo' && photoUri) {
      analyzePhoto(photoUri);
    } else if (mode === 'barcode' && barcode) {
      lookupBarcode(barcode);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text variant="body" color="secondary" style={styles.loadingText}>
            {mode === 'photo' ? 'Analyzing your meal...' : 'Looking up product...'}
          </Text>
        </View>
      </Screen>
    );
  }

  // Error state
  if (error) {
    return (
      <Screen>
        <View style={styles.errorContainer}>
          <AppIcon type="warning" size={48} />
          <Text variant="h4" weight="semibold" style={styles.errorTitle}>
            {mode === 'photo' ? 'Analysis Failed' : 'Lookup Failed'}
          </Text>
          <Text variant="body" color="secondary" style={styles.errorMessage}>
            {error}
          </Text>
          <View style={styles.errorActions}>
            <Button variant="outline" onPress={() => router.back()}>
              Go Back
            </Button>
            <Button variant="primary" onPress={handleRetry}>
              Try Again
            </Button>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <AppIcon type="back" size={24} />
          </TouchableOpacity>
          <Text variant="h3" weight="bold">
            {mode === 'photo' ? 'Meal Analysis' : 'Product Found'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* Photo preview (photo mode) */}
          {mode === 'photo' && photoUrl && (
            <Card variant="elevated" padding="sm" style={styles.imageCard}>
              <Image
                source={{ uri: photoUrl }}
                style={styles.previewImage}
                contentFit="cover"
              />
            </Card>
          )}

          {/* Product image (barcode mode) */}
          {mode === 'barcode' && productInfo?.imageUrl && (
            <Card variant="elevated" padding="sm" style={styles.imageCard}>
              <Image
                source={{ uri: productInfo.imageUrl }}
                style={styles.productImage}
                contentFit="contain"
              />
            </Card>
          )}

          {/* Brand info for barcode */}
          {mode === 'barcode' && productInfo?.brand && (
            <Text variant="bodySmall" color="secondary" style={styles.brandText}>
              {productInfo.brand}
            </Text>
          )}

          {/* Demo Mode Banner */}
          {isUsingFallback && (
            <View style={[styles.demoBanner, { backgroundColor: themeColors.warning + '20' }]}>
              <Text variant="bodySmall" style={{ color: themeColors.warning }}>
                Demo Mode - Using sample data
              </Text>
            </View>
          )}

          {/* AI Disclaimer banner */}
          <AIDisclaimerBanner visible={mode === 'photo' && hasLowConfidence} />

          {/* Food items */}
          <View style={styles.itemsContainer}>
            {editableItems.map((item) => (
              <Card
                key={item.id}
                variant="outlined"
                padding="md"
                style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemInfo}>
                    <Text variant="body" weight="semibold" numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text variant="caption" color="secondary">
                      {item.servingSize}
                    </Text>
                    {item.confidence !== undefined && (
                      <ConfidenceBadge confidence={item.confidence} />
                    )}
                  </View>
                  {editableItems.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeItem(item.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <AppIcon type="close" size={18} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Macros */}
                <View style={styles.macrosRow}>
                  <View style={styles.macroItem}>
                    <Text
                      variant="bodySmall"
                      weight="semibold"
                      style={{ color: themeColors.calories }}>
                      {Math.round(item.calories * item.servings)}
                    </Text>
                    <Text variant="caption" color="secondary">
                      cal
                    </Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text
                      variant="bodySmall"
                      weight="semibold"
                      style={{ color: themeColors.protein }}>
                      {Math.round(item.protein * item.servings)}g
                    </Text>
                    <Text variant="caption" color="secondary">
                      protein
                    </Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text
                      variant="bodySmall"
                      weight="semibold"
                      style={{ color: themeColors.carbs }}>
                      {Math.round(item.carbs * item.servings)}g
                    </Text>
                    <Text variant="caption" color="secondary">
                      carbs
                    </Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text
                      variant="bodySmall"
                      weight="semibold"
                      style={{ color: themeColors.fats }}>
                      {Math.round(item.fat * item.servings)}g
                    </Text>
                    <Text variant="caption" color="secondary">
                      fat
                    </Text>
                  </View>
                </View>

                {/* Quantity stepper */}
                <View style={styles.quantityRow}>
                  <Text variant="bodySmall" color="secondary">
                    Servings
                  </Text>
                  <QuantityStepper
                    value={item.servings}
                    onChange={(servings) => updateQuantity(item.id, servings)}
                    min={0.125}
                    max={10}
                    size="sm"
                  />
                </View>
              </Card>
            ))}
          </View>

          {/* Empty state */}
          {editableItems.length === 0 && (
            <View style={styles.emptyState}>
              <Text variant="body" color="secondary">
                No items to log
              </Text>
              <Button variant="outline" onPress={() => router.back()} style={styles.emptyButton}>
                Go Back
              </Button>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        {editableItems.length > 0 && (
          <View style={[styles.footer, { backgroundColor: themeColors.cardBackground }]}>
            {/* Totals */}
            <View style={styles.totalsRow}>
              <View style={styles.totalItem}>
                <Text variant="h4" weight="bold" style={{ color: themeColors.calories }}>
                  {Math.round(totals.calories)}
                </Text>
                <Text variant="caption" color="secondary">
                  calories
                </Text>
              </View>
              <View style={styles.totalDivider} />
              <View style={styles.totalItem}>
                <Text variant="body" weight="semibold" style={{ color: themeColors.protein }}>
                  {Math.round(totals.protein)}g
                </Text>
                <Text variant="caption" color="secondary">
                  protein
                </Text>
              </View>
              <View style={styles.totalDivider} />
              <View style={styles.totalItem}>
                <Text variant="body" weight="semibold" style={{ color: themeColors.carbs }}>
                  {Math.round(totals.carbs)}g
                </Text>
                <Text variant="caption" color="secondary">
                  carbs
                </Text>
              </View>
              <View style={styles.totalDivider} />
              <View style={styles.totalItem}>
                <Text variant="body" weight="semibold" style={{ color: themeColors.fats }}>
                  {Math.round(totals.fat)}g
                </Text>
                <Text variant="caption" color="secondary">
                  fat
                </Text>
              </View>
            </View>

            {/* Log button */}
            <Button
              variant="primary"
              size="lg"
              onPress={handleLogMeal}
              loading={isLogging}
              disabled={editableItems.length === 0 || isLogging}
              fullWidth>
              Log {mode === 'photo' ? 'Meal' : 'Product'}
            </Button>
          </View>
        )}

        {/* Success Modal */}
        <SuccessModal
          visible={successModal.visible}
          title="Added!"
          message={`Added ${successModal.calories} calories to your daily total.`}
          onClose={handleSuccessClose}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  headerSpacer: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  errorActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  imageCard: {
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: radius.md,
  },
  productImage: {
    width: '100%',
    height: 150,
    borderRadius: radius.md,
  },
  brandText: {
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  disclaimerText: {
    flex: 1,
  },
  demoBanner: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  itemsContainer: {
    gap: spacing.md,
  },
  itemCard: {
    gap: spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    alignItems: 'center',
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyButton: {
    marginTop: spacing.md,
  },
  footer: {
    padding: spacing.lg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    gap: spacing.md,
  },
  totalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalItem: {
    flex: 1,
    alignItems: 'center',
  },
  totalDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});
