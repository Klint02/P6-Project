import fs from 'fs'

export function send_component(paths) {
    let components = [];
    let component = {
        html: "",
        js: ""
    };
    console.log(paths[0], paths.length)
    for (let i = 0; i < paths.length; i++) {
        const data = fs.readFileSync(paths[i], "utf8");
        let index_of_js = data.indexOf("<script>");
        component.html = data.substring(0, index_of_js);
        component.js = data.substring(data.indexOf("<script>") + 8, data.length - 9);
        components.push(component);
    }
    /*
    paths.array.forEach(file => {
        let obj;
        fs.readFile(file, function(err, data) {
            console.log(data);
        });
        
    });
    return 
    */
   return components;
}