class Projectile {
    constructor({x, y, value, id}) {
      this.x = x;
      this.y = y;
      this.value = value;
      this.id = id;
    }

    draw(ctx) {
      ctx.strokeStyle = 'red';
      ctx.fillStyle = 'darkred';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, 50, 50, 0, 0, 2*Math.PI);
      ctx.stroke();
      ctx.fill();
    }
  
  }
  
  /*
    Note: Attempt to export this for use
    in server.js
  */
  try {
    module.exports = Projectile;
  } catch(e) {}
  
  export default Projectile;
  