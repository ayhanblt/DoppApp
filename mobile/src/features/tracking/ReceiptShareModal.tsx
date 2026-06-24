import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Image, ActivityIndicator, Share, Pressable } from 'react-native';
import { X, Share2 } from 'lucide-react-native';
import { Locale } from '@/shared/lib/types';
import { supabase } from '@/shared/api/supabase';

interface ReceiptShareModalProps {
  locale: Locale;
  imageUrl: string;
  visible: boolean;
  onClose: () => void;
}

export function ReceiptShareModal({ locale, imageUrl, visible, onClose }: ReceiptShareModalProps) {
  const [shortId, setShortId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    
    const saveReceipt = async () => {
      const dataString = imageUrl.split('data=')[1] || "";
      if (!dataString) {
        setLoading(false);
        return;
      }
      
      try {
        const dataObj = JSON.parse(decodeURIComponent(dataString));
        const { data, error } = await supabase.from('shared_receipts').insert({ data: dataObj }).select('id').single();
        if (data?.id) {
          setShortId(data.id);
        }
      } catch (err) {
        console.error("Failed to generate short ID:", err);
      } finally {
        setLoading(false);
      }
    };
    
    saveReceipt();
  }, [imageUrl, visible]);

  const dataString = imageUrl.split('data=')[1] || "";
  const webUrl = process.env.EXPO_PUBLIC_WEB_URL || "https://doppapp.com";
  const shareUrl = shortId ? `${webUrl}/share?id=${shortId}` : `${webUrl}/share?data=${dataString}`;
  const shareText = "İşte benim DoppApp sepetim! Gerçek olsaydı ilk hangi ürünü alırdım dersin? #DoppApp";

  const handleNativeShare = async () => {
    try {
      await Share.share({
        message: `${shareText}\n${shareUrl}`,
        title: "DoppApp Sepetim",
      });
    } catch (err) {
      console.error("Error sharing:", err);
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

          <View className="relative mb-6 rounded-2xl overflow-hidden border border-black/10 bg-zinc-50 flex items-center justify-center">
            {loading && (
              <View className="absolute z-10">
                <ActivityIndicator size="large" color="#fb4824" />
              </View>
            )}
            <Image 
              source={{ uri: imageUrl }} 
              style={{ width: '100%', aspectRatio: 1200 / 900 }} 
              resizeMode="contain"
              onLoad={() => setLoading(false)}
            />
          </View>

          <Pressable
            onPress={handleNativeShare}
            className="w-full flex-row items-center justify-center bg-zinc-100 py-4 rounded-xl mb-3"
            disabled={loading}
          >
            <Share2 size={18} color="#3f3f46" className="mr-2" />
            <Text className="text-zinc-800 font-bold">Paylaş</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
