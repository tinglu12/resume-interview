import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import path from "node:path";

setup.describe.configure({ mode: "serial" });

setup("global setup", async () => {
  await clerkSetup();
});

const authFile = path.join(__dirname, ".auth/user.json");

setup("authenticate and save state to storage", async ({ page }) => {
  await page.goto("/");
  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_CLERK_USER_EMAIL!,
  });
  // Exercises src/proxy.ts's clerkMiddleware + auth.protect() directly —
  // an invalid session bounces to /sign-in and this fails loudly.
  await page.goto("/dashboard");
  await page.waitForURL("/dashboard");
  await page.context().storageState({ path: authFile });
});
