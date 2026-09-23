// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IBotOracle.sol";

/**
 * @title MockBotOracle
 * @notice Mock implementation of BotOracle for unit testing and local development
 */
contract MockBotOracle is IBotOracle {
    struct PriceData {
        int256 answer;
        uint256 updatedAt;
        uint256 roundId;
    }

    mapping(uint256 => PriceData) public feeds;

    event FeedUpdated(uint256 indexed feedId, int256 answer, uint256 updatedAt, uint256 roundId);

    /**
     * @notice Set or update the price feed mock data
     * @param feedId Identifier of the price feed
     * @param answer Oracle price
     * @param updatedAt Timestamp of update
     * @param roundId Round index
     */
    function setAnswer(
        uint256 feedId,
        int256 answer,
        uint256 updatedAt,
        uint256 roundId
    ) external {
        feeds[feedId] = PriceData({
            answer: answer,
            updatedAt: updatedAt,
            roundId: roundId
        });
        emit FeedUpdated(feedId, answer, updatedAt, roundId);
    }

    /**
     * @inheritdoc IBotOracle
     */
    function getLatestAnswer(uint256 feedId) external view override returns (
        int256 answer,
        uint256 updatedAt,
        uint256 roundId
    ) {
        PriceData memory data = feeds[feedId];
        return (data.answer, data.updatedAt, data.roundId);
    }
}
