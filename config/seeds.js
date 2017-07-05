/* global module */
let seeds = function(contracts) {
  return {
    Contributors: {
      setOperatorContract: contracts['Contributors'].address
    },
    Token: {
      setOperatorContract: contracts['Contributors'].address
    },
    Operator: {
      setTokenContract: contracts['Token'].address,
      setContributorsContract: contracts['Contributors'].address,
      addContributor: [
        ['0xF18E631Ea191aE4ebE70046Fcb01a43655441C6d', 'QmQ2ZZS2bXgneQfKtVTVxe6dV7pcJuXnTeZJQtoVUFsAtJ', true], // basti
        ['0xa502eb4021f3b9ab62f75b57a94e1cfbf81fd827', 'QmdXMsswhDkuqWDQ5Qjr5thvYF668i7XVHwDoAoFkfcKWp', false]
      ],
      addProposal: [
        [1, 23, ''],
        [2, 42, '']
      ],
    }
  };
};

module.exports = seeds;
