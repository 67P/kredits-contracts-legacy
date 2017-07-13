/* global module */
let seeds = function(contracts) {
  return {
    Contributors: {
      setOperatorContract: [
        [ contracts['Operator'].address ]
      ]
    },
    Token: {
      setOperatorContract: [
        [ contracts['Operator'].address ]
      ]
    },
    Operator: {
      setContributorsContract: [
        [ contracts['Contributors'].address ]
      ],
      setTokenContract: [
        [ contracts['Token'].address ]
      ],
      addContributor: [
        ['0xF18E631Ea191aE4ebE70046Fcb01a43655441C6d', '0x191518bf22f4ac29c1d26bf2a30eabb082525ed134a13f8d76bc9f5aec820b73', true], // basti
        ['0xa502eb4021f3b9ab62f75b57a94e1cfbf81fd827', '0x1b4613a14998c5a2ff302a161feb5f30f5f6468d0a2afc01600cc66d87230a9c', false]
      ],
      addProposal: [
        [1, 23, ''],
        [2, 42, '']
      ],
    }
  };
};

module.exports = seeds;
