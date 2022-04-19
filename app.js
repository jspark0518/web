'use strict';

var showcase;
var iframe = document.getElementById('showcase');

var map = document.getElementById('map');
var minX, minY, maxX, maxY;

var modes = document.querySelectorAll('.mode-control');
var moves = document.querySelectorAll('.move-control');
var transitions = document.querySelectorAll('.transition-control');

// ** Replace demo applicationKey with your application key **
var key = 'wh7mas98d1teyaxz304n7ziza';

var settings = {
  sweep: '',
  mode: 'INSIDE',
  transition: 'FLY'
};

// Define iframe's src with my Space url
iframe.setAttribute('src', 'https://my.matterport.com/show/?m=cKHMpazixm2&hhl=0&play=1&tiles=1&hl=0');

// Initialize showcase SDK when iframe has loaded
iframe.addEventListener('load', showcaseLoader, true);

function showcaseLoader() {
  // Connect to SDK with applicationKey and iframe element
  try {
    window.MP_SDK.connect(iframe, key, '3.2')
      .then(loadedShowcaseHandler)
      .catch(handleError);
  }

  catch (e) {
    console.error(e);
  }

}

function loadedShowcaseHandler(response) {
  // Define showcase and event listeners
  showcase = response;
  showcase.Model.getData().then(loadedSpaceHandler);
  showcase.on(showcase.Sweep.Event.ENTER, changedSweepHandler);
}

function loadedSpaceHandler(metadata) {
  // Initialize min and max values
  minX = maxX = minY = maxY = 0;

  var sweeps = metadata.sweeps.map(function (sweep) {

    if (sweep.position) {
      // Format data
      var p = {
        pid: sweep.uuid,
        x: sweep.position.x || 0,
        y: sweep.position.z || 0
      };

      // Define min and max values for each axis
      setMinAndMax(p.x, p.y);

      // Define starting sweep
      if (p.x == 0 && p.y == 0) {
        settings.sweep = sweep.uuid;
      }

      return p
    }
  });

  // Add each sweep to the div
  sweeps.map(sweepToMap);

  // Add event listeners to elements based on control type
  moves.forEach(function (elem) {

    elem.addEventListener('click', function () {
      movement(showcase.Camera.Direction[elem.value]);
    })
  });

  document.getElementById('ABOVE').addEventListener('click', function () {
    rotation(0, 15);
  });
  document.getElementById('BELOW').addEventListener('click', function () {
    rotation(0, -15);
  });
  document.getElementById('LTURN').addEventListener('click', function () {
    rotation(-15, 0);
  });
  document.getElementById('RTURN').addEventListener('click', function () {
    rotation(15, 0);
  });

  modes.forEach(function (elem) {

    elem.addEventListener('click', function () {

      var prev = document.querySelector('.mode-control.active');
      toggleActive(elem, prev);
      modeChange(elem.value);
    });
  });

  transitions.forEach(function (elem) {

    elem.addEventListener('click', function () {

      var prev = document.querySelector('.transition-control.active');
      settings.transition = elem.value;
      toggleActive(elem, prev);
    })
  });

  document.addEventListener('keydown', inputHandler, true);
}

function changedSweepHandler(oldP, newP) {
  // Update map markers
  var curr = document.getElementById('p' + newP);
  var prev = document.getElementById('p' + oldP) || curr;

  settings.sweep = (curr && curr.value) || '';
  toggleActive(curr, prev);
}


function inputHandler(event) {

  if (event.defaultPrevented) {
    return; // Do nothing if the event was already processed
  }

  // Determine which key triggered the event and appropriate SDK action and parameters
  var key = event.key || event.keyCode || event.charCode || event.which;

  switch (key) {
    case "ArrowDown" || 40:
      var direction = event.altKey ? 'DOWN' : 'BACK';
      movement(showcase.Camera.Direction[direction]);
      break;

    case "ArrowUp" || 38:
      var direction = event.altKey ? 'UP' : 'FORWARD';
      movement(showcase.Camera.Direction[direction]);
      break;

    case "ArrowLeft" || 37:
      movement(showcase.Camera.Direction['LEFT']);
      break;

    case "ArrowRight" || 39:
      movement(showcase.Camera.Direction['RIGHT']);
      break;

    case "Enter" || 13:
      // Define action for enter key.
      break;

    case "Escape" || 27:
      // Define action for escape key.
      break;

    default:
      return; // otherwise, quit.
  }

  // Cancel the default
  event.preventDefault();
}


function movement(direction) {
  // Accepts 'LEFT', 'RIGHT', 'FORWARD', 'BACK'
  return showcase.Camera.moveInDirection(direction)
    .then(handleMessage)
    .catch(handleError);
}

function rotation(horizontal, vertical) {
  return showcase.Camera.rotate(horizontal, vertical)
    .then(handleMessage)
    .catch(handleError);
}

function modeChange(mode) {
  settings.mode = mode;
  return showcase.Mode.moveTo(showcase.Mode.Mode[mode])
    .then(handleMessage)
    .catch(handleError);
}

function sweepMove(event) {
  // sweep extracts sweep ID from the clicked element's value,
  // transition is defined by value in settings object
  // rotation.x rotates camera vertically (up and down)
  // rotation.y rotates camera horizonally (left and right)
  return showcase.Sweep.moveTo(
    event.target.value || document.getElementById('p' + event).value, {
      transition: showcase.Sweep.Transition[settings.transition]
  })
    .then(handleMessage)
    .catch(handleError);
}


function scaleToContainer(num, min, max, scale, offset) {
  // calculate position as percentage with left and top offset
  // return ( ((num - min) / (max - min)) * 78 ) + 6;
  return ( ((num - min) / (max - min)) * scale ) + offset;
}

function sweepToMap(p) {
  // Create a sweep marker and position it over the floorplan
  if (p) {
    var btn = document.createElement('BUTTON');
    var cList = 'sweep z-depth-3';
    var x = scaleToContainer(p.x, minX, maxX, 71, 13);
    var y = scaleToContainer(p.y, minY, maxY, 74, 15);

    btn.setAttribute('id', 'p' + p.pid);
    btn.setAttribute('value', p.pid);
    btn.style.left = x + '%';
    btn.style.top = y + '%';
    btn.setAttribute('class', cList);

    btn.addEventListener('click', sweepMove);
    map.appendChild(btn);
  }
}

function setMinAndMax(x,y) {
  // Compare a set of coordinates to update min and max
  minX = Math.min(minX, x);
  maxX = Math.max(maxX, x);
  minY = Math.min(minY, y);
  maxY = Math.max(maxX, y);
}

function toggleActive(curr, prev) {
  if (prev) {
    prev.classList.remove('active');
  }

  if (curr) {
    curr.classList += ' active';
  }
}

function handleMessage(message) {
  console.log(message);
}

function handleError(err) {
  console.error(err);
}