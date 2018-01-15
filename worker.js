'set strict';

var i = 1;

let work = () => {
  console.log("Iteration " + i++);
}

setInterval(work, 1000);
