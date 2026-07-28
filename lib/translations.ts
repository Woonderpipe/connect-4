import en from '@/locales/en.json';
import de from '@/locales/de.json';
import ar from '@/locales/ar.json';
import { type AppLocale } from '@/lib/locales';

export type TranslationStrings = typeof en;

type TranslationOverrides = Partial<TranslationStrings>;

const translatedUi: Record<Exclude<AppLocale, 'en' | 'de' | 'ar'>, TranslationOverrides> = {
  fr: { title: 'Puissance 4', subtitle: 'Le classique, à votre façon', globalStats: 'Statistiques', settings: 'Réglages', language: 'Langue', newGame: 'Nouvelle partie', undo: 'Annuler', history: 'Historique', resume: 'Reprendre', pause: 'Pause', darkMode: 'Mode sombre', difficulty: 'Difficulté', mode: 'Mode', online: 'En ligne', pvp: 'Joueur contre joueur', pve: 'Joueur contre IA', easy: 'Facile', medium: 'Moyen', hard: 'Difficile' },
  es: { title: 'Conecta 4', subtitle: 'El clásico, a tu manera', globalStats: 'Estadísticas', settings: 'Ajustes', language: 'Idioma', newGame: 'Nueva partida', undo: 'Deshacer', history: 'Historial', resume: 'Continuar', pause: 'Pausa', darkMode: 'Modo oscuro', difficulty: 'Dificultad', mode: 'Modo', online: 'En línea', pvp: 'Jugador contra jugador', pve: 'Jugador contra IA', easy: 'Fácil', medium: 'Medio', hard: 'Difícil' },
  it: { title: 'Forza 4', subtitle: 'Il classico, a modo tuo', globalStats: 'Statistiche', settings: 'Impostazioni', language: 'Lingua', newGame: 'Nuova partita', undo: 'Annulla', history: 'Cronologia', resume: 'Riprendi', pause: 'Pausa', darkMode: 'Modalità scura', difficulty: 'Difficoltà', mode: 'Modalità', online: 'Online', pvp: 'Giocatore contro giocatore', pve: 'Giocatore contro IA', easy: 'Facile', medium: 'Media', hard: 'Difficile' },
  'pt-br': { title: 'Ligue 4', subtitle: 'O clássico, do seu jeito', globalStats: 'Estatísticas', settings: 'Configurações', language: 'Idioma', newGame: 'Novo jogo', undo: 'Desfazer', history: 'Histórico', resume: 'Retomar', pause: 'Pausar', darkMode: 'Modo escuro', difficulty: 'Dificuldade', mode: 'Modo', online: 'Online', pvp: 'Jogador contra jogador', pve: 'Jogador contra IA', easy: 'Fácil', medium: 'Médio', hard: 'Difícil' },
  ru: { title: 'Четыре в ряд', subtitle: 'Классика по-вашему', globalStats: 'Статистика', settings: 'Настройки', language: 'Язык', newGame: 'Новая игра', undo: 'Отменить', history: 'История', resume: 'Продолжить', pause: 'Пауза', darkMode: 'Тёмная тема', difficulty: 'Сложность', mode: 'Режим', online: 'Онлайн', pvp: 'Игрок против игрока', pve: 'Игрок против ИИ', easy: 'Легко', medium: 'Средне', hard: 'Сложно' },
  tr: { title: 'Dört Bağla', subtitle: 'Klasik, senin tarzın', globalStats: 'İstatistikler', settings: 'Ayarlar', language: 'Dil', newGame: 'Yeni oyun', undo: 'Geri al', history: 'Geçmiş', resume: 'Devam et', pause: 'Duraklat', darkMode: 'Koyu mod', difficulty: 'Zorluk', mode: 'Mod', online: 'Çevrimiçi', pvp: 'Oyuncuya karşı oyuncu', pve: 'Yapay zekâya karşı', easy: 'Kolay', medium: 'Orta', hard: 'Zor' },
  th: { title: 'คอนเน็กต์ 4', subtitle: 'เกมคลาสสิกในแบบของคุณ', globalStats: 'สถิติ', settings: 'การตั้งค่า', language: 'ภาษา', newGame: 'เกมใหม่', undo: 'เลิกทำ', history: 'ประวัติ', resume: 'เล่นต่อ', pause: 'หยุดชั่วคราว', darkMode: 'โหมดมืด', difficulty: 'ระดับความยาก', mode: 'โหมด', online: 'ออนไลน์', pvp: 'ผู้เล่นกับผู้เล่น', pve: 'ผู้เล่นกับ AI', easy: 'ง่าย', medium: 'ปานกลาง', hard: 'ยาก' },
  vi: { title: 'Cờ 4', subtitle: 'Kinh điển theo cách của bạn', globalStats: 'Thống kê', settings: 'Cài đặt', language: 'Ngôn ngữ', newGame: 'Ván mới', undo: 'Hoàn tác', history: 'Lịch sử', resume: 'Tiếp tục', pause: 'Tạm dừng', darkMode: 'Chế độ tối', difficulty: 'Độ khó', mode: 'Chế độ', online: 'Trực tuyến', pvp: 'Người chơi với người chơi', pve: 'Người chơi với AI', easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' },
  id: { title: 'Connect 4', subtitle: 'Klasik dengan gayamu', globalStats: 'Statistik', settings: 'Pengaturan', language: 'Bahasa', newGame: 'Permainan baru', undo: 'Urungkan', history: 'Riwayat', resume: 'Lanjutkan', pause: 'Jeda', darkMode: 'Mode gelap', difficulty: 'Kesulitan', mode: 'Mode', online: 'Daring', pvp: 'Pemain lawan pemain', pve: 'Pemain lawan AI', easy: 'Mudah', medium: 'Sedang', hard: 'Sulit' },
  ja: { title: '四目並べ', subtitle: 'クラシックを、あなたらしく', globalStats: '統計', settings: '設定', language: '言語', newGame: '新しいゲーム', undo: '元に戻す', history: '履歴', resume: '再開', pause: '一時停止', darkMode: 'ダークモード', difficulty: '難易度', mode: 'モード', online: 'オンライン', pvp: '対人戦', pve: 'AI 対戦', easy: 'かんたん', medium: 'ふつう', hard: 'むずかしい' },
  ko: { title: '사목', subtitle: '나만의 클래식', globalStats: '통계', settings: '설정', language: '언어', newGame: '새 게임', undo: '실행 취소', history: '기록', resume: '계속하기', pause: '일시 정지', darkMode: '다크 모드', difficulty: '난이도', mode: '모드', online: '온라인', pvp: '플레이어 대 플레이어', pve: '플레이어 대 AI', easy: '쉬움', medium: '보통', hard: '어려움' },
  'zh-hans': { title: '四子棋', subtitle: '经典玩法，由你定义', globalStats: '统计', settings: '设置', language: '语言', newGame: '新游戏', undo: '撤销', history: '历史记录', resume: '继续', pause: '暂停', darkMode: '深色模式', difficulty: '难度', mode: '模式', online: '在线', pvp: '玩家对玩家', pve: '玩家对 AI', easy: '简单', medium: '中等', hard: '困难' },
  'zh-hant': { title: '四子棋', subtitle: '經典玩法，由你定義', globalStats: '統計', settings: '設定', language: '語言', newGame: '新遊戲', undo: '復原', history: '歷史記錄', resume: '繼續', pause: '暫停', darkMode: '深色模式', difficulty: '難度', mode: '模式', online: '線上', pvp: '玩家對玩家', pve: '玩家對 AI', easy: '簡單', medium: '中等', hard: '困難' },
};

export const translations: Record<AppLocale, TranslationStrings> = {
  en,
  de,
  ar,
  ...Object.fromEntries(Object.entries(translatedUi).map(([locale, overrides]) => [locale, { ...en, ...overrides }])) as Record<Exclude<AppLocale, 'en' | 'de' | 'ar'>, TranslationStrings>,
};

export function getTranslation(locale: AppLocale): TranslationStrings {
  return translations[locale];
}