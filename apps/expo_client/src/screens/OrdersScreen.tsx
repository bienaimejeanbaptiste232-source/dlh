import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Config } from '../constants/Config';

export default function OrdersScreen() {
  const dummyOrders = [
    {
      id: 'DLH-9021',
      restaurant: 'Kafou Manje Kreyòl',
      date: 'Jodi a, 12:30 PM',
      total: '1,450 HTG',
      status: 'An Pwosesis ⏱',
      items: '2x Griyo konplè, 1x Kola Kouwòn',
    },
    {
      id: 'DLH-8842',
      restaurant: 'Pizza Lakay Delmas',
      date: 'Hier, 7:15 PM',
      total: '2,100 HTG',
      status: 'Livre ✓',
      items: '1x Pitza Vyann Moulue, 2x Prestige',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kòmand Mwen Yo</Text>
      </View>

      <FlatList
        data={dummyOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.orderId}>#{item.id}</Text>
                <Text style={styles.restaurantName}>{item.restaurant}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  item.status.includes('Livre') ? styles.deliveredBadge : styles.processingBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    item.status.includes('Livre') ? styles.deliveredText : styles.processingText,
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </View>

            <Text style={styles.itemsText}>{item.items}</Text>

            <View style={styles.cardFooter}>
              <Text style={styles.dateText}>{item.date}</Text>
              <Text style={styles.totalText}>{item.total}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Config.colors.navy,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Config.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 12,
    fontWeight: '700',
    color: Config.colors.primary,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '800',
    color: Config.colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  processingBadge: {
    backgroundColor: '#FEF3C7',
  },
  processingText: {
    color: '#D97706',
    fontWeight: '700',
    fontSize: 12,
  },
  deliveredBadge: {
    backgroundColor: '#D1FAE5',
  },
  deliveredText: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 12,
  },
  itemsText: {
    fontSize: 14,
    color: Config.colors.muted,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '800',
    color: Config.colors.navy,
  },
});
