import * as admin from "firebase-admin";
import * as path from "path";
import * as bcrypt from "bcrypt";

const serviceAccountPath = path.resolve(__dirname, "../serviceAccountKey.json");
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkUsers() {
  console.log("Checking users in Firestore...");
  const snapshot = await db.collection("users").get();

  if (snapshot.empty) {
    console.log("No users found in the database.");
    return;
  }

  console.log(`Found ${snapshot.size} user(s):`);
  snapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`- Username: ${data.username}`);
    console.log(`  Email: ${data.email}`);
    console.log(`  User ID: ${data.userId}`);
    console.log(`  Password Hash Length: ${data.password?.length}`);
    console.log(`  Created At: ${data.createdAt}`);
    console.log("-------------------");
  });
}

checkUsers().catch((err) => {
  console.error("Error checking users:", err);
  process.exit(1);
});
