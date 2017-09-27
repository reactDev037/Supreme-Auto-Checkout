import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';
import RaisedButton from 'material-ui/RaisedButton';
import Divider from 'material-ui/Divider';
import { red300 } from 'material-ui/styles/colors';
import Dialog from 'material-ui/Dialog';
import IconButton from 'material-ui/IconButton';
import EditIcon from 'material-ui/svg-icons/image/edit';
import DeleteButton from 'material-ui/svg-icons/action/delete';
import Toggle from 'material-ui/Toggle';
import LaunchIcon from 'material-ui/svg-icons/action/launch';
import Layout from '../../../../containers/Layout';
import { addAtcProduct, removeAtcProduct, setAtcProductEnabled, editAtcProduct } from '../../../../actions/atc';
import AtcCreateForm from '../AtcCreateForm';
import StorageService from '../../../../../services/StorageService';
import AtcService from '../../../../../services/supreme/AtcService';
import ProductWatcherService from '../../../../../services/supreme/ProductWatcherService';
import version from '../../../../version';
import addNotification from '../../../../actions/notification';
import * as Helpers from '../../../../utils/Helpers';

class Atc extends Component {
  constructor(props) {
    super(props);
    const interval = setInterval(() => this.updateTimer(), 500);
    this.state = {
      createModalOpen: false,
      editingAtc: null,
      remainingTimeAtc: null,
      interval: interval,
    };
  }

  updateTimer() {
    if (!this.props.atcStartTime) return;
    const now = new Date().getTime();

    const time = Helpers.timeToDate(this.props.atcStartTime);
    const currDate = new Date(this.props.atcStartDate);
    currDate.setHours(time.getHours());
    currDate.setMinutes(time.getMinutes());
    currDate.setSeconds(time.getSeconds());

    const distance = currDate - now;
    // Time calculations for days, hours, minutes and seconds
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    this.setState({
      remainingTimeAtc: `${days}d ${hours}h ${minutes}m ${seconds}s`,
    });
  }

  componentWillUnmount() {
    if (this.state.interval) {
      clearInterval(this.state.interval);
    }
  }

  requestCloseModal() {
    this.setState({
      createModalOpen: false,
      editingAtc: null,
    });
  }

  requestModalOpen(editingAtc = null) {
    this.setState({
      createModalOpen: true,
      editingAtc,
    });
  }

  onRequestDeleteAtc(atcName) {
    this.props.removeAtcProduct(atcName);
  }

  handleSubmit(data) {
    if (this.state.editingAtc) {
      this.props.editAtcProduct(this.state.editingAtc.name, data);
    } else {
      this.props.addAtcProduct(data);
    }
    this.requestCloseModal();
  }

  toggleAtc(name, enabled) {
    this.props.setAtcProductEnabled(name, enabled);
  }

  async runNow(category, keywords, color) {
    let atcCategory = category;
    const profile = await StorageService.getCurrentProfileSettings(version);
    if (!profile || !profile.Supreme) {
      this.props.notify('Please configure your bot before running ATC');
      return false;
    }
    const useMonitor = profile.Supreme.Options.atcUseMonitor;
    if (!useMonitor) {
      return AtcService.openAtcTab(atcCategory, keywords, color);
    }
    const monitorProducts = await ProductWatcherService.getProducts();
    if (!monitorProducts) {
      return false;
    }
    const hasFound = AtcService.openAtcTabMonitor(monitorProducts, atcCategory, keywords, color);
    if (!hasFound) {
      this.props.notify('No matching product found');
    }
  }

  render() {
    const { atcProducts } = this.props;
    const isEditing = this.state.editingAtc !== null;
    const title = isEditing ? `Edit ${this.state.editingAtc.name}` : 'Add a new product';
    return (
      <Layout>
        <Dialog
          open={this.state.createModalOpen}
          title={title}
          modal={false}
          onRequestClose={() => this.requestCloseModal()}
          autoScrollBodyContent
        >
          <AtcCreateForm onRequestClose={() => this.requestCloseModal()} onSubmit={data => this.handleSubmit(data)} initialValues={this.state.editingAtc} />
        </Dialog>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <p>Each product you add will be automatically added to your cart by the AutoCop once the timer reaches its end.</p>
          <p>Click 'Run now' to manually trigger AutoCop for a single product</p>
          <h3>Autocop status: {this.props.atcEnabled ? 'ENABLED' : 'DISABLED'}</h3>
          { this.state.remainingTimeAtc &&
          <h3>Autocop starting in: {this.state.remainingTimeAtc}</h3>
          }
          <RaisedButton label="Add new" onTouchTap={() => this.requestModalOpen()} primary />
        </div>
        <Divider />
        <Table selectable={false}>
          <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
            <TableRow>
              <TableHeaderColumn>Name</TableHeaderColumn>
              <TableHeaderColumn>Enabled</TableHeaderColumn>
              <TableHeaderColumn>Run now</TableHeaderColumn>
              <TableHeaderColumn>Edit</TableHeaderColumn>
              <TableHeaderColumn>Delete</TableHeaderColumn>
            </TableRow>
          </TableHeader>
          <TableBody displayRowCheckbox={false} stripedRows>
            {
              (() => {
                if (!atcProducts || !atcProducts.length) {
                  return (<p style={{ textAlign: 'center' }}>Click "Add new" to add a new Autocop Product"</p>);
                }
                return atcProducts.map((x) => {
                  return (
                    <TableRow key={x.name}>
                      <TableRowColumn>{x.name}</TableRowColumn>
                      <TableRowColumn>
                        <Toggle toggled={x.enabled} onToggle={() => this.toggleAtc(x.name, !x.enabled)} />
                      </TableRowColumn>
                      <TableRowColumn>
                        <IconButton onTouchTap={async () => await this.runNow(x.category, x.keywords, x.color)}>
                          <LaunchIcon />
                        </IconButton>
                      </TableRowColumn>
                      <TableRowColumn>
                        <IconButton onTouchTap={() => this.requestModalOpen(x)}>
                          <EditIcon />
                        </IconButton>
                      </TableRowColumn>
                      <TableRowColumn>
                        <IconButton onTouchTap={() => this.onRequestDeleteAtc(x.name)}>
                          <DeleteButton color={red300} />
                        </IconButton>
                      </TableRowColumn>
                    </TableRow>
                  );
                });
              })()
            }
          </TableBody>
        </Table>
      </Layout>
    );
  }
}

function mapStateToProps(state) {
  const currentProfile = state.profiles.currentProfile;
  const settings = state.profiles.profiles.filter(x => x.name === currentProfile)[0].settings;
  let props = {
    atcProducts: state.atc.atcProducts,
  };
  if (settings && settings.Supreme && settings.Supreme.Options) {
    props = Object.assign({}, props, {
      atcEnabled: settings.Supreme.Options.atcEnabled,
      atcStartTime: settings.Supreme.Options.atcStartTime,
      atcStartDate: settings.Supreme.Options.atcStartDate,
    });
  }
  return props;
}

function mapDispatchToProps(dispatch) {
  return {
    addAtcProduct: data => dispatch(addAtcProduct(data)),
    editAtcProduct: (name, data) => dispatch(editAtcProduct(name, data)),
    removeAtcProduct: data => dispatch(removeAtcProduct(data)),
    setAtcProductEnabled: (name, enabled) => dispatch(setAtcProductEnabled(name, enabled)),
    notify: msg => dispatch(addNotification(msg)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Atc);
