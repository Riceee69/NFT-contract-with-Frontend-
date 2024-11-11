import React, { Component } from 'react';
import { ethers, Contract } from 'ethers';
import TestNFTArtifact from '../contract/TestNFT.json';
import contractAddress from '../contract/deployed_addresses.json';
import { NoWalletDetected } from '../components/NoWalletDetected';
import { ConnectWallet } from '../components/ConnectWallet';
import { Loading } from '../components/Loading';
import { TransactionErrorMessage } from '../components/TransactionErrorMessage';
import { WaitingForTransactionMessage } from '../components/WaitingForTransactionMessage';

const SEPOLIA_NETWORK_ID: string = '11155111';
const ERROR_CODE_TX_REJECTED_BY_USER: number = 4001;

interface DappState {
  selectedAddress?: string;
  tokenData?: { name: string; symbol: string };
  mintStatus: boolean;
  transactionError?: Error;
  balance: number;
  txBeingSent?: string;
  networkError?: Error;
}

declare global {
  interface Window {
    ethereum: any; // or a more specific type if known
  }
}

export default class Dapp extends Component<{}, DappState> {
  private _testNFT: Contract | null = null;
  private _provider: ethers.BrowserProvider | null = null;
  private _signer: ethers.JsonRpcSigner | null = null;

  constructor(props: {}) {
    super(props);
    this.state = {
      selectedAddress: undefined,
      tokenData: undefined,
      mintStatus: false,
      transactionError: undefined,
      balance: 0,
      txBeingSent: undefined,
    };
  }

  render() {
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }

    if (!this.state.selectedAddress) {
      console.log('Connecting wallet');
      return (
        <ConnectWallet
          connectWallet={() => this._connectWallet()}
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }

    if (!this.state.tokenData) {
      return <Loading />;
    }

    return this.state.mintStatus ? (
      <div className="">
        <p>Minted!</p>
      </div>
    ) : this.state.txBeingSent ? (
      this.state.transactionError ? (
        <TransactionErrorMessage
          message={this._getRpcErrorMessage(this.state.transactionError)}
          dismiss={() => this._dismissTransactionError()}
        />
      ) : (
        <WaitingForTransactionMessage txHash={this.state.txBeingSent} />
      )
    ) : (
      <div className="">
        <button onClick={() => this._mintNFT()}>Mint NFT</button>
      </div>
    );
  }

  async _connectWallet(): Promise<void> {
    const [selectedAddress] = await window.ethereum.request({ method: 'eth_requestAccounts' });
    await this._checkNetwork();
    await this._initialize(selectedAddress);

    window.ethereum.on('accountsChanged', ([newAddress]: [string | undefined]) => {
      console.log('accountsChanged');
      if (newAddress === undefined) {
        return this._resetState();
      }
      this._initialize(newAddress);
    });
  }

  async _initializeEthers(): Promise<void> {
    this._provider = new ethers.BrowserProvider(window.ethereum);
    this._signer = await this._provider.getSigner();
    this._testNFT = new ethers.Contract(
      contractAddress.deployed_address,
      TestNFTArtifact.abi,
      this._signer
    );
  }

  async _getTokenData(): Promise<void> {
    if (this._testNFT) {
      const name: string = await this._testNFT.name();
      const symbol: string = await this._testNFT.symbol();
      console.log('name', name);
      console.log('symbol', symbol);
      this.setState({ tokenData: { name, symbol } });
    } else {
      throw new Error('Contract is null');
    }
  }

  async _initialize(userAddress: string): Promise<void> {
    this.setState({ selectedAddress: userAddress });
    console.log('userAddress', userAddress);
    await this._initializeEthers();
    await this._getTokenData();
  }

  async _mintNFT(): Promise<void> {
    if (this._testNFT) {
      this._dismissTransactionError();
      try {
        const tx = await this._testNFT.safeMint();
        this.setState({ txBeingSent: tx.hash });
        const receipt = await tx.wait();

        if (receipt.status === 0) {
          throw new Error('Transaction failed');
        }

        await this._updateBalance();
        this.setState({ mintStatus: true });
      } catch (error) {
        if ((error as any).code === ERROR_CODE_TX_REJECTED_BY_USER) {
          return;
        }
        console.error('Error minting NFT:', error);
        this.setState({ transactionError: error });
      } finally {
        this.setState({ txBeingSent: undefined });
      }
    } else {
      throw new Error('Contract is null');
    }
  }

  async _updateBalance(): Promise<void> {
    if (this._testNFT) {
      const balance: number = await this._testNFT.balanceOf(this.state.selectedAddress!);
      this.setState({ balance });
    } else {
      throw new Error('Contract is null');
    }
  }

  _dismissTransactionError(): void {
    this.setState({ transactionError: undefined });
  }

  _dismissNetworkError(): void {
    this.setState({ networkError: undefined });
  }

  _getRpcErrorMessage(error: Error): string {
    if ((error as any).data) {
      return (error as any).data.message;
    }
    return error.message;
  }

  _resetState(): void {
    this.setState({
      selectedAddress: undefined,
      tokenData: undefined,
      mintStatus: false,
      transactionError: undefined,
      balance: 0,
      txBeingSent: undefined,
    });
  }

  async _switchChain(): Promise<void> {
    const chainIdHex: string = `0x${Number(SEPOLIA_NETWORK_ID).toString(16)}`;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainIdHex,
                chainName: 'Sepolia Testnet',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'sepoliaETH',
                  decimals: 18,
                },
                rpcUrls: ['https://sepolia.infura.io/v3/'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
        } catch (addError) {
          console.error('Failed to add the network:', addError);
        }
      } else {
        console.error('Failed to switch to the network:', switchError);
      }
    }
  }

  async _checkNetwork(): Promise<void> {
    if (window.ethereum.networkVersion !== SEPOLIA_NETWORK_ID) {
      await this._switchChain();
    }
  }
}