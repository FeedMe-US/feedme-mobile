
import React, { useRef, useState, useMemo } from 'react';
import { View, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { haptics } from '@/src/utils/haptics';

interface TasteSliderProps {
    leftLabel: string;
    rightLabel: string;
    value: number; // -5 to 5
    onValueChange: (value: number) => void;
}

const MIN_VALUE = -5;
const MAX_VALUE = 5;
const RANGE = MAX_VALUE - MIN_VALUE; // 10

export function TasteSlider({
    leftLabel,
    rightLabel,
    value,
    onValueChange,
}: TasteSliderProps) {
    const colorScheme = useColorScheme();
    const themeColors = colors[colorScheme ?? 'light'];

    const [sliderWidth, setSliderWidth] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const sliderWidthRef = useRef(0);

    const onLayout = (event: LayoutChangeEvent) => {
        const width = event.nativeEvent.layout.width;
        setSliderWidth(width);
        sliderWidthRef.current = width;
    };

    const updateValueFromGesture = (gestureX: number) => {
        if (sliderWidthRef.current <= 0) return;

        // Clamp x position
        const x = Math.max(0, Math.min(gestureX, sliderWidthRef.current));

        // Calculate percentage (0 to 1)
        const percentage = x / sliderWidthRef.current;

        // Map to range MIN_VALUE to MAX_VALUE
        const rawValue = MIN_VALUE + (percentage * RANGE);

        // Snap to nearest integer
        const snappedValue = Math.round(rawValue);

        // Only update if changed
        if (snappedValue !== value) {
            onValueChange(snappedValue);
            haptics.selection(); // Light feedback on step change
        }
    };

    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: () => true,
                onPanResponderGrant: (evt) => {
                    setIsDragging(true);
                    updateValueFromGesture(evt.nativeEvent.locationX);
                },
                onPanResponderMove: (evt) => {
                    updateValueFromGesture(evt.nativeEvent.locationX);
                },
                onPanResponderRelease: () => {
                    setIsDragging(false);
                },
                onPanResponderTerminate: () => {
                    setIsDragging(false);
                },
            }),
        [value, onValueChange] // Re-create if these change, though usually only onValueChange matters
    );

    // Calculate thumb position percentage for rendering
    // Map value (-5 to 5) back to 0-100%
    const percentage = ((value - MIN_VALUE) / RANGE) * 100;

    return (
        <View style={styles.container}>
            {/* Labels Row */}
            <View style={styles.labelsContainer}>
                <Text variant="bodySmall" weight="medium" style={styles.labelLeft}>
                    {leftLabel}
                </Text>
                <Text variant="bodySmall" weight="medium" style={styles.labelRight}>
                    {rightLabel}
                </Text>
            </View>

            {/* Slider Track Area */}
            <View
                style={styles.touchArea}
                onLayout={onLayout}
                {...panResponder.panHandlers}
            >
                {/* Track Line */}
                <View style={[styles.track, { backgroundColor: themeColors.border }]}>
                    {/* Filled part (optional, or just centered thumb style) */}
                    {/* Design shows a solid track, thumb determines value. No fill needed usually for bipolar sliders unless from center. */}
                    {/* Let's stick to simple full track background for now matching the image which seems to be a single gray bar */}
                </View>

                {/* Thumb */}
                <View
                    style={[
                        styles.thumb,
                        {
                            backgroundColor: themeColors.primary,
                            left: `${percentage}%`,
                            transform: [
                                { translateX: -12 }, // Center thumb (width/2)
                                { scale: isDragging ? 1.2 : 1 }
                            ],
                        },
                    ]}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
    },
    labelsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    labelLeft: {
        flex: 1,
        textAlign: 'left',
    },
    labelRight: {
        flex: 1,
        textAlign: 'right',
    },
    touchArea: {
        height: 40, // Tall enough for touch
        justifyContent: 'center',
    },
    track: {
        height: 6,
        borderRadius: 3,
        width: '100%',
    },
    thumb: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#FFFFFF', // White border for contrast
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
});
