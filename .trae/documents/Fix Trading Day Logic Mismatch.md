I will fix the discrepancy between the list page and detail page calculations.

### Issue Analysis
*   **The Mismatch**: The Detail Page correctly identifies today (Tuesday, Feb 10) as a trading day and uses the real-time estimate (`1.7637`). The List Page incorrectly flags it as a non-trading day and falls back to yesterday's NAV (`1.748`).
*   **The Cause**: The List Page (`page.jsx`) relies on an external stock index API (`sh000001`) to verify if the market is open. This API returned stale data (date `20260209`), causing the code to assume the market is closed. The Detail Page (`FundCardDetailClient.jsx`) simply checks if today is a weekend, which is more robust for display purposes.

### Plan
1.  **Simplify List Page Logic**: Update `app/page.jsx` to use the same robust logic as the Detail Page. Instead of relying solely on the flaky stock index API, we will:
    *   Prioritize the "Weekend Check" (Mon-Fri are trading days).
    *   Only fallback to the API if needed, or remove the strict API dependency that forces `isTradingDay = false` on weekdays.
2.  **Cleanup**: Remove the console logs added for debugging.

### Verification
*   After the fix, the List Page will treat today (Tuesday) as a trading day.
*   It will use the Estimate (`1.7637`) for calculation, matching the Detail Page.
