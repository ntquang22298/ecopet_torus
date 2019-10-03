import getWeb3 from '../utils/getWeb3';
import getWeb3Torus from '../utils/getWeb3Torus';
import Factory from 'contracts/PetWalletFactory.json';
import petWallet from 'contracts/PetWallet.json';

export const WEB3_CONNECT = 'WEB3_CONNECT';
export const web3Connect = () => async (dispatch) => {
  const web3 = await getWeb3();
  const accounts = await web3.eth.getAccounts();
  if (web3.currentProvider.networkVersion !== '3') {
    alert('Unknown network, please change network to Ropsten testnet');
    return;
  }
  if (accounts.length > 0) {
    const account = accounts[0];
    let balance = await web3.eth.getBalance(account);
    balance = parseFloat(web3.utils.fromWei(balance)).toFixed(2);
    dispatch({
      type: WEB3_CONNECT,
      web3,
      account,
      balance
    });
  } else {
    console.log('Account not found');
  }
  dispatch(instantiateContracts());
  dispatch(getAllPets());
};

export const web3TorusConnect = () => async (dispatch) => {
  const web3 = await getWeb3Torus();
  const accounts = await web3.eth.getAccounts();
  if (web3.currentProvider.networkVersion !== '3') {
    alert('Unknown network, please change network to Ropsten testnet');
    return;
  }
  if (accounts.length > 0) {
    const account = accounts[0];
    let balance = await web3.eth.getBalance(account);
    balance = parseFloat(web3.utils.fromWei(balance)).toFixed(2);
    dispatch({
      type: WEB3_CONNECT,
      web3,
      account,
      balance
    });
  } else {
    console.log('Account not found');
  }
  dispatch(instantiateContracts());
  dispatch(getAllPets());
};

export const INSTANTIATE_CONTRACT = 'INSTANTIATE_CONTRACT';
export const instantiateContracts = () => async (dispatch, getState) => {
  const state = getState();
  let web3 = state.tomo.web3;
  const networkId = process.env.REACT_APP_TOMO_ID;
  let factoryAddress = Factory.networks[networkId].address;
  let factory = new web3.eth.Contract(Factory.abi, factoryAddress);
  dispatch({
    type: INSTANTIATE_CONTRACT,
    factory
  });
};

export const GET_ALL_PETS = 'GET_ALL_PETS';
export const getAllPets = () => async (dispatch, getState) => {
  const state = getState();
  let web3 = state.tomo.web3;
  const factory = state.tomo.factory;
  const account = state.tomo.account;
  let petArray = await factory.methods.getAllPetAddressOf(account).call({ from: account });

  const pets = [];
  for (let i = 0; i < petArray.length; i++) {
    let pet = {
      instance: null,
      id: 0,
      amount: 0,
      time: 0,
      targetFund: 0,
      duration: 0,
      purpose: ''
    };
    pet.instance = new web3.eth.Contract(petWallet.abi, petArray[i]);
    let petInfo = await pet.instance.methods.getInformation().call();
    pet.id = petInfo[0];
    pet.amount = petInfo[1];
    pet.time = petInfo[2];
    pet.targetFund = petInfo[3];
    pet.duration = petInfo[4];
    pet.purpose = petInfo[5];
    pets.push(pet);
  }
  dispatch({
    type: GET_ALL_PETS,
    pets
  });
};
export const GET_ALL_PETS_ADDRESS = 'GET_ALL_PETS_ADDRESS';
export const getAllPetsAddress = () => async (dispatch, getState) => {
  const state = getState();
  const factory = state.tomo.factory;
  const account = state.tomo.account;
  let petsAddress = await factory.methods.getAllPetAddressOf(account).call({ from: account });
  dispatch({
    type: GET_ALL_PETS_ADDRESS,
    petsAddress
  });
};

export const CREATE_NEW_PET = 'CREATE_NEW_PET';
export const createNewPet = (petId, targetFund, duration, purpose) => async (
  dispatch,
  getState
) => {
  const state = getState();
  const factory = state.tomo.factory;
  const account = state.tomo.account;
  const pets = state.tomo.pets;
  await factory.methods
    .create(petId, targetFund, duration, purpose)
    .send({ from: account })
    .then(() => {
      window.location.href = `/pets/${pets.length}`;
    })
    .catch((e) => {
      console.log('Create pet action error', e);
    });
};
