export function calc_distribution(servers, current_mwh, lower_type, upper_type) {
    let empty_server = [];
    let full_server = [];
    let upper_server = [];
    let lower_server = [];
    let distribution = [];
    let res = [];
    let unchanged = current_mwh;
    servers.forEach(server => {
        if (server["State"] != "not init") {
            if (server["LastKnownPercentage"] == 0) {
                empty_server.push(server);
            } else if (server["LastKnownPercentage"] < server["LowerBound"]) {
                if (current_mwh < 0 && server["MaxDischarge"] < -server["MaxDischargeRate"]) {
                    server["MaxDischargeRate"] = server["MaxDischargeRate"]
                }
                lower_server.push(server);
            } else if (server["LastKnownPercentage"] < 100){
                let temp = server["MaxCapacity"] * (100 - server["LastKnownPercentage"]);
                if (current_mwh > 0 && temp < server["MaxChargeRate"]){
                    server["MaxChargeRate"] = temp
                }
                upper_server.push(server);
            } else {
                full_server.push(server);
            }
        }
    });
    //console.log("empty servers", empty_server);
    //console.log("lower bound servers", lower_server);
    //console.log("upper bound servers", upper_server);
    //console.log("full servers", full_server);

    if (current_mwh >= 0){
        res = serverdistribute(empty_server, lower_type, distribution, current_mwh)
        res = serverdistribute(lower_server, upper_type, res[0], res[1])
        res = serverdistribute(upper_server, upper_type, res[0], res[1])
        distribution = res[0];
        current_mwh = res[1];
    }
    else {
        res = serverdistribute(full_server, upper_type, distribution, current_mwh)
        res = serverdistribute(upper_server, upper_type, res[0], res[1])
        res = serverdistribute(lower_server, lower_type, res[0], res[1])
        distribution = res[0];
        current_mwh = res[1];
    }
    if (1e-11 > current_mwh && current_mwh> -1e-11){current_mwh = 0} //if a charge of this small size does not matter then this is ok
    if ((current_mwh - unchanged) == 0){
        console.log("no clients to distribute to", current_mwh)
    }
    //console.log(distribution,current_mwh)
    return {
        "distribution": distribution,
        "current_mwh": current_mwh
    }
}
function serverdistribute(servers, type, distribution, current_mwh){
    switch (type){
        case "full":
            return(MaximumInput(servers, distribution, current_mwh))
        case "proc":
            return(ProcentInput(servers, distribution, current_mwh))
        case "max":
            return(MaximumPriority(servers, distribution, current_mwh))
        case "min":
            return(MinimumPriority(servers, distribution, current_mwh))
        case "empty":
            return(empty(servers, distribution, current_mwh))
    }
}

function MaximumInput(servers, distribution, current_mwh){
    if (current_mwh >= 0) {
        for(let i = 0; i < servers.length; i++) {
            let out = { "Key": servers[i]["Key"], "current_input": 0 }
            let posiblecharge = current_mwh;
            current_mwh -= servers[i]["MaxChargeRate"]
            if (current_mwh < 0) {
                out["current_input"] = posiblecharge;
                current_mwh = 0;
                distribution.push(out);
            } else {
                out["current_input"] = servers[i]["MaxChargeRate"];
                distribution.push(out);
            }
        }
    }
    else {
        for(let i = 0; i < servers.length; i++) {
            let out = { "Key": servers[i]["Key"], "current_input": 0 }
            let posiblecharge = current_mwh;
            current_mwh -= servers[i]["MaxDischargeRate"]
            if (current_mwh > 0) {
                out["current_input"] = posiblecharge;
                current_mwh = 0;
                distribution.push(out);
            } else {
                out["current_input"] = servers[i]["MaxDischargeRate"];
                distribution.push(out);
            }
        }
    }
    return [distribution, current_mwh]
}

function ProcentInput(servers, distribution, current_mwh){
    let totalcharge = 0;
    if (current_mwh >= 0) {
        for(let i = 0; i < servers.length; i++) {
            totalcharge += servers[i]["MaxChargeRate"]
        }
        let procent = current_mwh/totalcharge;
        if (procent >= 1){procent = 1}
        for(let i = 0; i < servers.length; i++) {
            let out = { "Key": servers[i]["Key"], "current_input": 0 }
            let posiblecharge = servers[i]["MaxChargeRate"] * procent;
            if (posiblecharge <= servers[i]["MaxChargeRate"]){
                //console.log("posiblecharge",posiblecharge)
                out["current_input"] = posiblecharge
                current_mwh -= posiblecharge
            }
            else {
                console.log("MaxChargeRate",servers[i]["MaxChargeRate"])
                out["current_input"] = servers[i]["MaxChargeRate"]
                current_mwh -= servers[i]["MaxChargeRate"]
            }
            distribution.push(out);
        }
        if (current_mwh < 0){current_mwh = 0}
    }
    else {
        for(let i = 0; i < servers.length; i++) {
            totalcharge += servers[i]["MaxDischargeRate"]
        }
        let procent = current_mwh/totalcharge;
        if (procent >= 1){procent = 1}
        for(let i = 0; i < servers.length; i++) {
            let out = { "Key": servers[i]["Key"], "current_input": 0 }
            let posiblecharge = servers[i]["MaxDischargeRate"] * procent;
            if (posiblecharge <= servers[i]["MaxDischargeRate"]){
                //console.log("posiblecharge",posiblecharge)
                out["current_input"] = posiblecharge
                current_mwh -= posiblecharge
            }
            else {
                console.log("MaxDischargeRate",servers[i]["MaxDischargeRate"])
                out["current_input"] = servers[i]["MaxDischargeRate"]
                current_mwh -= servers[i]["MaxDischargeRate"]
            }
            distribution.push(out);
        }
        if (current_mwh > 0){current_mwh = 0}
    }
    return [distribution, current_mwh]
}

function MaximumPriority(servers, distribution, current_mwh){
    let sortedservers = [];
    if (current_mwh >= 0) {
        for(let i = 0; i < servers.length; i++) {
            for(let i2 = 0; i2 <= sortedservers.length; i2++) {
                if (servers[i]["LastKnownPercentage"] > sortedservers[i2]["LastKnownPercentage"]) {
                    sortedservers.splice(i2, 0, servers[i])
                    break
                }
            }
        }
    } else {
        for(let i = 0; i < servers.length; i++) {
            for(let i2 = 0; i2 <= sortedservers.length; i2++) {
                if (servers[i]["LastKnownPercentage"] < sortedservers[i2]["LastKnownPercentage"]) {
                    sortedservers.splice(i2, 0, servers[i])
                    break
                }
            }
        }
    }
    return (MaximumInput(sortedservers, distribution, current_mwh))
}

function MinimumPriority(servers, distribution, current_mwh){
    let sortedservers = [];
    if (current_mwh >= 0) {
        for(let i = 0; i < servers.length; i++) {
            for(let i2 = 0; i2 <= sortedservers.length; i2++) {
                if (servers[i]["LastKnownPercentage"] < sortedservers[i2]["LastKnownPercentage"]) {
                    sortedservers.splice(i2, 0, servers[i])
                    break
                }
            }
        }
    } else {
        for(let i = 0; i < servers.length; i++) {
            for(let i2 = 0; i2 <= sortedservers.length; i2++) {
                if (servers[i]["LastKnownPercentage"] > sortedservers[i2]["LastKnownPercentage"]) {
                    sortedservers.splice(i2, 0, servers[i])
                    break
                }
            }
        }
    }
    return (MaximumInput(sortedservers, distribution, current_mwh))
}

function empty(servers, distribution, current_mwh){
    for(let i = 0; i < servers.length; i++) {
        let out = { "Key": servers[i]["Key"], "current_input": 0 }

        distribution.push(out);
    }
    return [distribution, current_mwh]
}