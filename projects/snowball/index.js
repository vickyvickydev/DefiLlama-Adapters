const sdk = require('@defillama/sdk');
const { request, gql } = require("graphql-request");
const { sumTokens2 } = require("../helper/unwrapLPs");
const { staking } = require('../helper/staking.js');

const abi = require('./abi.json')

const API_URL = `https://api.snowapi.net/graphql`

const query = gql`
query {
  SnowglobeContracts {
    pair
    snowglobeAddress
  }
  DeprecatedContracts {
    kind
    pair
    contractAddresses
  }
  StablevaultContracts {
    swapAddress
  }
}
`;

const XSNOB_CONTRACT = '0x83952E7ab4aca74ca96217D6F8f7591BEaD6D64E';
const SNOB_TOKEN_CONTRACT = '0xc38f41a296a4493ff429f1238e030924a1542e50';

async function getStableVaultBalances(balances, stablevaults, block, api) {
  const calls = stablevaults.map(i => [0, 1, 2, 3].map(num => ({ params: num, target: i.swapAddress }))).flat()
  const tokens = await api.multiCall({ abi: abi.getToken, calls: calls, withMetadata: true, })
  const toa = []
  tokens.forEach(i => {
    if (!i.output) return;
    toa.push([i.output, i.input.target])
  })
  return sumTokens2({ balances, api, tokensAndOwners: toa })
}

async function getSnowglobeBalances(balances, snowglobes, block, api) {
  const singleSidedPairs = snowglobes.map(globe => globe.snowglobeAddress).filter(i => i)
  const [tokens, tokenBalances] = await Promise.all([
    api.multiCall({
      calls: singleSidedPairs,
      abi: abi.token
    }),
    api.multiCall({
      calls: singleSidedPairs,
      abi: abi.balance
    })
  ])
  tokens.map((token, idx) => {
    sdk.util.sumSingleBalance(balances, `avax:${token}`, tokenBalances[idx]);
  })
  return balances
}

async function tvl(_timestamp, _ethereumBlock, chainBlocks, { api }) {
  const balances = {}
  const block = chainBlocks['avax'];

  let data = await request(API_URL, query);
  const deprecatedSnowglobes = data.DeprecatedContracts.filter(contract => contract.kind === "Snowglobe").map(contract => ({ pair: contract.pair, snowglobeAddress: contract.contractAddresses[0] }));
  const deprecatedStablevaults = data.DeprecatedContracts.filter(contract => contract.kind === "Stablevault").map(contract => ({ swapAddress: contract.contractAddresses[2] }));

  await Promise.all([
    getStableVaultBalances(balances, data.StablevaultContracts.concat(deprecatedStablevaults), block, api),
    getSnowglobeBalances(balances, data.SnowglobeContracts.concat(deprecatedSnowglobes), block, api),
  ])
  return balances;
}

module.exports = {
  avax: {
    tvl,
    staking: staking(XSNOB_CONTRACT, SNOB_TOKEN_CONTRACT)
  }
} // node test.js projects/snowball/index.js
