# Secure Real Time Multiplayer Game - Tank Battle

This is the boilerplate for the Secure Real Time Multiplayer Game project. Instructions for building your project can be found at https://www.freecodecamp.org/learn/information-security/information-security-projects/secure-real-time-multiplayer-game

## Completed Project: 

This project was completed by kinome79 ©2023 to meet the project requirements for course certification

## Controls:

There are two control methods: 

#### WASD - 
This will move your tank up/down/left/or right per the project specification requirements

#### arrow keys - 
This will rotate your tank with left and right arrows, and move forward and backward with up and down buttons (desired method)

#### Space Bar - 
There will be a red projectile positioned on the game board. Pick it up by running over it, and fire it at another player with space bar

## Objective: 

The objective is to increase your points by: 
1. Collecting Coins - size of coin denotes a value between 50 and 100 points
2. Pickup projectiles - picking up a projectile awards 25 points
3. Don't get hit - getting hit reduces points by 200

## Future Dev: 

Future developement may include: 
- Implementing the ability to steal a picked-up projectile
- Add some graphical enhancements to coins and projectile
- Need to improve network communication to prevent lag: 
- - Smaller tank ID.... currently its a long string matching the socket ID
- - Limit messages... reduce the amount of updates back and fourth by pooling them together
- - Switch to window.requestAnimationFrame... current setInterval implementation should be changed
- - Code communications... reduce transferred information by encoding data into a small binary instead of sending JSON object 