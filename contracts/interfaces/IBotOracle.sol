// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IBotOracle
 * @notice Standard oracle interface for BotOracle ecosystem price feeds
 */
interface IBotOracle {
    /**
     * @notice Returns the latest price and update timestamp for a given feed ID
     * @param feedId The identifier of the asset price feed
     * @return answer The price formatted in fixed-point (typically 8 or 18 decimals)
     * @return updatedAt Timestamp when the price was last updated
     * @return roundId The sequential round identifier
     */
    function getLatestAnswer(uint256 feedId) external view returns (
        int256 answer,
        uint256 updatedAt,
        uint256 roundId
    );
}
