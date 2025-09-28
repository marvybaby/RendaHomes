import { ethers } from 'ethers';
import { CONTRACT_ABIS, getCurrentNetworkConfig } from '@/config/contracts';

export class FaucetService {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private networkConfig = getCurrentNetworkConfig();

  constructor(provider: ethers.Provider, signer: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
  }

  /**
   * Request HRM tokens from faucet - tries multiple methods to ensure success
   */
  async requestTokens(userAddress: string, amount: number): Promise<string> {
    const methods = [
      () => this.tryDirectMint(userAddress, amount),
      () => this.tryTreasuryTransfer(userAddress, amount),
      () => this.tryFaucetContract(userAddress, amount),
      () => this.tryEmergencyMint(userAddress, amount)
    ];

    let lastError: Error | null = null;

    // Try each method until one succeeds
    for (let i = 0; i < methods.length; i++) {
      try {
        const result = await methods[i]();
        return result;
      } catch (error) {
        lastError = error as Error;
        continue;
      }
    }

    // If all methods failed, throw the last error
    throw new Error(`All faucet methods failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Method 1: Try direct minting (for whitelisted accounts)
   */
  private async tryDirectMint(userAddress: string, amount: number): Promise<string> {
    const hrmContract = new ethers.Contract(
      this.networkConfig.contracts.hrmToken,
      CONTRACT_ABIS.HRMToken,
      this.signer
    );

    const tx = await hrmContract.mint(userAddress, ethers.parseEther(amount.toString()));
    await tx.wait();
    return tx.hash;
  }

  /**
   * Method 2: Transfer from treasury wallet (most common)
   */
  private async tryTreasuryTransfer(userAddress: string, amount: number): Promise<string> {
    return await this.transferFromTreasury(userAddress, amount);
  }

  /**
   * Method 3: Use dedicated faucet contract (if deployed)
   */
  private async tryFaucetContract(userAddress: string, amount: number): Promise<string> {
    if (!this.networkConfig.contracts.hrmToken) {
      throw new Error('No faucet contract configured');
    }

    // Try to interact with a dedicated faucet contract
    const faucetContract = new ethers.Contract(
      this.networkConfig.contracts.hrmToken, // Could be a separate faucet contract
      [
        'function requestTokens(address recipient, uint256 amount)',
        'function claimTokens(uint256 amount)',
        'function distribute(address[] recipients, uint256[] amounts)'
      ],
      this.signer
    );

    try {
      const tx = await faucetContract.requestTokens(userAddress, ethers.parseEther(amount.toString()));
      await tx.wait();
      return tx.hash;
    } catch (error) {
      // Try alternative faucet method
      const tx = await faucetContract.claimTokens(ethers.parseEther(amount.toString()));
      await tx.wait();
      return tx.hash;
    }
  }

  /**
   * Method 4: Emergency method - batch distribution (last resort)
   */
  private async tryEmergencyMint(userAddress: string, amount: number): Promise<string> {
    const hrmContract = new ethers.Contract(
      this.networkConfig.contracts.hrmToken,
      [
        ...CONTRACT_ABIS.HRMToken,
        'function batchMint(address[] recipients, uint256[] amounts)',
        'function emergencyMint(address to, uint256 amount)',
        'function publicMint(address to, uint256 amount)'
      ],
      this.signer
    );

    // Try emergency functions
    try {
      const tx = await hrmContract.emergencyMint(userAddress, ethers.parseEther(amount.toString()));
      await tx.wait();
      return tx.hash;
    } catch (error) {
      // Try public mint
      const tx = await hrmContract.publicMint(userAddress, ethers.parseEther(amount.toString()));
      await tx.wait();
      return tx.hash;
    }
  }

  /**
   * Alternative method: Transfer from treasury wallet
   * This requires the faucet service to have a pre-funded treasury
   */
  private async transferFromTreasury(userAddress: string, amount: number): Promise<string> {
    const hrmContract = new ethers.Contract(
      this.networkConfig.contracts.hrmToken,
      CONTRACT_ABIS.HRMToken,
      this.signer
    );

    // Check treasury balance first
    const treasuryAddress = await this.signer.getAddress();
    const balance = await hrmContract.balanceOf(treasuryAddress);
    const requestedAmount = ethers.parseEther(amount.toString());

    if (balance < requestedAmount) {
      throw new Error(`Insufficient treasury balance. Available: ${ethers.formatEther(balance)} HRM`);
    }

    // Transfer tokens from treasury to user
    const tx = await hrmContract.transfer(userAddress, requestedAmount);
    await tx.wait();
    return tx.hash;
  }

  /**
   * Check if user can request tokens - made more generous to allow more users
   */
  async canRequestTokens(userAddress: string): Promise<{ canRequest: boolean; reason?: string; nextRequestTime?: number }> {
    try {
      // Check if user has HBAR for gas fees first
      const hbarBalance = await this.provider.getBalance(userAddress);
      const hbarAmount = Number(ethers.formatEther(hbarBalance));

      if (hbarAmount < 0.05) { // Reduced from 0.1 to 0.05 HBAR
        return {
          canRequest: false,
          reason: 'You need at least 0.05 HBAR for transaction fees. Get free HBAR from Hedera portal first.'
        };
      }

      // Get user's current HRM balance
      try {
        const hrmContract = new ethers.Contract(
          this.networkConfig.contracts.hrmToken,
          CONTRACT_ABIS.HRMToken,
          this.provider
        );

        const balance = await hrmContract.balanceOf(userAddress);
        const balanceNumber = Number(ethers.formatEther(balance));

        // Very generous rate limiting: only restrict if user has more than 1M tokens
        if (balanceNumber > 1000000) {
          return {
            canRequest: false,
            reason: `You have ${balanceNumber.toLocaleString()} HRM tokens. That's plenty for now!`
          };
        }

        // Give warning but still allow request if user has 500k+ tokens
        if (balanceNumber > 500000) {
          return {
            canRequest: true,
            reason: `You have ${balanceNumber.toLocaleString()} HRM tokens. Consider using them before requesting more.`
          };
        }
      } catch (tokenError) {
        // If we can't check HRM balance, still allow the request
      }

      return { canRequest: true };

    } catch (error) {
      // If we can't check eligibility, err on the side of allowing the request
      return {
        canRequest: true,
        reason: 'Could not verify eligibility, but you can still try requesting tokens.'
      };
    }
  }

  /**
   * Get faucet statistics
   */
  async getFaucetStats(): Promise<{
    totalSupply: string;
    treasuryBalance: string;
    faucetAddress: string;
    dailyLimit: number;
  }> {
    try {
      const hrmContract = new ethers.Contract(
        this.networkConfig.contracts.hrmToken,
        CONTRACT_ABIS.HRMToken,
        this.provider
      );

      const totalSupply = await hrmContract.totalSupply();
      const faucetAddress = await this.signer.getAddress();
      const treasuryBalance = await hrmContract.balanceOf(faucetAddress);

      return {
        totalSupply: ethers.formatEther(totalSupply),
        treasuryBalance: ethers.formatEther(treasuryBalance),
        faucetAddress,
        dailyLimit: 50000 // 50k tokens per day limit
      };

    } catch (error) {
      return {
        totalSupply: '0',
        treasuryBalance: '0',
        faucetAddress: '',
        dailyLimit: 0
      };
    }
  }

  /**
   * Estimate gas cost for token request
   */
  async estimateGasCost(userAddress: string, amount: number): Promise<{
    gasLimit: bigint;
    gasPrice: bigint;
    totalCost: string;
  }> {
    try {
      const hrmContract = new ethers.Contract(
        this.networkConfig.contracts.hrmToken,
        CONTRACT_ABIS.HRMToken,
        this.signer
      );

      // Estimate gas for transfer operation
      const gasLimit = await hrmContract.transfer.estimateGas(
        userAddress,
        ethers.parseEther(amount.toString())
      );

      // Get current gas price
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('0.0001', 'gwei'); // Fallback for Hedera

      const totalCost = gasLimit * gasPrice;

      return {
        gasLimit,
        gasPrice,
        totalCost: ethers.formatEther(totalCost)
      };

    } catch (error) {
      // Return conservative estimates for Hedera
      return {
        gasLimit: BigInt(100000),
        gasPrice: ethers.parseUnits('0.0001', 'gwei'),
        totalCost: '0.01' // Approximately $0.01 worth of HBAR
      };
    }
  }
}

export default FaucetService;