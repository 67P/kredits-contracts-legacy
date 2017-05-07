# Kredits Contracts

This repository contains source code and related files for the Ethereum smart
contracts, which are issuing and managing [Kosmos Kredits](https://wiki.kosmos.org/Kredits).

## Getting started

Add [kredits-contracts](https://www.npmjs.com/package/kredits-contracts) as dependency to your project: 

	npm install --save kredits-contracts
    
```javascript
const kreditsContracts = require('kredits-contracts');
const Web3 = require('web3');

let contracts = kreditsContracts(web3);
let Kredits = contracts['Kredits'];
let Token = contracts['Token'];

// sync contract calls (not supported by all web3 configurations)
console.log(Kredits.contributorsCount());

// async contract calls
Kredits.contributorsCount(c => console.log);

```

This package comes with pre-configured default contract addresses for dev (our KreditsChain on parity.kosmos.org), test (kovan) and main ethereum network. You can also provide your custom contract addresses: 

```javascript
let contracts = kreditsContracts(web3, {Kredits: {address: 'x0kredits'}, Token: {address: 'x0token'}});

```

Have a look at the contract documentation and the [contract sources](https://github.com/67P/kredits-contracts/tree/master/contracts) for available contract methods.


### Kredits contract

```javascript
let k = kreditsContracts(web3)['Kredits'];
k.contributorsCount();
k.addContributor('<0xContributorAddress>', '<github name>', '<ifps hash>', isCore?, 'github id');
k.contributors('<0xContributorAddress>') // returns the contributor data as array

k.addProposal('<0xRecipient>', <amount as int>, <url>, <ipfs hash>);
k.proposalsCount();
k.proposals(<proposal id>);
k.vote(<proposal id>);
```

### Token contract

The Token follows the [ERC20 Token](https://github.com/ethereum/EIPs/issues/20) standard and implements all standard methods

```javascript
let t = kreditsContracts(web3)['Token'];
t.totalSupply();
t.balanceOf('0xAddress');
t.transfer('0xToAddress', <amount as int>);
```


## Developing kredits-contracts

[Solidity](https://solidity.readthedocs.io/) sources are stored in the `contracts` directory. Besides that we follow the npm directory layout.

It is recommended to run a local ethereum node (i.e. parity) to locally deploy and test the contracts. The `scripts/parity.sh` script helps starting parity node configuried with a separated local KreditsChain and a funded account. It starts the RPC interface and makes the wallet UI available.

	# start parity:
    npm run parity # or script/parity.sh
    
    # start parity and open the wallet ui
    npm run parity ui # or script/parity.sh ui
    
    # all other parity commands are available
    npm run parity -- --help # or script/parity.sh --help
    
### Deploy contracts

`scripts/deploy.js` is a simple deploy script to deploy solidity sources to an specified Ethereum network. 

	# see --help for all configuration options
    npm run deploy -- --help # or scripts/deploy.js --help
    
    # deploy the Kredits contract to the dev network
    npm run deploy -- --network=dev --contracts=Kredits # note the capitalized Kredits - just as the contract name and filename.

	# deploy the contracts and write the contracts metadata (address/abi) to /path/to/my/app
    npm run deploy -- --directory=/path/to/my/app


### Contracts REPL

To quickly interact with the contracts use the REPL provided by `scripts/console.js`
	
    # see --help for all configuration options
    npm run console -- --help # or scripts/console.js --help


### Inspect contracts metadata

To watch contracts from an Ethereum wallet (i.e. parity) you need the contracts addresses and ABIs. 
	
    # see --help for all configuration options
    npm run inspect -- --help # or scripts/inspect.js --help
    
    # print the ABI for the Kredits contract
    npm run inspect -- --what=abi --contracts=Kredits
	
	


### Remix IDE

[Solidity Browser (Remix)](https://ethereum.github.io/browser-solidity/) can be used as
an interactive IDE for contract development in the browser, with no running
node or contract deployment needed.


## ToDo

- TESTS
- Generate contract object documentation automatically by 

## Resources

* [Solidity Docs](https://solidity.readthedocs.io/en/latest/)

