const {getLiquityTvl} = require('../helper/liquity')

const FTM_ADDRESS = '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83';
const TROVE_MANAGER_ADDRESS = "0xC87D230B3239d1A90463463d8adDFD70709D391b";

module.exports = {
  fantom: {
    tvl: getLiquityTvl(FTM_ADDRESS,TROVE_MANAGER_ADDRESS,"fantom"),
  },
  methodology: `Aquarius does not run its own web interface deposits for it's TVL are made at third-party frontend operators incetivized with the AQU token. TVL consists of deposits made to mint aUSD.`
};
