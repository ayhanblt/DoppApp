import React, { useState } from 'react';
import { View, Text, Modal, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Send } from 'lucide-react-native';
import { dictionaries } from '@/shared/i18n/dictionaries';
import { Locale } from '@/shared/lib/types';
import { useCatalog } from '@/features/catalog/CatalogContext';

interface FeedbackModalProps {
  locale?: Locale;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ locale = "tr" }) => {
  const { feedbackOpen, setFeedbackOpen } = useCatalog();
  const t = dictionaries[locale];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [messageType, setMessageType] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !title || !messageType || !message) {
      Alert.alert("Hata", "Lütfen zorunlu alanları doldurun.");
      return;
    }

    setLoading(true);
    try {
      // In a real app we'd call the API here.
      // But we can't easily call next.js /api from mobile unless we use the full URL.
      // We'll simulate success for the sandbox.
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert("Başarılı", t.feedbackSuccess);
      setFeedbackOpen(false);
      setName("");
      setEmail("");
      setTitle("");
      setMessageType("");
      setMessage("");
    } catch (err) {
      Alert.alert("Hata", t.feedbackError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={feedbackOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setFeedbackOpen(false)}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <Pressable style={{ flex: 1 }} onPress={() => setFeedbackOpen(false)} activeOpacity={1} />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View className="bg-white rounded-t-3xl max-h-[90%] shadow-2xl">
            <View className="px-6 py-4 flex-row items-center justify-between border-b border-zinc-100">
              <Text className="text-xl font-black text-zinc-900">{t.sendFeedback}</Text>
              <Pressable onPress={() => setFeedbackOpen(false)} className="bg-zinc-100 p-2 rounded-full">
                <X size={20} color="#52525b" />
              </Pressable>
            </View>

            <ScrollView className="p-6">
              <View className="gap-4 pb-12">
                <View>
                  <Text className="text-sm font-bold text-zinc-700 mb-1">{t.nameSurnameOptional}</Text>
                  <TextInput
                    className="w-full rounded-xl border border-zinc-300 p-3 text-sm text-zinc-900"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View>
                  <Text className="text-sm font-bold text-zinc-700 mb-1">{t.emailLabel}</Text>
                  <TextInput
                    className="w-full rounded-xl border border-zinc-300 p-3 text-sm text-zinc-900"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View>
                  <Text className="text-sm font-bold text-zinc-700 mb-1">{t.titleLabel}</Text>
                  <TextInput
                    className="w-full rounded-xl border border-zinc-300 p-3 text-sm text-zinc-900"
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>

                {/* For simplicity we use a TextInput for the type, in a real app use a Picker */}
                <View>
                  <Text className="text-sm font-bold text-zinc-700 mb-1">{t.feedbackType}</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {["istek", "urun_ekleme", "sikayet", "tesekkur"].map((type) => (
                      <Pressable
                        key={type}
                        onPress={() => setMessageType(type)}
                        className={`px-3 py-2 rounded-lg border ${messageType === type ? 'bg-[#fb4824] border-[#fb4824]' : 'bg-white border-zinc-300'}`}
                      >
                        <Text className={`text-xs font-bold ${messageType === type ? 'text-white' : 'text-zinc-700'}`}>
                          {type === 'istek' && t.typeRequest}
                          {type === 'urun_ekleme' && t.typeProductRequest}
                          {type === 'sikayet' && t.typeComplaint}
                          {type === 'tesekkur' && t.typeThanks}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View>
                  <Text className="text-sm font-bold text-zinc-700 mb-1">{t.messageLabel}</Text>
                  <TextInput
                    className="w-full rounded-xl border border-zinc-300 p-3 text-sm text-zinc-900 h-24"
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <Pressable
                  disabled={loading}
                  onPress={handleSubmit}
                  className="mt-2 flex-row items-center justify-center gap-2 rounded-xl py-4 bg-[#fb4824] shadow-sm"
                  style={{ opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? (
                    <Text className="font-black text-white">{t.sending}</Text>
                  ) : (
                    <>
                      <Send size={18} color="white" />
                      <Text className="font-black text-white">{t.send}</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
