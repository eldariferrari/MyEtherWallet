import React, { Component } from 'react';
import { connect } from 'react-redux';
import { AppState } from 'reducers';
import {
  setValueField,
  setGasLimitField,
  setDataField,
  setToField,
  setNonceField,
  TSetGasLimitField,
  TSetDataField,
  TSetToField,
  TSetNonceField,
  TSetValueField,
  FieldAction
} from 'actions/transaction';
import { upperFirst } from 'lodash';

type FieldNames = keyof AppState['transaction']['fields'];
type FieldSetter = (payload: FieldAction['payload']) => void;
interface DispatchProps {
  setGasLimitField: TSetGasLimitField;
  setDataField: TSetDataField;
  setToField: TSetToField;
  setNonceField: TSetNonceField;
  setValueField: TSetValueField;
}
interface SetterProps {
  name: FieldNames;
  withFieldSetter(setter: FieldSetter): React.ReactElement<any> | null;
}

class SetTransactionFieldClass extends Component<SetterProps & DispatchProps> {
  public render() {
    return this.props.withFieldSetter(this.fieldSetter);
  }
  private fieldSetter = (payload: FieldAction['payload']) =>
    this.props[`set${upperFirst(this.props.name)}Field`](payload);
}

export const SetTransactionField = connect(null, {
  setGasLimitField,
  setDataField,
  setToField,
  setNonceField,
  setValueField
})(SetTransactionFieldClass);