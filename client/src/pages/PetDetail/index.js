import React, { Component } from 'react';
import { Row, Col } from 'reactstrap';
import { CircularProgressbarWithChildren } from 'react-circular-progressbar';
import { compose } from 'redux';
import { connect } from 'react-redux';
import store from 'store';
import * as actions from 'actions';
import * as createjs from 'createjs-module';
import StepProgressBar from './StepProgressBar';
import petWallet from 'contracts/PetWallet.json';
import Pet from 'constants/Pet';
import { PetAction } from 'constants/PetAction';
import Food from 'components/Food';
import Withdraw from 'components/Withdraw';
import './index.css';
import { petFood } from 'constants/PetFood';
import { withDraw } from 'constants/Petwithdraw';
import { Link } from 'react-router-dom';

class PetDetail extends Component {
  constructor() {
    super();

    this.state = {
      growthTime: 0,
      providentFund: 0,
      targetFund: 0,
      duration: 0,
      petInstance: null,
      type: 0,
      withdrawValue: '',
      progress: 0,
      action: PetAction.DEFAULT,
      scale: 1,
      xCoordinate: window.innerWidth / 2,
      yCoordinate: (window.innerHeight * 2) / 3,
      feed: true,
      feedButtonColor: 'success',
      withDrawButtonColor: 'secondary'
    };
    this.canvas = React.createRef();
    this.tick = this.tick.bind(this);
    this.feedPet = this.feedPet.bind(this);
    this.withDraw = this.withDraw.bind(this);
    this.action = this.action.bind(this);
  }

  async componentDidMount() {
    if (!window.web3) return;
    if (window.web3.currentProvider.isMetaMask) {
      await store.dispatch(actions.web3Connect());
    } else if (window.web3.currentProvider.isTomoWallet) {
      await store.dispatch(actions.web3TomoWalletConnect());
    }
    // await store.dispatch(actions.instantiateContracts());
    await store.dispatch(actions.getAllPetsAddress());
    let PetInstance = new this.props.tomo.web3.eth.Contract(
      petWallet.abi,
      this.props.petsAddress[this.props.match.params.address]
    );
    this.stage = new createjs.Stage('canvas');
    var divcanvas = document.getElementById('box-canvas');
    console.log(divcanvas.clientWidth);

    this.stage.canvas.height = (divcanvas.clientHeight * 2) / 3 - 50;
    this.stage.canvas.width = divcanvas.clientWidth;
    this.setState({
      petInstance: PetInstance,
      xCoordinate: divcanvas.clientWidth / 2,
      yCoordinate: (divcanvas.clientHeight * 2) / 3 - 100
    });
    this.getPetInfo();
  }

  async getPetInfo() {
    let [type, providentFund, growthTime, targetFund, duration] = Object.values(
      await this.state.petInstance.methods.getInfomation().call()
    );
    this.setState({ type, providentFund, growthTime, targetFund, duration });
    this.getProgress();
    this.getSize();
    this.action();
  }

  getProgress() {
    let progress = (this.state.growthTime / this.state.duration) * 100;
    let progressArray = Pet[this.state.type].progress;
    for (let element of progressArray) {
      if (progress < element.milestone) {
        this.setState({
          progress: element.index - 1
        });
        return;
      }
      this.setState({
        progress: progressArray.length - 1
      });
    }
  }

  getSize() {
    let size = (this.state.providentFund / this.state.targetFund) * 100;
    let sizeArray = Pet[this.state.type].size;
    for (let element of sizeArray) {
      if (size >= element.milestone) {
        this.setState({
          scale: element.scale
        });
      }
    }
  }

  handleSendChange = (e) => {
    this.setState({ sendValue: e.target.value });
  };

  feedPet = async (value) => {
    let PetInstance = this.state.petInstance;
    await PetInstance.methods
      .savingMoney(value)
      .send({ from: this.props.tomo.account, value: value * 10 ** 18 })
      .then(async () => {
        this.getPetInfo();
        this.setState({
          action: PetAction.FEED
        });
        this.action();
      });
  };

  handleWithdrawChange = (e) => {
    this.setState({ withdrawValue: e.target.value });
  };

  withDraw = async (value) => {
    let amount = Math.ceil((this.state.providentFund * value) / 100);
    let PetInstance = this.state.petInstance;
    await PetInstance.methods
      .withdrawMoney(amount)
      .send({ from: this.props.tomo.account })
      .then(async () => {
        this.getPetInfo();
        this.setState({ withdrawValue: '', action: PetAction.WITHDRAW });
        this.action();
      });
  };
  action() {
    let divcanvas = document.getElementById('box-canvas');
    this.stage.removeAllChildren();
    const img = new Image();
    img.src = Pet[this.state.type].background.src;
    let background = new createjs.Bitmap(img);
    background.image.onload = () => {
      background.sourceRect = new createjs.Rectangle(0, 0, img.width, img.height);
      background.scaleX = Pet[this.state.type].background.scaleX;
      background.scaleY = Pet[this.state.type].background.scaleY;
      background.x = divcanvas.clientWidth / 2 - (img.width * background.scaleX) / 2;
      background.y = this.stage.canvas.height - img.height * background.scaleY - 50;
    };

    let petAction = new createjs.SpriteSheet(
      Pet[this.state.type].progress[this.state.progress].item[this.state.action]
    );
    let petSprite = new createjs.Sprite(petAction);
    this.setState({ petSprite: petSprite });
    petSprite.x = this.state.xCoordinate;
    petSprite.y = this.state.yCoordinate;
    petSprite.scaleX = this.state.scale;
    petSprite.scaleY = this.state.scale;
    this.stage.addChild(background);
    this.stage.addChild(petSprite);
    petSprite.gotoAndPlay();
    createjs.Ticker.addEventListener('tick', this.tick);
  }

  tick() {
    let petSprite = this.state.petSprite;
    this.stage.update();
    if (this.state.action === PetAction.FEED) {
      if (petSprite.x < 0) {
        petSprite.x = 0;
        petSprite.scaleX = -1 * this.state.scale;
      } else if (petSprite.x > this.stage.canvas.width) {
        petSprite.x = this.stage.canvas.width;
        petSprite.scaleX = 1 * this.state.scale;
      }
      petSprite.scaleX > 0 ? (petSprite.x -= 10) : (petSprite.x += 10);
      this.setState({ xCoordinate: petSprite.x });
    }

    createjs.Ticker.framerate =
      Pet[this.state.type].progress[this.state.progress].item[this.state.action].framerate;
  }
  handleFeedClick = () => {
    this.setState({
      feed: true,
      feedButtonColor: 'success',
      withDrawButtonColor: 'secondary'
    });
  };
  handleWithdrawClick = () => {
    this.setState({
      feed: false,
      withDrawButtonColor: 'danger',
      feedButtonColor: 'secondary'
    });
  };
  render() {
    return (
      <div className='view'>
        <div className='row justify-content-md-center '>
          <div id='box-canvas'>
            <Row>
              <Col>
                <div className='fund_tracking'>
                  <div className='fund-circle-tracking'>
                    <CircularProgressbarWithChildren
                      value={(this.state.providentFund / this.state.targetFund) * 100}
                    >
                      <img alt='' src={require('assets/img/giphy.webp')} width='40' />
                      <div className='fund-circle-tracking-info'>
                        <strong>
                          {this.state.providentFund} / {this.state.targetFund}
                        </strong>
                        TOMO
                      </div>
                    </CircularProgressbarWithChildren>
                  </div>
                </div>
              </Col>
              <Col>
                <div className='growth_tracking'>
                  <StepProgressBar
                    percent={(this.state.growthTime / this.state.duration) * 100}
                    step={Pet[this.state.type].progress.length}
                    type={this.state.type}
                  />
                </div>
              </Col>
            </Row>
            <Row id='size'>
              <canvas id='canvas' />
            </Row>
            <Row>
              {this.state.feed
                ? petFood.map((item) => (
                    <Col
                      xs='4'
                      className='z-index-1000'
                      onClick={() => this.feedPet(item.value)}
                      key={item.value}
                    >
                      <Food item={item} />
                    </Col>
                  ))
                : withDraw.map((item) => (
                    <Col
                      xs='4'
                      className='z-index-1000'
                      onClick={() => this.withDraw(item.value)}
                      key={item.value}
                    >
                      <Withdraw item={item} />
                    </Col>
                  ))}
            </Row>
            <div className='bottom-mobile'>
              <div className='circle-btn-home'>
                <Link to={`/`}>
                  <span className='pushme'>
                    <span className='inner' onClick={this.toggleNewPet}>
                      <img alt='pet' src={require('assets/img/home-page.png')} />{' '}
                    </span>
                  </span>
                </Link>
              </div>
              <div className='box'>
                <div className='icons row'>
                  <div
                    className={(this.state.feed ? 'active-click' : '') + ' move-left'}
                    onClick={this.handleFeedClick}
                  >
                    <img alt='feed' src={require('assets/img/plus-math.png')} />
                  </div>
                  <div
                    className={(!this.state.feed ? 'active-click' : '') + ' move-right'}
                    onClick={this.handleWithdrawClick}
                  >
                    <img alt='withDraw' src={require('assets/img/minus-math.png')} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    tomo: state.tomo,
    petsAddress: state.tomo.petsAddress
  };
};

export default compose(connect(mapStateToProps))(PetDetail);
