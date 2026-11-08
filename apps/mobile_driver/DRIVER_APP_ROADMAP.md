# 📱 PLAN METRÈ & ACHITEKTI: DELIVERY HAÏTI (MOBILE DRIVER)

> **Dokiman referans ofisyèl pou nenpòt devlopè oswa ajan AI k ap kontinye travay sou aplikasyon chofè a (`apps/mobile_driver`).**

---

## 1. 🎯 Vizyon & Prensip Jeneral
Aplikasyon `mobile_driver` se zouti prensipal livrè moto ak kousye **Delivery Haïti (DLH)** nan zòn Okap (Cap-Haïtien) ak tout Nò peyi a. Li fèt pou:
- Efikasite maksimòm pou chofè k ap kondui moto ak yon sèl men oswa ak gan.
- Lizibilite ekselan sou solèy cho (wo kontras, gwo bouton, polis klè).
- 100% Kreyòl Ayisyen kòrèk, san okenn karaktè kase (mojibake) ni karaktè chinwa.
- Entegrasyon an tan reyèl ak Admin Dispatch ak Merchant Dashboard.

---

## 2. 🧩 Eta Aktyèl Eleman yo & Travay Ki Fini

### A. Reparasyon Enkodaj & Karaktè (100% Pwòp ✅)
- **Pwoblèm ki te la:** Karaktè UTF-8 te kase nan fòma Latin-1/Windows-1252 (`ðŸŽ¯`, `ðŸ’°`, `âš¡`, `âœ…`, `â”€`, elatriye) ki te parèt tankou bwat vid oswa karaktè chinwa nan bulbe yo.
- **Solisyon aplike:** Tout 57 liy nan `driver_home_screen.dart` ak tout fichye `apps/mobile_driver/` te netwaye epi ranplase pa vrè emoji ak senbòl natif:
  - 🎯 Bullseye (Objektif)
  - 💰 Bous / Revni
  - 🔥 Zòn Cho (Hotspots)
  - 🏍️ Moto / Kous
  - ⏱️ Tan travay
  - 📡 Rada kòmand
  - 💵 Lajan kach kliyan (Cash on delivery)
  - 📞 Rele / 💬 WhatsApp
  - ✅ Konfimasyon livrezon / 🛍️ Rekiperasyon pake

### B. Logo & Idantite Vizyèl DLH (100% Aplike ✅)
- Logo ofisyèl Delivery Haïti (`dlh_logo.png`) entegre nan:
  - `driver_login_screen.dart`: Logo santre nan antèt la ak bann gradyan.
  - `driver_home_screen.dart`: Logo nan antèt HUD flanban nèf la.
  - `driver_profile_drawer.dart`: Logo nan bann fonse anwo a ak badj estati koneksyon.
  - `android/app/src/main/res/`: Icônes aplikasyon an nan tout 5 rezolisyon (`mipmap-mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`).

### C. Tiwa Pwofil Chofè (`driver_profile_drawer.dart` ✅)
- Antèt ofisyèl DLH ak non, nimewo, ak plak moto (`MC-45892`).
- Metrik chofè: Nòt (⭐ 4.95), To Akseptasyon (99.2%), Kous Fini (42).
- Bouton SOS & Sekirite ak yon dyalòg konplè ki gen nimewo ijans nasyonal Ayiti:
  - 🚓 **114** - Polis Nasyonal d Ayiti (PNH)
  - 🚒 **118** - Sèvis Pompier & Sekou
  - 🎧 **+509 3800 0000** - Sant Sipò DLH 24/7
  - Bouton transmèt kòdonne GPS imedyatman.

### D. Cockpit Flotan ak Bulbe yo (`driver_home_screen.dart` ✅)
- **Eta Hòs Lig (Offline):**
  - Tit estati klè ak seleksyon zòn Okap.
  - Bulbe Objektif jounen an (pwogresyon, bonis, rapò kous).
  - Gwo bouton prensipal pou pase an liy.
- **Eta An Lig (Radar Searching):**
  - Bulbe Rada ak pwen vèt k ap bat (animated pulse beacon).
  - Hotspots zòn Okap (Bòdmè, Santvil Rue 18, Carénage).
  - Presizyon GPS HD ±3m.
- **Eta Misyon Aktif (Active Mission):**
  - Etap 1: Rekipere nan komèsan (advis kach, kòdonne GPS, atik pou verifye).
  - Etap 2: Livre bay kliyan (repè kliyan, bouton apèl & WhatsApp 1-tap).
  - Gwo bouton aksyon pou chanje etap misyon an.

---

## 3. 🛠️ Estrikti Pwojè a (`apps/mobile_driver/lib`)

```
apps/mobile_driver/lib/
├── config/
│   ├── constants.dart       # Koulè, URLs API/Supabase, paramèt vitès
│   └── theme.dart           # Tèm jeneral Flutter
├── models/
│   └── driver_models.dart   # Mission, DriverUserProfile, MissionItem
├── providers/
│   └── driver_providers.dart # Riverpod State (profile, status, mission, wallet)
├── screens/
│   ├── driver_home_screen.dart   # Ekran kat, HUD, ak cockpit prensipal
│   ├── driver_login_screen.dart  # Ekran koneksyon ak anrejistreman
│   └── driver_wallet_screen.dart # Ekran pòtmonnen, retrè MonCash/Natcash
### E. Sistèm Son Alèt Kòmand & Vibwasyon (100% Entegre ✅)
- **Fichye:** `lib/services/driver_alert_service.dart` + `assets/audio/order_alert.wav` + `delivery_success.wav`.
- **Fonksyònman:**
  - Lè yon kòmand rive (deklanche pa WebSocket oswa tès), yon son 880Hz-1396Hz ki pèse bri wout la sonnen an bouk ak volim maksimòm.
  - Vibwasyon fizik (`HapticFeedback.vibrate()`) repete chak 1.4 segonn.
  - Lè chofè a aksepte kous la oswa li konfime livrezon, yon son viktwa (`delivery_success.wav`) jwe.
  - Chofè a ka teste son an dirèkteman nan tiwa pwofil li (`driver_profile_drawer.dart`).

---

## 3. 🛠️ Estrikti Pwojè a (`apps/mobile_driver/lib`)

```
apps/mobile_driver/lib/
├── config/
│   ├── constants.dart          # Koulè, URLs API/Supabase, paramèt vitès
│   └── theme.dart              # Tèm jeneral Flutter
├── models/
│   └── driver_models.dart      # Mission, DriverUserProfile, MissionItem
├── providers/
│   └── driver_providers.dart    # Riverpod State (profile, status, mission, wallet)
├── screens/
│   ├── driver_home_screen.dart # Ekran kat, HUD, ak cockpit prensipal
│   ├── driver_login_screen.dart # Ekran koneksyon ak anrejistreman
│   └── driver_wallet_screen.dart# Ekran pòtmonnen, retrè MonCash/Natcash
├── services/
│   ├── driver_alert_service.dart   # Son alèt fò (audioplayers) & vibwasyon
│   ├── driver_api_service.dart     # Apèl HTTP Supabase & Backend
│   ├── driver_location_service.dart# Sèvis GPS Geolocator
│   └── driver_socket_service.dart  # Socket.IO pou dispatch an tan reyèl
└── widgets/
    ├── driver_live_map_widget.dart # Kat entèaktif (flutter_map)
    ├── driver_profile_drawer.dart  # Tiwa pwofil chofè ak tès son
    └── glass_container.dart        # Efè glassmorphism modèn
```

---

## 4. 🚀 Plan Aksyon pou Pwochen Etap yo (Next Milestones)

### Priyorite 1: Asistan Lajan Kach & MonCash/Natcash QR (COD Assistant)
- Kalkilatè monnen otomatik sou ekran livrezon an.
- Afichaj kòd QR MonCash / Natcash chofè a pou peman san kontak.

### Priyorite 2: Wout Polylines sou Kat la (OSRM / GraphHopper)
- Trase liy ble/vèt ant pozisyon moto a ak adrès rekipere/livre sou `DriverLiveMapWidget`.
- Itilize sèvis OSRM gratis sou wout Okap yo.

### Priyorite 3: File D'attente Senkronizasyon Hòs Lig (Offline Queue)
- Si rezo a koupe pandan chofè a klike sou "Mwen rekipere pake a" oswa "Livrezon fini", estoke aksyon an lokalman nan `shared_preferences` epi voye li otomatikman kou koneksyon revi.

---

## 5. 🔍 Kòmand Validasyon Rapid

Pou verifye si tout bagay fonksyone byen:
```powershell
cd c:\Users\GOD\.gemini\antigravity-ide\scratch\delivery-haiti\apps\mobile_driver
flutter analyze
```
*Rezilta espere:* `No issues found! ✅`
