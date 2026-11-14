import { test, expect } from "@playwright/test";

// Real full-stack boundaries: no fabricated clips, API mocks, or replacement video.
test("finds a player, combines filters, and clears a genuine empty result", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("article")).toHaveCount(24);
  await page.getByRole("searchbox").fill("Cade Cunningham");
  await expect(page.locator("article").first()).toBeVisible();
  await expect(page).toHaveURL(/q=Cade/);
  await expect
    .poll(async () => page.locator("article").count())
    .toBeGreaterThan(0);
  await page
    .getByRole("group", { name: "Filter by play type" })
    .getByRole("button", { name: "Dunks", exact: true })
    .click();
  await expect(
    page
      .getByRole("group", { name: "Filter by play type" })
      .getByRole("button", { name: "Dunks", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Team", { exact: true }).selectOption("13");
  await expect(
    page.getByRole("heading", { name: "No plays. Yet." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .first()
    .click();
  await expect(page.locator("article")).toHaveCount(24);
  await page.getByRole("button", { name: "More moments, please" }).click();
  await expect(page.locator("article")).toHaveCount(48);
  await page.getByRole("button", { name: "List view" }).click();
  await expect(page.getByRole("button", { name: "List view" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("plays real video, saves across reloads, and opens a shared deep link", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Watch spotlight:/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const video = dialog.locator("video");
  await expect
    .poll(() => video.evaluate((v) => v.readyState), { timeout: 30000 })
    .toBeGreaterThanOrEqual(2);
  await video.evaluate((v) => {
    v.muted = true;
    return v.play();
  });
  await expect
    .poll(() => video.evaluate((v) => v.currentTime))
    .toBeGreaterThan(0.2);
  const title = await dialog.getByRole("heading").textContent();
  const deepLink = page.url();
  await dialog.getByRole("button", { name: "Save clip", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "Saved to film room" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: /^Saved clips/ }).click();
  await expect(page.locator("article")).toHaveCount(1);
  await page.reload();
  await expect(page.locator("article")).toHaveCount(1);
  const shared = await context.newPage();
  await shared.goto(deepLink);
  await expect(shared.getByRole("dialog").getByRole("heading")).toHaveText(
    title,
  );
  await shared.close();
  await page
    .locator("article")
    .getByRole("button", { name: /^Unsave/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "A film room of your own." }),
  ).toBeVisible();
});

test("mobile navigation, player directory, and keyboard search remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("article")).toHaveCount(24);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect
    .poll(() =>
      page
        .locator("main section img")
        .first()
        .evaluate((img) => img.complete && img.naturalWidth > 0),
    )
    .toBe(true);
  await page.screenshot({ path: ".artifacts/mobile-viewport.png" });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Players", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /Know your players/i }),
  ).toBeVisible();
  await page.getByRole("searchbox").fill("Cade");
  await page
    .getByRole("button", { name: "Cade Cunningham", exact: true })
    .click();
  await expect(page.getByRole("searchbox")).toHaveValue("Cade Cunningham");
  await page.getByRole("button", { name: "Clear search" }).click();
  await page.getByRole("searchbox").blur();
  await page.keyboard.press("/");
  await expect(page.getByRole("searchbox")).toBeFocused();
});

test("an API outage shows a recoverable error rather than an empty archive", async ({
  page,
}) => {
  await page.route("**/api/clips?**", (route) =>
    route.fulfill({ status: 503, body: "{}" }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A timeout. Not the end of the game." }),
  ).toBeVisible();
  await page.unroute("**/api/clips?**");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.locator("article")).toHaveCount(24);
});
