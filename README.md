# Hastane Nöbet Sistemi

Modern ve kullanıcı dostu hastane nöbet planlama sistemi.

## 🚀 Özellikler

- **Doktor Yönetimi**: Doktor bilgilerini ekleme, düzenleme ve silme
- **Akıllı Nöbet Planlama**: Mavi gün, kırmızı gün ve gün aşırı kuralları ile
- **Mobil Uyumlu**: Tüm cihazlarda çalışan responsive tasarım
- **Vardiya Değişimi**: Kolay nöbet değişimi sistemi
- **HTML Export**: Yazdırılabilir ve paylaşılabilir HTML formatı
- **Dinamik Ayarlar**: Ay içinde değiştirilebilir kurallar

## 📋 Nöbet Kuralları

### Mavi Gün Kuralı
- Mavi gün seçilen doktorlar kesinlikle o gün nöbet tutmalı
- Mavi gün doktorları öncelikli olarak seçiliyor

### Kırmızı Gün Kuralı
- Kırmızı günlerde kesinlikle nöbet yazılmaz
- Doktorların izin günleri korunur

### Gün Aşırı Nöbet Sistemi
- Doktorlar gün aşırı nöbet tutabilir (1-3-5-7 gibi)
- Ardışık nöbet yasağı korunur

## 🛠️ Teknolojiler

- React 19
- Vite
- Tailwind CSS
- IndexedDB
- Lucide React Icons

## 📦 Kurulum

```bash
npm install
npm run dev
```

## 🏗️ Build

```bash
npm run build
```

## 🌐 Netlify Deployment

Bu proje Netlify'da deploy edilmek üzere hazırlanmıştır:

1. GitHub'a push edin
2. Netlify'da yeni site oluşturun
3. GitHub repository'nizi bağlayın
4. Build komutu: `npm run build`
5. Publish directory: `dist`

## 📱 Mobil Uyumluluk

- Chrome, Opera ve diğer tüm tarayıcılarda çalışır
- Doktor yönetimi mobil cihazlarda düzgün açılır
- Responsive tasarım ile tüm ekran boyutlarına uyum

## 🔧 Ayarlar

- **Program Türü**: Haftalık, 2 haftalık, aylık
- **Vardiya Ayarları**: Saat ve doktor sayısı
- **Nöbet Kuralları**: Mavi gün, kırmızı gün, gün aşırı
- **Bildirimler**: Sistem bildirimleri
- **Export**: HTML ve Excel formatları

## 📄 Lisans

MIT License
