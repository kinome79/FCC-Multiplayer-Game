class Player {

  constructor(x, y, rot, score, color, id) {
    this.x = x;
    this.y = y;
    this.rot = rot;
    this.score = score;
    this.color = color;
    this.id = id;
    this.rotating = 0;
    this.moving = 0;
  }

  movePlayer(dir, speed) {
    this.y -= dir * speed * Math.sin(this.rot*(Math.PI/180));
    this.x -= dir * speed * Math.cos(this.rot*(Math.PI/180));
  }

  rotPlayer(dir, speed) {
    this.rot += speed*dir;
    if (this.rot < 0) {
      this.rot += 360;
    } else if (this.rot > 360) {
      this.rot -= 360;
    }
  }

  fire() {

  }

  collision(item) {

  }

  calculateRank(arr) {
    let rank = 1;
    arr.forEach( player => {
      if (player.score > this.score) {
        rank --;
      }
    })
    return rank;
  }

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

  draw (ctx) {
    ctx.save();
  
    //draw tank here
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot*Math.PI/180);
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
    ctx.restore();
  }
}

export default Player;
