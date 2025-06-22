export const WHEEL_COLORS = [
  '#FF6B6B', // Canlı kırmızı
  '#4ECDC4', // Turkuaz
  '#45B7D1', // Mavi
  '#96CEB4', // Açık yeşil
  '#FFEAA7', // Sarı
  '#DDA0DD', // Açık mor
  '#98D8C8', // Mint yeşili
  '#F7DC6F', // Altın sarısı
  '#BB8FCE', // Lavanta
  '#85C1E9', // Açık mavi
  '#F8C471', // Turuncu
  '#82E0AA', // Yeşil
  '#F1948A', // Mercan
  '#85C1E9', // Gök mavisi
  '#F7DC6F', // Altın
  '#D7BDE2', // Açık mor
  '#A9DFBF', // Açık yeşil
  '#FAD7A0', // Şeftali
  '#AED6F1', // Bebek mavisi
  '#F9E79F', // Krem sarısı
  '#D2B4DE', // Orta mor
  '#A3E4D7', // Açık turkuaz
  '#F5B7B1', // Açık pembe
  '#D5A6BD', // Gül pembesi
  '#A9CCE3', // Açık mavi
  '#F8C471', // Turuncu
];

// Renk seçici fonksiyonu
export const getRandomColor = (): string => {
  const randomIndex = Math.floor(Math.random() * WHEEL_COLORS.length);
  return WHEEL_COLORS[randomIndex];
};

// Sıralı renk seçici fonksiyonu
export const getColorByIndex = (index: number): string => {
  return WHEEL_COLORS[index % WHEEL_COLORS.length];
}; 