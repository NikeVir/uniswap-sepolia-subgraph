import { ZERO_BD, ZERO_BI, ONE_BI } from './constants'
/* eslint-disable prefer-const */
import {
  UniswapDayData,
  Factory,
  Pool,
  PoolDayData,
  Token,
  TokenDayData,
  TokenHourData,
  Bundle,
  PoolHourData,
  TickDayData,
  Tick
} from '../../generated/schema'
import { FACTORY_ADDRESS } from './constants'
import { ethereum } from '@graphprotocol/graph-ts'

/**
 * Tracks global aggregate data over daily windows
 * @param event
 */
export function updateUniswapDayData(event: ethereum.Event): UniswapDayData|null {
  let uniswap = Factory.load(FACTORY_ADDRESS)
  if(uniswap === null) {return null }
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400 // rounded
  let dayStartTimestamp = dayID * 86400
  let uniswapDayData = UniswapDayData.load(dayID.toString())
  if (uniswapDayData === null) {
    uniswapDayData = new UniswapDayData(dayID.toString())
    uniswapDayData.date = dayStartTimestamp
    uniswapDayData.volumeETH = ZERO_BD
    uniswapDayData.volumeUSD = ZERO_BD
    uniswapDayData.volumeUSDUntracked = ZERO_BD
    uniswapDayData.feesUSD = ZERO_BD
  }
  uniswapDayData.tvlUSD = uniswap.totalValueLockedUSD
  uniswapDayData.txCount = uniswap.txCount
  uniswapDayData.save()
  return uniswapDayData as UniswapDayData
}

export function updatePoolDayData(event: ethereum.Event): PoolDayData|null {
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let dayPoolID = event.address
    .toHexString()
    .concat('-')
    .concat(dayID.toString())
  let pool = Pool.load(event.address.toHexString())
  if (pool === null) {
    return null
  }
  let poolDayData = PoolDayData.load(dayPoolID)

  if (poolDayData === null) {
    poolDayData = new PoolDayData(dayPoolID)
    poolDayData.date = dayStartTimestamp
    poolDayData.pool = pool.id
    // things that dont get initialized always
    poolDayData.volumeToken0 = ZERO_BD
    poolDayData.volumeToken1 = ZERO_BD
    poolDayData.volumeUSD = ZERO_BD
    poolDayData.feesUSD = ZERO_BD
    poolDayData.txCount = ZERO_BI
    poolDayData.feeGrowthGlobal0X128 = ZERO_BI
    poolDayData.feeGrowthGlobal1X128 = ZERO_BI
    poolDayData.open = pool.token0Price
    poolDayData.high = pool.token0Price
    poolDayData.low = pool.token0Price
    poolDayData.close = pool.token0Price
  }

  if (pool.token0Price.gt(poolDayData.high)) {
    poolDayData.high = pool.token0Price
  }
  if (pool.token0Price.lt(poolDayData.low)) {
    poolDayData.low = pool.token0Price
  }

  poolDayData.liquidity = pool.liquidity
  poolDayData.sqrtPrice = pool.sqrtPrice
  poolDayData.feeGrowthGlobal0X128 = pool.feeGrowthGlobal0X128
  poolDayData.feeGrowthGlobal1X128 = pool.feeGrowthGlobal1X128
  poolDayData.token0Price = pool.token0Price
  poolDayData.token1Price = pool.token1Price
  poolDayData.tick = pool.tick
  poolDayData.tvlUSD = pool.totalValueLockedUSD
  poolDayData.txCount = poolDayData.txCount.plus(ONE_BI)
  poolDayData.save()

  return poolDayData as PoolDayData
}


export function updateTokenDayData(token: Token, event: ethereum.Event): TokenDayData|null {
  let bundle = Bundle.load('1')
  if (bundle === null) {
    return null
  }
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let tokenDayID = token.id
    .toString()
    .concat('-')
    .concat(dayID.toString())
  let tokenPrice = token.derivedETH.times(bundle.ethPriceUSD)

  let tokenDayData = TokenDayData.load(tokenDayID)
  if (tokenDayData === null) {
    tokenDayData = new TokenDayData(tokenDayID)
    tokenDayData.date = dayStartTimestamp
    tokenDayData.token = token.id
    tokenDayData.volume = ZERO_BD
    tokenDayData.volumeUSD = ZERO_BD
    tokenDayData.feesUSD = ZERO_BD
    tokenDayData.untrackedVolumeUSD = ZERO_BD
    tokenDayData.open = tokenPrice
    tokenDayData.high = tokenPrice
    tokenDayData.low = tokenPrice
    tokenDayData.close = tokenPrice
  }

  if (tokenPrice.gt(tokenDayData.high)) {
    tokenDayData.high = tokenPrice
  }

  if (tokenPrice.lt(tokenDayData.low)) {
    tokenDayData.low = tokenPrice
  }

  tokenDayData.close = tokenPrice
  tokenDayData.priceUSD = token.derivedETH.times(bundle.ethPriceUSD)
  tokenDayData.totalValueLocked = token.totalValueLocked
  tokenDayData.totalValueLockedUSD = token.totalValueLockedUSD
  tokenDayData.save()

  return tokenDayData as TokenDayData
}


