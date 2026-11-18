// Boot: find the canvas and the screen-reader status line, hand them to
// the game, and let the loop take over.
import { createGame } from './game.js';

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
createGame(canvas, statusEl);
