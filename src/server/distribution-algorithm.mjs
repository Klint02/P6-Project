export function calc_distribution(servers, current_kwh, lower_type, middle_type, upper_type) {
    let full = [];
    let upper_bound = [];
    let middle_bound = [];
    let lower_bound = [];
    let distribution = [];
    let res = [];
    servers.forEach(server => {
        if (server["State"] != "not init") {
            if (server["LastKnownPercentage"] < server["LowerBound"]) {
                lower_bound.push(server);
            } else if (server["LastKnownPercentage"] < server["MiddleBound"]) {
                middle_bound.push(server);
            } else if (server["LastKnownPercentage"] < 100){
                upper_bound.push(server);
            }
            else {
                full.push(server);
            }
        }
    });
    //console.log("lower bound servers", lower_bound);
    //console.log("middle bound servers", middle_bound);
    //console.log("upper bound servers", upper_bound);
    
    switch (lower_type){
        case "shotgun":
            res = MaximumInput(lower_bound, distribution, current_kwh)
            break
        case "smg":
            res = smg(lower_bound, distribution, current_kwh)
            break
        case "sniper":
            res = sniper(lower_bound, distribution, current_kwh)
            break
    }
    distribution = res[0];
    current_kwh = res[1];
    switch (middle_type){
        case "shotgun":
            res = MaximumInput(middle_bound, distribution, current_kwh)
            break
        case "smg":
            res = smg(middle_bound, distribution, current_kwh)
            break
        case "sniper":
            res = sniper(middle_bound, distribution, current_kwh)
            break
    }
    distribution = res[0];
    current_kwh = res[1];
    switch (upper_type){
        case "shotgun":
            res = MaximumInput(upper_bound, distribution, current_kwh)
            break
        case "smg":
            res = smg(upper_bound, distribution, current_kwh)
            break
        case "sniper":
            res = sniper(upper_bound, distribution, current_kwh)
            break
    }
    distribution = res[0];
    current_kwh = res[1];

    console.log("distribution", distribution);
    console.log("res kwh", current_kwh);
    return distribution
}

function MaximumInput(server, distribution, current_kwh){
    for(let i = 0; i < server.length; i++) {
        let out = { "Key": server[i]["Key"], "current_input": 0 }
        let tmp_current_kwh = current_kwh;
        current_kwh -= server[i]["MaxChargeRate"]
        if (current_kwh < 0) { 
            out["current_input"] = tmp_current_kwh;
            distribution.push(out);
            break;
        } else {
            out["current_input"] = server[i]["MaxChargeRate"];
            distribution.push(out);
        }
    }
    return [distribution, current_kwh]
}
function smg(server, distribution, current_kwh){
    for(let i = 0; i < server.length; i++) {
        let out = { "Key": server[i]["Key"], "current_input": 0 }
        distribution.push(out);
    }
    return [distribution, current_kwh]
}
function sniper(server, distribution, current_kwh){

    return [distribution, current_kwh]
}