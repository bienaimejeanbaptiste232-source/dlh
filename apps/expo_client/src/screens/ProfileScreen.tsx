import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Config } from '../constants/Config';

export default function ProfileScreen() {
  const menuOptions = [
    { id: '1', title: 'Adrès Mwen Yo (Kote m rete)', icon: '📍' },
    { id: '2', title: 'Mwayen Peman (MonCash & Natcash)', icon: '💳' },
    { id: '3', title: 'Notifikasyon', icon: '🔔' },
    { id: '4', title: 'Èd ak Sipò Kliyan', icon: '💬' },
    { id: '5', title: 'Kondisyon & Règleman', icon: '📄' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pwofil Mwen</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>KL</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Kliyan Delivery Lakay</Text>
            <Text style={styles.userPhone}>+509 3700-0000</Text>
          </View>
        </View>

        {/* Menu list */}
        <View style={styles.menuContainer}>
          {menuOptions.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </View>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Dekonekte</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Delivery Lakay v1.0.0 (Expo React Native)</Text>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Config.colors.navy,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Config.colors.border,
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Config.colors.navy,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: Config.colors.text,
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: Config.colors.muted,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Config.colors.border,
    overflow: 'hidden',
    marginBottom: 25,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Config.colors.text,
  },
  menuChevron: {
    fontSize: 20,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  logoutButton: {
    marginHorizontal: 20,
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutText: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 15,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 30,
  },
});

