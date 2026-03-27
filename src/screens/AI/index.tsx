import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../theme/ThemeContext';
import { getSoilRecommendation, chatWithAI } from '../../services/groq';

const AIScreen: React.FC = () => {
  const { sensorData, selectedPlant, chatMessages, addChatMessage, setChatMessages, soilRecommendations, addSoilRecommendation } = useApp();
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'chat' | 'soil'>('chat');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPot, setSelectedPot] = useState(1);
  const scrollViewRef = useRef<ScrollView>(null);

  const chatMessagesArray = chatMessages || [];
  const soilRecommendationsArray = soilRecommendations || [];

  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat History',
      'Are you sure you want to clear all chat messages? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            setChatMessages([]);
          },
        },
      ]
    );
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    
    const userMessage = { id: Date.now().toString(), role: 'user' as const, content: inputText.trim(), timestamp: Date.now() };
    addChatMessage(userMessage);
    setInputText('');
    setIsLoading(true);

    try {
      const messages = (chatMessages || []).map((msg) => ({ role: msg.role, content: msg.content }));
      messages.push({ role: 'user', content: userMessage.content });

      const response = await chatWithAI(messages, { sensorData: sensorData || undefined, plant: selectedPlant });

      const assistantMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant' as const, 
        content: response, 
        timestamp: Date.now() 
      };
      addChatMessage(assistantMessage);
    } catch (error) {
      const errorMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant' as const, 
        content: 'Sorry, I encountered an error. Please try again.', 
        timestamp: Date.now() 
      };
      addChatMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }

    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleGetSoilRecommendation = async () => {
    if (!sensorData || isLoading) return;
    setIsLoading(true);
    
    try {
      const soilMoisture = sensorData.soilMoisture[`pot${selectedPot}` as keyof typeof sensorData.soilMoisture] as number;

      const recommendation = await getSoilRecommendation({
        potNumber: selectedPot,
        soilMoisture,
        plant: selectedPlant,
        temperature: sensorData.temperature,
        humidity: sensorData.humidity,
      });

      const newRecommendation = {
        id: Date.now().toString(),
        potNumber: selectedPot,
        recommendation,
        timestamp: Date.now(),
      };
      addSoilRecommendation(newRecommendation);
    } catch (error) {
      alert('Failed to get recommendation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    'Is my plant healthy?',
    'Optimize growing conditions',
    'When should I water?',
    'What nutrients does my plant need?',
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Tab Selector */}
      <View style={[styles.tabContainer, { backgroundColor: colors.cardBackground }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chat' && { backgroundColor: colors.primaryLight }]}
          onPress={() => setActiveTab('chat')}
        >
          <LinearGradient
            colors={activeTab === 'chat' ? ['#4CAF50', '#8BC34A'] : ['#E0E0E0', '#E0E0E0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.tabIcon, activeTab !== 'chat' && { opacity: 0 }]}
          >
            <Ionicons name="chatbubble" size={18} color="#fff" />
          </LinearGradient>
          {activeTab !== 'chat' && <Ionicons name="chatbubble-outline" size={22} color={colors.textSecondary} />}
          <Text style={[styles.tabText, { color: activeTab === 'chat' ? colors.primary : colors.textSecondary }]}>
            AI Chat
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'soil' && { backgroundColor: colors.primaryLight }]}
          onPress={() => setActiveTab('soil')}
        >
          <LinearGradient
            colors={activeTab === 'soil' ? ['#4CAF50', '#8BC34A'] : ['#E0E0E0', '#E0E0E0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.tabIcon, activeTab !== 'soil' && { opacity: 0 }]}
          >
            <Ionicons name="leaf" size={18} color="#fff" />
          </LinearGradient>
          {activeTab !== 'soil' && <Ionicons name="leaf-outline" size={22} color={colors.textSecondary} />}
          <Text style={[styles.tabText, { color: activeTab === 'soil' ? colors.primary : colors.textSecondary }]}>
            Soil Analysis
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'chat' ? (
        <>
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatContainer}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
          >
            {chatMessagesArray.length > 0 ? (
              chatMessagesArray.map((message: any) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubble,
                    message.role === 'user'
                      ? [styles.messageBubbleUser, { backgroundColor: colors.primary }]
                      : [styles.messageBubbleAssistant, { backgroundColor: colors.cardBackground, borderColor: colors.border }],
                  ]}
                >
                  <Text style={[styles.messageText, { color: message.role === 'user' ? '#fff' : colors.text }]}>
                    {message.content}
                  </Text>
                  <Text style={[styles.messageTime, { color: message.role === 'user' ? 'rgba(255,255,255,0.7)' : colors.textMuted }]}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              ))
            ) : (
              <View style={[styles.emptyState, { backgroundColor: colors.cardBackground }]}>
                <LinearGradient
                  colors={['#E0E0E0', '#D0D0D0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyStateIcon}
                >
                  <Ionicons name="chatbubbles-outline" size={40} color={colors.textMuted} />
                </LinearGradient>
                <Text style={[styles.emptyStateTitle, { color: colors.text }]}>Start a Conversation</Text>
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  Ask anything about your greenhouse or plant care!
                </Text>

                <View style={styles.quickActions}>
                  {quickActions.map((action, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.quickAction, { borderColor: colors.primary }]}
                      onPress={() => setInputText(action)}
                    >
                      <Text style={[styles.quickActionText, { color: colors.primary }]}>{action}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            {isLoading && (
              <View style={[styles.messageBubble, styles.messageBubbleAssistant, { backgroundColor: colors.cardBackground }]}>
                <LinearGradient
                  colors={['#4CAF50', '#8BC34A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.typingIndicator}
                >
                  <ActivityIndicator size="small" color="#fff" />
                </LinearGradient>
                <Text style={[styles.messageText, { color: colors.text }]}>Thinking...</Text>
              </View>
            )}
          </ScrollView>

          <View style={[styles.inputContainer, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.clearButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={handleClearChat}
              disabled={chatMessagesArray.length === 0}
            >
              <Ionicons name="trash-outline" size={20} color={chatMessagesArray.length === 0 ? colors.textMuted : (isDark ? '#888' : colors.textSecondary)} />
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
              placeholder="Ask me anything..."
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: inputText.trim() ? colors.primary : colors.border }]}
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
            >
              <LinearGradient
                colors={inputText.trim() ? ['#4CAF50', '#8BC34A'] : [colors.border, colors.border]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="send" size={20} color={inputText.trim() ? '#fff' : colors.textMuted} />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <ScrollView style={styles.soilContainer} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={['#11998e', '#38ef7d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.soilCard}
          >
            <Text style={styles.soilCardTitle}>Soil Recommendation</Text>
            <Text style={styles.soilCardSubtitle}>Get AI-powered soil analysis based on current conditions</Text>

            <View style={styles.potSelector}>
              <Text style={styles.potSelectorLabel}>Select Pot:</Text>
              <View style={styles.potButtons}>
                {[1, 2, 3].map((pot) => (
                  <TouchableOpacity
                    key={pot}
                    style={[
                      styles.potButton,
                      { backgroundColor: selectedPot === pot ? '#fff' : 'rgba(255,255,255,0.2)', borderColor: selectedPot === pot ? '#fff' : 'transparent' },
                    ]}
                    onPress={() => setSelectedPot(pot)}
                  >
                    <Text style={[styles.potButtonText, { color: selectedPot === pot ? colors.primary : '#fff' }]}>
                      Pot {pot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {sensorData && (
              <View style={styles.currentReading}>
                <Text style={styles.readingLabel}>Current Soil Moisture:</Text>
                <LinearGradient
                  colors={['#4CAF50', '#66BB6A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.readingValueBg}
                >
                  <Text style={styles.readingValue}>
                    {(sensorData.soilMoisture as any)[`pot${selectedPot}`].toFixed(1)}%
                  </Text>
                </LinearGradient>
              </View>
            )}

            <TouchableOpacity
              style={[styles.getRecommendationButton, (!sensorData || isLoading) && { opacity: 0.6 }]}
              onPress={handleGetSoilRecommendation}
              disabled={!sensorData || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="analytics" size={22} color="#fff" />
                  <Text style={styles.getRecommendationText}>Get AI Recommendation</Text>
                </>
              )}
            </TouchableOpacity>
          </LinearGradient>

          {soilRecommendationsArray.length > 0 && (
            <View style={[styles.historyCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={styles.historyHeader}>
                <LinearGradient
                  colors={['#4CAF50', '#8BC34A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.historyIconBg}
                >
                  <Ionicons name="time" size={18} color="#fff" />
                </LinearGradient>
                <Text style={[styles.historyTitle, { color: colors.text }]}>Recommendation History</Text>
              </View>
              {soilRecommendationsArray.map((rec: any) => (
                <View key={rec.id} style={styles.historyItem}>
                  <View style={styles.historyHeaderRow}>
                    <LinearGradient
                      colors={['#4CAF50', '#8BC34A']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.historyPotBadge}
                    >
                      <Text style={styles.historyPotText}>Pot {rec.potNumber}</Text>
                    </LinearGradient>
                    <Text style={[styles.historyDate, { color: colors.textMuted }]}>
                      {new Date(rec.timestamp).toLocaleString()}
                    </Text>
                  </View>
                  <Text style={[styles.historyRecommendation, { color: colors.text }]}>{rec.recommendation}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabContainer: { flexDirection: 'row', padding: 16, paddingTop: 20, gap: 12 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 14, gap: 8 },
  tabIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 14, fontWeight: '700' },
  chatContainer: { flex: 1 },
  chatContent: { padding: 16, paddingBottom: 100 },
  messageBubble: { maxWidth: '85%', padding: 14, borderRadius: 18, marginBottom: 12, gap: 6 },
  messageBubbleUser: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  messageBubbleAssistant: { alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1 },
  messageText: { fontSize: 15, lineHeight: 22, flexShrink: 1 },
  messageTime: { fontSize: 11, marginTop: 4, textAlign: 'right' },
  typingIndicator: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, borderRadius: 20, marginHorizontal: 16, marginTop: 20, paddingHorizontal: 24 },
  emptyStateIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyStateTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8, paddingHorizontal: 10 },
  emptyStateText: { fontSize: 15, textAlign: 'center', marginBottom: 24, lineHeight: 22, color: '#666', paddingHorizontal: 10 },
  quickActions: { width: '100%', gap: 10 },
  quickAction: { padding: 16, borderRadius: 14, borderWidth: 2, alignItems: 'center' },
  quickActionText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  inputContainer: { flexDirection: 'row', padding: 12, borderTopWidth: 1, gap: 10, paddingBottom: Platform.OS === 'ios' ? 10 : 20 },
  clearButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 12, fontSize: 15, maxHeight: 100, minHeight: 44 },
  sendButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  soilContainer: { flex: 1 },
  soilCard: { margin: 16, padding: 24, borderRadius: 20 },
  soilCardTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8 },
  soilCardSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 24, lineHeight: 20 },
  potSelector: { marginBottom: 24 },
  potSelectorLabel: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  potButtons: { flexDirection: 'row', gap: 12 },
  potButton: { flex: 1, padding: 16, borderRadius: 14, borderWidth: 2, alignItems: 'center' },
  potButtonText: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  currentReading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', padding: 18, borderRadius: 14, marginBottom: 20 },
  readingLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500', flexShrink: 1 },
  readingValueBg: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  readingValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
  getRecommendationButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 18, borderRadius: 14, gap: 12 },
  getRecommendationText: { fontSize: 16, fontWeight: '800', color: '#11998e', textAlign: 'center' },
  historyCard: { margin: 16, padding: 20, borderRadius: 20, borderWidth: 1 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  historyIconBg: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  historyTitle: { fontSize: 18, fontWeight: '700', flexShrink: 1 },
  historyItem: { paddingVertical: 16 },
  historyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  historyPotBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  historyPotText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  historyDate: { fontSize: 12, flexShrink: 1 },
  historyRecommendation: { fontSize: 14, lineHeight: 22 },
  bottomPadding: { height: 40 },
});

export default AIScreen;
