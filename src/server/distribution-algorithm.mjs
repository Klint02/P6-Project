export function calc_distribution(servers) {
    //console.log(servers);
    let sorted_servers = [];
    servers.forEach(element => {
        if (element["state"] != "not init") {
            console.log(element);
            sorted_servers.push(element);
        }
    });
    console666.log(sorted_servers);
}