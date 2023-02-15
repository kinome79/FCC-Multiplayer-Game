class Collectible {
  constructor({x, y, value, id}) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.id = id;
    this.step = this.value-30;
  }

  draw(ctx) {
    ctx.strokeStyle = 'darkgold';
    ctx.fillStyle = 'gold';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, this.step, this.value - 30, 0, 0, 2*Math.PI);
    ctx.stroke();
    ctx.fill();
    this.step -= 5 ;
    if (this.step < -(this.value-30)) { this.step = (this.value-30)}
  }

}

/*
  Note: Attempt to export this for use
  in server.js
*/
try {
  module.exports = Collectible;
} catch(e) {}

export default Collectible;
