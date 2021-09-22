const { test, expect } = require("@playwright/test");
const { BN } = require("bn.js");
const { parseNearAmount } = require("near-api-js/lib/utils/format");

const { CreateAccountPage } = require("../register/models/CreateAccount");
const { HomePage } = require("../register/models/Home");
const { SetRecoveryOptionPage } = require("../register/models/SetRecoveryOption");
const { VerifySeedPhrasePage } = require("../register/models/VerifySeedPhrase");
const nearApiJsConnection = require("../utils/connectionSingleton");
const {
    generateTestAccountId,
    LinkdropAccountManager,
    getBankAccount,
    E2eTestAccount,
} = require("../utils/account");
const { LinkDropPage } = require("./models/LinkDrop");
const { SetupSeedPhrasePage } = require("../register/models/SetupSeedPhrase");
const { WALLET_NETWORK, LINKDROP_ACCESS_KEY_ALLOWANCE } = require("../constants");
const { testDappURL } = require("../utils/config");

const { describe, beforeAll, afterAll } = test;

describe("Linkdrop flow", () => {
    let linkdropAccountManager,
        linkdropNEARAmount = "2.5";

    const linkdropClaimableAmount = new BN(parseNearAmount(linkdropNEARAmount)).sub(LINKDROP_ACCESS_KEY_ALLOWANCE);

    beforeAll(async () => {
        const bankAccount = await getBankAccount();
        linkdropAccountManager = await new LinkdropAccountManager(bankAccount).initialize("11.0");
    });

    afterAll(async () => {
        await linkdropAccountManager.deleteAccounts();
    });

    test("logs in and claims linkdrop", async ({ page }) => {
        const linkdropPage = new LinkDropPage(page);
        const linkdropSecretKey = await linkdropAccountManager.send(linkdropNEARAmount);
        const { linkdropContractAccount, linkdropReceiverAccount } = linkdropAccountManager;

        await linkdropPage.navigate(linkdropContractAccount.accountId, linkdropSecretKey);
        await expect(page).not.toHaveSelector(".dots");
        await linkdropPage.loginAndClaim();

        await page.click(`data-test-id=recoverAccountWithPassphraseButton`);
        await page.fill("data-test-id=seedPhraseRecoveryInput", linkdropReceiverAccount.seedPhrase);
        await page.click(`data-test-id=seedPhraseRecoverySubmitButton`);
        await page.waitForNavigation();
        await linkdropPage.claimToExistingAccount();
        await page.waitForNavigation();

        await expect(page).toMatchURL(/\/$/);
        await page.reload();
        await expect(page).not.toHaveSelector(".dots");
        const nearBalance = await new HomePage(page).getNearBalanceInNear();
        await expect(new BN(parseNearAmount(nearBalance)).gte(linkdropClaimableAmount)).toBe(true);
    });
    test("redirects to redirectUrl after claiming when redirectUrl provided", async ({ page }) => {
        const linkdropPage = new LinkDropPage(page);
        const linkdropSecretKey = await linkdropAccountManager.send(linkdropNEARAmount);
        const { linkdropContractAccount, linkdropReceiverAccount } = linkdropAccountManager;

        await linkdropPage.navigate(linkdropContractAccount.accountId, linkdropSecretKey, testDappURL);
        await expect(page).not.toHaveSelector(".dots");
        await linkdropPage.loginAndClaim();

        await page.click(`data-test-id=recoverAccountWithPassphraseButton`);
        await page.fill("data-test-id=seedPhraseRecoveryInput", linkdropReceiverAccount.seedPhrase);
        await page.click(`data-test-id=seedPhraseRecoverySubmitButton`);
        await page.waitForNavigation();
        await linkdropPage.claimToExistingAccount();
        await page.waitForNavigation();

        await expect(page).toMatchURL(new RegExp(testDappURL));
        await expect(page).toMatchURL(new RegExp(`accountId=${linkdropReceiverAccount.accountId}`));
    });
    test("claims linkdrop to new account", async ({ page, context }) => {
        await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(test.skip);
        // skip test on mainnet
        if (nearApiJsConnection.config.networkId === WALLET_NETWORK.MAINNET) {
            test.skip();
        }

        const linkdropSecretKey = await linkdropAccountManager.sendToNetworkTLA(linkdropNEARAmount);
        const linkdropPage = new LinkDropPage(page);
        await linkdropPage.navigate(nearApiJsConnection.config.networkId, linkdropSecretKey);
        await linkdropPage.createAccountToClaim();

        const createAccountPage = new CreateAccountPage(page);
        await createAccountPage.acceptTerms();
        const testAccountId = generateTestAccountId();
        await createAccountPage.submitAccountId(testAccountId);

        const setRecoveryOptionPage = new SetRecoveryOptionPage(page);
        await setRecoveryOptionPage.clickSeedPhraseRecoveryOption();
        await setRecoveryOptionPage.submitRecoveryOption();

        const setupSeedPhrasePage = new SetupSeedPhrasePage(page);
        const copiedSeedPhrase = await setupSeedPhrasePage.copySeedPhrase();
        await setupSeedPhrasePage.continueToSeedPhraseVerification();

        const verifySeedPhrasePage = new VerifySeedPhrasePage(page);
        const requestedVerificationWordNumber = await verifySeedPhrasePage.getRequestedVerificationWordNumber();
        await verifySeedPhrasePage.verifyWithWord(copiedSeedPhrase.split(" ")[requestedVerificationWordNumber - 1]);

        await expect(page).toMatchURL(/\/$/);
        await expect(page).toHaveSelector("data-test-id=linkDropSuccessModal");

        const testAccount = await new E2eTestAccount(
            `${testAccountId}.${nearApiJsConnection.config.networkId}`,
            copiedSeedPhrase,
            {
                accountId: nearApiJsConnection.config.networkId,
            }
        ).initialize();

        testAccount.delete();
    });
    test("redirects to redirectUrl after account creation when redirectUrl provided", async ({ page, context }) => {
        await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(test.skip);
        // skip test on mainnet
        if (nearApiJsConnection.config.networkId === WALLET_NETWORK.MAINNET) {
            test.skip();
        }

        const linkdropSecretKey = await linkdropAccountManager.sendToNetworkTLA(linkdropNEARAmount);
        const linkdropPage = new LinkDropPage(page);
        await linkdropPage.navigate(nearApiJsConnection.config.networkId, linkdropSecretKey, testDappURL);
        await linkdropPage.createAccountToClaim();

        const createAccountPage = new CreateAccountPage(page);
        await createAccountPage.acceptTerms();
        const testAccountId = generateTestAccountId();
        await createAccountPage.submitAccountId(testAccountId);

        const setRecoveryOptionPage = new SetRecoveryOptionPage(page);
        await setRecoveryOptionPage.clickSeedPhraseRecoveryOption();
        await setRecoveryOptionPage.submitRecoveryOption();

        const setupSeedPhrasePage = new SetupSeedPhrasePage(page);
        const copiedSeedPhrase = await setupSeedPhrasePage.copySeedPhrase();
        await setupSeedPhrasePage.continueToSeedPhraseVerification();

        const verifySeedPhrasePage = new VerifySeedPhrasePage(page);
        const requestedVerificationWordNumber = await verifySeedPhrasePage.getRequestedVerificationWordNumber();
        await verifySeedPhrasePage.verifyWithWord(copiedSeedPhrase.split(" ")[requestedVerificationWordNumber - 1]);

        await expect(page).toMatchURL(new RegExp(testDappURL));
        await expect(page).toMatchURL(new RegExp(`accountId=${testAccountId}`));

        const testAccount = await new E2eTestAccount(
            `${testAccountId}.${nearApiJsConnection.config.networkId}`,
            copiedSeedPhrase,
            {
                accountId: nearApiJsConnection.config.networkId,
            }
        ).initialize();

        testAccount.delete();
    });
});
