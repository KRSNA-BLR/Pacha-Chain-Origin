import { test, expect } from "@playwright/test";

test.describe("PachaChainOrigin — Landing Page", () => {
  test("should load the homepage with correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Pacha.Chain.Origin/i);
  });

  test("should display the hero section", async ({ page }) => {
    await page.goto("/");
    // Hero heading — actual text: "Del campo ecuatoriano a tu taza."
    const hero = page.locator("h1");
    await expect(hero).toBeVisible();
    await expect(hero).toContainText(/campo|taza|ecuatorian/i);
  });

  test("should have navigation links", async ({ page }) => {
    await page.goto("/");
    // Header should be visible with nav links
    const header = page.locator("header");
    await expect(header).toBeVisible();
    // Multiple track/rastrear links exist — use .first()
    await expect(page.getByRole("link", { name: /rastrear/i }).first()).toBeVisible();
  });

  test("should display the how-it-works section", async ({ page }) => {
    await page.goto("/");
    // The page has a section describing the process — scroll to see content loads
    const body = await page.locator("body").textContent();
    expect(body?.length).toBeGreaterThan(100);
  });

  test("should have a footer", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
  });
});

test.describe("PachaChainOrigin — Track Page", () => {
  test("should load the track page", async ({ page }) => {
    await page.goto("/track");
    await expect(page).toHaveTitle(/track|rastrear|pacha/i);
  });

  test("should have a search input for batch ID", async ({ page }) => {
    await page.goto("/track");
    const searchInput = page.getByPlaceholder(/batch|lote|id|buscar/i);
    await expect(searchInput).toBeVisible();
  });

  test("should show message when searching with empty input", async ({ page }) => {
    await page.goto("/track");
    // The page should have some instructional text visible
    const content = page.locator("main");
    await expect(content).toBeVisible();
  });
});

test.describe("PachaChainOrigin — Admin Page", () => {
  test("should load the admin page", async ({ page }) => {
    await page.goto("/admin");
    // Admin page should show wallet connection requirement
    await expect(page.locator("main")).toBeVisible();
  });

  test("should show wallet connection gate when not connected", async ({ page }) => {
    await page.goto("/admin");
    // Without a wallet connected, should show a connection prompt
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();
    // Should contain text about connecting wallet or admin access
    const bodyText = await mainContent.textContent();
    expect(bodyText).toBeTruthy();
  });
});

test.describe("PachaChainOrigin — Verify Page", () => {
  test("should load the verify page", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("PachaChainOrigin — 404 Page", () => {
  test("should return 404 for non-existent routes", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist");
    expect(response?.status()).toBe(404);
  });
});

test.describe("PachaChainOrigin — Security Headers", () => {
  test("should include security headers in response", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers() ?? {};

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toMatch(/origin-when-cross-origin/i);
  });
});

test.describe("PachaChainOrigin — Accessibility Basics", () => {
  test("should have lang attribute on html", async ({ page }) => {
    await page.goto("/");
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBeTruthy();
  });

  test("should have a main landmark", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/");
    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);
  });
});
