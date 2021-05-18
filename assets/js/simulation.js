//Setup the epidemic simulation.
function setup() {
  //Generate and display streets and units on the map.
  agentmap.buildingify(mapConfig.bounding_box, map_data, undefined);

  //Split the map's units into residential and commercial zones.
  var residential_streets = ["Saint Paul Road"];
  var commercial_streets = ["John Kennedy Road"];

  agentmap.zoned_units = getZonedUnits(
    agentmap,
    residential_streets,
    commercial_streets
  );

  // Use only a subset of the zoned units.
  agentmap.zoned_units.residential = pick_random_n(
    agentmap.zoned_units.residential,
    10
  );
  agentmap.zoned_units.commercial = pick_random_n(
    agentmap.zoned_units.commercial,
    5
  );

  //Generate 200 agents according to the rules of epidemicAgentMaker, displaying them as blue, .5 meter radius circles.
  agentmap.agentify(20, epidemicAgentMaker);

  //Attach a popup to show when any agent is clicked.
  agentmap.agents.bindPopup(agentPopupMaker);

  //Keep a count of how many infected agents there are.
  agentmap.infected_count = 0;

  //Set how infectious the disease is (the probability that someone nearby will get infected)
  agentmap.infection_probability = infection_probability;

  //Set the default speed for the agent.
  agentmap.speed_controller = speedAgent;

  //Do the following on each tick of the simulation.
  agentmap.controller = agentmapController;

  //Set each Agent up.
  agentmap.agents.eachLayer(function (agent) {
    //Add the agent's ID to its home unit's resident_ids array to help keep track of which agents are in the same unit.
    var home_unit = agentmap.units.getLayer(agent.home_id);
    home_unit.resident_ids.push(agent._leaflet_id);

    //Define the update_func for the agent.
    setAgentController(agent);
  });

  //Infect a random 10% of the population on the agentmap.
  infect(agentmap, population_infected);

  //Set the data displays and input options in the interface to their default values.
  // defaultInterface();
}

/*                                                 */
/* Function definitions for everything done above. */
/*                                                 */

//Given an agent, return an HTML string to embed in a popup.
function agentPopupMaker(agent) {
  var string = `
    Infected: ${agent.infected}<br/>
    Homebound: ${agent.homebound}
    `;
  return string;
}

//0: (2) [57.49276840264451, -20.29911295669613]
// 1: (2) [57.49275551546237, -20.299238280039976]

//Given two arrays of streets and their agentmap, split their units into residential and commercial zones,
//and return their division.
function getZonedUnits(agentmap, residential_streets, commercial_streets) {
  var zoned_units = {
    residential: [],
    commercial: [],
  };

  //Find and store the units on the perimeter of the lower part of the neighborhood,
  //and along the streets in the upper part of the neighborhood.
  agentmap.units.eachLayer(function (unit) {
    var street_id = unit.street_id,
      street = agentmap.streets.getLayer(street_id),
      street_name = street.feature.properties.name;

    if (residential_streets.includes(street_name)) {
      zoned_units.residential.push(unit._leaflet_id);
    }

    if (commercial_streets.includes(street_name)) {
      zoned_units.commercial.push(unit._leaflet_id);
    }

    //For each zoned unit, add an array to store which agents are in it for easy searching.
    unit.resident_ids = [];
  });
  styleUnits(zoned_units.residential, zoned_units.commercial, agentmap);

  return zoned_units;
}

//The controller function for the Agentmap.
function agentmapController() {
  //Set the tick display box to display the number of the current tick.
  // ticks_display.textContent = agentmap.state.ticks;

  //Check if any of the options have been changed in the interface and update the Agentmap accordingly.
  if (agentmap.animation_interval !== Number(animation_interval_map[5])) {
    agentmap.setAnimationInterval(animation_interval_map[5]);
  }
}

//Return a GeoJSON feature representing an agent.
function epidemicAgentMaker(id) {
  //Decide whether the agent will be homebound.
  var homebound = Math.random() <= homebound_percentage ? true : false;

  //Get a random residential unit and its center.
  var random_residential_index = Math.floor(
      Math.random() * this.zoned_units.residential.length
    ),
    random_residential_unit_id =
      this.zoned_units.residential[random_residential_index];

  //Store the residential unit's ID as the agent's home ID.
  var home_id = random_residential_unit_id;

  var go_home_interval = null,
    workplace_id = null,
    first_go_work_interval = null,
    go_work_interval = null;

  if (!homebound) {
    //Get a random commercial unit and its ID.
    var random_workplace_index = Math.floor(
        this.zoned_units.commercial.length * Math.random()
      ),
      random_workplace_id = this.zoned_units.commercial[random_workplace_index];

    //Store the commercial unit's ID as the agent's workplace ID.
    workplace_id = random_workplace_id;

    //Approximately many ticks until any agent goes to work or back home will be based on these numbers.
    //Make the first commute to work come quicker than any subsequent ones.
    var first_go_work_base_interval = 300,
      go_work_base_interval = 900,
      go_home_base_interval = 900;

    //Randomize how early or late agents make their commute.
    var sign = Math.random() < 0.5 ? 1 : -1,
      go_home_randomizer = sign * Math.floor(Math.random() * 200),
      go_work_randomizer = -sign * Math.floor(Math.random() * 200);

    (first_go_work_interval = first_go_work_base_interval + go_work_randomizer),
      (go_work_interval = go_work_base_interval + go_work_randomizer),
      (go_home_interval = go_home_base_interval - go_home_randomizer);
  }

  //Get the agent's starting position.
  var home_unit = this.units.getLayer(home_id);
  var home_center_coords = L.A.pointToCoordinateArray(home_unit.getCenter());

  var agentColor = "green";

  if (homebound) {
    agentColor = "blue";
  }

  return {
    type: "Feature",
    properties: {
      place: {
        type: "unit",
        id: home_id,
      },
      layer_options: {
        color: agentColor,
        radius: radiusAgent,
      },
      recent_unit_id: home_id,
      homebound: homebound,
      next_commute: "work",
      commuting: false,
      home_id: home_id,
      workplace_id: workplace_id,
      first_go_work_interval: first_go_work_interval,
      go_work_interval: go_work_interval,
      go_home_interval: go_home_interval,
      commute_alarm: first_go_work_interval,
      infected: false,
      recovery_tick: 0,
    },
    geometry: {
      type: "Point",
      coordinates: home_center_coords,
    },
  };
}

//Given an agent, define its controller in a way conducive to the epidemic simulation.
function setAgentController(agent) {
  //Do the following on each tick of the simulation for the agent.
  agent.controller = function () {
    //Do this when the commute_alarm tick is reached.
    if (!agent.homebound && agent.agentmap.state.ticks !== 0) {
      if (agent.agentmap.state.ticks % agent.commute_alarm === 0) {
        if (agent.next_commute === "work") {
          commuteToWork(agent);
        } else if (agent.next_commute === "home") {
          commuteToHome(agent);
        }

        //Apply the agentmap's speed control whenever the agent decides to commute.
        agent.setSpeed(agent.agentmap.speed_controller);
      }
    }
    //If the agent isn't already scheduled to commute, give it a chance to randomly move around its unit.
    else if (!agent.commuting) {
      if (Math.random() < 0.001) {
        var random_unit_point = agent.agentmap.getUnitPoint(
          agent.place.id,
          Math.random(),
          Math.random()
        );
        agent.scheduleTrip(random_unit_point, agent.place, 1);
      }
    }

    checkCommute(agent);
    updateResidency(agent);
    checkInfection(agent);

    //Have the agent move along its scheduled trip.
    agent.moveIt();
  };
}

//Track an agent's transitions between units and update the units' resident_ids array accordingly.
function updateResidency(agent) {
  //If the agent is in a unit and came from another place, add its ID to the unit's resident_ids.
  if (agent.place.type === "unit") {
    if (agent.place.id !== agent.recent_unit_id) {
      var current_unit = agent.agentmap.units.getLayer(agent.place.id);
      current_unit.resident_ids.push(agent._leaflet_id);

      agent.recent_unit_id = agent.place.id;
    }
  }
  //Otherwise, if an agent wasn't just on a street, remove its ID from its recent unit's resident_ids.
  else if (agent.recent_unit_id !== -1) {
    var recent_unit = agent.agentmap.units.getLayer(agent.recent_unit_id),
      agent_resident_index = recent_unit.resident_ids.indexOf(
        agent._leaflet_id
      );

    recent_unit.resident_ids.pop(agent_resident_index);

    agent.recent_unit_id = -1;
  }
}

//Check whether the agent should recover or become infected.
function checkInfection(agent) {
  //Check whether the agent is in a unit. If so, if any other agents in the unit are infected,
  //infect it with a certain probability.
  if (agent.place.type === "unit" && agent.infected === false) {
    var resident_ids = agent.agentmap.units.getLayer(
      agent.place.id
    ).resident_ids;

    for (var i = 0; i < resident_ids.length; i++) {
      var resident = agent.agentmap.agents.getLayer(resident_ids[i]);
      if (resident.infected) {
        if (Math.random() < agent.agentmap.infection_probability) {
          infectAgent(agent);
          break;
        }
      }
    }
  }

  //If the agent is infected, check whether it is time for the agent to recover and if so,
  //uninfect it.
  if (agent.infected && agent.agentmap.state.ticks === agent.recovery_tick) {
    uninfectAgent(agent);
  }
}

function infectAgent(agent) {
  (agent.infected = true),
    //Have the agent recover in a random number of ticks under 2000 from the time it is infected.
    (agent.recovery_tick =
      agent.agentmap.state.ticks + Math.floor(recovery_rate * 2000));
  agent.setStyle({ color: colorInfectedAgent });

  agent.agentmap.infected_count++;
  updateEpidemicStats(agent.agentmap);
}

function uninfectAgent(agent) {
  (agent.infected = false), agent.setStyle({ color: "green" });
  agent.recoveryTick = -1;

  agent.agentmap.infected_count--;
  updateEpidemicStats(agent.agentmap);
}

//Infect a certain percent of the population, randomly.
function infect(agentmap, percent) {
  var number_of_infectees = Math.ceil(agentmap.agents.count() * percent),
    infectees = pick_random_n(agentmap.agents.getLayers(), number_of_infectees);
  infectees.forEach(function (infectee) {
    infectAgent(infectee);
  });
}

//Update the numbers in the display boxes in the HTML document.
function updateEpidemicStats(agentmap) {
  var infected_display = document.getElementById("infected_value");
  // infected_display.textContent = agentmap.infected_count;

  var healthy_display = document.getElementById("healthy_value");
  // healthy_display.textContent =
  //   agentmap.agents.count() - agentmap.infected_count;
}

function commuteToWork(agent) {
  //Schedule the agent to move to a random point in its workplace and replace the currently scheduled trip.
  var random_workplace_point = agent.agentmap.getUnitPoint(
    agent.workplace_id,
    Math.random(),
    Math.random()
  );

  if (state.features.length) {
    const { lat, lng } = state.features[0];
    agent.scheduleTrip(
      [lat, lng],
      {
        id: 1000,
        type: "unit",
      },
      3,
      true,
      true
    );
  } else {
    agent.scheduleTrip(
      random_workplace_point,
      { type: "unit", id: agent.workplace_id },
      3,
      false,
      true
    );
  }

  agent.commuting = true;
  agent.next_commute = "home";
  agent.commute_alarm += agent.go_home_interval;
}

function commuteToHome(agent) {
  //Schedule the agent to move to a random point in its home and replace the currently scheduled trip.
  var random_home_point = agent.agentmap.getUnitPoint(
    agent.home_id,
    Math.random(),
    Math.random()
  );
  agent.scheduleTrip(
    random_home_point,
    { type: "unit", id: agent.home_id },
    3,
    false,
    true
  );

  agent.commuting = true;
  agent.next_commute = "work";
  agent.commute_alarm += agent.go_work_interval;
}

function checkCommute(agent) {
  if (agent.commuting_to === "home" && agent.place.id === agent.home_id) {
    agent.commuting = false;
  } else if (
    agent.commuting_to === "work" &&
    agent.place.id === agent.workplace_id
  ) {
    agent.commuting = false;
  }
}

//Given an array, return n random elements from it.
function pick_random_n(array, n) {
  if (array.length < n) {
    throw new Error(
      "n cannot be bigger than the number of elements in the array!"
    );
  }

  var random_indices = [];

  for (var i = 0; i < n; i++) {
    var random_index = Math.floor(Math.random() * array.length);
    if (!random_indices.includes(random_index)) {
      random_indices.push(random_index);
    } else {
      i--;
    }
  }

  var random_n = random_indices.map(function (index) {
    return array[index];
  });

  return random_n;
}

function styleUnits(residential_units, commercial_units, agentmap) {
  const residentialColor = "grey";
  const commercialColor = "purple";

  residential_units.forEach((residential_id) => {
    agentmap.units._layers[residential_id].setStyle({
      color: residentialColor,
    });
  });

  commercial_units.forEach((commercial_id) => {
    agentmap.units._layers[commercial_id].setStyle({
      color: commercialColor,
    });
  });
}
