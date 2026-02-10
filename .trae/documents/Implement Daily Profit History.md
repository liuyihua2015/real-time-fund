I will implement a "Daily Profit History" feature to record and display the daily gains and losses for a single fund.

### Analysis of the Issue
The user reported that "daily profit is not recorded," leading to confusion about the total holding profit. Currently, the app calculates "Total Profit" as a snapshot (`(Current Value - Cost) + Realized`), which is mathematically correct but opaque. It lacks a visible history of daily earnings (e.g., "Earned 500 yesterday, Lost 200 today").

### Implementation Plan
1.  **Add "Daily Profit History" Section**:
    *   In the Fund Detail page (`app/fund/[code]/FundCardDetailClient.jsx`), I will add a new list/table below the charts.
    *   It will display the last 30 trading days of data.
    *   **Columns**: Date (日期), NAV (净值), Change Rate (涨跌幅), Daily Profit (当日盈亏).
    *   **Calculation**: `Daily Profit = (NAV_Today - NAV_Yesterday) * Current_Share`.
        *   *Note*: This uses the *current* share count as a baseline to estimate historical daily profits, providing a clear breakdown of how the current position would have performed.

2.  **Enhance "Yesterday's Profit" Display**:
    *   Ensure the "Yesterday's Profit" (昨日收益) metric in the top card strictly aligns with the latest entry in the new history list.

3.  **Verification**:
    *   The user will be able to see the daily breakdown.
    *   I will verify that the "Total Holding Profit" logic remains `(Market Value - Principal) + Realized Profit`, which is the correct standard for "Total Return". The new history list will serve as a supporting record to validate these numbers.

### File Changes
*   `app/fund/[code]/FundCardDetailClient.jsx`: Add the profit history list logic and UI.
