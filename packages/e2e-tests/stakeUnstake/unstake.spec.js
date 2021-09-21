const { test, expect } = require("@playwright/test");
const { parseNearAmount } = require("near-api-js/lib/utils/format");

const { StakeUnstakePage } = require("./models/StakeUnstake");
const { HomePage } = require("../register/models/Home");
const { createRandomBankSubAccount } = require("../utils/account");
const { generateNUniqueRandomNumbersInRange } = require("../utils/helpers");
const { BN } = require("bn.js");

const { describe, beforeAll, afterEach, beforeEach } = test;

describe("Unstaking flow", () => {
    let testAccount;

    beforeEach(async ({ page }) => {
        testAccount = await createRandomBankSubAccount();
        const homePage = new HomePage(page);
        await homePage.navigate();
        await homePage.loginWithSeedPhraseLocalStorage(testAccount.account.accountId, testAccount.seedPhrase);
    });

    afterEach(async () => {
        testAccount && (await testAccount.delete());
    });

    test("displays the correct number of validators with the correct amounts", async ({ page }) => {
        const stakeUnstakePage = new StakeUnstakePage(page);
        await stakeUnstakePage.navigate();
        await stakeUnstakePage.clickStakeButton();
        const validatorLastIndex = (await stakeUnstakePage.getNumberOfSelectableValidators()) - 1;
        const randomValidatorIndexes = generateNUniqueRandomNumbersInRange({ from: 0, to: validatorLastIndex }, 2);
        await stakeUnstakePage.runStakingFlowWithAmount(0.1, randomValidatorIndexes[0]);
        await stakeUnstakePage.clickStakeButton();
        await stakeUnstakePage.runStakingFlowWithAmount(0.2, randomValidatorIndexes[1]);
        await stakeUnstakePage.clickUnstakeButton();

        await expect(page).toMatchURL(/\/staking\/unstake$/);
        await expect(page).toHaveSelectorCount("data-test-id=stakingPageValidatorItem", 2);
        await expect(page).toMatchText(/0.1 NEAR/);
        await expect(page).toMatchText(/0.2 NEAR/);
    });

    test("successfully unstakes and displays the right data after", async ({ page }) => {
        const stakeUnstakePage = new StakeUnstakePage(page);
        await stakeUnstakePage.navigate();
        await stakeUnstakePage.clickStakeButton();
        const validatorLastIndex = (await stakeUnstakePage.getNumberOfSelectableValidators()) - 1;
        const randomValidatorIndexes = generateNUniqueRandomNumbersInRange({ from: 0, to: validatorLastIndex }, 2);
        await stakeUnstakePage.runStakingFlowWithAmount(0.1, randomValidatorIndexes[0]);
        await stakeUnstakePage.clickStakeButton();
        await stakeUnstakePage.runStakingFlowWithAmount(0.2, randomValidatorIndexes[1]);
        await stakeUnstakePage.clickUnstakeButton();
        await stakeUnstakePage.clickValidatorItem();
        const submittedUnstakeAmount = await stakeUnstakePage.submitStakeWithMaxAmount();
        const amountStillStaked = (0.3 - submittedUnstakeAmount).toFixed(1);
        await stakeUnstakePage.confirmStakeOnModal();
        await stakeUnstakePage.returnToDashboard();

        await expect(page).toMatchText(
            "data-test-id=accountSelectStakedBalance",
            new RegExp(`${amountStillStaked} NEAR`)
        );
        await expect(page).toMatchText(
            "data-test-id=stakingPageTotalStakedAmount",
            new RegExp(`${amountStillStaked} NEAR`)
        );
        await expect(page).toMatchText(
            "data-test-id=stakingPagePendingReleaseAmount",
            new RegExp(`${submittedUnstakeAmount} NEAR`)
        );

        await stakeUnstakePage.clickUnstakeButton();

        await expect(page).toHaveSelectorCount("data-test-id=stakingPageValidatorItem", 1);
        await expect(page).toMatchText(new RegExp(`${amountStillStaked} NEAR`));

        // const { staked } = await testAccount.account.getAccountBalance();

        // expect(new BN(staked).eq(new BN(parseNearAmount(amountStillStaked.toString())))).toBe(true);
    });
});
