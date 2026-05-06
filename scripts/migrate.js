/**
 * Migration Script: Convert string-based fields to ObjectId references
 * 
 * Run this ONCE after upgrading schemas:
 *   node scripts/migrate.js
 * 
 * What it does:
 * - Converts Post.author from username string → User ObjectId
 * - Converts Post.likes from username strings → User ObjectIds
 * - Converts Post.comments[].author from username string → User ObjectId
 * - Sets default category 'General' on posts without one
 * - Sets default role 'author' on users without one
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Post = require('../models/Post');

async function migrate() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Step 1: Ensure all users have a role
    const usersWithoutRole = await User.updateMany(
      { role: { $exists: false } },
      { $set: { role: 'author' } }
    );
    console.log(`📌 Set default role for ${usersWithoutRole.modifiedCount} users`);

    // Step 2: Build username → userId lookup map
    const allUsers = await User.find().select('username _id');
    const userMap = {};
    allUsers.forEach((u) => {
      userMap[u.username.toLowerCase()] = u._id;
    });
    console.log(`📋 Found ${allUsers.length} users for mapping`);

    // Step 3: Migrate posts
    const posts = await Post.find();
    let migratedCount = 0;

    for (const post of posts) {
      let needsSave = false;

      // Migrate author (string → ObjectId)
      if (typeof post.author === 'string') {
        const userId = userMap[post.author.toLowerCase()];
        if (userId) {
          post.author = userId;
          needsSave = true;
        } else {
          console.warn(`  ⚠️ Post "${post.title}" — author "${post.author}" not found in users`);
        }
      }

      // Set default category
      if (!post.category) {
        post.category = 'General';
        needsSave = true;
      }

      // Migrate likes (string[] → ObjectId[])
      if (post.likes && post.likes.length > 0) {
        const newLikes = [];
        for (const like of post.likes) {
          if (typeof like === 'string') {
            const userId = userMap[like.toLowerCase()];
            if (userId) {
              newLikes.push(userId);
            }
          } else {
            newLikes.push(like); // Already an ObjectId
          }
        }
        post.likes = newLikes;
        needsSave = true;
      }

      // Migrate comment authors (string → ObjectId)
      if (post.comments && post.comments.length > 0) {
        for (const comment of post.comments) {
          if (typeof comment.author === 'string') {
            const userId = userMap[comment.author.toLowerCase()];
            if (userId) {
              comment.author = userId;
              needsSave = true;
            }
          }
        }
      }

      if (needsSave) {
        await post.save({ validateBeforeSave: false });
        migratedCount++;
      }
    }

    console.log(`✅ Migrated ${migratedCount} out of ${posts.length} posts`);
    console.log('🎉 Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrate();
