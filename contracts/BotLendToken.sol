// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BotLendToken
 * @notice ERC20 protocol token (BLBOT) created for BotLend protocol functionality.
 * @dev NOTE: This ERC20 token should NOT be confused with the native gas token of Botchain (BOT).
 */
contract BotLendToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant FAUCET_AMOUNT = 1_000 * 10**18;
    uint256 public constant MAX_FAUCET_REQUEST = 10_000 * 10**18;

    constructor() ERC20("BotLend BOT", "BLBOT") Ownable(msg.sender) {
        // Mint initial supply to deployer
        _mint(msg.sender, 5_000_000 * 10**18);
    }

    /**
     * @notice Mint new tokens (restricted to owner)
     * @param to Recipient address
     * @param amount Token amount in wei
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Faucet giving caller 1,000 BLBOT tokens for testing
     */
    function faucet() external {
        _mint(msg.sender, FAUCET_AMOUNT);
    }

    /**
     * @notice Faucet allowing custom amount up to MAX_FAUCET_REQUEST
     * @param amount Token amount in wei requested
     */
    function faucetAmount(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");
        require(amount <= MAX_FAUCET_REQUEST, "Exceeds max faucet amount per request");
        _mint(msg.sender, amount);
    }
}
