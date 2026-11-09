import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Config } from '../constants/Config';
import { fetchProductsByMerchant } from '../services/api';

export default function RestaurantDetailScreen({ route, navigation }: any) {
  const restaurant = route?.params?.restaurant || {
    name: 'Restoran Lakay',
    address: 'Pétion-Ville',
    bannerUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
  };

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurant.id) {
      fetchProductsByMerchant(restaurant.id)
        .then((data) => setProducts(data || []))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [restaurant.id]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar with Back Button */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Text style={styles.backButtonText}>← Retounen</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {restaurant.name}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Image
          source={{
            uri:
              restaurant.bannerUrl ||
              restaurant.logoUrl ||
              'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
          }}
          style={styles.bannerImage}
        />

        <View style={styles.infoCard}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.restaurantAddress}>📍 {restaurant.address || 'Port-au-Prince'}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Evalyasyon</Text>
              <Text style={styles.metaValue}>★ 4.9</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Preparasyon</Text>
              <Text style={styles.metaValue}>20-30 min</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Livrezon</Text>
              <Text style={styles.metaValue}>150 HTG</Text>
            </View>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSectionHeader}>
          <Text style={styles.menuSectionTitle}>Meni & Pwodui Disponib</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Config.colors.primary} style={{ marginTop: 20 }} />
        ) : products.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🍲</Text>
            <Text style={styles.emptyText}>Restoran sa a ap ajoute nouvo meni byento!</Text>
          </View>
        ) : (
          products.map((item) => (
            <View key={item.id} style={styles.productCard}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productDesc} numberOfLines={2}>
                  {item.description || 'Plat fre prepare ak bon engredyan kreyòl.'}
                </Text>
                <Text style={styles.productPrice}>{item.price} HTG</Text>
              </View>
              {item.imageUrl && (
                <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
              )}
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Config.colors.border,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Config.colors.primary,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Config.colors.navy,
    flex: 1,
    textAlign: 'center',
  },
  bannerImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#CBD5E1',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Config.colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: '800',
    color: Config.colors.text,
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 13,
    color: Config.colors.muted,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    color: Config.colors.muted,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Config.colors.navy,
  },
  metaDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E2E8F0',
  },
  menuSectionHeader: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  menuSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Config.colors.navy,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Config.colors.border,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: Config.colors.text,
    marginBottom: 4,
  },
  productDesc: {
    fontSize: 13,
    color: Config.colors.muted,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: Config.colors.primary,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  emptyState: {
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 14,
    color: Config.colors.muted,
    textAlign: 'center',
  },
});

