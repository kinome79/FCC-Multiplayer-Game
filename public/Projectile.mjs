// Projectile object can be carried and fired by game character
class Projectile {

    //initialize object based on provided values
    constructor({x, y, value, id, fired=0, carried=false}) {
      this.x = x;
      this.y = y;
      this.value = value;        // score value when picked up
      this.id = id;              // not currently used

      // 0 means not fired, < 400 is the angle it was fired at for animation, 999 indicates to destroy it, 990 indicates to animate explosion(counts up until hits 999)
      this.fired = fired; 

      this.carried = carried;    // indicates projectile is carried by a player
      this.firer = "";           // indicates which player ID had fired the projectile (can't hit themselves)
    }

    // draw function - called to animate and draw projectile
    draw(ctx) {

      // if fired and currently has angle assigned, change location based on speed and angle
      if (this.fired && this.fired < 400) {
        let speed = 20;
        this.y -= speed * Math.sin(this.fired*(Math.PI/180));
        this.x -= speed * Math.cos(this.fired*(Math.PI/180));

        // if reaches edge of gameboard, set fired to 999 to have projectile destoryed and recreated by server
        if (this.x > 630 || this.x < 10 || this.y > 470 || this.y < 85) {
          this.fired = 999;
        }
      }

      // if value is less than 400 for fired, draw the projectile as normal
      if (this.fired < 400) {
        ctx.strokeStyle = 'red';
        ctx.fillStyle = 'darkred';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, 10, 10, 0, 0, 2*Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

      // if projectile greater than 400, then increment explosion animation with each draw call, increment fired until reaching 999
      } else if (this.fired < 999) {

        // animate an explosion
        ctx.strokeStyle = 'yellow';
        ctx.fillStyle = 'orange';
        ctx.beginPath();

        // width/height of projectile is set based on fired (990 is 7 px, counts up to 998 which is 70 px), results in growing explosion as frames animate
        ctx.ellipse(this.x, this.y, (this.fired-989) * 7, (this.fired-989) * 7 , 0, 0, 2*Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        // increment fired to grow explosion as gameinterval keeps calling draw, until it reaches 999
        this.fired ++;
      }
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
  