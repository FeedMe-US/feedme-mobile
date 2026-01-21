/**
 * Camera Screen - Dual mode for photo AI and barcode scanning
 * Mode: 'photo' for AI meal analysis, 'barcode' for product scanning
 */

import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { Image } from 'expo-image';
import {
  CameraView,
  CameraType,
  useCameraPermissions,
  BarcodeScanningResult,
} from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { haptics } from '@/src/utils/haptics';
import { AppIcon } from '@/src/components/AppIcon';

// Mode types
type CameraMode = 'photo' | 'barcode';

type CameraParams = {
  mode?: string;
};

export default function CameraScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];
  const router = useRouter();
  const params = useLocalSearchParams<CameraParams>();

  // Determine mode from params (default to photo)
  const mode: CameraMode = params.mode === 'barcode' ? 'barcode' : 'photo';

  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true); // For barcode mode
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Screen>
        <View style={styles.container}>
          <Text variant="h3" weight="bold" style={styles.message}>
            Camera permission required
          </Text>
          <Text variant="body" color="secondary" style={styles.message}>
            {mode === 'barcode'
              ? 'We need access to your camera to scan barcodes'
              : 'We need access to your camera to scan meals'}
          </Text>
          <Button onPress={requestPermission} style={styles.button}>
            Grant Permission
          </Button>
        </View>
      </Screen>
    );
  }

  // Photo mode: take picture
  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      haptics.medium();
      const photo = await cameraRef.current.takePictureAsync();
      if (photo?.uri) {
        setPhotoUri(photo.uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const handleUsePhoto = () => {
    if (photoUri) {
      haptics.success();
      router.push({
        pathname: '/scan-results',
        params: { photoUri, mode: 'photo' },
      });
    }
  };

  const handleRetake = () => {
    haptics.light();
    setPhotoUri(null);
  };

  // Barcode mode: handle scanned barcode
  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (!isScanning || scannedBarcode) return;

    const barcode = result.data;
    if (barcode && barcode.length >= 8) {
      setIsScanning(false);
      setScannedBarcode(barcode);
      haptics.success();

      // Navigate to scan-results with barcode
      router.push({
        pathname: '/scan-results',
        params: { barcode, mode: 'barcode' },
      });
    }
  };

  // Reset barcode scanning
  const handleScanAgain = () => {
    haptics.light();
    setScannedBarcode(null);
    setIsScanning(true);
  };

  if (photoUri) {
    return (
      <Screen>
        <View style={styles.previewContainer}>
          {/* Top bar with close */}
          <View style={styles.previewTopBar}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}>
              <AppIcon type="close" size={20} />
            </TouchableOpacity>
            <Text variant="h4" weight="bold" style={styles.previewTitle}>
              Preview
            </Text>
            <View style={styles.topSpacer} />
          </View>

          {/* Image preview */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: photoUri }}
              style={styles.previewImage}
              contentFit="cover"
            />
          </View>

          {/* Bottom actions */}
          <View style={styles.previewActions}>
            <Button variant="outline" onPress={handleRetake} style={styles.actionButton}>
              Retake
            </Button>
            <Button variant="primary" onPress={handleUsePhoto} style={styles.actionButton}>
              Use Photo
            </Button>
          </View>
        </View>
      </Screen>
    );
  }

  // Render barcode mode
  if (mode === 'barcode') {
    return (
      <Screen>
        <View style={styles.container}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={facing}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
            }}
            onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
          />
          {/* Overlay rendered as sibling with absolute positioning */}
          <View style={styles.overlay} pointerEvents="box-none">
            {/* Top bar */}
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => router.back()}>
                <AppIcon type="close" size={20} />
              </TouchableOpacity>
              <Text variant="h4" weight="bold" style={styles.modeTitle}>
                Scan Barcode
              </Text>
              <View style={styles.topSpacer} />
            </View>

            {/* Center scanning area */}
            <View style={styles.scanArea} pointerEvents="none">
              <View style={styles.scanFrame}>
                <View style={[styles.scanCorner, styles.scanCornerTL]} />
                <View style={[styles.scanCorner, styles.scanCornerTR]} />
                <View style={[styles.scanCorner, styles.scanCornerBL]} />
                <View style={[styles.scanCorner, styles.scanCornerBR]} />
              </View>
              <Text variant="body" style={styles.scanHint}>
                {scannedBarcode
                  ? `Scanned: ${scannedBarcode}`
                  : 'Position barcode within frame'}
              </Text>
            </View>

            {/* Bottom controls */}
            <View style={styles.bottomControls}>
              {scannedBarcode ? (
                <Button
                  variant="outline"
                  onPress={handleScanAgain}
                  style={styles.rescanButton}>
                  Scan Another
                </Button>
              ) : (
                <>
                  <Text variant="caption" style={styles.scanningText}>
                    Scanning...
                  </Text>
                  <Button
                    variant="outline"
                    onPress={() => router.back()}
                    style={styles.cancelButton}>
                    Cancel
                  </Button>
                </>
              )}
            </View>
          </View>
        </View>
      </Screen>
    );
  }

  // Render photo mode (default)
  return (
    <Screen>
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
        />
        {/* Overlay rendered as sibling with absolute positioning */}
        <View style={styles.overlay} pointerEvents="box-none">
          {/* Top bar with close button */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}>
              <AppIcon type="close" size={20} />
            </TouchableOpacity>
            <Text variant="h4" weight="bold" style={styles.modeTitle}>
              Scan Meal
            </Text>
            <View style={styles.topSpacer} />
          </View>

          {/* Center hint */}
          <View style={styles.photoHintContainer} pointerEvents="none">
            <Text variant="body" style={styles.photoHint}>
              Take a photo of your meal for AI analysis
            </Text>
          </View>

          {/* Bottom controls */}
          <View style={styles.bottomControls}>
            <View style={styles.controlsRow}>
              <TouchableOpacity
                style={styles.flipButton}
                onPress={() => {
                  setFacing(facing === 'back' ? 'front' : 'back');
                  haptics.light();
                }}>
                <AppIcon type="flip-camera" size={24} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.shutterButton} onPress={takePicture}>
                <View style={styles.shutterInner} />
              </TouchableOpacity>

              <View style={styles.placeholder} />
            </View>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  topSpacer: {
    width: 44,
  },
  modeTitle: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: spacing.xxl + 20,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  placeholder: {
    width: 50,
    height: 50,
  },
  // Photo mode hints
  photoHintContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoHint: {
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    textAlign: 'center',
  },
  // Barcode mode styles
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 280,
    height: 150,
    position: 'relative',
  },
  scanCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FFFFFF',
  },
  scanCornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  scanCornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  scanCornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  scanCornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  scanHint: {
    color: '#FFFFFF',
    marginTop: spacing.lg,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  scanningText: {
    color: '#FFFFFF',
    opacity: 0.7,
  },
  rescanButton: {
    minWidth: 150,
  },
  cancelButton: {
    marginTop: spacing.md,
    minWidth: 150,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  previewTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  previewTitle: {
    color: '#FFFFFF',
  },
  imageContainer: {
    flex: 1,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  actionButton: {
    flex: 1,
  },
  message: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.lg,
  },
});

