export function calc_distribution(servers, current_kwh, lower_type, upper_type) {
    let empty_server = [];
    let full_server = [];
    let upper_server = [];
    let lower_server = [];
    let distribution = [];
    let res = [];
    let unchanged = current_kwh;
    servers.forEach(server => {
        if (server["State"] != "not init") {
            if (server["LastKnownPercentage"] == 0) {
                empty_server.push(server);
            } else if (server["LastKnownPercentage"] < server["LowerBound"]) {
                if (current_kwh < 0) {
                    let tempproc = (39.4 * (server["MaxCapacity"] * server["LastKnownPercentage"]) / server["MaxDischargeRate"]);
                    if (tempproc < 100){
                        server["MaxDischargeRate"] = (server["MaxDischargeRate"] * (tempproc/100))
                    }
                }
                lower_server.push(server);
            } else if (server["LastKnownPercentage"] < 100){
                if (current_kwh > 0) {
                    let tempproc = (53 * (server["MaxCapacity"] * (100 - server["LastKnownPercentage"])) / server["MaxChargeRate"]);
                    if (tempproc < 100){
                        server["MaxChargeRate"] = (server["MaxChargeRate"] * (tempproc/100))
                    }
                }
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
        res = serverdistribute(empty_server, lower_type, distribution, current_kwh)
        res = serverdistribute(lower_server, upper_type, res[0], res[1])
        res = serverdistribute(upper_server, upper_type, res[0], res[1])
        distribution = res[0];
        current_kwh = res[1];
    }
    else {
        res = serverdistribute(full_server, upper_type, distribution, current_kwh)
        res = serverdistribute(upper_server, upper_type, res[0], res[1])
        res = serverdistribute(lower_server, lower_type, res[0], res[1])
        distribution = res[0];
        current_kwh = res[1];
    }
    if (1e-11 > current_kwh && current_kwh> -1e-11){current_kwh = 0} //if a charge of this small size does not matter then this is ok
    if ((current_kwh - unchanged) == 0){
        console.log("no clients to distribute to")
    }
    return {
        "distribution": distribution,
        "current_kwh": current_kwh
    }
}
function serverdistribute(servers, type, distribution, current_kwh){
    switch (type){
        case "full":
            return(MaximumInput(servers, distribution, current_kwh))
        case "proc":
            return(ProcentInput(servers, distribution, current_kwh))
        case "max":
            return(MaximumPriority(servers, distribution, current_kwh))
        case "min":
            return(MinimumPriority(servers, distribution, current_kwh))
        case "empty":
            return(empty(servers, distribution, current_kwh))
    }
}

function MaximumInput(servers, distribution, current_kwh){
    if (current_kwh >= 0) {
        for(let i = 0; i < servers.length; i++) {
            let out = { "Key": servers[i]["Key"], "current_input": 0 }
            let posiblecharge = current_kwh;
            current_kwh -= servers[i]["MaxChargeRate"]
            if (current_kwh < 0) { 
                out["current_input"] = posiblecharge;
                current_kwh = 0;
                distribution.push(out);
            } else {
                out["current_input"] = servers[i]["MaxChargeRate"];
                distribution.push(out);
            }
        }
        return [distribution, current_kwh]
    }
    else {
        for(let i = 0; i < servers.length; i++) {
            let out = { "Key": servers[i]["Key"], "current_input": 0 }
            let posiblecharge = current_kwh;
            current_kwh += servers[i]["MaxDischargeRate"]
            if (current_kwh > 0) { 
                out["current_input"] = posiblecharge;
                current_kwh = 0;
                distribution.push(out);
            } else {
                out["current_input"] = -servers[i]["MaxDischargeRate"];
                distribution.push(out);
            }
        }
        return [distribution, current_kwh]
    }
}

function ProcentInput(servers, distribution, current_kwh){
    let totalcharge = 0;
    if (current_kwh >= 0) {
        for(let i = 0; i < servers.length; i++) {
            totalcharge += servers[i]["MaxChargeRate"]
        }
        let procent = current_kwh/totalcharge;
        if (procent >= 1){procent = 1}
        for(let i = 0; i < servers.length; i++) {
            let out = { "Key": servers[i]["Key"], "current_input": 0 }
            let posiblecharge = servers[i]["MaxChargeRate"] * procent;
            if (posiblecharge <= servers[i]["MaxChargeRate"]){
                //console.log("posiblecharge",posiblecharge)
                out["current_input"] = posiblecharge
                current_kwh -= posiblecharge
            }
            else {
                console.log("MaxChargeRate",servers[i]["MaxChargeRate"])
                out["current_input"] = servers[i]["MaxChargeRate"]
                current_kwh -= servers[i]["MaxChargeRate"]
            }
            distribution.push(out);
        }
        if (current_kwh < 0){current_kwh = 0}
    }
    else {
        for(let i = 0; i < servers.length; i++) {
            totalcharge += servers[i]["MaxDischargeRate"]
        }
        let procent = current_kwh/totalcharge;
        if (procent <= -1){procent = -1}
        for(let i = 0; i < servers.length; i++) {
            let out = { "Key": servers[i]["Key"], "current_input": 0 }
            let posiblecharge = servers[i]["MaxDischargeRate"] * procent;
            if (posiblecharge <= servers[i]["MaxDischargeRate"]){
                //console.log("posiblecharge",posiblecharge)
                out["current_input"] = posiblecharge
                current_kwh -= posiblecharge
            }
            else {
                console.log("MaxDischargeRate",-servers[i]["MaxDischargeRate"])
                out["current_input"] = -servers[i]["MaxDischargeRate"]
                current_kwh += servers[i]["MaxDischargeRate"]
            }
            distribution.push(out);
        }
        if (current_kwh > 0){current_kwh = 0}
    }
    return [distribution, current_kwh]
}

function MaximumPriority(servers, distribution, current_kwh){
    let sortedservers = [];
    if (current_kwh >= 0) {
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
    return (MaximumInput(sortedservers, distribution, current_kwh))
}

function MinimumPriority(servers, distribution, current_kwh){
    let sortedservers = [];
    if (current_kwh >= 0) {
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
    return (MaximumInput(sortedservers, distribution, current_kwh))
}

function empty(servers, distribution, current_kwh){
    for(let i = 0; i < servers.length; i++) {
        let out = { "Key": servers[i]["Key"], "current_input": 0 }

        distribution.push(out);
    }
    return [distribution, current_kwh]
}