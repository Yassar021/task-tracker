import { auth } from "../lib/auth";
import { db, users } from "../db";
import { eq } from "drizzle-orm";

async function createAdminAccount() {
  try {
    console.log("🔧 Creating default admin account...");

    // Create default admin user
    const adminUser = await auth.api.signUpEmail({
      body: {
        email: "admin@ypssingkole.sch.id",
        password: "admin123456",
        name: "Administrator YPS",
      },
    });

    if (adminUser.user) {
      console.log("✅ Admin account created successfully!");
      console.log("📧 Email: admin@ypssingkole.sch.id");
      console.log("🔑 Password: admin123456");
      console.log("👤 User ID:", adminUser.user.id);

      // Update user role to admin in database
      if (db && users) {
        await db.update(users)
          .set({ role: 'admin' })
          .where(eq(users.id, adminUser.user.id));

        console.log("✅ User role updated to admin");
      }
    } else {
      console.log("❌ Failed to create admin account");
    }
  } catch (error) {
    console.error("Error creating admin account:", error);

    // Check if admin already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).message?.includes("already exists") || (error as any).message?.includes("duplicate")) {
      console.log("ℹ️ Admin account might already exist. Trying to update role...");

      try {
        // Try to get existing user and update role
        const session = await auth.api.signInEmail({
          body: {
            email: "admin@ypssingkole.sch.id",
            password: "admin123456",
          },
        });

        if (session.user && db && users) {
          await db.update(users)
            .set({ role: 'admin' })
            .where(eq(users.email, "admin@ypssingkole.sch.id"));

          console.log("✅ Existing admin account updated with admin role");
        }
      } catch (signInError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.log("❌ Could not update existing account:", (signInError as any).message);
      }
    }
  }
}

createAdminAccount();