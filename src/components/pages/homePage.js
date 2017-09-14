import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import ModalFilters from 'components/modals/modalFilters';
import {
	Grid,
	Row,
	Col,
	Form,
	FormGroup,
	FormControl,
	Image,
	ListGroup,
	ListGroupItem,
	Well,
	PageHeader,
	Button
} from 'react-bootstrap';
import { FormattedMessage, injectIntl } from 'react-intl';

import { getUserFromSession, disconnectUser } from '../../actions/usersActions';
import * as Collections from '../../actions/collectionsActions';

@connect(
	(state) => ({
		sessionUser: state.users.sessionUser,
		msg: state.users.msg,
		style: state.users.style,
		collection: state.collection.collection,
		filters: state.filters,
		page: state.collection.page
	}),
	(dispatch) =>
		bindActionCreators(
			{
				...Collections,
				getUserFromSession,
				disconnectUser
			},
			dispatch
		)
)
class HomePage extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			searchRequest: '',
			scrollHeight: 0,
			titleVideo: this.props.title
		};
	}

	getMovies(e) {
		const {
				getCollectionsListByName,
				getAllGenresInStore,
				getAllQualityInStore,
				getAllSeasonsInStore,
				getMinMaxImdbNote,
				getMinMaxYears,
				filters,
				page
			} = this.props,
			inputId = e.target.id,
			val = e.target.value;

		if (inputId === 'formControlsText') {
			this.setState({ searchRequest: val, scrollHeight: 0 });

			getAllGenresInStore(val);
			getAllQualityInStore(val);
			getAllSeasonsInStore(val);
			getMinMaxImdbNote(val);
			getMinMaxYears(val);

			getCollectionsListByName(val, page, 'input', filters);
		}
	}

	componentDidMount() {
		const {
			getCollectionsListByName,
			getAllGenresInStore,
			getAllQualityInStore,
			getAllSeasonsInStore,
			getMinMaxImdbNote,
			getMinMaxYears
		} = this.props;

		getAllGenresInStore();
		getAllQualityInStore();
		getAllSeasonsInStore();
		getMinMaxImdbNote();
		getMinMaxYears();

		getCollectionsListByName('', 1);
		window.addEventListener('scroll', (e) => this.handleScroll(e));
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.state.scrollHeight < document.getElementById('collectionListItems').scrollHeight) {
			this.setState({ scrollHeight: document.getElementById('collectionListItems').scrollHeight });
		}
		if (prevProps.page > 1 && this.props.page === 1) {
			this.setState({ scrollHeight: 0 });
		}
	}

	componentWillUnmount() {
		window.removeEventListener('scroll', (e) => this.handleScroll(e));
	}

	handleScroll(event) {
		// Firefox 1.0+
		var isFirefox = typeof InstallTrigger !== 'undefined';

		// Chrome 1+
		var isChrome = !!window.chrome && !!window.chrome.webstore;

		if (isChrome) {
			if (event.srcElement.scrollingElement.scrollTop >= this.state.scrollHeight - 1200) {
				this.getNewPageMovies();
			}
		} else {
			if (event.pageY >= this.state.scrollHeight - 1200) {
				this.getNewPageMovies();
			}
		}
	}

	getNewPageMovies() {
		const { getCollectionsListByName, addOnePage, filters } = this.props;

		addOnePage();
		getCollectionsListByName(this.state.searchRequest, this.props.page, 'scroll', filters);
	}

	openDetailMovie(id) {
		window.location.href = '/movie?id=' + id;
	}

	render() {
		const { collection, showModal, intl } = this.props;
		const { collection, showModal } = this.props;

		return !this.props.sessionUser ? (
			<Grid>
				<Row>Blablabla</Row>
			</Grid>
		) : (
			<Grid>
				<Row>
					<PageHeader>
						<FormattedMessage id="title_home" />
					</PageHeader>
					<Form horizontal>
						<FormGroup>
							<Col smOffset={2} xs={8} md={8} lg={8}>
								<FormControl
									id="formControlsText"
									type="text"
									label="Text"
									placeholder={intl.formatMessage({ id: 'search_bar' })}
									autoFocus="true"
									onChange={(e) => this.getMovies(e)}
								/>
							</Col>
							<ModalFilters title={this.state.searchRequest} />
						</FormGroup>
						<Col smOffset={0} xs={12} md={12} lg={12} id="collectionListItems">
							{collection ? (
								collection.map((movie, index) => {
									return (
										<ListGroup key={index}>
											<ListGroupItem
												id={movie._id}
												onClick={() => this.openDetailMovie(movie._id)}
											>
												<Well>
													{movie.title}
													{movie.season && movie.season != -1 ? (
														intl.formatMessage({ id: 'season_home' }) + movie.season
													) : (
														''
													)}
												</Well>
												{movie.title_episode ? (
													<Well bsSize="small">{movie.title_episode}</Well>
												) : (
													''
												)}
												<div className="year-collection">
													<span>{movie.year}</span>
												</div>
												<div className="img-collection">
													<Image key={movie.cover} src={movie.cover} responsive />
												</div>

												<Well>
													{movie.episode ? (
														intl.formatMessage({ id: 'episode_home' }) + movie.episode
													) : (
														''
													)}
													{movie.quality ? (
														intl.formatMessage({ id: 'quality_home' }) + movie.quality
													) : (
														''
													)}
													{movie.rating && movie.rating !== -1 ? (
														intl.formatMessage({ id: 'rating_home' }) + movie.rating + '/10'
													) : (
														''
													)}
												</Well>
											</ListGroupItem>
										</ListGroup>
									);
								})
							) : (
								'rien'
							)}
						</Col>
					</Form>
				</Row>
			</Grid>
		);
	}
}

export default injectIntl(HomePage);
