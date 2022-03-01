const { default: Web3 } = require("web3");

const UdhariToken = artifacts.require("UdhariToken");
const Exchange= artifacts.require("Exchange");

module.exports = async function (deployer) {
  const accounts= await web3.eth.getAccounts();
  const feeAccount= accounts[0];
  const feePercent= 10;

  await deployer.deploy(UdhariToken);
  await deployer.deploy(Exchange,feeAccount,feePercent);
};

