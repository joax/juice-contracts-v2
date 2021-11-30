import { expect } from 'chai';
import { ethers } from 'hardhat';

import { fastforwardFn } from '../helpers/utils';

describe('JBProjects::claimHandle(...)', function () {

  let jbOperatorStoreFactory;
  let jbOperatorStore;

  let jbProjectsFactory;
  let jbProjectsStore;

  let deployer;
  let projectOwner;
  let addrs;

  let projectHandle = "PROJECT_1";
  let projectHandleNotTaken = "PROJECT_2";
  let projectHandleNotTaken2 = "PROJECT_3";
  let metadataCid = "";

  beforeEach(async function () {
    [deployer, projectOwner, ...addrs] = await ethers.getSigners();

    jbOperatorStoreFactory = await ethers.getContractFactory('JBOperatorStore');
    jbOperatorStore = await jbOperatorStoreFactory.deploy();

    jbProjectsFactory = await ethers.getContractFactory('JBProjects');
    jbProjectsStore = await jbProjectsFactory.deploy(jbOperatorStore.address);
  });

  // Working on these now

  it('Should reject with Unauthorized', async function () {

    await jbProjectsStore
      .connect(deployer)
      .createFor(
        /*owner=*/ projectOwner.address,
        /*handle=*/ ethers.utils.formatBytes32String(projectHandle),
        /*metadataCid=*/ metadataCid,
      )

    await jbProjectsStore
      .connect(projectOwner)
      .transferHandleOf(
          /*projectId=*/ 1,
          /*address=*/ deployer.address,
          /*handle=*/ ethers.utils.formatBytes32String(projectHandleNotTaken)
      )

    await expect(
      jbProjectsStore
        .connect(projectOwner)
        .claimHandle(
          /*handle=*/ ethers.utils.formatBytes32String(projectHandleNotTaken),
          /*address=*/ projectOwner.address,
          /*projectId=*/ 1,
        ),
    ).to.be.revertedWith('0x0c: UNAUTHORIZED');
  });

  it('Claim handle from another project with wrong owner', async function () {

    await jbProjectsStore
      .connect(deployer)
      .createFor(
        /*owner=*/ projectOwner.address,
        /*handle=*/ ethers.utils.formatBytes32String(projectHandle),
        /*metadataCid=*/ "",
      )

    await jbProjectsStore
      .connect(deployer)
      .createFor(
        /*owner=*/ deployer.address,
        /*handle=*/ ethers.utils.formatBytes32String(projectHandleNotTaken2),
        /*metadataCid=*/ "",
      )

    await jbProjectsStore
      .connect(projectOwner)
      .transferHandleOf(
          /*projectId=*/ 1,
          /*address=*/ deployer.address,
          /*handle=*/ ethers.utils.formatBytes32String(projectHandleNotTaken)
      )

    await expect(
      jbProjectsStore
        .connect(projectOwner)
        .claimHandle(
            /*handle=*/ ethers.utils.formatBytes32String(projectHandle),
            /*address=*/ deployer.address,
            /*projectId=*/ 2,
        ),
    ).to.be.revertedWith('Operatable: UNAUTHORIZED');
  });

  it('Claim handle from another project after expiration date', async function () {

    await jbProjectsStore
      .connect(deployer)
      .createFor(
        /*owner=*/ projectOwner.address,
        /*handle=*/ ethers.utils.formatBytes32String(projectHandle),
        /*metadataCid=*/ "",
      )

    await jbProjectsStore
      .connect(deployer)
      .createFor(
        /*owner=*/ deployer.address,
        /*handle=*/ ethers.utils.formatBytes32String(projectHandleNotTaken2),
        /*metadataCid=*/ "",
      )

    await jbProjectsStore
      .connect(projectOwner)
      .transferHandleOf(
          /*projectId=*/ 1,
          /*address=*/ deployer.address,
          /*handle=*/ ethers.utils.formatBytes32String(projectHandleNotTaken)
      )

    let tx = await jbProjectsStore
      .connect(projectOwner)
      .challengeHandle(
        /*handle=*/ ethers.utils.formatBytes32String(projectHandleNotTaken)
      )

    await fastforwardFn(tx.blockNumber, ethers.BigNumber.from(12536000))

    await expect(
      jbProjectsStore
        .connect(deployer)
        .claimHandle(
            /*handle=*/ ethers.utils.formatBytes32String(projectHandleNotTaken),
            /*address=*/ deployer.address,
            /*projectId=*/ 2,
        ),
    ).to.be.revertedWith('0x0c: UNAUTHORIZED');
  });

  it('Should claim handle from another project', async function () {

    await jbProjectsStore
      .connect(deployer)
      .createFor(
        /*owner=*/ projectOwner.address,
        /*handle=*/ ethers.utils.formatBytes32String(projectHandle),
        /*metadataCid=*/ "",
      )

    await jbProjectsStore
      .connect(deployer)
      .createFor(
        /*owner=*/ deployer.address,
        /*handle=*/ ethers.utils.formatBytes32String(projectHandleNotTaken2),
        /*metadataCid=*/ "",
      )

    await jbProjectsStore
      .connect(projectOwner)
      .transferHandleOf(
          /*projectId=*/ 1,
          /*address=*/ deployer.address,
          /*handle=*/ ethers.utils.formatBytes32String(projectHandleNotTaken)
      )

    let tx = await jbProjectsStore
      .connect(deployer)
      .claimHandle(
          /*handle=*/ ethers.utils.formatBytes32String(projectHandle),
          /*address=*/ deployer.address,
          /*projectId=*/ 2,
      )

    await expect(tx)
      .to.emit(jbProjectsStore, 'ClaimHandle')
      .withArgs(2, deployer.address, ethers.utils.formatBytes32String(projectHandle), deployer.address)
  });

})