import { test, expect, Page } from '@playwright/test';
import { gotoWithAuth, loginIfNeeded, resetSession } from '../../fixtures/auth';

const channelTypeRowByName = (page: Page, name: string) =>
  page
    .locator('table tbody tr')
    .filter({ has: page.getByRole('cell', { name }) })
    .filter({ has: page.getByRole('link', { name: /view/i }) });

const partnerRowByEmail = (page: Page, email: string) =>
  page
    .locator('table tbody tr')
    .filter({ has: page.getByRole('cell', { name: new RegExp(email, 'i') }) });

const searchInput = (page: Page) =>
  page.getByPlaceholder('Search partners by name or email...');

const waitForPartnerRow = async (page: Page, email: string, attempts = 3) => {
  const search = searchInput(page);
  let lastError: any;

  for (let i = 0; i < attempts; i++) {
    await search.fill(email);

    const row = partnerRowByEmail(page, email);
    try {
      await expect(row).toHaveCount(1, { timeout: 15000 });
      return row;
    } catch (err) {
      lastError = err;
      await page.waitForTimeout(2000);
      await page.reload();
      await expect(search).toBeVisible({ timeout: 15000 });
    }
  }

  await expect(partnerRowByEmail(page, email)).toHaveCount(1, { timeout: 15000 });
  if (lastError) {
    throw lastError;
  }
};

const selectChannelType = async (page: Page, channelTypeName: string) => {
  // Wait for invite form to render before looking for the combobox
  const inviteHeading = page.getByRole('heading', { name: /Invite Business Partner/i }).first();
  await expect(inviteHeading).toBeVisible({ timeout: 30000 });

  // Prefer a combobox that mentions channel type; fall back to the first combobox on the form.
  const comboWithLabel = page
    .locator('label:has-text("Channel Type")')
    .first()
    .locator('..')
    .getByRole('combobox')
    .first();

  const genericCombo = page
    .getByRole('combobox')
    .filter({ hasText: /channel type|select channel type/i })
    .first();

  const triggerCandidates = [comboWithLabel, genericCombo, page.getByRole('combobox').first()];

  let trigger: ReturnType<Page['getByRole']> | null = null;
  for (const candidate of triggerCandidates) {
    try {
      await expect(candidate).toBeVisible({ timeout: 20000 });
      trigger = candidate;
      break;
    } catch {
      // try next candidate
    }
  }

  if (!trigger) {
    throw new Error('Channel type selector not found');
  }

  await trigger.click();
  const searchBox = page.getByPlaceholder(/search.*channel/i).first();
  await expect(searchBox).toBeVisible({ timeout: 20000 });
  await searchBox.fill(channelTypeName);

  const option = page.getByRole('option', { name: new RegExp(channelTypeName, 'i') }).first();
  await expect(option).toBeVisible({ timeout: 30000 });
  await option.click();

  await expect(trigger).toContainText(new RegExp(channelTypeName, 'i'), { timeout: 15000 });
};

const openActionsMenu = async (page: Page, email: string) => {
  const row = partnerRowByEmail(page, email);
  await expect(row).toHaveCount(1, { timeout: 45000 });
  const actionsButton = row
    .getByRole('button')
    .filter({ has: row.locator('svg[data-lucide="more-horizontal"]') })
    .first();

  await expect(actionsButton).toBeVisible({ timeout: 15000 });
  await actionsButton.click();
  return row;
};

const createChannelTypeForPartners = async (
  page: Page,
  name: string,
  description: string,
  commissionRate: string
) => {
  await gotoWithAuth(page, '/channel-types');

  const createLink = page.getByRole('link', { name: /create channel type/i }).first();
  const createButton = page.getByRole('button', { name: /create channel type/i }).first();

  if ((await createLink.count()) > 0) {
    await createLink.click();
  } else if ((await createButton.count()) > 0) {
    await createButton.click();
  } else {
    await gotoWithAuth(page, '/channel-types/new');
  }

  await expect(page).toHaveURL(/\/channel-types\/new/, { timeout: 20000 });

  await page.getByLabel('Name').fill(name);
  await page.getByLabel('Description').fill(description);
  await page.getByLabel('Commission Rate').fill(commissionRate);

  await page.getByRole('button', { name: /next step/i }).click();
  await page.getByRole('button', { name: /create channel type/i }).click();

  await expect(page).toHaveURL(/\/channel-types$/, { timeout: 30000 });
  const nameFilter = page.getByPlaceholder('Filter...').first();
  await expect(nameFilter).toBeVisible({ timeout: 20000 });
  await nameFilter.fill(name);
  await expect(channelTypeRowByName(page, name)).toHaveCount(1, { timeout: 30000 });
};

test.describe.serial('Business Partner Management', () => {
  const timestamp = Date.now();
  const channelTypeName = `E2E Partner Channel ${timestamp}`;
  const channelTypeDescription = 'Channel type created for business partner e2e tests';
  const commissionRate = '12';

  const partnerEmail = `partner+${timestamp}@example.com`;
  const partnerFirstName = `E2E Partner ${timestamp}`;
  const partnerLastName = 'User';
  const updatedFirstName = `${partnerFirstName} Updated`;
  const updatedLastName = `${partnerLastName} Updated`;

  test.beforeAll(async ({ browser }) => {
    const setupPage = await browser.newPage();
    await loginIfNeeded(setupPage);
    await createChannelTypeForPartners(setupPage, channelTypeName, channelTypeDescription, commissionRate);
    await setupPage.close();
  });

  test.beforeEach(async ({ page }) => {
    await loginIfNeeded(page);
  });

  test.afterEach(async ({ page }) => {
    await resetSession(page);
    await page.goto('/');
  });

  test('invite a business partner from the invite page', async ({ page }) => {
    await gotoWithAuth(page, '/invite-partners');

    const sendButton = page.getByRole('button', { name: /send invitation/i });
    await expect(sendButton).toBeDisabled();

    await page.getByLabel(/First Name/i).fill(partnerFirstName);
    await page.getByLabel(/Last Name/i).fill(partnerLastName);
    await expect(sendButton).toBeDisabled();

    await page.getByLabel(/Email Address/i).fill(partnerEmail);
    await selectChannelType(page, channelTypeName);
    await expect(sendButton).toBeEnabled();

    await sendButton.click();

    await expect(page.getByText(/Recent Invitations/i)).toBeVisible({ timeout: 45000 });
    await expect(page.getByText(partnerEmail)).toBeVisible({ timeout: 45000 });
  });

  test('list and search the invited partner', async ({ page }) => {
    await gotoWithAuth(page, '/business-partners');

    const search = searchInput(page);
    await expect(search).toBeVisible({ timeout: 30000 });
    const loading = page.getByText(/Loading business partners/i);
    try {
      await expect(loading).toBeVisible({ timeout: 8000 });
      await expect(loading).toBeHidden({ timeout: 30000 });
    } catch {
      // ignore if loading indicator is not present
    }

    const partnerRow = await waitForPartnerRow(page, partnerEmail, 4);
    await expect(partnerRow).toContainText(`${partnerFirstName} ${partnerLastName}`);
    await expect(partnerRow.getByRole('cell', { name: new RegExp(channelTypeName, 'i') })).toBeVisible({
      timeout: 30000,
    });

    await search.fill(`missing-partner-${Date.now()}`);
    await expect(page.getByText(/No partners found matching your search/i)).toBeVisible({ timeout: 20000 });

    await search.fill('');
  });

  test('resend invitation from the actions menu', async ({ page }) => {
    await gotoWithAuth(page, '/business-partners');

    await waitForPartnerRow(page, partnerEmail, 4);
    await openActionsMenu(page, partnerEmail);
    const inviteAgain = page.getByRole('menuitem', { name: /invite again/i });
    await expect(inviteAgain).toBeVisible({ timeout: 20000 });
    await inviteAgain.click();

    await expect(
      page.getByText(/Invitation email sent again|invitation email sent/i).first()
    ).toBeVisible({ timeout: 45000 });
  });

  test('edit business partner details', async ({ page }) => {
    await gotoWithAuth(page, '/business-partners');

    await waitForPartnerRow(page, partnerEmail, 4);
    await openActionsMenu(page, partnerEmail);
    await page.getByRole('menuitem', { name: /edit partner/i }).click();

    await expect(page).toHaveURL(/\/business-partners\/.*\/edit/, { timeout: 30000 });
    await expect(page.getByLabel(/Email Address/i)).toHaveValue(partnerEmail);

    await page.getByLabel(/First Name/i).fill(updatedFirstName);
    await page.getByLabel(/Last Name/i).fill(updatedLastName);
    await selectChannelType(page, channelTypeName);

    await page.getByRole('button', { name: /update partner/i }).click();

    await expect(page).toHaveURL(/\/business-partners$/, { timeout: 45000 });
    const updatedRow = await waitForPartnerRow(page, partnerEmail, 4);
    await expect(updatedRow).toContainText(`${updatedFirstName} ${updatedLastName}`);
  });

  test('remove business partner', async ({ page }) => {
    await gotoWithAuth(page, '/business-partners');

    await waitForPartnerRow(page, partnerEmail, 4);
    await openActionsMenu(page, partnerEmail);
    await page.getByRole('menuitem', { name: /remove partner/i }).click();

    const confirmDialog = page.getByRole('dialog', { name: /Remove Business Partner/i });
    await expect(confirmDialog).toBeVisible({ timeout: 20000 });
    await confirmDialog.getByRole('button', { name: /^Remove Partner$/i }).click();

    await expect(partnerRowByEmail(page, partnerEmail)).toHaveCount(0, { timeout: 60000 });
    await page.reload();
    const search = searchInput(page);
    await expect(search).toBeVisible({ timeout: 20000 });
    await search.fill(partnerEmail);
    await expect(partnerRowByEmail(page, partnerEmail)).toHaveCount(0, { timeout: 20000 });
  });
});
