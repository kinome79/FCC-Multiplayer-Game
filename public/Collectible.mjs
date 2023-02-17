// Collectible object - rotating coin object, varies in size depending on value assigned to it, spins on the screen
class Collectible {

  // Initialize the object variables
  constructor({x, y, value, id}) {
    this.x = x;
    this.y = y;
    this.value = value;

    // size set based on value... values of 50 - 100 result in size 5 - 20 px
    this.size = Math.floor((this.value/10)*(this.value/50));

    this.id = id; // id currently isn't used
    this.width = this.size; // width set to size, but used to animate the spinning
    this.step = -3; // step changes spinning animation speed
  }

  // draw function - draws the coin, then changes the width based on step to simulate spinning
  draw(ctx) {
    ctx.strokeStyle = 'darkgold';
    ctx.fillStyle = 'gold';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, this.width, this.size, 0, 0, 2*Math.PI);
    ctx.stroke();
    ctx.fill();

    // change width by the step variable
    this.width += this.step ;

    // if width gets to less than 0, change sign on step so now width grows, or visa versa
    if (this.width < 0) { 
      this.width = -this.width;
      this.step = -this.step;
    } else if (this.width > this.size) {
      this.width = this.size;
      this.step = -this.step;
    }
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
