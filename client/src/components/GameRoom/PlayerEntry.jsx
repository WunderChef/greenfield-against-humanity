import React from 'react';

const PlayerEntry = ({player, czar}) => {
  if (player.username === czar) {
    return (
      <div className='czar'>
        <div className='score'>{player.points}</div>
        <div className='username'>
          {player.username}
        </div>
      </div>
    );
  }
  return (
    <div className='player-entry'>
      <div className='score'>{player.points}</div>
      <div className='username'>
        {player.username}
      </div>
    </div>
  );
};

export default PlayerEntry;