import Web3 from 'web3';
import Torus from '@toruslabs/torus-embed';
const getWeb3Torus = async () => {
  const torus = new Torus({
    buttonPosition: 'top-left'
  });
  await torus.init({
    buildEnv: 'production',
    enableLogging: true,
    network: {
      host: 'ropsten',
      chainId: 3,
      networkName: 'Ropsten Test Network'
    },
    showTorusButton: true
  });
  await torus.login();
  const web3 = new Web3(torus.provider);
  return web3;
};
export default getWeb3Torus;
