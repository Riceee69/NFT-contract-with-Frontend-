import React from "react";
import "./Dapp.css";

// We'll use ethers to interact with the Ethereum network and our contract
import { ethers } from "ethers";

// We import the contract's artifacts and address here, as we are going to be
// using them with ethers
import TestNFTArtifact from "../contract/TestNFT.json";
import contractAddress from "../contract/deployed_addresses.json";

// All the logic of this dapp is contained in the Dapp component.
// These other components are just presentational ones: they don't have any
// logic. They just render HTML.
import { NoWalletDetected } from "../components/NoWalletDetected";
import { ConnectWallet } from "../components/ConnectWallet";
import { Loading } from "../components/Loading";
//import { Transfer } from "../components/Transfer";
import { TransactionErrorMessage } from "../components/TransactionErrorMessage";
import { WaitingForTransactionMessage } from "../components/WaitingForTransactionMessage";
//import { NoTokensMessage } from "../components/NoTokensMessage";

// This is the default id used by the Hardhat Network
const SEPOLIA_NETWORK_ID = '11155111';

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

// This component is in charge of doing these things:
//   1. It connects to the user's wallet
//   2. Initializes ethers and the Token contract
//   3. Polls the user balance to keep it updated.
//   4. Transfers tokens by sending transactions
//   5. Renders the whole application
//
// Note that (3) and (4) are specific of this sample application, but they show
// you how to keep your Dapp and contract's state in sync,  and how to send a
// transaction.
export default class Dapp extends React.Component {

  constructor(props) {
    super(props);

    this.initialState = {
      selectedAddress: undefined,
      tokenData: undefined,
      mintStatus: false,
      transactionError: undefined,
      balance: 0,
      txBeingSent: undefined,
    };

    this.state = this.initialState;
    this._testNFT = null;
  }

  render() {

    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }

    if (!this.state.selectedAddress) {
      console.log("Connecting wallet")
      return (
        <div className="center-container">
        <ConnectWallet 
          connectWallet={() => this._connectWallet()} 
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
        </div>
      );
    }

    if (!this.state.tokenData) {
      return <Loading />;
    }

    return (
        this.state.mintStatus ? 
        (
          <div className="center-container">
            <p>Minted!</p>
          </div>
        ) : this.state.txBeingSent ? 
        (
          this.state.transactionError ? 
          (
            <div className="center-container">
              <TransactionErrorMessage
                message={this._getRpcErrorMessage(this.state.transactionError)}
                dismiss={() => this._dismissTransactionError()}
              />
            </div>
          ) : 
          (
            <div className="center-container">
              <WaitingForTransactionMessage txHash={this.state.txBeingSent} />
            </div>
          )
        ) : 
        (
          <div className="center-container">
            <button  className="button-5" onClick={() => this._mintNFT()}>Mint NFT</button>
          </div>
        )
    );
  }


  async _connectWallet() {
    const [selectedAddress] = await window.ethereum.request({ method: 'eth_requestAccounts' })

    // First we check the network
    await this._checkNetwork();

    await this._initialize(selectedAddress);

    // We reinitialize it whenever the user changes their account.
    window.ethereum.on("accountsChanged", ([newAddress]) => {
      console.log("accountsChanged");
      // `accountsChanged` event can be triggered with an undefined newAddress.
      // This happens when the user removes the Dapp from the "Connected
      // list of sites allowed access to your addresses" (Metamask > Settings > Connections)
      // To avoid errors, we reset the dapp state 
      if (newAddress === undefined) {
        return this._resetState();
      }
    
      this._initialize(newAddress);
    });
  }
  
  //setting up ethers
  async _initializeEthers() {
    // We first initialize ethers by creating a provider using window.ethereum
    this._provider =  new ethers.BrowserProvider(window.ethereum);
    this._signer = await this._provider.getSigner();
    // Then, we initialize the contract using that provider and the token's artifact
    this._testNFT =  new ethers.Contract(
      contractAddress.deployed_address,
      TestNFTArtifact.abi,
      this._signer
    );
  }

  async _getTokenData() {
    if(this._testNFT){
    const name = await this._testNFT.name();
    const symbol = await this._testNFT.symbol();
    console.log("name", name);
    console.log("symbol", symbol);
    console.log("this.state", this.state);
    this.setState({ tokenData: { name, symbol } });
    }else{
      throw new Error("Contract is null");
    }
  }

  async _initialize(userAddress) {
    this.setState({
      selectedAddress: userAddress,
    });
    console.log("userAddress", userAddress);
    // Then, we initialize ethers
    await this._initializeEthers();
    await this._getTokenData();
  }

  async _mintNFT() {
    if(this._testNFT){
    this._dismissTransactionError();

    try {
      const tx = await this._testNFT.safeMint();
      this.setState({ txBeingSent: tx.hash });

      const receipt = await tx.wait();

      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }

      await this._updateBalance();

      this.setState({ mintStatus: true });
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      if (error.code === "CALL_EXCEPTION") {
        window.alert("Max supply reached!!!");
      }

      console.error("Error minting NFT:", error);
      this.setState({ transactionError: error });
    }finally{
      this.setState({ txBeingSent: undefined });
    }
  }else{
    throw new Error("Contract is null");
  }

  }

  async _updateBalance() {
    if(this._testNFT){
    const balance = await this._testNFT.balanceOf(this.state.selectedAddress);
    this.setState({ balance });//render only when state value changes
    }else{
      throw new Error("Contract is null");
    }
  }

  // This method just clears part of the state.
  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  // This method just clears part of the state.
  // _dismissNetworkError() {
  //   this.setState({ networkError: undefined });
  // }

  // This is an utility method that turns an RPC error into a human readable
  // message.
  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message;
    }

    return error.message;
  }

  // This method resets the state
  _resetState() {
    this.setState(this.initialState);
  }

  async _switchChain() {
    const chainIdHex = `0x${Number(SEPOLIA_NETWORK_ID).toString(16)}`
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: chainIdHex,
              chainName: "Sepolia Testnet",
              nativeCurrency: {
                name: "Ethereum",
                symbol: "sepoliaETH",
                decimals: 18
              },
              rpcUrls: ["https://sepolia.infura.io/v3/"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            }],
          });
        } catch (addError) {
          console.error("Failed to add the network:", addError);
        }
      } else {
        console.error("Failed to switch to the network:", switchError);
      }
    }
  }

  async _checkNetwork() {
    if (window.ethereum.networkVersion !== SEPOLIA_NETWORK_ID) {
      await this._switchChain();
    }
  }
}

