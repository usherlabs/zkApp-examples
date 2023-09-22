// import {
//   // isReady,
//   shutdown,
//   Field,
//   // Mina,
//   // PrivateKey,
//   // AccountUpdate,
//   SelfProof,
//   Experimental,
//   Struct,
//   // Bool,
//   // Circuit,
//   // Poseidon,
//   MerkleMap,
//   // MerkleTree,
//   // MerkleWitness,
//   MerkleMapWitness,
//   verify,
//   // SmartContract,
//   // state,
//   // method,
//   // DeployArgs,
//   Proof,
//   // Permissions,
// } from 'o1js';
// import { Logger } from 'tslog';

// // class MerkleWitness20 extends MerkleWitness(20) {}

// const logger = new Logger();

// // ===============================================================

// async function main() {
//   logger.info('SnarkyJS loaded');

//   logger.info('compiling...');

//   const { verificationKey } = await Rollup.compile();

//   logger.info('generating transition information');

//   const events = [
//     { key: Field(8), size: Field(3) },
//     { key: Field(43), size: Field(2) },
//     { key: Field(6), size: Field(3999) },
//     { key: Field(8), size: Field(400) },
//   ];

//   let map = new MerkleMap();

//   events.forEach(({ key, size }) => {
//     map.set(key, size);
//   });

//   logger.info('making first set of proofs');

//   const rollupProofs: Proof<RollupState, void>[] = [];
//   for (var {
//     initialRoot,
//     latestRoot,
//     key,
//     currentValue,
//     increment,
//     witness,
//   } of rollupStepInfo) {
//     const rollup = RollupState.createOneStep(
//       initialRoot,
//       latestRoot,
//       key,
//       currentValue,
//       increment,
//       witness
//     );
//     logger.info(`rollup updated: ${rollup.latestRoot}`);
//   }

//   const proof = await Rollup.oneStep(
//     rollup,
//     initialRoot,
//     latestRoot,
//     key,
//     currentValue,
//     increment,
//     witness
//   );
//   logger.info(`proof created: ${proof.publicInput.latestRoot}`);
//   rollupProofs.push(proof);

//   // const rps = await Promise.all(rollupProofs);
//   const rps = rollupProofs;
//   logger.info('merging proofs');

//   var proof: Proof<RollupState, void> = await rps[0];
//   for (let i = 1; i < rollupProofs.length; i++) {
//     const rollup = RollupState.createMerged(
//       proof.publicInput,
//       rps[i].publicInput
//     );
//     let mergedProof = await Rollup.merge(rollup, proof, rps[i]);
//     proof = mergedProof;
//   }

//   logger.info('verifying rollup');
//   logger.info(proof.publicInput.latestRoot.toString());

//   const ok = await verify(proof.toJSON(), verificationKey);
//   logger.info('ok', ok);

//   logger.info('Shutting down');

//   await shutdown();
// }

// // ===============================================================

// class RollupState extends Struct({
//   initialRoot: Field,
//   latestRoot: Field,
// }) {
//   static createOneStep(
//     initialRoot: Field,
//     latestRoot: Field,
//     key: Field,
//     currentValue: Field,
//     incrementAmount: Field,
//     merkleMapWitness: MerkleMapWitness
//   ) {
//     const [witnessRootBefore, witnessKey] =
//       merkleMapWitness.computeRootAndKey(currentValue);
//     initialRoot.assertEquals(witnessRootBefore);
//     witnessKey.assertEquals(key);
//     // eslint-disable-next-line
//     const [witnessRootAfter, _] = merkleMapWitness.computeRootAndKey(
//       currentValue.add(incrementAmount)
//     );
//     latestRoot.assertEquals(witnessRootAfter);

//     return new RollupState({
//       initialRoot,
//       latestRoot,
//     });
//   }

//   static createMerged(state1: RollupState, state2: RollupState) {
//     return new RollupState({
//       initialRoot: state1.initialRoot,
//       latestRoot: state2.latestRoot,
//     });
//   }

//   static assertEquals(state1: RollupState, state2: RollupState) {
//     state1.initialRoot.assertEquals(state2.initialRoot);
//     state1.latestRoot.assertEquals(state2.latestRoot);
//   }
// }

// // ===============================================================

// const Rollup = Experimental.ZkProgram({
//   publicInput: RollupState,

//   methods: {
//     oneStep: {
//       privateInputs: [Field, Field, Field, Field, Field, MerkleMapWitness],

//       method(
//         state: RollupState,
//         initialRoot: Field,
//         latestRoot: Field,
//         key: Field,
//         currentValue: Field,
//         incrementAmount: Field,
//         merkleMapWitness: MerkleMapWitness
//       ) {
//         const computedState = RollupState.createOneStep(
//           initialRoot,
//           latestRoot,
//           key,
//           currentValue,
//           incrementAmount,
//           merkleMapWitness
//         );
//         RollupState.assertEquals(computedState, state);
//       },
//     },

//     merge: {
//       privateInputs: [SelfProof, SelfProof],

//       method(
//         newState: RollupState,
//         rollup1proof: SelfProof<RollupState, void>,
//         rollup2proof: SelfProof<RollupState, void>
//       ) {
//         rollup1proof.verify();
//         rollup2proof.verify();

//         rollup2proof.publicInput.initialRoot.assertEquals(
//           rollup1proof.publicInput.latestRoot
//         );
//         rollup1proof.publicInput.initialRoot.assertEquals(newState.initialRoot);
//         rollup2proof.publicInput.latestRoot.assertEquals(newState.latestRoot);
//       },
//     },
//   },
// });

// export let RollupProof_ = Experimental.ZkProgram.Proof(Rollup);
// export class RollupProof extends RollupProof_ {}

// // ===============================================================

// // class RollupContract extends SmartContract {
// //   @state(Field) state = State<Field>();

// //   deploy(args: DeployArgs) {
// //     super.deploy(args);
// //     this.setPermissions({
// //       ...Permissions.default(),
// //       editState: Permissions.proofOrSignature(),
// //     });
// //   }

// //   @method initStateRoot(stateRoot: Field) {
// //     this.state.set(stateRoot);
// //   }

// //   @method update(rollupStateProof: RollupProof) {
// //     const currentState = this.state.get();
// //     this.state.assertEquals(currentState);

// //     rollupStateProof.publicInput.initialRoot.assertEquals(currentState);

// //     rollupStateProof.verify();

// //     this.state.set(rollupStateProof.publicInput.latestRoot);
// //   }
// // }

// // ===============================================================

// main();
