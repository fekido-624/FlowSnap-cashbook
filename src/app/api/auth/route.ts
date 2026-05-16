import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

const DEFAULT_ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@flowsnap.local").trim().toLowerCase();
const DEFAULT_ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";

const SALT_ROUNDS = 10;

/**
 * Ensure the default admin account exists in the database.
 * Called on every auth request so the first visit always has an admin ready.
 */
async function ensureAdminExists() {
  const existing = await prisma.user.findFirst({ where: { role: "admin" } });
  if (!existing) {
    const hashed = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, SALT_ROUNDS);
    await prisma.user.create({
      data: {
        email: DEFAULT_ADMIN_EMAIL,
        password: hashed,
        role: "admin",
        status: "active",
      },
    });
  }
}

const safeUser = (user: any) => ({
  uid: user.id,
  email: user.email,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
});

export async function POST(req: Request) {
  const body = await req.json();
  const action = body.action as string;
  const data = body.data || {};

  try {
    // Always ensure admin exists
    await ensureAdminExists();

    switch (action) {
      // ── Login ──────────────────────────────────────────────────────────
      case "login": {
        const email = (data.email || "").trim().toLowerCase();
        const password = data.password || "";

        if (!email) return jsonError("Email diperlukan.", 400);
        if (!password) return jsonError("Kata laluan diperlukan.", 400);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return jsonError("Email atau kata laluan tidak betul. Sila cuba lagi.", 401);

        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) return jsonError("Email atau kata laluan tidak betul. Sila cuba lagi.", 401);

        if (user.status === "pending") {
          return jsonError("Akaun anda masih menunggu kelulusan admin.", 403);
        }
        if (user.status === "frozen") {
          return jsonError("Akaun anda telah dibekukan. Hubungi admin.", 403);
        }

        return json(safeUser(user), 200);
      }

      // ── Signup ─────────────────────────────────────────────────────────
      case "signup": {
        const email = (data.email || "").trim().toLowerCase();
        const password = data.password || "";

        if (!email) return jsonError("Email diperlukan.", 400);
        if (password.length < 6) return jsonError("Kata laluan mesti sekurang-kurangnya 6 aksara.", 400);

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          return jsonError("Email ini telah digunakan. Sila log masuk atau guna email lain.", 409);
        }

        const hashed = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await prisma.user.create({
          data: {
            email,
            password: hashed,
            role: "user",
            status: "pending",
          },
        });

        return json({ success: true, message: "Pendaftaran berjaya. Sila tunggu kelulusan admin." }, 201);
      }

      // ── Change Password ────────────────────────────────────────────────
      case "changePassword": {
        const userId = data.userId;
        const currentPassword = data.currentPassword || "";
        const newPassword = data.newPassword || "";

        if (!userId) return jsonError("Tiada pengguna aktif.", 400);
        if (!currentPassword) return jsonError("Kata laluan semasa diperlukan.", 400);
        if (newPassword.length < 6) return jsonError("Kata laluan baru mesti sekurang-kurangnya 6 aksara.", 400);

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return jsonError("Akaun tidak dijumpai.", 404);

        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) return jsonError("Kata laluan semasa tidak betul.", 401);

        const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await prisma.user.update({
          where: { id: userId },
          data: { password: hashed },
        });

        return json({ success: true }, 200);
      }

      // ── Get All Accounts (Admin only) ──────────────────────────────────
      case "getAccounts": {
        const accounts = await prisma.user.findMany({
          orderBy: { createdAt: "asc" },
        });
        return json(accounts.map(safeUser), 200);
      }

      // ── Update Account Status (Admin only) ─────────────────────────────
      case "updateAccountStatus": {
        const { uid, status } = data;
        if (!uid) return jsonError("uid diperlukan.", 400);
        if (!["pending", "active", "frozen"].includes(status)) {
          return jsonError("Status tidak sah.", 400);
        }

        const user = await prisma.user.findUnique({ where: { id: uid } });
        if (!user) return jsonError("Pengguna tidak dijumpai.", 404);

        await prisma.user.update({
          where: { id: uid },
          data: { status },
        });

        return json({ success: true }, 200);
      }

      // ── Update Account (Admin only) ────────────────────────────────────
      case "updateAccount": {
        const { uid, email, password } = data;
        if (!uid) return jsonError("uid diperlukan.", 400);

        const user = await prisma.user.findUnique({ where: { id: uid } });
        if (!user) return jsonError("Pengguna tidak dijumpai.", 404);

        const normalizedEmail = (email || "").trim().toLowerCase();
        if (!normalizedEmail) return jsonError("Email diperlukan.", 400);

        // Check email uniqueness
        if (normalizedEmail !== user.email) {
          const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
          if (existing) return jsonError("Email sudah digunakan oleh pengguna lain.", 409);
        }

        const updateData: any = { email: normalizedEmail };
        if (password && password.length >= 6) {
          updateData.password = await bcrypt.hash(password, SALT_ROUNDS);
        } else if (password && password.length > 0 && password.length < 6) {
          return jsonError("Kata laluan mesti sekurang-kurangnya 6 aksara jika ditukar.", 400);
        }

        const updated = await prisma.user.update({
          where: { id: uid },
          data: updateData,
        });

        return json(safeUser(updated), 200);
      }

      // ── Delete Account (Admin only) ────────────────────────────────────
      case "deleteAccount": {
        const { uid } = data;
        if (!uid) return jsonError("uid diperlukan.", 400);

        const user = await prisma.user.findUnique({ where: { id: uid } });
        if (!user) return jsonError("Pengguna tidak dijumpai.", 404);
        if (user.role === "admin") return jsonError("Akaun admin tidak boleh dipadam.", 403);

        // Delete all user data first
        await prisma.transaction.deleteMany({ where: { userId: uid } });
        await prisma.checklist.deleteMany({ where: { userId: uid } });
        await prisma.book.deleteMany({ where: { userId: uid } });
        // Delete the user account
        await prisma.user.delete({ where: { id: uid } });

        return json({ success: true }, 200);
      }

      default:
        return jsonError("Action tidak dikenali.", 400);
    }
  } catch (error: any) {
    console.error("[Auth API Error]", error);
    return jsonError(error?.message || "Ralat dalaman.", 500);
  }
}

function json(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
