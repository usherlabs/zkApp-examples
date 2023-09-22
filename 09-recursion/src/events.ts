// import {
//   shutdown,
//   Field,
//   SelfProof,
//   Experimental,
//   Struct,
//   MerkleMap,
//   MerkleMapWitness,
//   verify,
//   CircuitString,
// } from 'o1js';
// import { Logger } from 'tslog';

// // class MerkleWitness20 extends MerkleWitness(20) {}

// const logger = new Logger();

// // ===============================================================

// type CircuitEventType = { key: Field; increment: Field; content: Field };

// async function main() {
//   logger.info('SnarkyJS loaded');

//   logger.info('compiling...');

//   const { verificationKey } = await Rollup.compile();

//   logger.info('generating events');

//   const events = [
//     {
//       key: Field(8),
//       increment: Field(3),
//       content: CircuitString.fromString('dummy1'),
//     },
//     {
//       key: Field(43),
//       increment: Field(2),
//       content: CircuitString.fromString('dummy2'),
//     },
//     {
//       key: Field(6),
//       increment: Field(3999),
//       content: CircuitString.fromString('dummy3'),
//     },
//     {
//       key: Field(8),
//       increment: Field(400),
//       content: CircuitString.fromString('dummy4'),
//     },
//   ];

//   let map = new MerkleMap();

//   const rollupStepInfo: any[] = [];

//   transitions.forEach(({ key, increment }) => {
//     const witness = map.getWitness(key);
//     const initialRoot = map.getRoot();

//     const currentValue = map.get(key);
//     const updatedValue = map.get(key).add(increment);

//     map.set(key, updatedValue);
//     const latestRoot = map.getRoot();

//     rollupStepInfo.push({
//       initialRoot,
//       latestRoot,
//       key,
//       currentValue,
//       increment,
//       witness,
//     });
//   });

//   logger.info('making first set of proofs');

//   // These could all be done in parallel in a real rollup
//   // If T is the time to make a proof this could take time T
//   const rollupProofs = rollupStepInfo.map(
//     async ({
//       initialRoot,
//       latestRoot,
//       key,
//       currentValue,
//       increment,
//       witness,
//     }) => {
//       const rollup = RollupState.createOneStep(
//         initialRoot,
//         latestRoot,
//         key,
//         currentValue,
//         increment,
//         witness
//       );
//       const proof = await Rollup.oneStep(
//         rollup,
//         initialRoot,
//         latestRoot,
//         key,
//         currentValue,
//         increment,
//         witness
//       );
//       return proof;
//     }
//   );

//   logger.info('merging proofs');

//   // These could also all be done in parallel in a real rollup
//   // If T is the time to make a proof this could take time log(n)*T
//   const proof = await rollupProofs.reduce(async (a, b) => {
//     const rollup = RollupState.createMerged(
//       (await a).publicInput,
//       (await b).publicInput
//     );
//     return await Rollup.merge(rollup, await a, await b);
//   });

//   logger.info('verifying rollup');
//   logger.info(proof.publicInput.latestRoot.toString());

//   const ok = await verify(proof.toJSON(), verificationKey);
//   logger.info('ok', ok);

//   logger.info('Shutting down');

//   await shutdown();
// }

// // ===============================================================

// class MetadataState extends Struct({
//   key: Field,
//   increment: Field,
// }) {
//   static fromEvent(event: CircuitEventType) {
//     return new MetadataState({
//       key: event.key,
//       increment: event.increment,
//     });
//   }
// }

// class RollupState extends Struct({
//   initialRoot: Field,
//   latestRoot: Field,
// }) {
//   static createOneStep(
//     initialRoot: Field,
//     latestRoot: Field,
//     currentValue: Field,
//     merkleMapWitness: MerkleMapWitness,
//     // Event
//     event: CircuitEventType
//   ) {
//     const [witnessRootBefore, witnessKey] =
//       merkleMapWitness.computeRootAndKey(currentValue);
//     initialRoot.assertEquals(witnessRootBefore);
//     witnessKey.assertEquals(event.key);
//     // eslint-disable-next-line
//     const [witnessRootAfter, _] = merkleMapWitness.computeRootAndKey(
//       currentValue.add(event.increment)
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
