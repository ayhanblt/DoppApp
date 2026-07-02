import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Image, ActivityIndicator, Share, Pressable, ScrollView } from 'react-native';
import { X, Share2, Check, Link2 } from 'lucide-react-native';
import { Locale } from '@/shared/lib/types';
import { cacheDirectory, downloadAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';

interface ReceiptShareModalProps {
  imageUrl: string;
  visible: boolean;
  onClose: () => void;
}

export function ReceiptShareModal({ imageUrl, visible, onClose }: ReceiptShareModalProps) {
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [imageRatio, setImageRatio] = useState<number>(900 / 1200);

  useEffect(() => {
    if (visible) {
      setLoading(false);
    }
  }, [visible]);

  const webUrl = process.env.EXPO_PUBLIC_WEB_URL || "https://doppapp.com";
  let shareUrl = webUrl;
  
  if (imageUrl.includes('order_id=')) {
    const orderId = imageUrl.split('order_id=')[1].split('&')[0];
    shareUrl = `${webUrl}/share?order_id=${orderId}`;
  } else if (imageUrl.includes('data=')) {
    const dataString = imageUrl.split('data=')[1];
    shareUrl = `${webUrl}/share?data=${dataString}`;
  }
  
  const shareText = "İşte benim DoppApp sepetim! Gerçek olsaydı ilk hangi ürünü alırdım dersin? #DoppApp";

  const handleNativeShare = async () => {
    try {
      setLoading(true);
      const fileUri = cacheDirectory + 'doppapp-sepetim.png';
      await downloadAsync(imageUrl, fileUri);
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/png',
          dialogTitle: 'DoppApp Sepetim',
        });
      } else {
        await Share.share({
          message: `${shareText}\n${shareUrl}`,
          title: "DoppApp Sepetim",
        });
      }
    } catch (err) {
      console.error("Error sharing:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 items-center justify-center p-4">
        <Pressable style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} onPress={onClose}  />
        
        <View className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl flex-col z-10">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Share2 size={20} color="#fb4824" />
              <Text className="text-xl font-black text-zinc-800 ml-2">Siparişi Paylaş</Text>
            </View>
            <Pressable onPress={onClose} className="p-2 bg-zinc-100 rounded-full">
              <X size={18} color="#52525b" />
            </Pressable>
          </View>

          <View className="relative mb-6 rounded-2xl overflow-hidden border border-black/10 bg-zinc-50 w-full" style={{ maxHeight: 500 }}>
            <ScrollView showsVerticalScrollIndicator={true}>
              {loading && (
                <View className="absolute z-10 w-full h-[500px] bg-zinc-200 animate-pulse" />
              )}
              <Image 
                source={{ uri: imageUrl }} 
                style={{ width: '100%', aspectRatio: imageRatio }} 
                resizeMode="contain"
                onLoad={(e) => {
                  setLoading(false);
                  if (e.nativeEvent.source.width && e.nativeEvent.source.height) {
                    setImageRatio(e.nativeEvent.source.width / e.nativeEvent.source.height);
                  }
                }}
              />
            </ScrollView>
          </View>

          <View className="flex-row gap-2 mb-3">
            <Pressable
              onPress={handleNativeShare}
              className="flex-1 flex-row items-center justify-center bg-accent py-4 rounded-xl"
              disabled={loading}
            >
              <Share2 size={18} color="white" className="mr-2" />
              <Text className="text-white font-bold">Paylaş</Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                await Clipboard.setStringAsync(shareUrl);
                setCopiedLink(true);
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
