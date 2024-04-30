export function calc_distribution(servers, current_kwh, lower_type, upper_type) {
    let full_server = [];
    let upper_server = [];
    let lower_server = [];
    let distribution = [];
    let res = [];
    servers.forEach(server => {
        if (server["State"] != "not init") {
            if (server["LastKnownPercentage"] < server["LowerBound"]) {
                lower_server.push(server);
            } else if (server["LastKnownPercentage"] < 100){
                upper_server.push(server);
            }
            else {
                full_server.push(server);
            }
        }
    });
    //console.log("lower bound servers", lower_server);
    //console.log("upper bound servers", upper_server);
    //console.log("upper bound servers", full_server);

    if (current_kwh >= 0){
        res = serverdistribute(lower_server, lower_type, distribution, current_kwh)
        res = serverdistribute(upper_server, upper_type, res[0], res[1])
        distribution = res[0];
        current_kwh = res[1];
    }
    else {
        current_kwh = 0 //TODO gram fix negative kwh
        res = serverdistribute(full_server, upper_type, distribution, current_kwh)
        res = serverdistribute(upper_server, upper_type, res[0], res[1])
        res = serverdistribute(lower_server, lower_type, res[0], res[1])
        distribution = res[0];
        current_kwh = res[1];
    }

    console.log("distribution", distribution);
    console.log("res kwh", current_kwh);
    return distribution
}

function serverdistribute(servers, type, distribution, current_kwh){
    switch (type){
        case "shotgun":
            return(MaximumInput(servers, distribution, current_kwh))
        case "smg":
            return(ProcentInput(servers, distribution, current_kwh))
        case "sniper":
            return(sniper(servers, distribution, current_kwh))
    }
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
        } else {
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
    if (procent >= 1){procent = 1}
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