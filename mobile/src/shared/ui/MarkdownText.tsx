import React from 'react';
import { View, Text } from 'react-native';

interface MarkdownTextProps {
  content: string;
  style?: any;
}

export const MarkdownText: React.FC<MarkdownTextProps> = ({ content, style }) => {
  if (!content) return null;

  // Split by line breaks to check for list items
  const lines = content.split('\n');

  const renderTextWithFormatting = (text: string, keyPrefix: string) => {
    // Split by **bold** text format
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const cleanText = part.slice(2, -2);
        return (
          <Text key={`${keyPrefix}-${index}`} style={{ fontWeight: 'bold' }}>
            {cleanText}
          </Text>
        );
      }
      return <Text key={`${keyPrefix}-${index}`}>{part}</Text>;
    });
  };

  return (
    <View style={style}>
      {lines.map((line, lineIndex) => {
        const trimmed = line.trim();
        if (trimmed === '') return null;
        
        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
        if (isBullet) {
          const cleanLine = trimmed.replace(/^[-*]\s+/, '');
          return (
            <View key={lineIndex} style={{ flexDirection: 'row', alignItems: 'flex-start', marginVertical: 1, paddingLeft: 4 }}>
              <Text style={{ marginRight: 6, fontSize: 13, color: '#52525b' }}>•</Text>
              <Text style={{ flex: 1, fontSize: 13, color: '#52525b', lineHeight: 18 }}>
                {renderTextWithFormatting(cleanLine, `bullet-${lineIndex}`)}
              </Text>
            </View>
          );
        }

        return (
          <Text key={lineIndex} style={{ fontSize: 13, color: '#52525b', lineHeight: 18, marginVertical: 1 }}>
            {renderTextWithFormatting(line, `line-${lineIndex}`)}
          </Text>
        );
      })}
    </View>
  );
};
