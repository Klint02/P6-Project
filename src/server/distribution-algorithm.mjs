export function calc_distribution(servers, current_kwh, distribution_type) {
    let upper_bound = [];
    let middle_bound = [];
    let lower_bound = [];
    let sorted_servers = [];
    let distribution = [];
    servers.forEach(server => {
        if (server["state"] != "not init") {
            if (server["lastKnownPercentage"] < server["lowerBound"]) {
                lower_bound.push(server);
            } else if (server["lastKnownPercentage"] < server["middleBound"]) {
                middle_bound.push(server);
            } else {
                upper_bound.push(server);
            }
        }
    });

    sorted_servers = lower_bound;
    sorted_servers = sorted_servers.concat(middle_bound);
    sorted_servers = sorted_servers.concat(upper_bound)

    for(let i = 0; i < sorted_servers.length; i++) {
        let out = { "name": sorted_servers[i]["name"], "current_input": 0 }
        let tmp_current_kwh = current_kwh;
        current_kwh -= sorted_servers[i]["maxInput"]
        if (current_kwh < 0) { 
            out["current_input"] = tmp_current_kwh;
            distribution.push(out);
            break;
        } else {
            out["current_input"] = sorted_servers[i]["maxInput"];
            distribution.push(out);
        }

    }

    //console.log(lower_bound);
    //console.log(middle_bound);
    //console.log(distribution);
    
    return distribution
}