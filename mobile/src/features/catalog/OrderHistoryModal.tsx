import React, { useEffect, useState } from 'react';
import { View, Pressable, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { Text } from '@/shared/ui/Text';
import { X, History, FileText } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/shared/api/supabase';
import { dictionaries } from '@/shared/i18n/dictionaries';
import { Locale, Order } from '@/shared/lib/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useModalSwipeGesture } from '@/shared/hooks/useModalSwipeGesture';

type OrderHistoryModalProps = {
  locale: Locale;
  isOpen: boolean;
  onClose: () => void;
  onViewReceipt: (orderId: string) => void;
};

export function OrderHistoryModal({ locale, isOpen, onClose, onViewReceipt }: OrderHistoryModalProps) {
  const t = dictionaries[locale];
  const panResponder = useModalSwipeGesture(isOpen, onClose);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    
    let isMounted = true;
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const stored = await AsyncStorage.getItem("doppapp_orders");
        const localIds = stored ? JSON.parse(stored) : [];
        
        if (localIds.length > 0) {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .in('id', localIds)
            .order('created_at', { ascending: false });
            
          if (!error && data && isMounted) {
            setOrders(data);
          }
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchOrders();
    return () => { isMounted = false; };
  }, [isOpen]);

  const formatter = new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
  });

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View {...panResponder.panHandlers} className="flex-1 bg-black/50 justify-end">
        <Pressable className="flex-1" onPress={onClose} />
        
        <View className="bg-white rounded-t-3xl h-[80%] overflow-hidden">
          <SafeAreaView edges={['bottom']} className="flex-1">
            <View className="flex-row items-center justify-between p-6 border-b border-black/5">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-accent/10 rounded-full items-center justify-center">
                  <History size={20} color="#fb4824" />
                </View>
                <Text className="text-xl font-black text-zinc-900">{t.orderHistory}</Text>
              </View>
              <Pressable
                onPress={onClose}
                className="w-10 h-10 bg-zinc-100 rounded-full items-center justify-center"
              >
                <X size={20} color="#52525b" />
              </Pressable>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, gap: 16 }}>
              {loading ? (
                <View className="py-12 items-center">
                  <ActivityIndicator size="large" color="#fb4824" />
                </View>
              ) : orders.length === 0 ? (
                <View className="py-12 items-center">
                  <History size={48} color="#e4e4e7" />
                  <Text className="text-zinc-500 font-medium mt-4 text-center">
                    {t.noPastOrders}
                  </Text>
                </View>
              ) : (
                orders.map((order) => (
                  <View key={order.id} className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
                    <View className="flex-row justify-between items-start mb-3">
                      <View>
                        <Text className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">
                          {t.orderDate}
                        </Text>
                        <Text className="text-zinc-900 font-bold">
                          {new Date(order.created_at).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
                            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </Text>
                      </View>
                      <View className="bg-green-100 px-3 py-1 rounded-full">
                        <Text className="text-green-700 font-bold text-xs capitalize">{order.status}</Text>
                      </View>
                    </View>
                    
                    <View className="flex-row items-center justify-between mt-2 pt-3 border-t border-zinc-100">
                      <Text className="text-lg font-black text-accent">{formatter.format(order.total)}</Text>
                      
                      <Pressable 
                        onPress={() => onViewReceipt(order.id)}
                        className="flex-row items-center bg-zinc-100 px-4 py-2 rounded-xl"
                      >
                        <FileText size={16} color="#3f3f46" className="mr-2" />
                        <Text className="text-zinc-700 font-bold">{t.viewOrder}</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}
