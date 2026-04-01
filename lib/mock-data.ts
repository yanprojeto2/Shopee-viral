import type { ProductWithMedia } from '@/types/database'

const PLACEHOLDER_IMG = 'https://via.placeholder.com/400x400/EE4D2D/FFFFFF?text=Shopee'

export const MOCK_TOP10: ProductWithMedia[] = [
  {
    id: '1', name: 'Fone Bluetooth TWS Premium', description: '', category: 'Eletrônicos',
    price: '89,90', shopee_link: '#', affiliate_link: '#', rank: 1, is_top10: true,
    is_active: true, created_at: '', photo_count: 2, video_count: 1, total_downloads: 3420,
    media: [{ id: 'm1', product_id: '1', type: 'photo', url: 'https://via.placeholder.com/400x400/EE4D2D/FFFFFF?text=%231+Fone', thumbnail_url: null, original_source: null, file_size: '1.2 MB', duration: null, downloads: 2100, created_at: '' }],
  },
  {
    id: '2', name: 'Aspirador Robô Inteligente', description: '', category: 'Casa',
    price: '349,90', shopee_link: '#', affiliate_link: '#', rank: 2, is_top10: true,
    is_active: true, created_at: '', photo_count: 3, video_count: 2, total_downloads: 2810,
    media: [{ id: 'm2', product_id: '2', type: 'photo', url: 'https://via.placeholder.com/400x400/C73B1F/FFFFFF?text=%232+Robo', thumbnail_url: null, original_source: null, file_size: '980 KB', duration: null, downloads: 1800, created_at: '' }],
  },
  {
    id: '3', name: 'Kit Skincare Vitamina C', description: '', category: 'Beleza',
    price: '127,50', shopee_link: '#', affiliate_link: '#', rank: 3, is_top10: true,
    is_active: true, created_at: '', photo_count: 4, video_count: 1, total_downloads: 2340,
    media: [{ id: 'm3', product_id: '3', type: 'photo', url: 'https://via.placeholder.com/400x400/FF7B55/FFFFFF?text=%233+Skin', thumbnail_url: null, original_source: null, file_size: '1.5 MB', duration: null, downloads: 1540, created_at: '' }],
  },
  {
    id: '4', name: 'Smartwatch Fitness Pro Ultra', description: '', category: 'Esporte',
    price: '199,90', shopee_link: '#', affiliate_link: '#', rank: 4, is_top10: true,
    is_active: true, created_at: '', photo_count: 2, video_count: 1, total_downloads: 1980,
    media: [{ id: 'm4', product_id: '4', type: 'photo', url: 'https://via.placeholder.com/400x400/EE4D2D/FFFFFF?text=%234+Watch', thumbnail_url: null, original_source: null, file_size: '870 KB', duration: null, downloads: 1200, created_at: '' }],
  },
  {
    id: '5', name: 'Blender Portátil USB Smoothie', description: '', category: 'Casa',
    price: '59,90', shopee_link: '#', affiliate_link: '#', rank: 5, is_top10: true,
    is_active: true, created_at: '', photo_count: 2, video_count: 0, total_downloads: 1650,
    media: [{ id: 'm5', product_id: '5', type: 'photo', url: 'https://via.placeholder.com/400x400/C73B1F/FFFFFF?text=%235+Blend', thumbnail_url: null, original_source: null, file_size: '760 KB', duration: null, downloads: 980, created_at: '' }],
  },
  {
    id: '6', name: 'Colágeno Hidrolisado Premium', description: '', category: 'Saúde',
    price: '79,90', shopee_link: '#', affiliate_link: '#', rank: 6, is_top10: true,
    is_active: true, created_at: '', photo_count: 1, video_count: 1, total_downloads: 1420,
    media: [{ id: 'm6', product_id: '6', type: 'photo', url: 'https://via.placeholder.com/400x400/FF7B55/FFFFFF?text=%236+Col', thumbnail_url: null, original_source: null, file_size: '1.1 MB', duration: null, downloads: 870, created_at: '' }],
  },
  {
    id: '7', name: 'Câmera de Segurança IP 360°', description: '', category: 'Eletrônicos',
    price: '129,90', shopee_link: '#', affiliate_link: '#', rank: 7, is_top10: true,
    is_active: true, created_at: '', photo_count: 3, video_count: 0, total_downloads: 1190,
    media: [{ id: 'm7', product_id: '7', type: 'photo', url: 'https://via.placeholder.com/400x400/EE4D2D/FFFFFF?text=%237+Cam', thumbnail_url: null, original_source: null, file_size: '920 KB', duration: null, downloads: 740, created_at: '' }],
  },
  {
    id: '8', name: 'Legging Fitness Sculpt', description: '', category: 'Moda',
    price: '69,90', shopee_link: '#', affiliate_link: '#', rank: 8, is_top10: true,
    is_active: true, created_at: '', photo_count: 5, video_count: 1, total_downloads: 980,
    media: [{ id: 'm8', product_id: '8', type: 'photo', url: 'https://via.placeholder.com/400x400/C73B1F/FFFFFF?text=%238+Leg', thumbnail_url: null, original_source: null, file_size: '1.3 MB', duration: null, downloads: 610, created_at: '' }],
  },
  {
    id: '9', name: 'Massageador Shiatsu Cervical', description: '', category: 'Saúde',
    price: '149,90', shopee_link: '#', affiliate_link: '#', rank: 9, is_top10: true,
    is_active: true, created_at: '', photo_count: 2, video_count: 1, total_downloads: 870,
    media: [{ id: 'm9', product_id: '9', type: 'photo', url: 'https://via.placeholder.com/400x400/FF7B55/FFFFFF?text=%239+Mass', thumbnail_url: null, original_source: null, file_size: '890 KB', duration: null, downloads: 540, created_at: '' }],
  },
  {
    id: '10', name: 'Luminária LED Grow Light', description: '', category: 'Casa',
    price: '44,90', shopee_link: '#', affiliate_link: '#', rank: 10, is_top10: true,
    is_active: true, created_at: '', photo_count: 2, video_count: 0, total_downloads: 720,
    media: [{ id: 'm10', product_id: '10', type: 'photo', url: 'https://via.placeholder.com/400x400/EE4D2D/FFFFFF?text=%2310+Led', thumbnail_url: null, original_source: null, file_size: '670 KB', duration: null, downloads: 430, created_at: '' }],
  },
]

export const MOCK_OTHERS: ProductWithMedia[] = [
  { id: '11', name: 'Carregador Turbo 65W GaN USB-C', description: '', category: 'Eletrônicos', price: '79,90', shopee_link: '#', affiliate_link: '#', rank: null, is_top10: false, is_active: true, created_at: '', photo_count: 2, video_count: 0, total_downloads: 320, media: [{ id: 'm11', product_id: '11', type: 'photo', url: 'https://via.placeholder.com/400x400/EE4D2D/FFFFFF?text=Carregador', thumbnail_url: null, original_source: null, file_size: null, duration: null, downloads: 320, created_at: '' }] },
  { id: '12', name: 'Organizador de Gaveta Modular', description: '', category: 'Casa', price: '34,90', shopee_link: '#', affiliate_link: '#', rank: null, is_top10: false, is_active: true, created_at: '', photo_count: 3, video_count: 0, total_downloads: 210, media: [{ id: 'm12', product_id: '12', type: 'photo', url: 'https://via.placeholder.com/400x400/C73B1F/FFFFFF?text=Organiz', thumbnail_url: null, original_source: null, file_size: null, duration: null, downloads: 210, created_at: '' }] },
  { id: '13', name: 'Paleta de Sombras 18 Cores Matte', description: '', category: 'Beleza', price: '49,90', shopee_link: '#', affiliate_link: '#', rank: null, is_top10: false, is_active: true, created_at: '', photo_count: 4, video_count: 1, total_downloads: 540, media: [{ id: 'm13', product_id: '13', type: 'photo', url: 'https://via.placeholder.com/400x400/FF7B55/FFFFFF?text=Paleta', thumbnail_url: null, original_source: null, file_size: null, duration: null, downloads: 540, created_at: '' }] },
  { id: '14', name: 'Tênis Running Masculino Ultra Boost', description: '', category: 'Esporte', price: '189,90', shopee_link: '#', affiliate_link: '#', rank: null, is_top10: false, is_active: true, created_at: '', photo_count: 5, video_count: 0, total_downloads: 180, media: [{ id: 'm14', product_id: '14', type: 'photo', url: 'https://via.placeholder.com/400x400/EE4D2D/FFFFFF?text=Tenis', thumbnail_url: null, original_source: null, file_size: null, duration: null, downloads: 180, created_at: '' }] },
  { id: '15', name: 'Whey Protein Isolado Chocolate 1kg', description: '', category: 'Saúde', price: '119,90', shopee_link: '#', affiliate_link: '#', rank: null, is_top10: false, is_active: true, created_at: '', photo_count: 2, video_count: 1, total_downloads: 390, media: [{ id: 'm15', product_id: '15', type: 'photo', url: 'https://via.placeholder.com/400x400/C73B1F/FFFFFF?text=Whey', thumbnail_url: null, original_source: null, file_size: null, duration: null, downloads: 390, created_at: '' }] },
  { id: '16', name: 'Capa iPhone 15 Pro Magsafe', description: '', category: 'Eletrônicos', price: '29,90', shopee_link: '#', affiliate_link: '#', rank: null, is_top10: false, is_active: true, created_at: '', photo_count: 3, video_count: 0, total_downloads: 270, media: [{ id: 'm16', product_id: '16', type: 'photo', url: 'https://via.placeholder.com/400x400/FF7B55/FFFFFF?text=Capa', thumbnail_url: null, original_source: null, file_size: null, duration: null, downloads: 270, created_at: '' }] },
  { id: '17', name: 'Jogo de Lençol 400 Fios Egípcio', description: '', category: 'Casa', price: '159,90', shopee_link: '#', affiliate_link: '#', rank: null, is_top10: false, is_active: true, created_at: '', photo_count: 2, video_count: 0, total_downloads: 150, media: [{ id: 'm17', product_id: '17', type: 'photo', url: 'https://via.placeholder.com/400x400/EE4D2D/FFFFFF?text=Lencol', thumbnail_url: null, original_source: null, file_size: null, duration: null, downloads: 150, created_at: '' }] },
  { id: '18', name: 'Batom Líquido Matte 24h Waterproof', description: '', category: 'Beleza', price: '22,90', shopee_link: '#', affiliate_link: '#', rank: null, is_top10: false, is_active: true, created_at: '', photo_count: 3, video_count: 1, total_downloads: 480, media: [{ id: 'm18', product_id: '18', type: 'photo', url: 'https://via.placeholder.com/400x400/C73B1F/FFFFFF?text=Batom', thumbnail_url: null, original_source: null, file_size: null, duration: null, downloads: 480, created_at: '' }] },
]
