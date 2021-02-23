import { Wallet, Contract } from 'ethers'
import { Web3Provider } from 'ethers/providers'
import { deployContract } from 'ethereum-waffle'

import { expandTo18Decimals } from './utilities'

import InfinityFactory from '@infinitywallet/infinity-core/build/InfinityFactory.json'
import IInfinityPair from '@infinitywallet/infinity-core/build/IInfinityPair.json'

import ERC20 from '../../build/ERC20.json'
import WETH9 from '../../build/WETH9.json'
import InfinityRouter01 from '../../build/InfinityRouter01.json'
import RouterEventEmitter from '../../build/RouterEventEmitter.json'

const overrides = {
  gasLimit: 9999999
}

interface infinityFixture {
  token0: Contract
  token1: Contract
  WETH: Contract
  WETHPartner: Contract
  infinityFactory: Contract
  router01: Contract
  routerEventEmitter: Contract
  router: Contract
  pair: Contract
  WETHPair: Contract
}

export async function infinityFixture(provider: Web3Provider, [wallet]: Wallet[]): Promise<infinityFixture> {
  // deploy tokens
  const tokenA = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)])
  const tokenB = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)])
  const WETH = await deployContract(wallet, WETH9)
  const WETHPartner = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)])

  // deploy
  const infinityFactory = await deployContract(wallet, InfinityFactory, [wallet.address])

  // deploy routers
  const router01 = await deployContract(wallet, InfinityRouter01, [infinityFactory.address, WETH.address], overrides)

  // event emitter for testing
  const routerEventEmitter = await deployContract(wallet, RouterEventEmitter, [])

  // initialize
  await infinityFactory.createPair(tokenA.address, tokenB.address)
  const pairAddress = await infinityFactory.getPair(tokenA.address, tokenB.address)
  const pair = new Contract(pairAddress, JSON.stringify(IInfinityPair.abi), provider).connect(wallet)

  const token0Address = await pair.token0()
  const token0 = tokenA.address === token0Address ? tokenA : tokenB
  const token1 = tokenA.address === token0Address ? tokenB : tokenA

  await infinityFactory.createPair(WETH.address, WETHPartner.address)
  const WETHPairAddress = await infinityFactory.getPair(WETH.address, WETHPartner.address)
  const WETHPair = new Contract(WETHPairAddress, JSON.stringify(IInfinityPair.abi), provider).connect(wallet)

  return {
    token0,
    token1,
    WETH,
    WETHPartner,
    infinityFactory,
    router01,
    router: router01, // the default router
    routerEventEmitter,
    pair,
    WETHPair
  }
}
