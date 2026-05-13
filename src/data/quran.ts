export interface JuzData {
  number: number;
  mainSurah: string;
  startPage: number;
  surahs: string[];
}

export const QURAN_JUZ: JuzData[] = [
  { number: 30, mainSurah: "An-Naba'", startPage: 582, surahs: ['An-Naba', 'An-Nazi\'at', 'Abasa', 'At-Takwir', 'Al-Infitar', 'Al-Mutaffifin', 'Al-Inshiqaq', 'Al-Buruj', 'At-Tariq', 'Al-A\'la', 'Al-Ghashiyah', 'Al-Fajr', 'Al-Balad', 'Ash-Shams', 'Al-Layl', 'Ad-Duha', 'Ash-Sharh', 'At-Tin', 'Al-Alaq', 'Al-Qadr', 'Al-Bayyinah', 'Az-Zalzalah', 'Al-Adiyat', 'Al-Qari\'ah', 'At-Takathur', 'Al-Asr', 'Al-Humazah', 'Al-Fil', 'Quraysh', 'Al-Ma\'un', 'Al-Kawthar', 'Al-Kafirun', 'An-Nasr', 'Al-Masad', 'Al-Ikhlas', 'Al-Falaq', 'An-Nas'] },
  { number: 29, mainSurah: "Al-Mulk", startPage: 562, surahs: ['Al-Mulk', 'Al-Qalam', 'Al-Haqqah', 'Al-Ma\'arij', 'Nuh', 'Al-Jinn', 'Al-Muzzammil', 'Al-Muddathir', 'Al-Qiyamah', 'Al-Insan', 'Al-Mursalat'] },
  { number: 28, mainSurah: "Al-Mujadila", startPage: 542, surahs: ['Al-Mujadila', 'Al-Hashr', 'Al-Mumtahanah', 'As-Saff', 'Al-Jumu\'ah', 'Al-Munafiqun', 'At-Taghabun', 'At-Talaq', 'At-Tahrim'] },
  { number: 27, mainSurah: "Adh-Dhariyat", startPage: 522, surahs: ['Adh-Dhariyat', 'At-Tur', 'An-Najm', 'Al-Qamar', 'Ar-Rahman', 'Al-Waqi\'ah', 'Al-Hadid'] },
  { number: 26, mainSurah: "Al-Ahqaf", startPage: 502, surahs: ['Al-Ahqaf', 'Muhammad', 'Al-Fath', 'Al-Hujurat', 'Qaf', 'Adh-Dhariyat'] },
  { number: 25, mainSurah: "Fussilat", startPage: 482, surahs: ['Fussilat', 'Ash-Shura', 'Az-Zukhruf', 'Ad-Dukhan', 'Al-Jathiyah'] },
  { number: 24, mainSurah: "Az-Zumar", startPage: 462, surahs: ['Az-Zumar', 'Ghafir', 'Fussilat'] },
  { number: 23, mainSurah: "Ya-Sin", startPage: 442, surahs: ['Ya-Sin', 'As-Saffat', 'Sad', 'Az-Zumar'] },
  { number: 22, mainSurah: "Al-Ahzab", startPage: 422, surahs: ['Al-Ahzab', 'Saba', 'Fatir', 'Ya-Sin'] },
  { number: 21, mainSurah: "Al-Ankabut", startPage: 402, surahs: ['Al-Ankabut', 'Ar-Rum', 'Luqman', 'As-Sajdah', 'Al-Ahzab'] },
  { number: 20, mainSurah: "An-Naml", startPage: 382, surahs: ['An-Naml', 'Al-Qasas', 'Al-Ankabut'] },
  { number: 19, mainSurah: "Al-Furqan", startPage: 362, surahs: ['Al-Furqan', 'Ash-Shu\'ara', 'An-Naml'] },
  { number: 18, mainSurah: "Al-Mu\'minun", startPage: 342, surahs: ['Al-Mu\'minun', 'An-Nur', 'Al-Furqan'] },
  { number: 17, mainSurah: "Al-Anbiya", startPage: 322, surahs: ['Al-Anbiya', 'Al-Hajj'] },
  { number: 16, mainSurah: "Al-Kahf", startPage: 302, surahs: ['Al-Kahf', 'Maryam', 'Ta-Ha'] },
  { number: 15, mainSurah: "Al-Isra", startPage: 282, surahs: ['Al-Isra', 'Al-Kahf'] },
  { number: 14, mainSurah: "Al-Hijr", startPage: 262, surahs: ['Al-Hijr', 'An-Nahl'] },
  { number: 13, mainSurah: "Ar-Ra\'d", startPage: 242, surahs: ['Ar-Ra\'d', 'Ibrahim', 'Al-Hijr'] },
  { number: 12, mainSurah: "Yusuf", startPage: 222, surahs: ['Yusuf', 'Ar-Ra\'d'] },
  { number: 11, mainSurah: "Hud", startPage: 202, surahs: ['Hud', 'Yusuf'] },
  { number: 10, mainSurah: "Al-Anfal", startPage: 182, surahs: ['Al-Anfal', 'At-Tawbah'] },
  { number: 9, mainSurah: "Al-A\'raf", startPage: 162, surahs: ['Al-A\'raf', 'Al-Anfal'] },
  { number: 8, mainSurah: "Al-A\'raf", startPage: 142, surahs: ['Al-A\'raf'] },
  { number: 7, mainSurah: "Al-A\'raf", startPage: 122, surahs: ['Al-A\'raf'] },
  { number: 6, mainSurah: "Al-An\'am", startPage: 102, surahs: ['Al-An\'am', 'Al-A\'raf'] },
  { number: 5, mainSurah: "Al-Ma\'idah", startPage: 82, surahs: ['Al-Ma\'idah', 'Al-An\'am'] },
  { number: 4, mainSurah: "An-Nisa", startPage: 62, surahs: ['An-Nisa', 'Al-Ma\'idah'] },
  { number: 3, mainSurah: "Al-Imran", startPage: 42, surahs: ['Al-Imran', 'An-Nisa'] },
  { number: 2, mainSurah: "Al-Baqarah", startPage: 22, surahs: ['Al-Baqarah', 'Al-Imran'] },
  { number: 1, mainSurah: "Al-Fatiha", startPage: 1, surahs: ['Al-Fatiha', 'Al-Baqarah'] }
];
