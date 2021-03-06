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
	Button,
	Jumbotron,
	Thumbnail
} from 'react-bootstrap';
import { FormattedMessage, injectIntl } from 'react-intl';
import Waypoint from 'react-waypoint';
import { goToTop } from 'react-scrollable-anchor';

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
			titleVideo: this.props.title,
			isCollection: false,
			anchor: false,
			isCollection: false
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

	getCollectionFirstTime() {
		if (this.state.searchRequest === '') {
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
		}
	}

	componentDidUpdate(prevProps, prevState) {
		if (!this.state.isCollection && this.props.collection && this.props.collection[0]) {
			this.setState({ isCollection: true });
		}

		if (
			document.getElementById('collectionListItems') &&
			this.state.scrollHeight < document.getElementById('collectionListItems').scrollHeight
		) {
			this.setState({ scrollHeight: document.getElementById('collectionListItems').scrollHeight });
		}
		if (prevProps.page > 1 && this.props.page === 1) {
			this.setState({ scrollHeight: 0 });
		}
	}

	componentDidMount() {
		window.addEventListener('scroll', (e) => this.handleScroll(e));
	}

	handleScroll(event) {
		let target = event.target || event.srcElement;

		if (target.body.scrollTop) {
			if (target.body.scrollTop > 220) {
				this.setState({ anchor: true });
			} else {
				this.setState({ anchor: false });
			}
		} else if (target.documentElement.scrollTop) {
			if (target.documentElement.scrollTop > 220) {
				this.setState({ anchor: true });
			} else {
				this.setState({ anchor: false });
			}
		}
	}

	getNewPageMovies() {
		const { getCollectionsListByName, addOnePage, filters } = this.props;

		addOnePage();
		setTimeout(
			function() {
				getCollectionsListByName(this.state.searchRequest, this.props.page, 'scroll', filters);
			}.bind(this),
			1
		);
	}

	openDetailMovie(id) {
		window.location.href = '/movie?id=' + id;
	}

	render() {
		const { collection, showModal, intl } = this.props;

		return !this.props.sessionUser ? (
			<Grid>
				<Row>
					<Jumbotron>
						<h2>Welcome to Hypertube !</h2>
						<p>This is a web project from 42. Enjoy ;)</p>
					</Jumbotron>
				</Row>
			</Grid>
		) : (
			<Grid>
				{this.state.isCollection ? null : this.getCollectionFirstTime()}
				<Row>
					<PageHeader className={'center_it'}>
						<FormattedMessage id="title_home" />
					</PageHeader>
					<Form horizontal>
						<FormGroup validationState={collection.length ? 'success' : 'error'}>
							<Col smOffset={2} xs={8} md={8} lg={6} className={'smaller'}>
								<FormControl
									id="formControlsText"
									type="text"
									label="Text"
									placeholder={intl.formatMessage({ id: 'search_bar' })}
									autoFocus="true"
									onChange={(e) => this.getMovies(e)}
								/>
							</Col>
							{collection.length !== 1 ? (
								<ModalFilters title={this.state.searchRequest} status={this.state.filtersOn} />
							) : null}
						</FormGroup>
						<Col id="collectionListItems">
							{this.state.anchor ? (
								<div className="anchor-collection">
									<span className="anchor-top-text">BACK TO TOP ?</span>
									<div className="anchor-top">
										<Image
											key={Math.random()}
											src="/library/anchor-top.png"
											width="35px"
											responsive
											onClick={() => {
												goToTop();
												this.setState({ anchor: false });
											}}
										/>
									</div>
								</div>
							) : null}

							{collection.length ? (
								collection.map((movie, index) => {
									return (
										<Col key={Math.random()} xs={12} md={4} sm={6}>
											<Thumbnail
												className={'thumbnail_class'}
												key={index}
												src={movie.cover}
												id={movie._id}
												onClick={() => this.openDetailMovie(movie._id)}
											>
												<h5 className={'h5_normalized'}>
													{movie.views.indexOf(this.props.sessionUser.username) >= 0 ? (
														<Image
															key={Math.random()}
															src="/library/check.png"
															width="15px"
															className={'inline'}
															responsive
														/>
													) : null}
													{' ' + movie.title}
													{movie.season && movie.season != -1 ? (
														intl.formatMessage({ id: 'season_home' }) + movie.season
													) : (
														''
													)}
													{movie.title_episode ? (
														<Well bsSize="small">{movie.title_episode}</Well>
													) : (
														''
													)}
												</h5>
												<br />
												<p>
													<span>
														{intl.formatMessage({ id: 'year_player' })}
														{' ' + movie.year}
													</span>
													{movie.episode ? (
														' | ' +
														intl.formatMessage({ id: 'episode_home' }) +
														movie.episode
													) : (
														''
													)}
													{movie.quality ? (
														' | ' +
														intl.formatMessage({ id: 'quality_home' }) +
														movie.quality
													) : (
														''
													)}
													{movie.rating && movie.rating !== -1 ? (
														' | ' +
														intl.formatMessage({ id: 'rating_home' }) +
														movie.rating +
														'/10'
													) : (
														''
													)}
												</p>
											</Thumbnail>
										</Col>
									);
								})
							) : (
								<Col className="bad-request" key={Math.random()} smOffset={3} xs={12} md={8} lg={6}>
									<Col>
										<span className="bad-request-text">
											<FormattedMessage id="bad-request" />
										</span>
									</Col>
									<Col smOffset={2}>
										<Image
											key={Math.random()}
											src="/library/bad-request.gif"
											width="355px"
											className="bad-request"
											responsive
										/>
									</Col>
								</Col>
							)}
						</Col>
					</Form>
				</Row>
				{this.props.sessionUser && this.state.searchRequest === '' && this.props.collection[0] ? (
					<Waypoint onEnter={() => this.getNewPageMovies()} />
				) : null}
			</Grid>
		);
	}
}

export default injectIntl(HomePage);
