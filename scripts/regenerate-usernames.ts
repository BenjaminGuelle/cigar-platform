import { PrismaClient } from '../generated/prisma';
import { slugify, ensureMinLength, generateUniqueUsername } from '../apps/api/src/common/utils/username.utils';

const prisma = new PrismaClient();

async function regenerateUsernames() {
  try {
    console.log('🔄 Starting username regeneration...\n');

    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true, displayName: true, username: true },
    });

    console.log(`Found ${users.length} users to process\n`);

    // Get all existing usernames for uniqueness check
    const existingUsernames = users.map(u => u.username);

    let updatedCount = 0;

    for (const user of users) {
      // Generate new username from displayName
      const newUsername = generateUniqueUsername(
        user.displayName,
        existingUsernames.filter(u => u !== user.username), // Exclude current user's username
        'user'
      );

      if (user.username !== newUsername) {
        // Update username
        await prisma.user.update({
          where: { id: user.id },
          data: { username: newUsername },
        });

        console.log(`✅ Updated user ${user.id}: "${user.username}" → "${newUsername}"`);

        // Update the existingUsernames array for subsequent iterations
        const index = existingUsernames.indexOf(user.username);
        if (index > -1) {
          existingUsernames[index] = newUsername;
        }

        updatedCount++;
      } else {
        console.log(`⏭️  Skipped user ${user.id}: "${user.username}" (already correct)`);
      }
    }

    console.log(`\n✨ Done! Updated ${updatedCount} usernames`);
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

regenerateUsernames();