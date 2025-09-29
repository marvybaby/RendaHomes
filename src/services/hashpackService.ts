import { HashConnect } from 'hashconnect';
import { LedgerId, ContractExecuteTransaction, ContractId, ContractFunctionParameters } from '@hashgraph/sdk';

export class HashPackService {
  private hashconnect: HashConnect | null = null;
  private accountId: string | null = null;

  async initialize(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('Window not available');
    }

    const appMetadata = {
      name: "RendaHomes",
      description: "Real Estate Tokenization Platform",
      icons: ["http://localhost:3001/icon.png"],
      url: "http://localhost:3001"
    };

    const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
    if (!projectId) {
      throw new Error('WalletConnect Project ID not configured in environment variables');
    }

    this.hashconnect = new HashConnect(
      LedgerId.TESTNET,
      projectId,
      appMetadata,
      true
    );

  }

  async connect(): Promise<{ accountId: string; network: string }> {
    await this.initialize();

    if (!this.hashconnect) {
      throw new Error('HashConnect not initialized');
    }

    return new Promise((resolve, reject) => {
      if (!this.hashconnect) {
        reject(new Error('HashConnect not available'));
        return;
      }

      this.hashconnect.pairingEvent.on((data: any) => {
        this.accountId = data.accountIds?.[0];

        if (this.accountId) {
          resolve({
            accountId: this.accountId,
            network: 'testnet'
          });
        } else {
          reject(new Error('No account ID received from pairing'));
        }
      });

      if (this.hashconnect.connectionStatusChangeEvent) {
        this.hashconnect.connectionStatusChangeEvent.on((data: any) => {
        });
      }

      this.hashconnect!.init().then((initData) => {
        const existingPairings = (this.hashconnect as any).pairings;
        if (existingPairings && Object.keys(existingPairings).length > 0) {
          const firstTopic = Object.keys(existingPairings)[0];
          const pairing = existingPairings[firstTopic];
          if (pairing && pairing.accountIds && pairing.accountIds.length > 0) {
            this.accountId = pairing.accountIds[0];
            resolve({
              accountId: this.accountId,
              network: 'testnet'
            });
            return;
          }
        }

        this.hashconnect!.openPairingModal();
      }).catch((error) => {
        reject(new Error(`HashConnect initialization failed: ${error.message}`));
      });

      setTimeout(() => {
        reject(new Error('HashPack pairing timeout - please ensure HashPack extension is installed'));
      }, 30000);
    });
  }

  async sendContractTransaction(contractId: string, functionData: string): Promise<string> {

    if (!this.hashconnect || !this.accountId) {
      throw new Error(`HashPack not connected - missing: ${!this.hashconnect ? 'hashconnect ' : ''}${!this.accountId ? 'accountId' : ''}`);
    }

    try {

      let contractExecuteTransaction;

      if (functionData.includes('(') && functionData.includes(')')) {
        const functionName = functionData.substring(0, functionData.indexOf('('));
        const paramString = functionData.substring(functionData.indexOf('(') + 1, functionData.lastIndexOf(')'));

        console.log('HashPack function parsing:', {
          functionName,
          paramString,
          fullFunctionData: functionData
        });

        if (paramString.trim()) {
          const functionParameters = new ContractFunctionParameters();

          if (functionName === 'wrap' || functionName === 'unwrap') {
            functionParameters.addUint256(paramString as any);
          }
          else if (functionName === 'approve') {
            const params = paramString.split(',');
            if (params.length === 2) {
              functionParameters.addAddress(params[0].trim());
              functionParameters.addUint256(params[1].trim() as any);
            }
          }
          else if (functionName === 'listProperty') {
            const params = paramString.split(',');
            console.log('listProperty parameters:', {
              paramsLength: params.length,
              params: params.map((p, i) => ({ index: i, value: p.trim() }))
            });

            if (params.length === 5) {
              // listProperty(string metadataURI, uint256 totalValue, uint256 totalTokens, uint8 propertyType, uint8 riskLevel)
              const metadataURI = params[0].trim().replace(/"/g, '');
              const totalValue = params[1].trim();
              const totalTokens = params[2].trim();
              const propertyType = parseInt(params[3].trim());
              const riskLevel = parseInt(params[4].trim());

              console.log('Parsed listProperty parameters:', {
                metadataURI,
                totalValue,
                totalTokens,
                propertyType,
                riskLevel
              });

              functionParameters.addString(metadataURI);
              functionParameters.addUint256(totalValue as any);
              functionParameters.addUint256(totalTokens as any);
              functionParameters.addUint8(propertyType);
              functionParameters.addUint8(riskLevel);
            } else {
              console.error('listProperty: Invalid parameter count. Expected 5, got:', params.length);
            }
          }

          contractExecuteTransaction = new ContractExecuteTransaction()
            .setContractId(ContractId.fromString(contractId))
            .setGas(500000 as any)
            .setFunction(functionName, functionParameters);
        } else {
          contractExecuteTransaction = new ContractExecuteTransaction()
            .setContractId(ContractId.fromString(contractId))
            .setGas(500000 as any)
            .setFunction(functionName);
        }
      } else {
        contractExecuteTransaction = new ContractExecuteTransaction()
          .setContractId(ContractId.fromString(contractId))
          .setGas(500000)
          .setFunction(functionData);
      }

      if (!this.hashconnect || !this.accountId) {
        throw new Error('HashPack connection lost. Please reconnect your wallet.');
      }

      let response;
      try {
        const signer = this.hashconnect.getSigner(this.accountId as any);
        const frozenTransaction = await contractExecuteTransaction.freezeWithSigner(signer as any);
        response = await frozenTransaction.executeWithSigner(signer as any);
      } catch (signerError) {
        response = await this.hashconnect.sendTransaction(this.accountId as any, contractExecuteTransaction as any);
      }

      let transactionId = 'SUCCESS';

      try {
        if (response && typeof response === 'object') {
          if ((response as any).transactionId) {
            transactionId = (response as any).transactionId.toString();
          }
          else if (response.toString && typeof response.toString === 'function') {
            const responseString = response.toString();

            if (responseString.includes('"') && responseString.includes(':')) {
              try {
                const parsed = JSON.parse(responseString);
                if (parsed.transactionId) {
                  transactionId = parsed.transactionId;
                } else if (parsed.scheduledTransactionId) {
                  transactionId = parsed.scheduledTransactionId;
                }
              } catch (parseError) {
              }
            }
          }

          if (transactionId === 'SUCCESS' && (response as any).scheduledTransactionId) {
            transactionId = (response as any).scheduledTransactionId.toString();
          }
        }
      } catch (extractError) {
      }

      return transactionId;
    } catch (error: any) {
      console.error('HashPack transaction error:', error);
      console.error('HashPack error details:', {
        message: error.message,
        code: error.code,
        reason: error.reason,
        data: error.data,
        status: error.status,
        transactionId: error.transactionId,
        fullError: JSON.stringify(error, null, 2)
      });
      throw new Error(`HashPack transaction failed: ${error.message || error}`);
    }
  }

  isConnected(): boolean {
    return !!(this.hashconnect && this.accountId);
  }

  getAccountId(): string | null {
    return this.accountId;
  }

  async disconnect(): Promise<void> {
    if (this.hashconnect) {
      this.accountId = null;
    }
  }
}