import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../theme/ThemeContext';

const CameraScreen: React.FC = () => {
  const appContext = useApp();
  const snapshots = Array.isArray(appContext.snapshots) ? appContext.snapshots : [];
  const { colors } = useTheme();

  const handleOpenImage = (imageUrl: string) => {
    Linking.openURL(imageUrl);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return `${Math.floor((now.getTime() - date.getTime()) / (1000 * 60))}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getTimeOfDay = (timestamp: number) => {
    const date = new Date(timestamp);
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 21) return 'Evening';
    return 'Night';
  };

  if (appContext.isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading snapshots...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
        <LinearGradient
          colors={['#11998e', '#38ef7d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerIcon}
        >
          <Ionicons name="camera" size={28} color="#fff" />
        </LinearGradient>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Plant Snapshots</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Periodic captures from inside the greenhouse
        </Text>
      </View>

      {snapshots.length > 0 ? (
        <>
          {/* Latest Snapshot */}
          <View style={[styles.latestCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.latestHeader}>
              <LinearGradient
                colors={['#4CAF50', '#66BB6A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.latestBadge}
              >
                <Ionicons name="sparkles" size={16} color="#fff" />
                <Text style={styles.latestLabelText}>Latest Capture</Text>
              </LinearGradient>
            </View>
            
            <TouchableOpacity
              style={styles.latestImageContainer}
              onPress={() => handleOpenImage(snapshots[0].imageUrl)}
            >
              <Image source={{ uri: snapshots[0].imageUrl }} style={styles.latestImage} resizeMode="cover" />
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.imageOverlay}
              >
                <LinearGradient
                  colors={['#4CAF50', '#8BC34A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.expandButton}
                >
                  <Ionicons name="expand" size={24} color="#fff" />
                </LinearGradient>
              </LinearGradient>
            </TouchableOpacity>
            
            <View style={styles.latestInfo}>
              <View style={styles.latestInfoRow}>
                <LinearGradient
                  colors={['#2196F3', '#64B5F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.infoIconBg}
                >
                  <Ionicons name="time" size={14} color="#fff" />
                </LinearGradient>
                <Text style={[styles.latestInfoText, { color: colors.textSecondary }]}>
                  {formatTimestamp(snapshots[0].timestamp)}
                </Text>
              </View>
              <View style={styles.latestInfoRow}>
                <LinearGradient
                  colors={['#FF9800', '#FFB74D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.infoIconBg}
                >
                  <Ionicons name="sunny" size={14} color="#fff" />
                </LinearGradient>
                <Text style={[styles.latestInfoText, { color: colors.textSecondary }]}>
                  {getTimeOfDay(snapshots[0].timestamp)}
                </Text>
              </View>
            </View>
          </View>

          {/* Gallery */}
          <View style={[styles.gallerySection, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.galleryHeader}>
              <LinearGradient
                colors={['#4CAF50', '#8BC34A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.galleryIconBg}
              >
                <Ionicons name="images" size={16} color="#fff" />
              </LinearGradient>
              <Text style={[styles.galleryTitle, { color: colors.text }]}>Gallery</Text>
            </View>
            
            {snapshots.length > 1 ? (
              <View style={styles.galleryGrid}>
                {snapshots.slice(1).map((snapshot) => (
                  <TouchableOpacity
                    key={snapshot.id}
                    style={[styles.galleryItem, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => handleOpenImage(snapshot.imageUrl)}
                  >
                    <Image source={{ uri: snapshot.imageUrl }} style={styles.galleryImage} resizeMode="cover" />
                    <LinearGradient
                      colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.galleryOverlay}
                    >
                      <Text style={styles.galleryTime}>{formatTimestamp(snapshot.timestamp)}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyGallery, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="images-outline" size={40} color={colors.textMuted} />
                <Text style={[styles.emptyGalleryText, { color: colors.textSecondary }]}>No more snapshots yet</Text>
              </View>
            )}
          </View>
        </>
      ) : (
        <View style={[styles.emptyState, { backgroundColor: colors.cardBackground }]}>
          <LinearGradient
            colors={['#E0E0E0', '#D0D0D0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyStateIcon}
          >
            <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
          </LinearGradient>
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Snapshots Yet</Text>
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            The greenhouse camera will capture images periodically throughout the day.
          </Text>
          <LinearGradient
            colors={['#2196F3', '#64B5F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyStateHint}
          >
            <Ionicons name="information-circle" size={18} color="#fff" />
            <Text style={styles.emptyStateHintText}>Snapshots are taken twice daily</Text>
          </LinearGradient>
        </View>
      )}

      {/* Info Card */}
      <LinearGradient
        colors={['#4CAF50', '#66BB6A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.infoCard}
      >
        <View style={styles.infoHeader}>
          <View style={styles.infoIconBg}>
            <Ionicons name="leaf" size={20} color="#fff" />
          </View>
          <Text style={styles.infoTitle}>Plant Growth Tracking</Text>
        </View>
        <Text style={styles.infoText}>
          Regular snapshots help you monitor your plant's growth and health over time. 
          Compare images to track progress and identify any issues early.
        </Text>
      </LinearGradient>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 15 },
  header: { alignItems: 'center', padding: 24, paddingTop: 40, gap: 12 },
  headerIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 26, fontWeight: '800', textAlign: 'center', paddingHorizontal: 20 },
  headerSubtitle: { fontSize: 15, lineHeight: 22, textAlign: 'center', paddingHorizontal: 20 },
  latestCard: { margin: 16, borderRadius: 20, borderWidth: 1 },
  latestHeader: { padding: 16, paddingBottom: 8 },
  latestBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, gap: 6 },
  latestLabelText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  latestImageContainer: { margin: 16, marginTop: 0, borderRadius: 16, height: 280 },
  latestImage: { width: '100%', height: '100%' },
  imageOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  expandButton: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  latestInfo: { flexDirection: 'row', padding: 16, paddingTop: 0, gap: 20 },
  latestInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoIconBg: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  latestInfoText: { fontSize: 14, fontWeight: '500', flexShrink: 1 },
  gallerySection: { margin: 16, marginTop: 0, borderRadius: 20, borderWidth: 1 },
  galleryHeader: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 10 },
  galleryIconBg: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  galleryTitle: { fontSize: 18, fontWeight: '700', flexShrink: 1 },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  galleryItem: { width: '47%', aspectRatio: 1, borderRadius: 16 },
  galleryImage: { width: '100%', height: '100%' },
  galleryOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  galleryTime: { fontSize: 12, color: '#fff', fontWeight: '600', textAlign: 'center' },
  emptyGallery: { alignItems: 'center', padding: 40, gap: 12 },
  emptyGalleryText: { fontSize: 15, textAlign: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, margin: 16, borderRadius: 20, paddingHorizontal: 32 },
  emptyStateIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyStateTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  emptyStateText: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  emptyStateHint: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, gap: 8 },
  emptyStateHintText: { fontSize: 14, color: '#fff', fontWeight: '600', flexShrink: 1 },
  infoCard: { margin: 16, marginTop: 0, padding: 18, borderRadius: 16 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  infoTitle: { fontSize: 16, fontWeight: '800', color: '#fff', flexShrink: 1 },
  infoText: { fontSize: 14, color: '#fff', lineHeight: 22, opacity: 0.95 },
  bottomPadding: { height: 40 },
});

export default CameraScreen;
