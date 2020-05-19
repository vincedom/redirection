/**
 * External dependencies
 */

import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'lib/locale';
import PropTypes from 'prop-types';
import Highlighter from 'react-highlight-words';

/**
 * Internal dependencies
 */

import RowActions from 'component/table/row-action';
import Column from 'component/table/column';
import { setSelected, performTableAction } from 'state/log/action';
import Spinner from 'component/spinner';
import { STATUS_IN_PROGRESS, STATUS_SAVING } from 'state/settings/type';
import Modal from 'component/modal';
import GeoMap from 'component/geo-map';
import Useragent from 'component/useragent';
import ExternalLink from 'component/external-link';
import RequestData from 'component/request-data';
import { has_capability, CAP_LOG_DELETE } from 'lib/capabilities';

class LogRow extends React.Component {
	static propTypes = {
		item: PropTypes.object.isRequired,
		selected: PropTypes.bool.isRequired,
		status: PropTypes.string.isRequired,
	};

	constructor( props ) {
		super( props );

		this.state = {
			showMap: false,
			showAgent: false,
			showData: false,
		};
	}

	onShow = ev => {
		ev.preventDefault();
		this.props.setFilter( 'ip', this.props.item.ip );
	}

	onSelected = () => {
		this.props.onSetSelected( [ this.props.item.id ] );
	}

	onDelete = ev => {
		ev.preventDefault();
		this.props.onDelete( this.props.item.id );
	}

	renderIp = ipStr => {
		if ( ipStr ) {
			return (
				<a href={ 'https://redirect.li/map/?ip=' + encodeURIComponent( ipStr ) } onClick={ this.showMap }>
					<Highlighter searchWords={ [ this.props.filters.ip ] } textToHighlight={ ipStr } autoEscape />
				</a>
			);
		}

		return '-';
	}

	renderMap() {
		return (
			<Modal onClose={ this.closeMap } padding={ false }>
				<GeoMap ip={ this.props.item.ip } />
			</Modal>
		);
	}

	renderAgent() {
		return (
			<Modal onClose={ this.closeAgent }>
				<Useragent agent={ this.props.item.agent } />
			</Modal>
		);
	}

	renderData() {
		return (
			<Modal onClose={ () => this.setState( { showData: false } ) }>
				<RequestData data={ this.props.item.request_data } />
			</Modal>
		);
	}

	showData = ev => {
		ev.preventDefault();
		this.setState( { showData: true } );
	}

	showMap = ev => {
		ev.preventDefault();
		this.setState( { showMap: true } );
	}

	showAgent = ev => {
		ev.preventDefault();
		this.setState( { showAgent: true } );
	}

	closeMap = () => {
		this.setState( { showMap: false } );
	}

	closeAgent = () => {
		this.setState( { showAgent: false } );
	}

	getLink( domain, link ) {
		if ( domain ) {
			return domain + link;
		}

		return link;
	}

	render() {
		const { created, created_time, ip = '', referrer = '', url = '', agent = '', sent_to = '', id, redirect_by = null } = this.props.item;
		const { request_method = '', domain = '', http_code = '', request_data = '', redirection_id } = this.props.item;
		const { selected, status, currentDisplaySelected } = this.props;
		const isLoading = status === STATUS_IN_PROGRESS;
		const isSaving = status === STATUS_SAVING;
		const hideRow = isLoading || isSaving;
		const menu = [];

		if ( has_capability( CAP_LOG_DELETE ) ) {
			menu.push( <a href="#" onClick={ this.onDelete } key="0">{ __( 'Delete' ) }</a> );
		}

		if ( ip ) {
			menu.unshift( <a href={ 'https://redirect.li/map/?ip=' + encodeURIComponent( ip ) } onClick={ this.showMap } key="2">{ __( 'Geo Info' ) }</a> );
		}

		if ( agent ) {
			menu.unshift( <a href={ 'https://redirect.li/agent/?ip=' + encodeURIComponent( agent ) } onClick={ this.showAgent } key="3">{ __( 'Agent Info' ) }</a> );
		}

		if ( request_data ) {
			menu.push( <a href="#" onClick={ this.showData } key="4">{ __( 'Extra Data' ) }</a> );
		}

		if ( redirection_id > 0 ) {
			menu.push( <a href={ Redirectioni10n.pluginRoot + '&' + encodeURIComponent( 'filterby[id]' ) + '=' + redirection_id } key="5">{ __( 'View Redirect' ) }</a> );
		}

		return (
			<tr className={ hideRow ? 'disabled' : '' }>
				<th scope="row" className="check-column">
					{ ! isSaving && <input type="checkbox" name="item[]" value={ id } disabled={ isLoading } checked={ selected } onChange={ this.onSelected } /> }
					{ isSaving && <Spinner size="small" /> }
				</th>

				<Column enabled="date" className="column-date" selected={ currentDisplaySelected }>
					{ created }<br />{ created_time }
				</Column>

				<Column enabled="method" className="column-method" selected={ currentDisplaySelected }>
					{ request_method }
				</Column>

				<Column enabled="domain" className="column-domain" selected={ currentDisplaySelected }>
					<Highlighter searchWords={ [ this.props.filters.domain ] } textToHighlight={ domain ? domain : '' } autoEscape />
				</Column>

				<Column enabled="url" className="column-primary column-url" selected={ currentDisplaySelected }>
					<ExternalLink url={ this.getLink( domain, url ) }>
						<Highlighter searchWords={ [ this.props.filters.url || this.props.filters['url-exact'] ] } textToHighlight={ url.substring( 0, 100 ) } autoEscape />
					</ExternalLink>

					<RowActions disabled={ isSaving }>
						{ menu.reduce( ( prev, curr ) => [ prev, ' | ', curr ] ) }
					</RowActions>

					{ this.state.showMap && this.renderMap() }
					{ this.state.showAgent && this.renderAgent() }
					{ this.state.showData && this.renderData() }
				</Column>

				<Column enabled="target" className="column-primary column-target" selected={ currentDisplaySelected }>
					{ sent_to && <ExternalLink url={ sent_to }>
						<Highlighter searchWords={ [ this.props.filters.target ] } textToHighlight={ sent_to.substring( 0, 100 ) } autoEscape />
					</ExternalLink> }
				</Column>

				<Column enabled="redirect_by" className="column-redirect_by" selected={ currentDisplaySelected }>
					{ redirect_by ? redirect_by : __( 'Redirection' ) }
				</Column>

				<Column enabled="code" className="column-code" selected={ currentDisplaySelected }>
					{ http_code > 0 ? http_code : '' }
				</Column>

				<Column enabled="referrer" className="column-referrer" selected={ currentDisplaySelected }>
					<Highlighter searchWords={ [ this.props.filters.referrer ] } textToHighlight={ referrer ? referrer : '' } autoEscape />
				</Column>

				<Column enabled="agent" className="column-agent" selected={ currentDisplaySelected }>
					<Highlighter searchWords={ [ this.props.filters.agent ] } textToHighlight={ agent ? agent : '' } autoEscape />
				</Column>

				<Column enabled="ip" className="column-ip" selected={ currentDisplaySelected }>
					{ this.renderIp( ip ) }

					{ ip && <RowActions>
						{ <a href="#" onClick={ this.onShow }>{ __( 'Filter by IP' ) }</a> }
					</RowActions> }
				</Column>
			</tr>
		);
	}
}

function mapDispatchToProps( dispatch ) {
	return {
		onSetSelected: items => {
			dispatch( setSelected( items ) );
		},
		onDelete: item => {
			dispatch( performTableAction( 'delete', item ) );
		},
	};
}

export default connect(
	null,
	mapDispatchToProps
)( LogRow );
