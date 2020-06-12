import * as _ from 'lodash';
import axios from 'axios';
import { getConnection, EntityManager, In } from 'typeorm';
import { getLogger, BigNumber, BaseCurrencyWorker, GatewayRegistry, IToken, CurrencyRegistry, ICurrency } from 'sota-common';
import { MaxFee, CoinMarketCapKey } from '../../entities';
import * as rawdb from '../../rawdb';
​
const logger = getLogger('MaxFeeDoProcess');
​
const baseApiURL = 'https://pro-api.coinmarketcap.com';

// price every 5 minutes 1 time
export class MaxFeeDoProcessor extends BaseCurrencyWorker {
  protected _nextTickTimer: number = 300000;
}

/**
 * Tasks of maxFeeDoProcess:
 * - Get lastest price by usd of currency on CoinMarketCap
 * - Get estimate fee(network fee for token is native currency)
 * - Calculate current fee by usd and insert to database
 * @param process 
 */
export async function maxFeeDoProcess(process: MaxFeeDoProcessor): Promise<void> {
  await getConnection().transaction(async manager => {
    await _maxFeeDoProcess(manager, process);
  });
}

async function _maxFeeDoProcess(manager: EntityManager, process: MaxFeeDoProcessor): Promise<void> {
  const targetCurrency = 'usd';

  let iCurrency = process.getCurrency();
  if (!iCurrency) {
    throw new Error(`Currency = ${iCurrency} is invalid.`);
  }
  const coin = iCurrency.platform;
  const nativeCurrency: ICurrency = iCurrency.isNative? iCurrency : CurrencyRegistry.getOneCurrency(coin);

  const marketCapData = await manager.getRepository(CoinMarketCapKey).findOne({
    order: {
      updatedAt: 'ASC',
    },
  });
  if (!marketCapData) {
    logger.warn('Coin market cap API key was not found.');
    return;
  }

  const url = `${baseApiURL}/v1/cryptocurrency/quotes/latest?symbol=${coin.toUpperCase()}&convert=${targetCurrency.toUpperCase()}`;
  let result: any;
  try {
    result = await axios.get(url, {
      headers: {
        'X-CMC_PRO_API_KEY': marketCapData.key,
      },
    });
  } catch (err) {
    const response = err ? err.response : null;
    throw new Error(
      `CoinMarketCapAPI: ${response ? response.status : 500} - ${
        response ? response.statusText : 'Server Internal Error'
      }`
    );
  }

  const data = result.data && result.data.data ? result.data.data : null;
  const quotes = data && data[coin.toUpperCase()] ? data[coin.toUpperCase()].quote : null;
  const targetQuote = quotes && quotes[targetCurrency.toUpperCase()] ? quotes[targetCurrency.toUpperCase()] : null;
  if (!targetQuote || !targetQuote.price) {
    throw new Error(`CoinMarketCapAPI: quote[${targetCurrency.toUpperCase()}] or quote[${targetCurrency.toUpperCase()}].price is not exist.`)
  }
  const price = new BigNumber(targetQuote.price).decimalPlaces(2);
  
  const gateway = GatewayRegistry.getGatewayInstance(iCurrency);
  const estimateFee = await gateway.estimateFee({
    isConsolidate: iCurrency.isNative,
  });

  const feeByUsd = price.multipliedBy(estimateFee.div(new BigNumber(10).pow(nativeCurrency.humanReadableScale)));

  const maxFee = new MaxFee();
  maxFee.currency = iCurrency.isNative ? coin : (iCurrency as IToken).tokenType;
  maxFee.priceByUsd = price.toString();
  maxFee.estimateFee = estimateFee.toString();
  maxFee.feeByUsd = feeByUsd.toString();
  await manager.save(maxFee);

  await rawdb.updateRecordsTimestamp(manager, CoinMarketCapKey, [marketCapData.id]);
}

export default maxFeeDoProcess;
