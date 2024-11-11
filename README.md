Steps to run it:
1. Clone the repository (git clone <repo_name>)
2. Deploy local hardhat network (npx hardhat node) if u want to run it locally
3. Deploy the smart contract to your local network (npx hardhat ignition deploy ignition/modules/BuyMeACoffee.ts --network localhost) or any network of your choice
4. Deploy the website (npm run dev)

Make sure to change the cotract ABI and Address inside the frontend/contract directory


Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/TestNFT.ts
```
