// MongoDB Initialization Script
// This script runs when the MongoDB container starts for the first time

// Switch to the application database
db = db.getSiblingDB('auto-rpg-db');

// Create collections with initial indexes
db.createCollection('players');
db.createCollection('parties');
db.createCollection('dungeons');
db.createCollection('combat_results');

// Create indexes for better performance
db.players.createIndex({ "username": 1 }, { unique: true });
db.players.createIndex({ "level": 1 });
db.players.createIndex({ "experience": 1 });

db.parties.createIndex({ "playerId": 1 });
db.parties.createIndex({ "createdAt": 1 });

db.dungeons.createIndex({ "name": 1 }, { unique: true });
db.dungeons.createIndex({ "difficulty": 1 });

db.combat_results.createIndex({ "partyId": 1 });
db.combat_results.createIndex({ "dungeonId": 1 });
db.combat_results.createIndex({ "createdAt": 1 });

// Insert a sample player for testing (optional)
db.players.insertOne({
  username: "test_player",
  level: 1,
  experience: 0,
  createdAt: new Date(),
  updatedAt: new Date()
});

print("✅ MongoDB initialization completed successfully!");
print("📊 Created collections: players, parties, dungeons, combat_results");
print("🔍 Created performance indexes");
print("👤 Inserted test player: test_player");