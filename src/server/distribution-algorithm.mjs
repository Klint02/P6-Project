export function calc_distribution(servers, current_kwh, lower_type, upper_type) {
    let full = [];
    let upper_bound = [];
    let lower_bound = [];
    let distribution = [];
    let res = [];
    servers.forEach(server => {
        if (server["State"] != "not init") {
            if (server["LastKnownPercentage"] < server["LowerBound"]) {
                lower_bound.push(server);
            } else if (server["LastKnownPercentage"] < 100){
                upper_bound.push(server);
            }
            else {
                full.push(server);
            }
        }
    });
    //console.log("lower bound servers", lower_bound);
    //console.log("upper bound servers", upper_bound);
    
    switch (lower_type){
        case "shotgun":
            res = MaximumInput(lower_bound, distribution, current_kwh)
            break
        case "smg":
            res = ProcentInput(lower_bound, distribution, current_kwh)
            break
        case "sniper":
            res = sniper(lower_bound, distribution, current_kwh)
            break
    }
    distribution = res[0];
    current_kwh = res[1];
    switch (upper_type){
        case "shotgun":
            res = MaximumInput(upper_bound, distribution, current_kwh)
            break
        case "smg":
            res = ProcentInput(upper_bound, distribution, current_kwh)
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
        let posiblecharge = current_kwh;
        current_kwh -= parseInt(server[i]["MaxChargeRate"])
        if (current_kwh < 0) { 
            out["current_input"] = posiblecharge;
            current_kwh = 0;
            distribution.push(out);
        }
        else {
            out["current_input"] = server[i]["MaxChargeRate"];
            distribution.push(out);
        }
    }
    return [distribution, current_kwh]
}
function ProcentInput(server, distribution, current_kwh){
    let totalcharge = 0;
    for(let i = 0; i < server.length; i++) {
        totalcharge += parseInt(server[i]["MaxChargeRate"])
    }
    let procent = current_kwh/totalcharge;
    console.log(current_kwh, totalcharge, procent)
    for(let i = 0; i < server.length; i++) {
        let out = { "Key": server[i]["Key"], "current_input": 0 }
        let posiblecharge = server[i]["MaxChargeRate"] * procent;
        if (posiblecharge <= parseInt(server[i]["MaxChargeRate"])){
            out["current_input"] = posiblecharge
        }
        else {
            out["current_input"] = parseInt(server[i]["MaxChargeRate"])
        }
        distribution.push(out);
    }
    return [distribution, current_kwh]
}
function sniper(server, distribution, current_kwh){
    for(let i = 0; i < server.length; i++) {
        let out = { "Key": server[i]["Key"], "current_input": 0 }
        distribution.push(out);
    }
    return [distribution, current_kwh]
}