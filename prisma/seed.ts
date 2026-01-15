import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function main() {
  console.warn('Seeding database...');

  // Create a demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-studio' },
    update: {},
    create: {
      slug: 'demo-studio',
      name: 'Demo Photo Studio',
      tier: 'pro',
      status: 'active',
      brandColor: '#10b981',
    },
  });

  console.warn(`Created tenant: ${tenant.name} (${tenant.slug})`);

  // Create a demo user with password "demo1234"
  const passwordHash = await bcrypt.hash('demo1234', 10);

  const user = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'demo@lumora.hr' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'demo@lumora.hr',
      name: 'Demo User',
      passwordHash,
      role: 'owner',
      emailVerified: new Date(),
    },
  });

  console.warn(`Created user: ${user.email}`);

  // Create a sample gallery
  const galleryCode = generateCode();
  const gallery = await prisma.gallery.upsert({
    where: { code: galleryCode },
    update: {},
    create: {
      tenantId: tenant.id,
      code: galleryCode,
      title: 'Sample Wedding Gallery',
      description: 'A beautiful sample wedding photo gallery',
      status: 'published',
      visibility: 'public',
    },
  });

  console.warn(`Created gallery: ${gallery.title} (code: ${gallery.code})`);

  // Create a sample product
  const product = await prisma.product.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      tenantId: tenant.id,
      name: 'Print 10x15cm',
      description: 'High quality photo print',
      price: 500, // 5.00 EUR in cents
      type: 'print',
      isActive: true,
      metadata: { size: '10x15cm', paper: 'glossy' },
    },
  });

  console.warn(`Created product: ${product.name}`);

  console.warn('\n✅ Seed completed!');
  console.warn('\n📧 Login credentials:');
  console.warn('   Email: demo@lumora.hr');
  console.warn('   Password: demo1234');
  console.warn(`   Tenant: ${tenant.slug}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
