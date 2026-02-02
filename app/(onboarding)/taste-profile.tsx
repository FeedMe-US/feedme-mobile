
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { Screen } from '@/src/ui/Screen';
import { TasteSlider } from '@/src/components/TasteSlider';
import { apiClient } from '@/src/services/api';

export default function TasteProfileScreen() {
    const colorScheme = useColorScheme();
    const themeColors = colors[colorScheme ?? 'light'];
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for the 5 sliders (-5 to 5, default 0)
    const [comfortFood, setComfortFood] = useState(0);
    const [spiceTolerance, setSpiceTolerance] = useState(0);
    const [mealStyle, setMealStyle] = useState(0);
    const [varietySeeking, setVarietySeeking] = useState(0);
    const [texturePreference, setTexturePreference] = useState(0);

    const handleContinue = async () => {
        setIsSubmitting(true);
        try {
            const payload = {
                comfort_food: comfortFood,
                spice_tolerance: spiceTolerance,
                meal_style: mealStyle,
                variety_seeking: varietySeeking,
                texture_preference: texturePreference,
            };

            console.log('[Onboarding] Submitting taste profile:', payload);

            const response = await apiClient.post('/user/onboarding/taste-profile', payload);

            if (response.error) {
                console.error('[Onboarding] Failed to save taste profile:', response.error);
                // We might choose to proceed anyway or show an alert. 
                // For onboarding flow smoothness, we often log and proceed, or show an alert.
                // Let's proceed but log it (non-blocking for MVP unless critical)
            } else {
                console.log('[Onboarding] Taste profile saved successfully');
            }

            router.push('/(onboarding)/complete');
        } catch (error) {
            console.error('[Onboarding] Error submitting taste profile:', error);
            // Proceed to complete to not block user
            router.push('/(onboarding)/complete');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Screen>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}>
                <View style={styles.container}>
                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                        activeOpacity={0.7}>
                        <MaterialIcons name="arrow-back" size={24} color={themeColors.text} />
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text variant="h1" weight="bold" style={styles.title}>
                            What are you in the mood for?
                        </Text>
                        <Text variant="body" color="secondary" style={styles.subtitle}>
                            Move the sliders to set your baseline.
                        </Text>
                    </View>

                    {/* Card Container */}
                    <View style={[styles.card, { backgroundColor: themeColors.backgroundSecondary }]}>
                        <TasteSlider
                            leftLabel="American Staples"
                            rightLabel="World Flavors"
                            value={comfortFood}
                            onValueChange={setComfortFood}
                        />

                        <TasteSlider
                            leftLabel="Keep it mild"
                            rightLabel="Actually spicy"
                            value={spiceTolerance}
                            onValueChange={setSpiceTolerance}
                        />

                        <TasteSlider
                            leftLabel="Something light"
                            rightLabel="Hearty & Filling"
                            value={mealStyle}
                            onValueChange={setMealStyle}
                        />

                        <TasteSlider
                            leftLabel="Stick to the regulars"
                            rightLabel="Try something new"
                            value={varietySeeking}
                            onValueChange={setVarietySeeking}
                        />

                        <TasteSlider
                            leftLabel="Smooth & Soft"
                            rightLabel="Properly Crunchy"
                            value={texturePreference}
                            onValueChange={setTexturePreference}
                        />
                    </View>

                </View>
            </ScrollView>

            {/* Continue Button */}
            <View style={styles.buttonContainer}>
                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onPress={handleContinue}
                    loading={isSubmitting}>
                    Continue
                </Button>
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
    },
    backButton: {
        position: 'absolute',
        top: spacing.sm,
        left: spacing.lg,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        marginBottom: spacing.xl,
        marginTop: spacing.xxl + spacing.sm,
    },
    title: {
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    subtitle: {
        marginTop: spacing.xs,
        textAlign: 'center',
    },
    card: {
        borderRadius: 20, // To match image rounded corners
        padding: spacing.lg,
        paddingTop: spacing.xl,
        gap: spacing.md,
    },
    buttonContainer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
        paddingTop: spacing.md,
        backgroundColor: 'transparent',
    },
});
