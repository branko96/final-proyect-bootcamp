# NFT Marketplace
This is for a final proyect of web3 bootcamp: NFT Marketplace.
- Hardhat proyect in Typescript
- Contracts using OpenZeppelin ERC721Token
- Deployed NFT Market contract on [Ropsten Testnet](https://ropsten.etherscan.io/address/0xd1df94407C3EcDb92DB4683b9Ad7fc58763D2361)
- Deployed NFT Contract on [Ropsten Testnet](https://ropsten.etherscan.io/address/0x118B2D611a8FC8375c563c8eEe032BcA0aCB8a66)
- Nextjs frontend
- Wagmi to connect to metamask
- IPFS store for NFTs data
- Zustand for store state
- Deployed with vercel [NFT Marketplace frontend](https://nft-marketplace-nextjs-a70nyav8t-branko96.vercel.app/)

## Hardhat Proyect

### Install
```shell
npm install
```

### Test
```shell
npx hardhat test
GAS_REPORT=true npx hardhat test
```

### Deploy
```shell
.env file in root folder is needed with the following content:

PRIVATE_KEY=<private key>
ALCHEMY_API_KEY=<alchemy api key>
```
```shell
Locally:
npx hardhat run scripts/deploy.ts --network localhost --network

Deploy to ropsten network:

npx hardhat run scripts/deploy.ts --network ropsten
```

## Frontend Proyect (frontend folder)

### Install
```shell
cd frontend
yarn install
```

### Run local server (localhost:3000)
```shell
yarn dev
```

