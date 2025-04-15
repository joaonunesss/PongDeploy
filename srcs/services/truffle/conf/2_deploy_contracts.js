/**
 * Explanation of the code:
 *
 * 	1 -> Importing the smart contract Artifact
 *
 * 		In the first line, we import the smart contract artifact using
 * 	"artifacts.require()" function, which is provided by Truffle.
 *
 * 		The artifacts object allows to interact with compiled smart contracts
 *
 * 		"require("TournamentScore")" specifies the contract that we want
 * 	to deploy. Truffle looks for a compiled version of the TournamentScore
 * contract in the build/contracts directory.
 *
 * 		The const TournamentScore is now a reference to this contract
 * 	and can be used to deploy it, interact whith it, or create an instance
 * 	in the blockchain.
 */

const Web3 = require('web3');
const fs = require('fs');
const path = require('path')
const TournamentScore = artifacts.require("TournamentScore");

const web3 = new Web3('http://ganache:8545');

/**
 * 2 -> The Migration Script Function
 *
 * 		In module.exports = function (deployer) we define a migration
 * 	function and exports it as a module. This is necessary so that
 * 	Truffle can execute this function when running migrations.
 *
 * 		The deployer object is passed as an argument to the function.
 * 	It is provided by Truffle and offers a set of methods to manage the
 * 	deployment of contracts to the blockchain.
 *
 * 		This function is part of the migration script that Truffle will
 * 	run to deploy contracts.
 *
 * 3 -> Deploying The Smart Contract
 *
 * 		The last line tells Truffle to deploy the TournamentScore
 * 	contract to the blockchain.
 *
 * 		deployer.deploy() is a method provided by the deployer object.
 * 	It takes the contract and deploys it to the network specified (in the
 * 	case, local blockchain).
 *
 * 		Once the migration is executed, Truffle will interact with the
 * 	Ethereum Virtual Machine to place the contract on the blockchain,
 *
 * 	making it available for further interaction.
 */

module.exports = async function (deployer) {
  await deployer.deploy(TournamentScore);
  // const deployedContract = await TournamentScore.deployed();

  // const contractAddress = deployedContract.address;

  // const envFilePath = path.resolve('/app/shared_env/.env');
  // fs.appendFileSync(envFilePath, 'CONTRACT_ADDRESS=' + contractAddress + '\n');

  // console.log('Contract deployed at address: ${contractAddress}');
};

// async function getPrivateKey() {
//   const accounts = await web3.eth.getAccounts();
//   const privateKey = await web3.eth.personal.exportRawKey(accounts[0], ''); //Chave privada da primeira conta

//   const envFilePath = path.resolve('/app/shared_env/.env');
//   fs.appendFileSync(envFilePath, 'PRIVATE_KEY=' + privateKey + '\n');

//   console.log('Private key for account' + accounts[0] + ': ' + privateKey);
// }

// getPrivateKey();
