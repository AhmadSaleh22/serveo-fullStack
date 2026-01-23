import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DEFAULT_BUSINESS_HOURS } from '@repo/shared';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.item.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.restaurant.deleteMany();

  // Create demo restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'Shawarma Palace',
      nameAr: 'قصر الشاورما',
      slug: 'shawarma-palace',
      phone: '01012345678',
      whatsappEnabled: true,
      logoUrl: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400',
      address: 'Maadi, Cairo, Egypt',
      addressAr: 'المعادي، القاهرة، مصر',
      hoursJson: DEFAULT_BUSINESS_HOURS,
      minOrder: 50,
      deliveryFee: 20,
      currency: 'EGP',
    },
  });

  console.log(`✅ Created restaurant: ${restaurant.name}`);

  // Create demo user (owner)
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'owner@shawarma-palace.com',
      passwordHash,
      role: 'OWNER',
      restaurantId: restaurant.id,
    },
  });

  console.log(`✅ Created user: ${user.email}`);

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Shawarma',
        nameAr: 'شاورما',
        sortOrder: 0,
      },
    }),
    prisma.category.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Grills',
        nameAr: 'مشويات',
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Sandwiches',
        nameAr: 'ساندويتشات',
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Sides',
        nameAr: 'أطباق جانبية',
        sortOrder: 3,
      },
    }),
    prisma.category.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Beverages',
        nameAr: 'مشروبات',
        sortOrder: 4,
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create items
  const items = await Promise.all([
    // Shawarma items
    prisma.item.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categories[0].id,
        name: 'Chicken Shawarma Plate',
        nameAr: 'طبق شاورما دجاج',
        description: 'Tender chicken shawarma served with rice, salad, and garlic sauce',
        descriptionAr: 'شاورما دجاج طرية تقدم مع الأرز والسلطة وصوص الثوم',
        price: 85,
        imageUrl: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400',
        isAvailable: true,
      },
    }),
    prisma.item.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categories[0].id,
        name: 'Beef Shawarma Plate',
        nameAr: 'طبق شاورما لحم',
        description: 'Premium beef shawarma with rice, salad, and tahini',
        descriptionAr: 'شاورما لحم فاخرة مع الأرز والسلطة والطحينة',
        price: 95,
        imageUrl: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=400',
        isAvailable: true,
      },
    }),
    prisma.item.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categories[0].id,
        name: 'Mixed Shawarma Plate',
        nameAr: 'طبق شاورما ميكس',
        description: 'Both chicken and beef shawarma with all the fixings',
        descriptionAr: 'شاورما دجاج ولحم مع جميع الإضافات',
        price: 110,
        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
        isAvailable: true,
      },
    }),

    // Grills
    prisma.item.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categories[1].id,
        name: 'Grilled Chicken',
        nameAr: 'دجاج مشوي',
        description: 'Half grilled chicken with rice and salad',
        descriptionAr: 'نصف دجاجة مشوية مع الأرز والسلطة',
        price: 120,
        imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400',
        isAvailable: true,
      },
    }),
    prisma.item.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categories[1].id,
        name: 'Kofta Plate',
        nameAr: 'طبق كفتة',
        description: 'Grilled kofta skewers with rice and tahini',
        descriptionAr: 'أسياخ كفتة مشوية مع الأرز والطحينة',
        price: 90,
        imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
        isAvailable: true,
      },
    }),
    prisma.item.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categories[1].id,
        name: 'Mixed Grill Platter',
        nameAr: 'طبق مشويات مشكل',
        description: 'Assortment of grilled meats with sides',
        descriptionAr: 'تشكيلة من اللحوم المشوية مع الأطباق الجانبية',
        price: 180,
        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
        isAvailable: true,
      },
    }),

    // Sandwiches
    prisma.item.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categories[2].id,
        name: 'Chicken Shawarma Sandwich',
        nameAr: 'ساندويتش شاورما دجاج',
        description: 'Chicken shawarma in fresh Arabic bread',
        descriptionAr: 'شاورما دجاج في خبز عربي طازج',
        price: 45,
        imageUrl: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400',
        isAvailable: true,
      },
    }),
    prisma.item.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categories[2].id,
        name: 'Beef Shawarma Sandwich',
        nameAr: 'ساندويتش شاورما لحم',
        description: 'Beef shawarma in fresh Arabic bread',
        descriptionAr: 'شاورما لحم في خبز عربي طازج',
        price: 50,
        imageUrl: 'https://images.unsplash.com/photo-1561758033-f5f0e3c48a2f?w=400',
        isAvailable: true,
      },
    }),
    prisma.item.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categories[2].id,
        name: 'Falafel Sandwich',
        nameAr: 'ساندويتش فلافل',
        description: 'Crispy falafel with tahini and vegetables',
        descriptionAr: 'فلافل مقرمشة مع الطحينة والخضار',
        price: 30,
        imageUrl: 'https://images.unsplash.com/photo-1593001874117-c99c800e3eb7?w=400',
        isAvailable: true,
      },
    }),

    // Sides
    prisma.item.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categories[3].id,
        name: 'French Fries',
        nameAr: 'بطاطس مقلية',
        description: 'Crispy golden fries',
        descriptionAr: 'بطاطس مقلية ذهبية مقرمشة',
        price: 25,
        imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
        isAvailable: true,
      },
    }),
    prisma.item.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categories[3].id,
        name: 'Hummus',
        nameAr: 'حمص',
        description: 'Creamy hummus with olive oil',
        descriptionAr: 'حمص كريمي مع زيت الزيتون',
        price: 20,
        imageUrl: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=400',
        isAvailable: true,
      },
    }),
    prisma.item.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categories[3].id,
        name: 'Fattoush Salad',
        nameAr: 'سلطة فتوش',
        description: 'Fresh Lebanese salad with crispy bread',
        descriptionAr: 'سلطة لبنانية طازجة مع الخبز المقرمش',
        price: 30,
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
        isAvailable: true,
      },
    }),

    // Beverages
    prisma.item.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categories[4].id,
        name: 'Soft Drink',
        nameAr: 'مشروب غازي',
        description: 'Pepsi, 7Up, or Mirinda',
        descriptionAr: 'بيبسي، سفن أب، أو ميرندا',
        price: 15,
        imageUrl: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400',
        isAvailable: true,
      },
    }),
    prisma.item.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categories[4].id,
        name: 'Fresh Lemon Mint',
        nameAr: 'ليمون بالنعناع',
        description: 'Freshly squeezed lemon with mint',
        descriptionAr: 'ليمون طازج بالنعناع',
        price: 25,
        imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
        isAvailable: true,
      },
    }),
    prisma.item.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categories[4].id,
        name: 'Water Bottle',
        nameAr: 'زجاجة مياه',
        description: '500ml bottled water',
        descriptionAr: 'زجاجة مياه 500 مل',
        price: 10,
        imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400',
        isAvailable: true,
      },
    }),
  ]);

  console.log(`✅ Created ${items.length} items`);

  // Create a sample order
  const order = await prisma.order.create({
    data: {
      restaurantId: restaurant.id,
      orderNumber: '20240115-DEMO',
      customerName: 'Ahmed Mohamed',
      customerPhone: '01098765432',
      addressJson: {
        area: 'Maadi',
        street: 'Street 9',
        building: '15',
        floor: '3',
        apartment: '5',
      },
      notes: 'Please call before delivery',
      paymentMethod: 'CASH',
      subtotal: 175,
      deliveryFee: 20,
      total: 195,
      status: 'COMPLETED',
      items: {
        create: [
          {
            itemId: items[0].id,
            nameSnapshot: items[0].name,
            nameSnapshotAr: items[0].nameAr,
            priceSnapshot: items[0].price,
            quantity: 2,
          },
          {
            itemId: items[10].id,
            nameSnapshot: items[10].name,
            nameSnapshotAr: items[10].nameAr,
            priceSnapshot: items[10].price,
            quantity: 1,
          },
        ],
      },
    },
  });

  console.log(`✅ Created sample order: ${order.orderNumber}`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Demo credentials:');
  console.log('   Email: owner@shawarma-palace.com');
  console.log('   Password: password123');
  console.log(`\n🌐 Public menu: http://localhost:3000/r/${restaurant.slug}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
