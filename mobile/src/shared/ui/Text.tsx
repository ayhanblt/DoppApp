import React from 'react';
import { Text as RNText, TextProps, Platform, StyleSheet } from 'react-native';
import { cssInterop } from 'nativewind';

function BaseText(props: TextProps) {
  const flattened = StyleSheet.flatten(props.style);
  const hasFontFamily = !!flattened?.fontFamily;

  return (
    <RNText
      allowFontScaling={true}
      maxFontSizeMultiplier={1.3}
      {...props}
      style={[
        !hasFontFamily
          ? { fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System' }
          : null,
        !hasFontFamily ? { fontFamily: 'Geist-Regular' } : null,
        Platform.OS === 'android' ? { includeFontPadding: false } : null,
        props.style,
      ]}
    />
  );
}

cssInterop(BaseText, {
  className: 'style',
});

export { BaseText as Text };

