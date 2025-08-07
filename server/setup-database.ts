import { db } from './db';
import { users, venues, resources, bookings, bookingHistory } from '@shared/schema';
import { hashPassword } from './auth';
import fs from 'fs';
import path from 'path';

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database...');

    // Read and execute migration SQL
    const migrationPath = path.join(process.cwd(), 'migrations', '0000_bouncy_clint_barton.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by statement breakpoint and execute each statement
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📝 Executing ${statements.length} migration statements...`);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await db.execute(statement as any);
        } catch (error: any) {
          // Ignore "already exists" errors
          if (!error.message?.includes('already exists')) {
            console.warn(`⚠️  Warning executing statement: ${error.message}`);
          }
        }
      }
    }

    console.log('✅ Database schema created successfully');

    // Check if data already exists
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log('📊 Database already has data, skipping seeding');
      return;
    }

    console.log('🌱 Seeding database with initial data...');

    // Create users with hashed passwords
    const hashedPassword = await hashPassword('admin');
    
    const initialUsers = [
      {
        username: 'admin',
        email: 'admin@drdo.gov.in',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Director',
        role: 'group_director' as const,
        department: 'Administration',
      },
      {
        username: 'user',
        email: 'user@drdo.gov.in',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'user' as const,
        department: 'Research & Development',
      },
      {
        username: 'secretary',
        email: 'secretary@drdo.gov.in',
        password: hashedPassword,
        firstName: 'Secretary',
        lastName: 'Admin',
        role: 'secretary' as const,
        department: 'Administration',
      },
      {
        username: 'itteam',
        email: 'it@drdo.gov.in',
        password: hashedPassword,
        firstName: 'IT',
        lastName: 'Team',
        role: 'it_team' as const,
        department: 'Information Technology',
      },
    ];

    const createdUsers = await db.insert(users).values(initialUsers).returning();
    console.log(`👥 Created ${createdUsers.length} users`);

    // Create venues
    const initialVenues = [
      {
        name: 'Main Auditorium',
        capacity: 500,
        floor: 'Ground',
        amenities: ['AC', 'Audio System', 'Stage', 'Advanced Lighting'],
        status: 'available' as const,
      },
      {
        name: 'Conference Room - DRDO Main',
        capacity: 30,
        floor: 'Second',
        amenities: ['AC', 'Video Conference', 'Smart TV'],
        status: 'available' as const,
      },
      {
        name: 'Training Room - DRDO Lab',
        capacity: 50,
        floor: 'First',
        amenities: ['AC', 'Projector', 'Whiteboard', 'Audio System'],
        status: 'available' as const,
      },
    ];

    const createdVenues = await db.insert(venues).values(initialVenues).returning();
    console.log(`🏢 Created ${createdVenues.length} venues`);

    // Create resources
    const initialResources = [
      { name: 'Projector', description: 'High-resolution projector for presentations', available: true },
      { name: 'Microphone System', description: 'Wireless microphone system', available: true },
      { name: 'Video Conference', description: 'Video conferencing equipment', available: true },
      { name: 'Recording Equipment', description: 'Audio/video recording setup', available: true },
      { name: 'Smart TV', description: '65-inch smart TV for presentations', available: true },
      { name: 'Audio System', description: 'Professional audio system', available: true },
      { name: 'Stage Lighting', description: 'Professional stage lighting system', available: true },
      { name: 'Whiteboard', description: 'Interactive whiteboard', available: true },
    ];

    const createdResources = await db.insert(resources).values(initialResources).returning();
    console.log(`🔧 Created ${createdResources.length} resources`);

    // Create sample bookings
    const regularUser = createdUsers.find(u => u.role === 'user');
    const mainAuditorium = createdVenues.find(v => v.name === 'Main Auditorium');
    const conferenceRoom = createdVenues.find(v => v.name === 'Conference Room - DRDO Main');
    const trainingRoom = createdVenues.find(v => v.name === 'Training Room - DRDO Lab');

    if (regularUser && mainAuditorium && conferenceRoom && trainingRoom) {
      const sampleBookings = [
        {
          userId: regularUser.id,
          venueId: mainAuditorium.id,
          eventTitle: 'Annual Research Presentation',
          eventDescription: 'Presentation of annual research findings and future roadmap',
          meetingType: 'offline' as const,
          department: 'Research & Development',
          eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          startTime: '10:00',
          endTime: '12:00',
          expectedAttendees: 150,
          requestedResources: ['Projector', 'Microphone System', 'Recording Equipment'],
          specialRequirements: 'Need high-quality audio recording for documentation',
          status: 'submitted' as const,
        },
        {
          userId: regularUser.id,
          venueId: conferenceRoom.id,
          eventTitle: 'Project Review Meeting',
          eventDescription: 'Quarterly project review with stakeholders',
          meetingType: 'offline' as const,
          department: 'Project Management',
          eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          startTime: '14:00',
          endTime: '16:00',
          expectedAttendees: 25,
          requestedResources: ['Video Conference', 'Smart TV'],
          specialRequirements: 'Remote participants will join via video conference',
          status: 'submitted' as const,
        },
        {
          userId: regularUser.id,
          venueId: mainAuditorium.id,
          eventTitle: 'Defense Technology Seminar',
          eventDescription: 'Seminar on latest defense technologies and innovations',
          meetingType: 'offline' as const,
          department: 'Technology Development',
          eventDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          startTime: '09:00',
          endTime: '17:00',
          expectedAttendees: 300,
          requestedResources: ['Audio System', 'Stage Lighting', 'Recording Equipment'],
          specialRequirements: 'Full day event with lunch break, need catering arrangements',
          status: 'gd_approved' as const,
        },
        {
          userId: regularUser.id,
          venueId: conferenceRoom.id,
          eventTitle: 'Strategic Planning Workshop',
          eventDescription: 'Annual strategic planning session for upcoming projects',
          meetingType: 'offline' as const,
          department: 'Strategic Planning',
          eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          startTime: '09:00',
          endTime: '15:00',
          expectedAttendees: 20,
          requestedResources: ['Video Conference', 'Smart TV', 'Whiteboard'],
          specialRequirements: 'Need catering for full day workshop',
          status: 'gd_approved' as const,
        },
        {
          userId: regularUser.id,
          venueId: trainingRoom.id,
          eventTitle: 'Technical Training Session',
          eventDescription: 'Training session on new defense technologies for technical staff',
          meetingType: 'offline' as const,
          department: 'Technical Training',
          eventDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          startTime: '10:00',
          endTime: '16:00',
          expectedAttendees: 40,
          requestedResources: ['Projector', 'Microphone System', 'Video Conference', 'Recording Equipment'],
          specialRequirements: 'Need recording for training documentation and remote participants',
          status: 'secretary_approved' as const,
        },
        {
          userId: regularUser.id,
          venueId: conferenceRoom.id,
          eventTitle: 'Board Meeting',
          eventDescription: 'Monthly board meeting with senior officials',
          meetingType: 'offline' as const,
          department: 'Administration',
          eventDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          startTime: '14:00',
          endTime: '17:00',
          expectedAttendees: 15,
          requestedResources: ['Smart TV', 'Video Conference', 'Audio System'],
          specialRequirements: 'High priority meeting, ensure all systems are working perfectly',
          status: 'secretary_approved' as const,
        },
      ];

      const createdBookings = await db.insert(bookings).values(sampleBookings).returning();
      console.log(`📅 Created ${createdBookings.length} sample bookings`);

      // Create booking history
      const director = createdUsers.find(u => u.role === 'group_director');
      const secretary = createdUsers.find(u => u.role === 'secretary');

      if (director && secretary) {
        const historyEntries = [];

        // Add history for all bookings
        for (const booking of createdBookings) {
          historyEntries.push({
            bookingId: booking.id,
            status: 'submitted' as const,
            remarks: 'Booking request submitted for review',
            changedBy: regularUser.id,
          });

          if (booking.status === 'gd_approved' || booking.status === 'secretary_approved') {
            historyEntries.push({
              bookingId: booking.id,
              status: 'gd_approved' as const,
              remarks: `Approved by Group Director - ${booking.eventTitle}`,
              changedBy: director.id,
            });
          }

          if (booking.status === 'secretary_approved') {
            historyEntries.push({
              bookingId: booking.id,
              status: 'secretary_approved' as const,
              remarks: `Approved by Secretary - proceed with IT setup`,
              changedBy: secretary.id,
            });
          }
        }

        await db.insert(bookingHistory).values(historyEntries);
        console.log(`📝 Created ${historyEntries.length} booking history entries`);
      }
    }

    console.log('🎉 Database setup completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👥 Users: ${createdUsers.length}`);
    console.log(`🏢 Venues: ${createdVenues.length}`);
    console.log(`🔧 Resources: ${createdResources.length}`);
    console.log(`📅 Sample Bookings: 6`);
    console.log('\n🔑 Login Credentials (all use password: "admin"):');
    console.log('• Director: admin / admin');
    console.log('• Secretary: secretary / admin');
    console.log('• IT Team: itteam / admin');
    console.log('• User: user / admin');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase()
    .then(() => {
      console.log('✅ Setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

export { setupDatabase };