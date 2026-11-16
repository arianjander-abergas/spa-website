import { expect, test } from "@playwright/test";

// Books a real appointment against the connected database, then cancels it
// through the guest's own "manage booking" page so the slot is freed again.
test("a guest can book a treatment and then cancel it", async ({ page }, testInfo) => {
  const shot = (name: string) =>
    page.screenshot({ path: `test-results/shots/${testInfo.project.name}-${name}.png`, fullPage: true });

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await shot("1-home");

  await page.goto("/treatments");
  await shot("2-treatments");
  await page.getByRole("link", { name: "Book Signature Massage" }).click();

  // Step 2 opens directly because the treatment is already chosen.
  await expect(page.getByRole("heading", { name: "Choose a date and time" })).toBeVisible();
  const firstTime = page.locator("fieldset button").first();
  await firstTime.click();
  await expect(firstTime).toHaveAttribute("aria-pressed", "true");
  await shot("3-date-time");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 3: empty form shows plain-language errors beside the fields.
  await expect(page.getByRole("heading", { name: "Your details" })).toBeVisible();
  await page.getByRole("button", { name: "Review booking" }).click();
  await expect(page.getByText("Please enter your full name.")).toBeVisible();
  await shot("4-details-errors");

  await page.getByLabel("Full name").fill("Playwright Guest");
  await page.getByLabel("Email").fill(`e2e-ui-${testInfo.project.name}@example.com`);
  await page.getByLabel("Mobile number").fill("0917 000 0000");
  await page.getByRole("button", { name: "Review booking" }).click();

  // Step 4
  await expect(page.getByRole("heading", { name: "Review and confirm" })).toBeVisible();
  await shot("5-review");
  await page.getByRole("button", { name: "Confirm booking" }).click();

  await page.waitForURL(/\/book\/confirmed\//);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("booked");
  await shot("6-confirmed");

  // The calendar file downloads.
  const token = page.url().split("/").pop()!;
  const ics = await page.request.get(`/booking/${token}/calendar`);
  expect(ics.ok()).toBeTruthy();
  expect(await ics.text()).toContain("BEGIN:VEVENT");

  // Cancel it again.
  await page.getByRole("link", { name: "Move or cancel" }).click();
  await expect(page.getByRole("heading", { name: "Your booking" })).toBeVisible();
  await shot("7-manage");
  await page.getByRole("button", { name: "Cancel booking" }).click();
  await page.getByRole("button", { name: "Yes, cancel booking" }).click();
  await expect(page.getByRole("heading", { name: "This booking is cancelled." })).toBeVisible();
});
