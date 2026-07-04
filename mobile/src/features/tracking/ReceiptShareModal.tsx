import React, { useState, useEffect, useMemo } from 'react';
import { View, Modal, Image, ActivityIndicator, Share, Pressable, ScrollView } from 'react-native';
import { Text } from '@/shared/ui/Text';
import { X, Share2, Check, Link2 } from 'lucide-react-native';
import { cacheDirectory, downloadAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { Locale } from '@/shared/lib/types';
import { dictionaries } from '@/shared/i18n/dictionaries';

interface ReceiptShareModalProps {
  imageUrl: string;
  visible: boolean;
  onClose: () => void;
  locale: Locale;
}

export function ReceiptShareModal({ imageUrl, visible, onClose, locale }: ReceiptShareModalProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [imageRatio, setImageRatio] = useState<number>(900 / 1200);

  useEffect(() => {
    if (visible) {
      setIsImageLoading(true);
      setIsSharing(false);
      setCopiedLink(false);
    }
  }, [visible, imageUrl]);

  const t = dictionaries[locale];

  const webUrl = (process.env.EXPO_PUBLIC_WEB_URL || "https://doppapp.com").trim();
  let shareUrl = webUrl.startsWith("http") ? webUrl : `https://${webUrl}`;

  // Ensure the image URL has a protocol, otherwise Image component fails silently
  let validImageUrl = imageUrl.trim();
  if (validImageUrl && !validImageUrl.startsWith('http')) {
    validImageUrl = `${webUrl}${validImageUrl.startsWith('/') ? '' : '/'}${validImageUrl}`;
  }
  console.log('imageUrl', imageUrl)
  console.log('webUrl', webUrl)
  console.log('shareUrl', shareUrl)
  // Cache buster: React Native Image componenti URL bazlı agresif cache yapar.
  // Performans testi için her açılışta taze istek atmasını sağlamak adına useMemo ile timestamp ekliyoruz.
  // Sadece imageUrl veya görünürlük değiştiğinde yeni timestamp üretiriz, böylece state güncellemeleri (ör. loading bitişi) ikinci kez istek attırmaz.
  const cacheBuster = useMemo(() => Date.now(), [imageUrl, visible]);

  if (validImageUrl) {
    validImageUrl += (validImageUrl.includes('?') ? '&' : '?') + `_t=${cacheBuster}`;
  }

  if (imageUrl.includes('order_id=')) {
    const orderId = imageUrl.split('order_id=')[1].split('&')[0];
    shareUrl = `${webUrl}/share?order_id=${orderId}`;
  } else if (imageUrl.includes('data=')) {
    const dataString = imageUrl.split('data=')[1];
    shareUrl = `${webUrl}/share?data=${dataString}`;
  }


  const handleNativeShare = async () => {
    try {
      setIsSharing(true);
      const fileUri = cacheDirectory + 'doppapp-sepetim.png';
      await downloadAsync(validImageUrl, fileUri);

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/png',
          dialogTitle: 'Siparişini Paylaş',
          UTI: 'public.png'
        });
      } else {
        Toast.show({
          type: 'error',
          text1: t.shareError,
          text2: t.shareErrorDesc,
          position: 'bottom',
        });
      }
    } catch (err) {
      console.error("Error sharing:", err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 items-center justify-center p-4">
        <Pressable style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} onPress={onClose} />

        <View className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl flex-col z-10">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Share2 size={20} color="#fb4824" />
              <Text className="text-xl font-black text-zinc-800 ml-2">{t.shareReceipt}</Text>
            </View>
            <Pressable onPress={onClose} className="p-2 bg-zinc-100 rounded-full">
              <X size={18} color="#52525b" />
            </Pressable>
          </View>

          <View className="relative mb-6 rounded-2xl overflow-hidden border border-black/10 bg-zinc-50 w-full" style={{ maxHeight: 500 }}>
            <ScrollView showsVerticalScrollIndicator={true}>
              {isImageLoading && (
                <View className="absolute z-10 w-full h-[500px] bg-zinc-200 animate-pulse" />
              )}
              <Image
                source={{ uri: validImageUrl }}
                style={{ width: '100%', aspectRatio: imageRatio }}
                resizeMode="contain"
                onLoad={(e) => {
                  setIsImageLoading(false);
                  if (e.nativeEvent.source.width && e.nativeEvent.source.height) {
                    setImageRatio(e.nativeEvent.source.width / e.nativeEvent.source.height);
                  }
                }}
                onError={(e) => {
                  console.error("Receipt Image Load Error:", e.nativeEvent.error || e.nativeEvent);
                  setIsImageLoading(false);
                }}
              />
            </ScrollView>
          </View>

          <View className="flex-row gap-2 mb-3">
            <Pressable
              onPress={handleNativeShare}
              disabled={isSharing || isImageLoading}
              className="flex-1 bg-accent py-4 rounded-xl flex-row items-center justify-center disabled:opacity-50"
            >
              {isSharing ? (
                <Text className="text-white font-bold text-lg flex-shrink-1" numberOfLines={1}>{t.submitting}</Text>
              ) : (
                <>
                  <Share2 size={20} color="#ffffff" className="mr-2" />
                  <Text className="text-white font-bold text-lg flex-shrink-1" numberOfLines={1}>{t.shareReceipt}</Text>
                </>
              )}
            </Pressable>
            <Pressable
              onPress={async () => {
                await Clipboard.setStringAsync(shareUrl);
                setCopiedLink(true);
                Toast.show({
                  type: 'success',
                  text1: t.copied,
                  text2: t.linkCopiedDesc,
                  position: 'bottom',
                });
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="h-[54px] w-[54px] items-center justify-center bg-zinc-100 rounded-xl border border-zinc-200"
            >
              {copiedLink ? <Check size={20} color="#10b981" /> : <Link2 size={20} color="#52525b" />}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
