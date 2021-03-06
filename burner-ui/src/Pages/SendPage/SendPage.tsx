import React, { Component, Fragment } from 'react';
import { Redirect, RouteComponentProps } from 'react-router-dom';
import injectSheet from 'react-jss';
import { Asset } from '@burner-wallet/assets';
import { BurnerContext, withBurner, SendParams } from '../../BurnerProvider';
import { Account } from '../../';
import AddressInputField from '../../components/AddressInputField';
import AddressInputSearchResults from '../../components/AddressInputSearchResults';
import AssetSelector from '../../components/AssetSelector';
import AmountInput from '../../components/AmountInput';
import Button from '../../components/Button';
import Page from '../../components/Page';
import AccountBalance, { AccountBalanceData } from '../../data-providers/AccountBalance';

interface SendPageState {
  to: string,
  value: string,
  maxVal: string | null,
  asset: Asset,
  sending: boolean,
  txHash: string | null,
  account: Account | null,
  accounts: Account[],
  message: string,
}

type SendPageProps = BurnerContext & RouteComponentProps & { classes: any };

const getQueryStringParams = (query: string) => {
  return query
    ? (/^[?#]/.test(query) ? query.slice(1) : query)
      .split('&')
      .reduce((params: any, param: any) => {
          const [key, value] = param.split('=');
          params[key] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
          return params;
        }, {}
      )
    : {}
};

const styles = {
  messageField: {
    width: '100%',
    padding: 4,
    fontSize: 16,
    background: '#EEEEEE',
    height: 40,
    boxSizing: 'border-box',
    border: 'solid 1px #cccccc',
    borderRadius: 4,
  },
  sendContainer: {
    marginTop: 16,
  },
};

class SendPage extends Component<SendPageProps, SendPageState> {
  constructor(props: SendPageProps) {
    super(props);
    const defaultVals = {
      to: '',
      value: '',
      message: '',
      ...props.location.state,
      ...getQueryStringParams(props.location.search),
    };

    const getAsset = (id: string) => {
      const [asset] = props.assets.filter(asset => asset.id === id);
      return asset || null;
    };
    const asset = (defaultVals.asset && getAsset(defaultVals.asset)) || props.assets[0];

    this.state = {
      to: defaultVals.to,
      value: defaultVals.value,
      maxVal: null,
      message: defaultVals.message,
      asset,

      sending: false,
      txHash: null,
      account: null,
      accounts: [],
    };
  }

  async getAccounts(search: string) {
    const { pluginData } = this.props;
    const _accounts = await Promise.all(pluginData.accountSearches.map(searchFn => searchFn(search)));
    const accounts = Array.prototype.concat(..._accounts);
    this.setState({ accounts });
  }

  async scanCode() {
    try {
      const address = await this.props.actions.scanQrCode();
      this.setState({ to: address });
    } catch (e) {}
  }

  send() {
    const { asset, to, value, message, maxVal } = this.state;
    const { actions } = this.props;
    if (!asset) {
      throw new Error('Asset not selected');
    }
    const sendProps: SendParams = {
      to,
      asset: asset.id,
      message: message.length > 0 ? message : null,
    };

    if (maxVal) {
      sendProps.value = maxVal;
    } else {
      sendProps.ether = value;
    }

    actions.send(sendProps);
  }

  render() {
    const { to, value, asset, sending, txHash, account, accounts, message } = this.state;
    const { actions, classes } = this.props;

    if (txHash && asset) {
      return (
        <Redirect to={`/receipt/${asset.id}/${txHash}`} />
      )
    }

    const canSend = !sending && to.length == 42 && to;
    return (
      <Page title="Send To Address">
        <AssetSelector selected={asset} onChange={newAsset => this.setState({ asset: newAsset })} disabled={sending} />
        <div>To address:</div>
        <AddressInputField
          value={to}
          account={account}
          onChange={(to: string, account: Account | null) => {
            this.setState({ to, account });
            if (account) {
              this.setState({ accounts: [] });
            } else {
              this.getAccounts(to);
            }
          }}
          scan={() => this.scanCode()}
          disabled={sending}
        />
        <AddressInputSearchResults
          accounts={accounts}
          onSelect={(account: Account) => this.setState({ account, accounts: [] })}
        />

        <AccountBalance asset={asset} render={(data: AccountBalanceData | null) => {
          const exceedsBalance = !!data && parseFloat(value) > parseFloat(data.displayMaximumSendableBalance);
          return (
            <Fragment>
              <div>Send Amount:</div>
              <AmountInput
                asset={asset}
                value={value}
                onChange={(val: string, isMax: boolean) => this.setState({
                  value: val,
                  maxVal: data && isMax ? data.maximumSendableBalance : null,
                })}
                disabled={sending}
                max={data && data.displayMaximumSendableBalance}
              />

              {asset.supportsMessages() && (
                <Fragment>
                  <div>Message:</div>
                  <input
                    value={message}
                    onChange={e => this.setState({ message: e.target.value })}
                    className={classes.messageField}
                  />
                </Fragment>
              )}

              <div className={classes.sendContainer}>
                <Button
                  onClick={() => this.send()}
                  disabled={!canSend || exceedsBalance}
                >
                  Send
                </Button>
              </div>
            </Fragment>
          );
        }} />
      </Page>
    );
  }
}

export default injectSheet(styles)(withBurner(SendPage));
