var reset_button = document.getElementById("reset");
var run_button = document.getElementById("run");
var isRunning = false;
var colorInfectedAgent = "red";
var radiusAgent = 0.5;
var speedAgent = 1;
var infection_probability = 0.01;
var recovery_rate = 0.5;
var homebound_percentage = 0.25;
var population_infected = 0.1;

document
  .querySelector("#infectedColorPicker")
  .addEventListener("input", watchColorPicker, false);

document
  .querySelector("#agentRadius")
  .addEventListener("change", radiusHandler, false);

document
  .querySelector("#agentSpeed")
  .addEventListener("change", speedHandler, false);

document
  .querySelector("#infection_rate")
  .addEventListener("change", infectionRateHandler, false);

document
  .querySelector("#recovery_rate")
  .addEventListener("change", recoveryRateHandler, false);

document
  .querySelector("#infectedPercentage")
  .addEventListener("change", infectedPercentageHandler, false);

document
  .querySelector("#homebound_percentage")
  .addEventListener("change", homeboundPercentageHandler, false);

//Disable the "Run" button at first.
run.disabled = "disabled";

reset_button.onclick = function () {
  isRunning = true;
  if (this.textContent == "Start") {
    this.textContent = "Reset";
    run_button.textContent = "Pause";
    run_button.disabled = "";
    setup();
    agentmap.run();
  } else {
    run_button.textContent = "Run";
    agentmap.clear();
    setup();
  }
};

run_button.onclick = function () {
  isRunning = false;
  if (this.textContent == "Run") {
    this.textContent = "Pause";
    agentmap.run();
  } else {
    this.textContent = "Run";
    agentmap.pause();
  }
};

var ticks_display = document.getElementById("tick_value");

//Map slider values to animation_gap values.
var animation_interval_map = {
  1: 0,
  2: 1000,
  3: 100,
  4: 10,
  5: 1,
};

function watchColorPicker(event) {
  if (isRunning) {
    var newColorValue = event.target.value;
    colorInfectedAgent = newColorValue;
    agentmap.agents.eachLayer((agent) => {
      if (agent.infected) {
        agent.setStyle({ color: newColorValue });
      }
    });
  } else {
    alert("Please start simulation first");
  }
}

function radiusHandler(event) {
  if (isRunning) {
    var newRadiusValue = event.target.value;
    radiusAgent = newRadiusValue;
    agentmap.agents.eachLayer((agent) => {
      agent.setStyle({ radius: newRadiusValue });
    });
  } else {
    alert("Please click on start first");
  }
}

function speedHandler(event) {
  if (isRunning) {
    var newSpeedValue = event.target.value;
    speedAgent = newSpeedValue;
    agentmap.speed_controller = speedAgent;
    agentmap.agents.eachLayer((agent) => {
      agent.setSpeed(newSpeedValue);
    });
  } else {
    alert("Please click on start first");
  }
}

function infectionRateHandler(event) {
  const newInfectionRateValue = event.target.value;
  const parsedInfectionRate = parseInt(newInfectionRateValue) / 100;
  infection_probability = parsedInfectionRate;
  document.querySelector(
    "#currentInfectionRate"
  ).textContent = `Current Infection Rate: ${parsedInfectionRate}`;
}

function recoveryRateHandler(event) {
  const newRecoveryRateValue = event.target.value;
  const parsedRecoveryRate = parseInt(newRecoveryRateValue) / 10;
  recovery_rate = parsedRecoveryRate;
  document.querySelector(
    "#currentRecoverRate"
  ).textContent = `Current Recovery Rate: ${parsedRecoveryRate}`;
}

function infectedPercentageHandler(event) {
  const newInfectedPercentageValue = event.target.value;
  const parsedInfectedPercentageValue =
    parseInt(newInfectedPercentageValue) / 100;
  population_infected = parsedInfectedPercentageValue;
  document.querySelector(
    "#currentInfectedPercentage"
  ).textContent = `Current % Infected: ${parsedInfectedPercentageValue}`;
}

function homeboundPercentageHandler(event) {
  const newHomeboundPercentageValue = event.target.value;
  const parsedPercentageValue = parseInt(newHomeboundPercentageValue) / 100;
  homebound_percentage = parsedPercentageValue;
  document.querySelector(
    "#currentHomeboundPercentage"
  ).textContent = `Current Homebound %: ${homebound_percentage}`;
}
