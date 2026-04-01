import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const sql = neon(process.env.DATABASE_URL!)

const TOP10 = [
  { name: 'Fone de Ouvido Bluetooth TWS Premium', category: 'Eletrônicos', price: '89,90', rank: 1 },
  { name: 'Aspirador de Pó Robô Inteligente', category: 'Casa', price: '349,90', rank: 2 },
  { name: 'Kit Skincare Vitamina C Coreano', category: 'Beleza', price: '127,50', rank: 3 },
  { name: 'Smartwatch Fitness Pro Ultra', category: 'Esporte', price: '199,90', rank: 4 },
  { name: 'Blender Portátil USB Smoothie', category: 'Casa', price: '59,90', rank: 5 },
  { name: 'Suplemento Colágeno Hidrolisado Premium', category: 'Saúde', price: '79,90', rank: 6 },
  { name: 'Câmera de Segurança IP 360° Full HD', category: 'Eletrônicos', price: '129,90', rank: 7 },
  { name: 'Legging Fitness Cintura Alta Sculpt', category: 'Moda', price: '69,90', rank: 8 },
  { name: 'Massageador Elétrico Shiatsu Cervical', category: 'Saúde', price: '149,90', rank: 9 },
  { name: 'Luminária LED Grow Light Plantas', category: 'Casa', price: '44,90', rank: 10 },
]

const OTHERS = [
  { name: 'Carregador Turbo 65W GaN USB-C', category: 'Eletrônicos', price: '79,90' },
  { name: 'Organizador de Gaveta Modular', category: 'Casa', price: '34,90' },
  { name: 'Paleta de Sombras 18 Cores Matte', category: 'Beleza', price: '49,90' },
  { name: 'Tênis Running Masculino Ultra Boost', category: 'Esporte', price: '189,90' },
  { name: 'Whey Protein Isolado Chocolate 1kg', category: 'Saúde', price: '119,90' },
  { name: 'Capa iPhone 15 Pro Magsafe Transparente', category: 'Eletrônicos', price: '29,90' },
  { name: 'Jogo de Lençol 400 Fios Egípcio', category: 'Casa', price: '159,90' },
  { name: 'Batom Líquido Matte 24h Waterproof', category: 'Beleza', price: '22,90' },
  { name: 'Mochila Antifurto USB Impermeável 30L', category: 'Moda', price: '89,90' },
  { name: 'Máscara Facial de Argila Verde', category: 'Beleza', price: '38,90' },
  { name: 'Suporte Articulado TV 40-85"', category: 'Casa', price: '99,90' },
  { name: 'Corda de Pular Speed Rope Crossfit', category: 'Esporte', price: '54,90' },
  { name: 'Óculos de Sol Polarizado UV400', category: 'Moda', price: '69,90' },
  { name: 'Vitamina D3 + K2 60 Cápsulas', category: 'Saúde', price: '44,90' },
  { name: 'Chapinha Cerâmica Profissional 230°C', category: 'Beleza', price: '139,90' },
  { name: 'Mesa Dobrável Home Office Compacta', category: 'Casa', price: '219,90' },
  { name: 'Garrafa Térmica Stanley 1L Inox', category: 'Esporte', price: '199,90' },
  { name: 'Perfume Importado Feminino 100ml', category: 'Beleza', price: '279,90' },
  { name: 'Fritadeira Elétrica Air Fryer 5L', category: 'Casa', price: '299,90' },
  { name: 'Tênis Casual Couro Legítimo', category: 'Moda', price: '249,90' },
]

async function seed() {
  console.log('🌱 Iniciando seed no Neon...\n')

  for (const p of TOP10) {
    await sql`
      INSERT INTO products (name, description, category, price, shopee_link, affiliate_link, is_top10, rank, is_active)
      VALUES (
        ${p.name},
        ${p.name + ' — produto viral com ótimo custo-benefício.'},
        ${p.category}, ${p.price},
        ${'https://shopee.com.br/produto-' + p.rank},
        ${'https://s.shopee.com.br/afiliado-' + p.rank},
        true, ${p.rank}, true
      )
      ON CONFLICT DO NOTHING
    `
    console.log(`✅ Top ${p.rank}: ${p.name}`)
  }

  for (const p of OTHERS) {
    await sql`
      INSERT INTO products (name, description, category, price, is_top10, rank, is_active)
      VALUES (${p.name}, ${p.name + ' — ótimo produto para viralizar.'}, ${p.category}, ${p.price}, false, null, true)
      ON CONFLICT DO NOTHING
    `
    console.log(`✅ Produto: ${p.name}`)
  }

  console.log('\n✨ Seed concluído!')
  console.log('\n📝 Acesso admin:')
  console.log(`   Email: ${process.env.ADMIN_EMAIL}`)
  console.log(`   Senha: ${process.env.ADMIN_PASSWORD}`)
}

seed().catch((err) => { console.error(err); process.exit(1) })
