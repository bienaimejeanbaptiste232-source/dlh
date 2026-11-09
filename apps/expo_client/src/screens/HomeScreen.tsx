import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Config } from '../constants/Config';
import { fetchRestaurants, fetchCategories } from '../services/api';

export default function HomeScreen({ navigation }: any) {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      const [restData, catData] = await Promise.all([
        fetchRestaurants(),
        fetchCategories(),
      ]);
      setRestaurants(restData || []);
      setCategories(catData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredRestaurants = restaurants.filter((r) =>
    r.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Livrezon an Ayiti</Text>
          <Text style={styles.headerTitle}>Delivery Lakay 🇭🇹</Text>
        </View>
        <TouchableOpacity style={styles.profileBadge}>
          <Text style={styles.profileInitials}>DL</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Chèche manje, restoran, bwason..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Promo Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerBadge}>PI BON CHWA</Text>
            <Text style={styles.bannerTitle}>Kòmande sa w vle, nou pote l vit!</Text>
            <Text style={styles.bannerSubtitle}>Livrezon rapid nan zòn ou an</Text>
          </View>
          <Text style={styles.bannerEmoji}>🛵</Text>
        </View>

        {/* Categories Carousel */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Kategori Popilè</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow}>
          {[
            { id: 'all', name: 'Tout', icon: '🍽️' },
            { id: '1', name: 'Manje Kreyòl', icon: '🍲' },
            { id: '2', name: 'Fritay', icon: '🍌' },
            { id: '3', name: 'Pitza & Burger', icon: '🍔' },
            { id: '4', name: 'Bwason', icon: '🥤' },
          ].map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.categoryCard}>
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={styles.categoryName}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Restaurants List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Restoran Disponib</Text>
          <Text style={styles.seeAllText}>{filteredRestaurants.length} restoran</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Config.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          filteredRestaurants.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.restaurantCard}
              activeOpacity={0.8}
              onPress={() => navigation?.navigate('RestaurantDetail', { restaurant: item })}
            >
              <Image
                source={{
                  uri:
                    item.bannerUrl ||
                    item.logoUrl ||
                    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
                }}
                style={styles.restaurantImage}
              />
              <View style={styles.restaurantInfo}>
                <View style={styles.restaurantHeaderRow}>
                  <Text style={styles.restaurantName}>{item.name}</Text>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>★ 4.8</Text>
                  </View>
                </View>
                <Text style={styles.restaurantAddress} numberOfLines={1}>
                  📍 {item.address || 'Pétion-Ville / Port-au-Prince'}
                </Text>
                <View style={styles.restaurantFooterRow}>
                  <Text style={styles.prepTimeText}>⏱ 20-35 min</Text>
                  <Text style={styles.deliveryFeeText}>🛵 150 HTG livrezon</Text>
                </View>
              </View>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Config.colors.muted,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Config.colors.navy,
  },
  profileBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Config.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    paddingHorizontal: 15,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Config.colors.border,
    marginBottom: 15,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Config.colors.text,
  },
  banner: {
    backgroundColor: Config.colors.navy,
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerBadge: {
    backgroundColor: Config.colors.primary,
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  bannerEmoji: {
    fontSize: 40,
    marginLeft: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Config.colors.navy,
  },
  seeAllText: {
    fontSize: 13,
    color: Config.colors.primary,
    fontWeight: '600',
  },
  categoriesRow: {
    paddingLeft: 20,
    marginBottom: 20,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Config.colors.border,
  },
  categoryIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '700',
    color: Config.colors.text,
  },
  restaurantCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Config.colors.border,
  },
  restaurantImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#E2E8F0',
  },
  restaurantInfo: {
    padding: 14,
  },
  restaurantHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  restaurantName: {
    fontSize: 17,
    fontWeight: '800',
    color: Config.colors.text,
    flex: 1,
  },
  ratingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: {
    color: '#D97706',
    fontWeight: '700',
    fontSize: 12,
  },
  restaurantAddress: {
    fontSize: 13,
    color: Config.colors.muted,
    marginBottom: 10,
  },
  restaurantFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  prepTimeText: {
    fontSize: 13,
    color: Config.colors.text,
    fontWeight: '600',
  },
  deliveryFeeText: {
    fontSize: 13,
    color: Config.colors.primary,
    fontWeight: '700',
  },
});

