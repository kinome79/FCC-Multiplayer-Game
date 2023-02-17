// Player object - stores a tank character to be played in the game
class Player {

  // initialize the object with provided information
  constructor({x, y, rot, score, color, id}) {
    this.x = x;
    this.y = y;
    this.rot = rot;        // rotation orientation
    this.score = score;
    this.color = color;
    this.id = id;         // is typically set to the session socket Id

    // status variables, indicates if rotating, moving, carrying projectile, or if dead - effects gameplay
    this.rotating = 0;
    this.moving = 0;
    this.carrying = false;
    this.dead = false;
  }

  // movePlayer function - called to change players x/y location based on direction(+/-1 to indicate forward/backward) and speed(in pixels)
  movePlayer(dir, speed) {

    if (dir == 'up') {
      this.rot = 90;
      dir = 1;
    } else if (dir == 'down'){
      this.rot = 270;
      dir = 1;
    } else if (dir == 'left'){
      this.rot = 0;
      dir = 1;
    } else if (dir == 'right'){
      this.rot = 180;
      dir = 1;
    }

    this.y -= dir * speed * Math.sin(this.rot*(Math.PI/180));
    this.x -= dir * speed * Math.cos(this.rot*(Math.PI/180));
    
  }

  // rotPlayer function - called to change players rotational orientation based on direction (+/-1) and speed in degrees
  rotPlayer(dir, speed) {
    this.rot += speed*dir;
    if (this.rot < 0) {
      this.rot += 360;
    } else if (this.rot > 360) {
      this.rot -= 360;
    }
  }

  // collision function - given item, true if center of that item is within 15 pixels of center of tank
  collision(item) {
    if (Math.abs(this.x-item.x) < 15 && Math.abs(this.y-item.y) < 15) {
      return true;
    } else {
      return false;
    }
  }

  // calculateRank function - given array of players, goes through every score to calculate and return rank (1 being highest score)
  calculateRank(arr) {
    let rank = 1;
    arr.forEach( player => {
      if (player.score > this.score) {
        rank ++;
      }
    })
    return `Rank: ${rank}/${arr.length}`;
  }

  // serialize function - called to convert function into javascript object to transfer data to the server
  serialize () {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      rot: this.rot,
      score: this.score,
      color: this.color
    }
  }

  // draw function - called to draw the tank on the context
  draw (ctx) {

    // if tank is not currently dead, draw tank
    if (!this.dead) {

      // save context state, and translate and rotate it to the tanks current location/angle
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot*Math.PI/180);
    
      // draw the tank using its specified color
      ctx.fillStyle = 'black';
      ctx.fillRect(-20,-15,40,30);
      ctx.fillStyle = this.color;
      ctx.fillRect(-18,-11, 36, 22);
      ctx.strokeStyle = 'black';
      ctx.fillRect(-22,-4, 18, 8);
      ctx.strokeRect(-22,-4, 18, 8);
      ctx.beginPath();
      ctx.arc(4,0,9,0,2*Math.PI);
      ctx.stroke();
      ctx.closePath();

      // restore the context back to its original state
      ctx.restore();
    }
  }
}

export default Player;
