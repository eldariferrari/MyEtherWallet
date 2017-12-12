import { getWalletInst } from 'selectors/wallet';
import { IFullWallet } from 'libs/wallet';
import { getGasPriceGwei, getNetworkConfig } from 'selectors/config';
import { select, call, put, take } from 'redux-saga/effects';
import { toWei, getDecimalFromEtherUnit, Wei } from 'libs/units';
import {
  signTransactionFailed,
  SignWeb3TransactionRequestedAction,
  SignLocalTransactionRequestedAction,
  GetFromFailedAction,
  GetFromSucceededAction,
  getFromRequested,
  TypeKeys as TK
} from 'actions/transaction';
import Tx from 'ethereumjs-tx';
import { NetworkConfig } from 'config/data';
import { SagaIterator } from 'redux-saga';
import { showNotification } from 'actions/notifications';
import { toBuffer } from 'ethereumjs-util';

/* tslint:disable */
import 'actions/transaction';
import 'selectors/transaction'; //throws if not imported
/* tslint:enable */

import {
  signTransactionWrapper,
  getGasPrice,
  getWalletAndTransaction,
  handleFailedTransaction,
  getFrom
} from 'sagas/transaction/signing/helpers';
import { cloneableGenerator } from 'redux-saga/utils';

describe('signTransactionWrapper*', () => {
  const partialTx: any = {
    payload: 'payload'
  };
  const IWalletAndTx: any = {
    wallet: 'wallet'
  };
  const err = new Error('Error');

  const func = jest.fn();
  const gens: any = {};
  gens.gen = cloneableGenerator(signTransactionWrapper(func))(partialTx);

  it('should call getWalletAndTransAction', () => {
    expect(gens.gen.next().value).toEqual(call(getWalletAndTransaction, partialTx.payload));
  });

  it('should call getFrom', () => {
    gens.clone = gens.gen.clone();
    expect(gens.gen.next(IWalletAndTx).value).toEqual(call(getFrom));
  });

  it('should call func with IWalletAndTx', () => {
    expect(gens.gen.next().value).toEqual(call(func, IWalletAndTx));
  });

  it('should handle errors', () => {
    expect(gens.clone.throw(err).value).toEqual(call(handleFailedTransaction, err));
  });

  it('should be done', () => {
    expect(gens.gen.next().done).toEqual(true);
  });
});

describe('getGasPrice*', () => {
  const gasPriceInGwei = 21;
  const gweiDecimal = 42;
  const gasPriceWei = Wei('100');
  const gasPriceBuffer = new Buffer(gasPriceInGwei);

  const gen = getGasPrice();

  it('should select getGasPriceGwei', () => {
    expect(gen.next().value).toEqual(select(getGasPriceGwei));
  });

  it('should call getDecimalFromEtherUnit', () => {
    expect(gen.next(gasPriceInGwei).value).toEqual(call(getDecimalFromEtherUnit, 'gwei'));
  });

  it('should call toWei', () => {
    expect(gen.next(gweiDecimal).value).toEqual(
      call(toWei, gasPriceInGwei.toString(), gweiDecimal)
    );
  });

  it('should call toBuffer', () => {
    expect(gen.next(gasPriceWei).value).toEqual(call(toBuffer, gasPriceWei));
  });

  it('should be done', () => {
    expect(gen.next().done).toEqual(true);
  });
});

describe('getWalletAndTransaction*', () => {
  const partialTx: any = {
    gasPrice: 'gasPrice',
    _chainId: '_chainId'
  };
  const wallet = {
    data2: 'data2'
  };
  const networkConfig = {
    chainId: 'chainId'
  };
  const gasPrice = new Buffer('gasPrice');

  const gens: any = {};
  gens.gen = cloneableGenerator(getWalletAndTransaction)(partialTx);

  it('should select getWalletInst', () => {
    expect(gens.gen.next().value).toEqual(select(getWalletInst));
  });

  it('should error on no wallet', () => {
    gens.clone = gens.gen.clone();
    expect(() => gens.clone.next()).toThrow();
  });

  it('should select getNetworkConfig', () => {
    expect(gens.gen.next(wallet).value).toEqual(select(getNetworkConfig));
  });

  it('should call getGasPrice', () => {
    expect(gens.gen.next(networkConfig).value).toEqual(call(getGasPrice));
  });

  it('should return expected', () => {
    expect(gens.gen.next().value).toEqual({
      wallet,
      tx: partialTx
    });
  });

  it('should be done', () => {
    expect(gens.gen.next().done).toEqual(true);
  });
});

describe('handleFailedTransaction*', () => {
  const err = new Error('Message');
  const gen = handleFailedTransaction(err);
  let random;

  beforeAll(() => {
    random = Math.random;
    Math.random = () => 0.001;
  });

  afterAll(() => {
    Math.random = random;
  });

  it('should put showNotification', () => {
    expect(gen.next().value).toEqual(put(showNotification('danger', err.message, 5000)));
  });

  it('should put signTransactionFailed', () => {
    expect(gen.next().value).toEqual(put(signTransactionFailed()));
  });
});

describe('getFrom*', () => {
  const getFromSucceeded = {
    type: TK.GET_FROM_SUCCEEDED
  };
  const getFromFailed = {
    type: TK.GET_FROM_FAILED
  };

  const gens: any = {};
  gens.gen = cloneableGenerator(getFrom)();

  it('should put getFromRequested', () => {
    expect(gens.gen.next().value).toEqual(put(getFromRequested()));
  });

  it('should take GET_FROM*', () => {
    expect(gens.gen.next().value).toEqual(take([TK.GET_FROM_SUCCEEDED, TK.GET_FROM_FAILED]));
  });

  it('should throw error if failed', () => {
    gens.clone = gens.gen.clone();
    expect(() => gens.clone.next(getFromFailed)).toThrow();
  });

  it('should return if success', () => {
    expect(gens.gen.next(getFromSucceeded).done).toEqual(true);
  });
});
