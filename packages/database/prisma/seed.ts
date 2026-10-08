import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@meadowmist.in';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminMeadowMist2026!';
  const adminName = process.env.ADMIN_NAME || 'Meadow Mist Admin';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      phone: '+91 98765 43210',
      role: 'ADMIN',
      isActive: true,
    },
  });

  await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      storeName: 'Meadow Mist',
      contactEmail: 'hello@meadowmist.in',
      contactPhone: '+91 98765 43210',
      shippingFlatRate: 99,
      freeShippingThreshold: 1499,
      codEnabled: true,
      codFee: 0,
      aboutHeadline: 'Every piece starts with a feeling.',
      aboutStory:
        'Meadow Mist began as a small experiment — what if everyday objects could feel as considered as something you would frame and hang on a wall? The candles are poured in batches of eight. The ceramics are thrown, trimmed, and glazed by one pair of hands. Nothing here is the same twice.',
      aboutArtisanNote:
        'Each piece is made in small batches — the variations in texture, glaze, and finish are a feature, not a flaw. Your piece will be similar to the photographs, and deliberately not identical.',
    },
  });

  const productsFilePath = path.join(__dirname, 'products.json');
  const productsRaw = fs.readFileSync(productsFilePath, 'utf-8');
  const products = JSON.parse(productsRaw);

  for (const p of products) {
    const defaultStock = p.category === 'candle' ? 20 : 12;
    const customOptions =
      p.category === 'candle'
        ? {
            fragrances: [
              'Original Scent',
              'Lavender & Wild Herbs',
              'Warm Vanilla & Sandalwood',
              'Fresh Rose & Citrus',
            ],
            waxTones: ['Natural Cream', 'Terracotta Blush', 'Amber Honey'],
            sizes: ['Standard Artisan Size', 'Petite Gift Size'],
            allowGiftMessage: true,
          }
        : {
            finishes: ['Matte Mineral Glaze', 'High Gloss Polish'],
            allowGiftMessage: true,
          };

    const productRecord = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.story,
        price: Number(p.price),
        salePrice: p.salePrice ? Number(p.salePrice) : null,
        category: p.category,
        subCategory: p.subCategory,
        images: JSON.stringify(p.images),
        materials: JSON.stringify(p.materials),
        dimensions: p.dimensions || null,
        badge: p.badge || null,
        colorFamily: p.colorFamily,
        scentFamily: p.scentFamily || null,
        scentNotes: p.scentNotes ? JSON.stringify(p.scentNotes) : null,
        customOptions: JSON.stringify(customOptions),
        stockQuantity: defaultStock,
        lowStockThreshold: 5,
        inStock: true,
        isFeatured: p.badge === 'bestseller' || p.badge === 'new',
        isActive: true,
      },
      create: {
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.story,
        price: Number(p.price),
        salePrice: p.salePrice ? Number(p.salePrice) : null,
        category: p.category,
        subCategory: p.subCategory,
        images: JSON.stringify(p.images),
        materials: JSON.stringify(p.materials),
        dimensions: p.dimensions || null,
        badge: p.badge || null,
        colorFamily: p.colorFamily,
        scentFamily: p.scentFamily || null,
        scentNotes: p.scentNotes ? JSON.stringify(p.scentNotes) : null,
        customOptions: JSON.stringify(customOptions),
        stockQuantity: defaultStock,
        lowStockThreshold: 5,
        inStock: true,
        isFeatured: p.badge === 'bestseller' || p.badge === 'new',
        isActive: true,
      },
    });

    const existingLog = await prisma.inventoryLog.findFirst({
      where: { productId: productRecord.id },
    });

    if (!existingLog) {
      await prisma.inventoryLog.create({
        data: {
          productId: productRecord.id,
          changeQuantity: defaultStock,
          newQuantity: defaultStock,
          reason: 'RESTOCK',
          note: 'Initial batch inventory setup',
        },
      });
    }
  }

  const banners = [
    {
      title: 'Handcrafted Candles & Ceramic Décor',
      subtitle: 'Hand-poured soy candles and wheel-thrown ceramic pieces, made in small batches in India.',
      badgeText: 'New Collection 2026',
      imageUrl: '/images/products/sunflower-wax-cluster-yellow.jpg',
      linkUrl: '/candles',
      sortOrder: 1,
      isActive: true,
    },
    {
      title: 'Artisan Lotus Bowls & Candle Holders',
      subtitle: 'Formed by hand with organic mineral pigments.',
      badgeText: 'Ceramics Feature',
      imageUrl: '/images/products/black-gold-lotus-tealight.jpg',
      linkUrl: '/ceramics',
      sortOrder: 2,
      isActive: true,
    },
  ];

  for (const b of banners) {
    const existingBanner = await prisma.banner.findFirst({ where: { title: b.title } });
    if (!existingBanner) {
      await prisma.banner.create({ data: b });
    }
  }

  const faqs = [
    {
      question: 'How long do Meadow Mist soy candles burn?',
      answer:
        'Our ribbed pillar candles burn for approximately 40 to 55 hours, while our smaller wax clusters burn cleanly for 18 to 25 hours. For best results, trim the cotton wick to 5mm before every burn.',
      category: 'Candle Care',
      sortOrder: 1,
      isActive: true,
    },
    {
      question: 'Are the ceramic items food safe?',
      answer:
        'Our glazed ceramic lotus bowls and tableware are glazed with lead-free, non-toxic mineral pigments. Trinket boxes and planters are crafted specifically for décor and accessories.',
      category: 'Materials',
      sortOrder: 2,
      isActive: true,
    },
    {
      question: 'What is your shipping timeline and delivery charge?',
      answer:
        'Orders are packaged with protective eco-friendly wrap and dispatched within 2 business days. Delivery across India usually takes 3-5 business days. Shipping is flat ₹99, or free on orders above ₹1,499.',
      category: 'Shipping',
      sortOrder: 3,
      isActive: true,
    },
    {
      question: 'What is your cancellation and return policy?',
      answer:
        'You can cancel any order directly from your account before it is dispatched. If your handcrafted piece arrives damaged or defective, report it within 48 hours for an instant replacement or refund.',
      category: 'Ordering',
      sortOrder: 4,
      isActive: true,
    },
  ];

  for (const f of faqs) {
    const existingFaq = await prisma.fAQ.findFirst({ where: { question: f.question } });
    if (!existingFaq) {
      await prisma.fAQ.create({ data: f });
    }
  }

  await prisma.promotion.upsert({
    where: { code: 'MEADOW10' },
    update: {},
    create: {
      code: 'MEADOW10',
      description: '10% off on your first handcrafted order',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 499,
      maxDiscount: 250,
      isActive: true,
    },
  });

  const demoCustomerPassword = await bcrypt.hash('MeadowCustomer2026!', 12);
  const customer1 = await prisma.user.upsert({
    where: { email: 'aditi.verma@example.com' },
    update: {},
    create: {
      name: 'Aditi Verma',
      email: 'aditi.verma@example.com',
      passwordHash: demoCustomerPassword,
      phone: '+91 98111 22334',
      role: 'CUSTOMER',
      isActive: true,
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: 'kavya.sharma@example.com' },
    update: {},
    create: {
      name: 'Kavya Sharma',
      email: 'kavya.sharma@example.com',
      passwordHash: demoCustomerPassword,
      phone: '+91 98222 33445',
      role: 'CUSTOMER',
      isActive: true,
    },
  });

  const allDbProducts = await prisma.product.findMany();
  for (const product of allDbProducts) {
    const existingReviews = await prisma.review.count({ where: { productId: product.id } });
    if (existingReviews === 0) {
      await prisma.review.createMany({
        data: [
          {
            productId: product.id,
            userId: customer1.id,
            rating: 5,
            title: `Exceptional quality and finish`,
            comment: `The artisanal attention to detail in this ${product.name} is evident right out of the package. It elevates our living space completely.`,
            isVerifiedPurchase: true,
            isApproved: true,
          },
          {
            productId: product.id,
            userId: customer2.id,
            rating: 5,
            title: `Pure handcrafted perfection`,
            comment: `Delicate texture, exquisite presence, and arrived securely packed in biodegradable materials. Will definitely order again.`,
            isVerifiedPurchase: true,
            isApproved: true,
          },
        ],
      });
    }
  }

  const articles = [
    {
      slug: 'candle-care-guide-first-burn-wick-trimming',
      title: 'The Art of Candle Care: Memory Rings & Wick Trimming',
      excerpt: 'Why the first burn defines the life of your soy candle, and how simple wick care produces a smokeless, clean ambiance.',
      category: 'Candle Care',
      readTime: '4 min read',
      coverImage: '/images/products/sunflower-wax-cluster-yellow.jpg',
      tags: JSON.stringify(['Soy Wax', 'Candle Care', 'Artisan Rituals']),
      relatedProductSlugs: JSON.stringify(['sunflower-wax-cluster-yellow', 'ribbed-pillar-candle-blush']),
      content: 'Wax possesses memory. When you light an artisanal soy candle for the first time, allow the melt pool to reach all edges of the vessel before extinguishing. This initial burn creates an even liquefaction path that prevents tunneling.\n\nTrim your natural cotton wick to approximately 5 millimeters prior to every lighting. A short wick ensures an even, controlled flame, preventing carbon mushrooming and soot.\n\nKeep the burning vessel away from open drafts and ceiling fans. A steady, unperturbed flame burns cleaner and extends your candle life by over twenty percent.',
    },
    {
      slug: 'wheel-thrown-ceramics-earth-to-kiln',
      title: 'From Earth to Fire: The Wheel-Thrown Ceramic Journey',
      excerpt: 'A behind-the-scenes look into our small-batch wheel-throwing, mineral glaze formulation, and the patience of high-fire ceramics.',
      category: 'Ceramics',
      readTime: '5 min read',
      coverImage: '/images/products/black-gold-lotus-tealight.jpg',
      tags: JSON.stringify(['Ceramics', 'Studio Notes', 'Handcrafted']),
      relatedProductSlugs: JSON.stringify(['black-gold-lotus-tealight', 'lotus-bowl-blush']),
      content: 'Wheel throwing is a practice of surrender and centering. Stoneware clay must be wedged thoroughly to remove air pockets before meeting the wheel head.\n\nEach vessel is pulled upward in deliberate motions, trimmed once leather-hard, and left to dry slowly for seven days. Rapid moisture loss causes warpage; slow drying yields strength.\n\nAfter bisque firing at 950 degrees Celsius, natural mineral glazes formulated with ash and copper are applied by hand. The final high fire at 1220 degrees vitrifies the clay into durable stoneware.',
    },
    {
      slug: 'ritual-of-fragrance-calming-spaces',
      title: 'The Architecture of Scent: Creating Calming Sanctuaries at Home',
      excerpt: 'How notes of amber, wild lavender, and warm sandalwood shift emotional resonance and ground your living spaces.',
      category: 'Rituals',
      readTime: '3 min read',
      coverImage: '/images/products/moss-green-bubble-candle.jpg',
      tags: JSON.stringify(['Scent Design', 'Home Decor', 'Aromatherapy']),
      relatedProductSlugs: JSON.stringify(['moss-green-bubble-candle', 'terracotta-fluted-vessel']),
      content: 'Olfactory memory is the most direct pathway to calm. When selecting botanical scents for living spaces, consider the movement of your day.\n\nMorning spaces thrive on crisp citrus, wild cedar, and dew-drenched herbs that awaken clarity without agitation. In the evening, grounding notes of golden amber, smoked sandalwood, and quiet vanilla slow the breath.\n\nDiffuse gentle fragrance in rooms with steady airflow to allow botanicals to unfold naturally.',
    },
    {
      slug: 'mindful-gifting-handcrafted-pairs',
      title: 'Gifting With Intention: Meaningful Artisan Pairs for Life Milestones',
      excerpt: 'Moving away from mass-produced presents. Thoughtful pairings of wheel-thrown ceramic dishes with artisanal botanical wax.',
      category: 'Gifting',
      readTime: '4 min read',
      coverImage: '/images/products/daisy-trinket-box-blue.jpg',
      tags: JSON.stringify(['Gifting Guide', 'Curated Sets', 'Celebrations']),
      relatedProductSlugs: JSON.stringify(['daisy-trinket-box-blue', 'sunflower-wax-cluster-yellow']),
      content: 'A gift made by human hands carries an unmistakable weight of care. When choosing an object for someone you cherish, look for items that invite daily pause.\n\nA hand-carved trinket dish paired with a sculptured pillar candle transforms an ordinary dresser into an intentional altar for jewelry, keys, or contemplation.\n\nEach piece arrives cushioned in biodegradable recycled pulp, accompanied by an artisan care card detailing the materials and batch number.',
    },
  ];

  for (const a of articles) {
    const existing = await prisma.journalArticle.findUnique({ where: { slug: a.slug } });
    if (!existing) {
      await prisma.journalArticle.create({ data: a });
    }
  }

  const defaultFaqs = [
    {
      question: 'How do I care for my soy candle on the first burn?',
      answer: 'Allow the melt pool to reach all outer edges before extinguishing. This initial burn creates a memory ring that prevents wax tunneling.',
      category: 'Candle Care',
      sortOrder: 1,
    },
    {
      question: 'How should I trim the cotton wick?',
      answer: 'Always trim the natural cotton wick to approximately 5mm prior to every lighting to ensure a soot-free, balanced flame.',
      category: 'Candle Care',
      sortOrder: 2,
    },
    {
      question: 'Are the ceramics food safe and dishwasher friendly?',
      answer: 'Our wheel-thrown stoneware ceramics are vitrified at 1220°C and glazed with non-toxic mineral glazes. Gentle hand washing is recommended to preserve luster.',
      category: 'Ceramics',
      sortOrder: 3,
    },
    {
      question: 'What are your delivery timelines and shipping charges?',
      answer: 'Orders are prepared in small batches and dispatched within 2 business days. Standard delivery is ₹99 across India, with complimentary shipping on orders over ₹1,499.',
      category: 'Shipping & Delivery',
      sortOrder: 4,
    },
    {
      question: 'Do you offer bespoke gifting hampers and custom scents?',
      answer: 'Yes, we curate custom gift boxes and wedding favors with personalized fragrance selections. Contact us through the studio enquiry form for bulk details.',
      category: 'Custom Orders',
      sortOrder: 5,
    },
  ];

  for (const faq of defaultFaqs) {
    const existingFaq = await prisma.fAQ.findFirst({ where: { question: faq.question } });
    if (!existingFaq) {
      await prisma.fAQ.create({ data: faq });
    }
  }

  const defaultPromos = [
    {
      code: 'WELCOME10',
      description: 'Welcome 10% off on your first handcrafted order',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 499,
      maxDiscount: 250,
      isActive: true,
    },
    {
      code: 'MEADOW15',
      description: 'Special 15% discount for artisanal connoisseurs',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minOrderValue: 999,
      maxDiscount: 500,
      isActive: true,
    },
  ];

  for (const p of defaultPromos) {
    const existingPromo = await prisma.promotion.findUnique({ where: { code: p.code } });
    if (!existingPromo) {
      await prisma.promotion.create({ data: p });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
