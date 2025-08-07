import { db } from './server/db';
import { users, venues, resources } from '@shared/schema';
import { hashPassword } from './server/auth';

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database with basic data...');

    // Create admin user
    const hashedPassword = await hashPassword('admin');
    
    const adminUser = await db.insert(users).values({
      username: 'admin',
      email: 'admin@drdo.gov.in',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Director',
      role: 'group_director',
      department: 'Administration',
    }).returning();

    console.log('✅ Created admin user:', adminUser[0].username);

    // Create a basic venue
    const venue = await db.insert(venues).values({
      name: 'Main Auditorium',
      capacity: 500,
      floor: 'Ground',
      amenities: ['AC', 'Audio System', 'Stage'],
      status: 'available',
    }).returning();

    console.log('✅ Created venue:', venue[0].name);

    // Create basic resources
    const resource = await db.insert(resources).values({
      name: 'Projector',
      description: 'High-resolution projector',
      available: true,
    }).returning();

    console.log('✅ Created resource:', resource[0].name);
    console.log('🎉 Basic seeding completed!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}

seedDatabase();