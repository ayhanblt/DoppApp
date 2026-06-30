import React, { useState } from 'react';
import { View, Text, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Send, CheckCircle2, AlertCircle } from 'lucide-react-native';
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
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'validation'>('idle');
  
  const webUrl = process.env.EXPO_PUBLIC_WEB_URL || "https://doppapp.com";

  const resetForm = () => {
    setStatus('idle');
    setName("");
    setEmail("");
    setTitle("");
    setMessageType("");
    setMessage("");
  };

  const handleClose = () => {
    setFeedbackOpen(false);
    setTimeout(resetForm, 300); // Reset after modal hide animation
  };

  const handleSubmit = async () => {
    if (!email || !title || !messageType || !message) {
      setStatus('validation');
      return;
    }

    setLoading(true);
    setStatus('idle');
    
    try {
      const response = await fetch(`${webUrl}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          title,
          message_type: messageType,
          message
        })
      });

      if (!response.ok) {
        throw new Error('API Error');
      }
      
      setStatus('success');
    } catch (err) {
      console.error('Feedback API error:', err);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={feedbackOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View className="flex-1 bg-black/50 justify-end">
          <Pressable style={{ flex: 1 }} onPress={handleClose}  />

          <View className="bg-white rounded-t-3xl max-h-[90%] shadow-2xl">
            <View className="px-6 py-4 flex-row items-center justify-between border-b border-zinc-100">
              <Text className="text-xl font-black text-zinc-900">{t.sendFeedback}</Text>
              <Pressable onPress={handleClose} className="bg-zinc-100 p-2 rounded-full">
                <X size={20} color="#52525b" />
              </Pressable>
            </View>

            {status === 'success' ? (
              <View className="p-8 items-center justify-center py-20">
                <View className="w-20 h-20 bg-emerald-100 rounded-full items-center justify-center mb-6">
                  <CheckCircle2 size={40} color="#059669" />
                </View>
                <Text className="text-2xl font-black text-zinc-900 text-center mb-2">{t.feedbackSuccess}</Text>
                <Text className="text-zinc-500 text-center mb-8">Geri bildiriminiz başarıyla iletildi.</Text>
                <Pressable onPress={handleClose} className="bg-zinc-900 px-8 py-3.5 rounded-xl w-full items-center">
                  <Text className="text-white font-bold text-lg">Kapat</Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView className="p-6">
                <View className="gap-4 pb-12">
                  {status === 'validation' && (
                    <View className="bg-red-50 p-4 rounded-xl flex-row items-center gap-3 border border-red-100">
                      <AlertCircle size={20} color="#ef4444" />
                      <Text className="text-red-600 font-bold flex-1">Lütfen zorunlu alanları (*) doldurun.</Text>
                    </View>
                  )}
                  
                  {status === 'error' && (
                    <View className="bg-red-50 p-4 rounded-xl flex-row items-center gap-3 border border-red-100">
                      <AlertCircle size={20} color="#ef4444" />
                      <Text className="text-red-600 font-bold flex-1">{t.feedbackError}</Text>
                    </View>
                  )}

                  <View>
                    <Text className="text-sm font-bold text-zinc-700 mb-1">{t.nameSurnameOptional}</Text>
                    <TextInput
                      className="w-full rounded-xl border border-zinc-300 p-3 text-sm text-zinc-900"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>

                  <View>
                    <Text className="text-sm font-bold text-zinc-700 mb-1">{t.emailLabel} *</Text>
                    <TextInput
                      className={`w-full rounded-xl border p-3 text-sm text-zinc-900 ${status === 'validation' && !email ? 'border-red-400 bg-red-50' : 'border-zinc-300'}`}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View>
                    <Text className="text-sm font-bold text-zinc-700 mb-1">{t.titleLabel} *</Text>
                    <TextInput
                      className={`w-full rounded-xl border p-3 text-sm text-zinc-900 ${status === 'validation' && !title ? 'border-red-400 bg-red-50' : 'border-zinc-300'}`}
                      value={title}
                      onChangeText={setTitle}
                    />
                  </View>

                  <View>
                    <Text className="text-sm font-bold text-zinc-700 mb-1">{t.feedbackType} *</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {["istek", "urun_ekleme", "sikayet", "tesekkur"].map((type) => (
                        <Pressable
                          key={type}
                          onPress={() => setMessageType(type)}
                          className={`px-3 py-2 rounded-lg border ${messageType === type ? 'bg-[#fb4824] border-[#fb4824]' : status === 'validation' && !messageType ? 'bg-red-50 border-red-300' : 'bg-white border-zinc-300'}`}
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
                    <Text className="text-sm font-bold text-zinc-700 mb-1">{t.messageLabel} *</Text>
                    <TextInput
                      className={`w-full rounded-xl border p-3 text-sm text-zinc-900 h-24 ${status === 'validation' && !message ? 'border-red-400 bg-red-50' : 'border-zinc-300'}`}
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
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
