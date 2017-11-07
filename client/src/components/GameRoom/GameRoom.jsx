import React from 'react';
import socket from '../../socket/index.js';
import Hand from './Hand';
import PlayerList from './PlayerList';
import Table from './Table';
import Actions from './Actions';
import PoopPrompt from './PoopPrompt';
import MessageBoard from './MessageBoard';
import EndGamePrompt from './EndGamePrompt';
import GameAlerts from './GameAlerts';


class GameRoom extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      user: '',
      room: '',
      hand: [],
      blackCard: {},
      roomCreator: '',
      submittedCards: [],
      turnPhase: '',
      playerArray: [],
      czar: '',
      yourSubmittedCards: [],
      submittedAlready: false,
      messages: [],
      winner: '',
      decidedEndGame: false,
    };

    this.startPoopPrompt = this.startPoopPrompt.bind(this);
    this.poopSubmission = this.poopSubmission.bind(this); 
    this.initializeGame = this.initializeGame.bind(this);
    this.cardSubmission = this.cardSubmission.bind(this);
    this.revealCard = this.revealCard.bind(this);
    this.winnerSelected = this.winnerSelected.bind(this);
    this.endTurn = this.endTurn.bind(this);
    this.submitMessage = this.submitMessage.bind(this);
    this.playerIsLeaving = this.playerIsLeaving.bind(this);
    this.playerIsStaying = this.playerIsStaying.bind(this);
  
  }

  componentDidMount() {
    this.setState({
      user: this.props.username,
      room: this.props.match.params.room,
    });
    socket.on('openPoopPrompt', () => {
      var poop = document.getElementById('poop');
      poop.style.display = 'block';
    });
    socket.on('gameHasStarted', () => {
      //removes poop prompt for gameplay
      document.getElementById('prompt').style.display = 'block';
      document.getElementById('waitingOnPoopers').style.display = 'none';
      var poop = document.getElementById('poop');
      poop.style.display = 'none';
      this.initializeGame();
    });
    socket.on('refillHand', (cards) => {
      this.setState({
        hand: cards
      });
    });
    socket.on('setupNewTurn', (blackCard, czar) => {
      // toggle on tint for the new czar's cards
      const cards = document.getElementsByClassName('Card');
      if (this.state.user === czar) {
        for (let i = 0; i < cards.length; i++) {
          cards[i].classList.add('tint-card');
        }
      } else {
        for (let i = 0; i < cards.length; i++) {
          cards[i].classList.remove('tint-card');
        }
      }

      this.setState({
        blackCard: blackCard,
        czar: czar
      });
    });
    socket.on('updatePhase', (phase) => {
      //removes selected class from cards in the hands
      const selected = document.getElementsByClassName('selected');
      for (var i = 0; i < selected.length; i++) {
        selected[i].classList.remove('selected');
      }
      this.setState({
        turnPhase: phase,
      });
      if (phase === 'revelation') {
        this.state.yourSubmittedCards = [];
        this.state.submittedAlready = false;
      }
    });
    socket.on('updateSubmittedCards', (submitted) => {
      //removes selected class from cards in the hands
      const selected = document.getElementsByClassName('selected');
      for (var i = 0; i < selected.length; i++) {
        selected[i].classList.remove('selected');
      }
      this.setState({
        submittedCards: submitted,
      });

    });
    socket.on('updatePlayers', (players) => {
      this.setState({
        playerArray: players
      });
      if (players.length === 1) {
        this.setState({
          roomCreator: players[0].username
        });
      }
    });
    socket.on('updateMessages', (messages) => {
      this.setState({messages});

      //if at the bottom, scroll more to reveal
      this.messageList.scrollTop = this.messageList.scrollHeight;     
    });
    socket.on('updateWinner', (winner) => {
      this.setState({
        winner: winner,
      });
    });
    socket.on('gameReset', () => {
      this.setState({
        hand: [],
        blackCard: {},
        submittedCards: [],
        turnPhase: '',
        czar: '',
        yourSubmittedCards: [],
        submittedAlready: false,
        winner: '',
        decidedEndGame: false,
      });
    });
    socket.on('updateCreator', (roomCreator) => {
      this.setState({
        roomCreator,
      });
    });
    
    // note: need to find better way of grabbing room name
    socket.emit('enterRoom', this.props.match.params.room);

    //get elements
    this.messageInput = document.getElementById('message-input');
    this.messageList = document.getElementById('message-list');
  }

  componentWillUnmount() {
    socket.removeAllListeners();
  }

  startPoopPrompt() {
    socket.emit('startPoopPrompt', this.state.room);
    var poop = document.getElementById('poop');
    poop.style.display = 'block';

  }

  poopSubmission(e) {
    e.preventDefault();
    const poopHours = document.getElementById('poopHours').value;
    var poop = document.getElementById('poop');
    document.getElementById('prompt').style.display = 'none';
    document.getElementById('waitingOnPoopers').style.display = 'block';
    socket.emit('poopSubmission', this.state.room, this.state.user, poopHours);
  }

  initializeGame() {
    socket.emit('initializeGame', this.state.room, this.props.username);
  }
  
  cardSubmission(card) {
    if (this.state.turnPhase === 'submission' && this.state.user !== this.state.czar) {
      //checks to see card has already been submitted, prevents double submission
      let submitted = false;
      this.state.yourSubmittedCards.forEach((submittedCard) => {
        if (submittedCard.id === card.id) {
          submitted = true;
        }
      });
      if (submitted === false) {
        this.state.yourSubmittedCards.push(card);
      }
      if (this.state.yourSubmittedCards.length === this.state.blackCard.pick) {
        this.state.submittedAlready = true;
        socket.emit('cardSubmission', this.state.room, this.props.username, this.state.yourSubmittedCards);
      }
    }
  }

  revealCard(card) {
    if (this.state.turnPhase === 'revelation' && this.props.username === this.state.czar) {
      socket.emit('revealCard', this.state.room, card.username);
    }
  }

  winnerSelected(card) {
    if (this.props.username === this.state.czar && this.state.turnPhase === 'judgement') {
      socket.emit('winnerSelected', this.state.room, card.username);
    }
  }

  endTurn() {
    if (this.state.turnPhase === 'end') {
      socket.emit('endTurn', this.state.room);
    }
  }

  playerIsLeaving() {
    socket.emit('playerIsLeaving', this.state.room, this.state.user);
    this.props.history.push('/lobby');
  }

  playerIsStaying() {
    this.setState({
      decidedEndGame: true
    });
    socket.emit('playerIsStaying', this.state.room, this.state.user);
  }

  submitMessage(e) {
    e.preventDefault();
    socket.emit('messageSubmission', this.state.room, this.props.username, this.messageInput.value);
    this.messageInput.value = '';
  }


  render() {
    return (
      <div className='gameroom-wrapper'>
        <div className='RoomName'>{this.state.room}</div>
        <div className='gameroom-container'>
          <div className='player-pannel'>
            <PlayerList players={this.state.playerArray} czar={this.state.czar}/>
            <MessageBoard messages={this.state.messages} submitMessage={this.submitMessage}/>
          </div>
          <div className='game-container'>
            <div className='game-alerts'>
              <GameAlerts 
                turnPhase={this.state.turnPhase} 
                user={this.state.user} 
                czar={this.state.czar}
                roomCreator={this.state.roomCreator}
                winner={this.state.winner}
                numToWaitFor={this.state.playerArray.length - 1 - this.state.submittedCards.length}
                startPoopPrompt={this.startPoopPrompt}
                endTurn={this.endTurn}
                playerIsLeaving={this.playerIsLeaving}
                playerIsStaying={this.playerIsStaying}
                decided={this.state.decidedEndGame}
              />
            </div>
            <div className='gameplay-window'>
              <PoopPrompt poopSubmission={this.poopSubmission} />
              <Table 
                state = {this.state}
                select={this.winnerSelected} 
                submit={this.cardSubmission} 
                black={this.state.blackCard} 
                cards={this.state.hand} 
                submittedCards={this.state.submittedCards}
                revealCard={this.revealCard}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default GameRoom;